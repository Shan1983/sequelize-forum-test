"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      "Notifications",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        interacted: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        read: {
          type: Sequelize.BOOLEAN,
          defaltValue: false
        },
        type: {
          type: Sequelize.ENUM("mention", "thread update", "reply")
        },
        UserId: {
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
    return queryInterface.dropTable("Notifications");
  }
};
