"use strict";

const routes = [
  "index",
  "search",
  "settingsAccount",
  "settingsGeneral",
  "thread",
  "threadNew",
  "userPosts",
  "userThreads"
];

module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define(
    "Log",
    {
      route: {
        type: DataTypes.ENUM(routes),
        validate: {
          isIn: {
            args: [routes],
            msg: `route does not exist`
          }
        }
      }
    },
    {}
  );
  Log.associate = function(models) {
    Log.belongsTo(models.Thread);
    Log.belongsTo(models.User);
    Log.belongsTo(models.User, { as: "SessionUser" });
  };
  return Log;
};
