"use strict";
module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    "Report",
    {
      reason: {
        type: DataTypes.ENUM,
        values: [
          "Spam",
          "Inappropriate",
          "Harrassment",
          "Poster Requested",
          "Duplicate"
        ],
        validate: {
          isIn: {
            args: [
              [
                "Spam",
                "Inappropriate",
                "Harrassment",
                "Poster Requested",
                "Duplicate"
              ]
            ],
            msg: `Report reason can only be one of the pre-defined options`
          }
        }
      },
      message: {
        type: DataTypes.STRING,
        validate: {
          isString(val) {
            if (typeof val !== "string") {
              throw sequelize.ValidationError(
                `The reason's message must be a string`
              );
            }
          }
        }
      }
    },
    {
      classMethods: {
        associate(models) {
          Report.belongsTo(models.User, { as: "FlaggedByUser" });
          Report.belongsTo(models.Post);
        },
        invalidPostId(value) {
          return new sequelize.ValidationError(`Post id is not valid`, [
            new sequelize.ValidationErrorItem(
              `Post id is not valid`,
              `Validation error`,
              `postId`,
              value
            )
          ]);
        }
      }
    }
  );

  return Report;
};
