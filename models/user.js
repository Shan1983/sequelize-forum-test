"use strict";

const bcrypt = require("bcryptjs");
const randomColor = require("randomcolor");

const pagination = require("../lib/pagination");
const Errors = require("../lib/Errors");

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING,
        unique: {
          msg: `Username already taken - try a different one`,
          fields: ["username"]
        },
        validate: {
          len: {
            args: [4, 50],
            msg: `Username must be between 6 and 50 characters`
          },
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(`Username must be a string`);
            }
          },
          containsNoBlankCharacters(val) {
            if (/\s/g.test(val)) {
              throw new sequelize.ValidationError(
                `Username can't contain blank characters`
              );
            }
          }
        }
      },
      description: {
        type: DataTypes.TEXT,
        validate: {
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(
                `Description must be a string`
              );
            }
          },
          len: {
            args: [0, 1024],
            msg: `description must be less than 1024 characters`
          }
        }
      },
      color: {
        type: DataTypes.STRING,
        defaultValue() {
          return randomColor();
        }
      },
      hash: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [6, 100],
            msg: `Password must be between 6 and 100 characters`
          },
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(`Password must be a string`);
            }
          }
        }
      },
      admin: { type: DataTypes.BOOLEAN, defaultValue: false },
      picture: {
        type: DataTypes.TEXT,
        validate: {
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(`Picture must be a string`);
            }
          }
        }
      }
    },
    {
      instanceMethods: {
        async updatePassword(currentPassword, newPassword) {
          if (currentPassword === newPassword) {
            throw Errors.passwordSame;
          } else if (
            typeof currentPassword !== "string" ||
            typeof newPassword !== "string"
          ) {
            throw new sequelize.ValidationError(`password must be a string`);
          }

          const correctPassword = await bcrypt.compare(
            currentPassword,
            this.hash
          );

          if (correctPassword) {
            await this.update({ hash: newPassword });
          } else {
            throw Errors.invalidLoginCredentials;
          }
        },
        async comparePassword(password) {
          return await bcrypt.compare(password, this.hash);
        },
        async getMeta(limit) {
          const Post = sequelize.models.Post;
          let meta = {};

          const nextId = await pagination.getNextIdDesc(
            Post,
            { userId: this.id },
            this.Post
          );

          if (nextId === null) {
            meta.nextURL = null;
            meta.nextPostsCount = 0;
          } else {
            meta.nextURL = `/api/v1/${
              this.username
            }?posts=true&limit=${limit}&from=${nextId - 1}`;
            meta.nextPostsCount = await pagination.getNextCount(
              Post,
              this.Posts,
              limit,
              { UserId: this.id },
              true
            );
          }
          return meta;
        }
      },
      classMethods: {
        associate(models) {
          User.hasMany(models.Post);
          User.hasMany(models.Thread);
          User.belongsToMany(models.Ip, { through: "UserIp" });
        },
        includeOptions(from, limit) {
          const models = sequelize.models;
          const options = models.Post.includedOptions();

          return [
            {
              model: models.Post,
              include: options,
              limit,
              where: { postNumber: { $gte: from } },
              order: [["id", "ASC"]]
            }
          ];
        },
        async canBeAdmin(token) {
          const { User, AdminToken } = sequelize.models;

          const adminUser = await User.findOne({ where: { admin: true } });

          if (adminUser) {
            if (token) {
              const adminToken = await AdminToken.findOne({ where: { token } });

              if (adminToken && adminToken.isValid()) {
                await adminToken.destroy();
                return true;
              } else {
                throw Errors.invalidToken;
              }
            } else {
              throw Errors.missingParameter("token");
            }
          } else {
            return true;
          }
        }
      },
      hooks: {
        async afterValidate(user, options) {
          if (user.changed("hash") && user.hash.length <= 50) {
            user.hash = await bcrypt.hash(user.hash, 12);
          }
          options.hooks = false;
          return options;
        }
      }
    }
  );

  return User;
};
