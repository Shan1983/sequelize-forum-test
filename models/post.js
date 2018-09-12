'use strict';
module.exports = (sequelize, DataTypes) => {
  const post = sequelize.define('post', {
    content: DataTypes.TEXT,
    postNumber: DataTypes.INTEGER,
    replyingToUsername: DataTypes.STRING,
    removed: DataTypes.BOOLEAN,
    userId: DataTypes.INTEGER,
    threadId: DataTypes.INTEGER,
    replyId: DataTypes.INTEGER
  }, {});
  post.associate = function(models) {
    // associations can be defined here
  };
  return post;
};