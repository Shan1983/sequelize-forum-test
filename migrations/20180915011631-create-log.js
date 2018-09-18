"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      "Logs",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        route: {
          type: Sequelize.ENUM([
            "index",
            "search",
            "settingsAccount",
            "settingsGeneral",
            "thread",
            "threadNew",
            "userPosts",
            "userThreads"
          ])
        },
        ThreadId: {
          type: Sequelize.INTEGER
        },
        UserId: {
          type: Sequelize.INTEGER
        },
        sessionUserId: {
          type: Sequelize.INTEGER
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      },
      {
        charset: "utf8mb4"
      }
    );
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("Logs");
  }
};
