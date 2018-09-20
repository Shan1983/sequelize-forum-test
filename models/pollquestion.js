"use strict";
module.exports = (sequelize, DataTypes) => {
  const PollQuestion = sequelize.define(
    "PollQuestion",
    {
      question: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: {
            args: [1, 256],
            msg: `The question must be between 1 and 256 characters`
          },
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(
                `The question must be a string`
              );
            }
          }
        }
      }
    },
    {
      classMethods: {
        associate(models) {
          PollQuestion.belongsTo(models.User);
          PollQuestion.hasMany(models.PollAnswer);
          PollQuestion.hasMany(models.PollVote);
        }
      }
    }
  );

  return PollQuestion;
};
