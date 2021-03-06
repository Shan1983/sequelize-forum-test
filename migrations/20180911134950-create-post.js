"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      "posts",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        content: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        postNumber: {
          type: Sequelize.INTEGER
        },
        replyingToUsername: {
          type: Sequelize.STRING
        },
        removed: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        UserId: {
          type: Sequelize.INTEGER
        },
        ThreadId: {
          type: Sequelize.INTEGER
        },
        ReplyId: {
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
    return queryInterface.dropTable("posts");
  }
};
