"use strict";

const Errors = require("../lib/errors");

module.exports = (sequelize, DataTypes) => {
  const Ban = sequelize.define(
    "Ban",
    {
      canCreatePosts: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        validate: {
          isBoolean(val) {
            if (typeof val !== "boolean") {
              throw new sequelize.ValidationError(
                `canCreatePosts must be a boolean`
              );
            }
          }
        }
      },
      canCreateThreads: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        validate: {
          isBoolean(val) {
            if (typeof val !== "boolean") {
              throw new sequelize.ValidationError(
                `canCreateThread must be a boolean`
              );
            }
          }
        }
      },
      ipBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        validate: {
          isBoolean(val) {
            if (typeof val !== "boolean") {
              throw new sequelize.ValidationError(`ipBanned must be a boolean`);
            }
          }
        }
      },
      message: {
        type: DataTypes.TEXT,
        validate: {
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(`message must be a string`);
            }
          },
          len: {
            args: [0, 1024],
            msg: `message must be less than 1024 characters`
          }
        }
      },
      userId: DataTypes.INTEGER
    },
    {}
  );

  Ban.associate = function(models) {
    Ban.belongsTo(models.User);
  };

  Ban.prototype.getBanInstance = async username => {
    const user = await sequelize.models.User.findOne({ where: { username } });
    const ban = await Ban.findOne({ where: { userId: user.id } });

    return ban;
  };

  Ban.prototype.canCreatePost = async username => {
    const ban = await this.getBanInstance(username);

    if (ban && !ban.canCreatePosts) {
      throw Errors.sequelizeValidation(sequelize.Sequelize, {
        error: ban.message || `You have been banned from posting`
      });
    } else {
      return false;
    }
  };

  Ban.prototype.canCreateThread = async username => {
    const ban = await this.getBanInstance(username);

    if (ban && !ban.canCreateThreads) {
      throw Errors.sequelizeValidation(sequelize.Sequelize, {
        error: ban.message || `You have been banned from creating threads`
      });
    } else {
      return false;
    }
  };

  Ban.prototype.isIpBanned = async (ip, username) => {
    const { User, Ip } = sequelize.models;

    if (username) {
      const user = await User.findOne({
        where: {
          username
        }
      });
      if (user && user.admin) {
        return false;
      }
    }

    const users = await User.findAll({
      include: [
        {
          model: Ip,
          where: { ip }
        }
      ]
    });

    if (!users.length) {
      return false;
    }

    const ban = await Ban.findOne({
      where: {
        userId: {
          $in: users.map(usr => usr.id)
        },
        ipBanned: true
      }
    });

    if (ban) {
      throw Errors.sequelizeValidation(sequelize.Sequelize, {
        error: ban.message || `This IP has been banned from using this site.`
      });
    } else {
      return false;
    }
  };
  return Ban;
};
