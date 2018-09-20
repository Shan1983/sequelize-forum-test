"use strict";
module.exports = (sequelize, DataTypes) => {
  const PollVote = sequelize.define(
    "PollVote",
    {},
    {
      classMethods: {
        associate(models) {
          PollVote.belongsTo(models.PollAnswer);
          PollVote.belongsTo(models.PollQuestion);
          PollVote.belongsTo(models.User);
        }
      }
    }
  );

  return PollVote;
};
