"use strict";
module.exports = (sequelize, DataTypes) => {
  const PollAnswer = sequelize.define(
    "PollAnswer",
    {
      answer: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [1, 256],
            msg: `The poll answer must be between 1 and 256 characters`
          },
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(
                `The poll answer must be a string`
              );
            }
          }
        }
      }
    },
    {}
  );
  PollAnswer.associate = function(models) {
    PollAnswer.hasMany(models.PollVote);
  };
  return PollAnswer;
};
