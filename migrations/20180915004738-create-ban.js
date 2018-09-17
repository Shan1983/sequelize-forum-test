"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      "bans",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        canCreatePosts: {
          type: Sequelize.BOOLEAN
        },
        canCreateThreads: {
          type: Sequelize.BOOLEAN,
          defaultValue: true
        },
        ipBanned: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        message: {
          type: Sequelize.TEXT
        },
        userId: {
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
    return queryInterface.dropTable("bans");
  }
};
