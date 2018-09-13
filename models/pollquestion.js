'use strict';
module.exports = (sequelize, DataTypes) => {
  const PollQuestion = sequelize.define('PollQuestion', {
    question: DataTypes.STRING,
    userId: DataTypes.INTEGER
  }, {});
  PollQuestion.associate = function(models) {
    // associations can be defined here
  };
  return PollQuestion;
};