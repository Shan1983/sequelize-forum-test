"use strict";
const slug = require("slug");

module.exports = (sequelize, DataTypes) => {
  const Thread = sequelize.define(
    "Thread",
    {
      name: {
        type: DataTypes.STRING,
        set(val) {
          this.setDataValue("name", val);
          if (val) {
            this.setDataValue("slug", slug(val).toLowerCase() || "_");
          }
        },
        allowNull: false,
        validate: {
          notEmpty: {
            msg: `The title cannot be empty`
          },
          len: {
            args: [0, 256],
            msg: `The title can only be up to 256 characters`
          },
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValationError(`The title must be a string`);
            }
          }
        }
      },
      slug: DataTypes.STRING,
      postsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      locked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      instanceMethods: {
        // set up pagination meta data
        getMeta(limit) {
          let meta = {};

          const posts = this.Posts;
          const firstPost = posts[0];
          const lastPost = posts.slice(-1)[0];

          // find the next url
          if (!lastPost || lastPost.postNumber + 1 === this.postsCount) {
            meta.nextURL = null;
          } else {
            meta.nextURL = `/api/v1/thread/${
              this.id
            }?limit=${limit}&from=${lastPost.postNumber + 1}`;
          }

          // find the previous url
          if (!firstPost || firstPost.postNumber === 0) {
            meta.previousURL = null;
          } else if (firstPost.postNumber - limit < 0) {
            meta.previousURL = `/api/v1/thread/${this.id}?limit=${
              firstPost.postNumber
            }&from=0`;
          } else {
            meta.previousURL = `/api/v1/thread/${
              this.id
            }?limit=${limit}&from=${firstPost.postNumber - limit}`;
          }

          // get the remaining posts
          if (lastPost === undefined) {
            meta.nextPostsCount = 0;
            meta.previousPostsCount = 0;
            meta.postsRemaining = 0;
          } else {
            const postsRemaining = this.postsCount - lastPost.postNumber - 1;

            meta.postsRemaining = postsRemaining;

            if (postsRemaining < limit) {
              meta.nextPostsCount = postsRemaining;
            } else {
              meta.nextPostsCount = limit;
            }

            if (firstPost.postNumber === 0) {
              meta.previousPostsCount = 0;
            } else if (firstPost.postNumber - limit < 0) {
              meta.previousPostsCount = firstPost.postNumber;
            } else {
              meta.previousPostsCount = limit;
            }
          }
          return meta;
        }
      }
    }
  );
  Thread.associate = function(models) {
    // associations can be defined here
    Thread.belongsTo(models.User);
    Thread.belongsTo(models.Category);
    Thread.belongsTo(models.PollQuestion);
    Thread.hasMany(models.Post, {
      foreignKeyConstraint: true,
      onDelete: "cascade"
    });
  };

  Thread.prototype.includeOptions = (from, limit) => {
    const models = sequelize.models;

    return [
      {
        model: models.User,
        attributes: [
          "username",
          "createdAt",
          "color",
          "picture",
          "updatedAt",
          "id"
        ]
      },
      models.Category,
      {
        model: models.Post,
        where: { postNumber: { $gte: from } },
        order: [["id", "ASC"]],
        limit,
        include: [
          { model: models.Thread, attributes: ["slug"] },
          {
            model: models.User,
            as: "Likes",
            attributes: ["username", "createdAt", "id", "color", "picture"]
          },
          {
            model: models.User,
            attributes: ["username", "createdAt", "id", "color", "picture"]
          },
          {
            model: models.Post,
            as: "Replies",
            include: [
              {
                model: models.User,
                attributes: ["username", "id", "color", "picture"]
              }
            ]
          }
        ]
      }
    ];
  };
  return Thread;
};
