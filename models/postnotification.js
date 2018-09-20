"use strict";
module.exports = (sequelize, DataTypes) => {
  const PostNotification = sequelize.define(
    "PostNotification",
    {},
    {
      classMethods: {
        associate(models) {
          PostNotification.belongsTo(models.User);
          PostNotification.belongsTo(models.Post);
          PostNotification.belongsTo(models.Notification);
        }
      }
    }
  );

  return PostNotification;
};
