"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      "Threads",
      {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false
        },
        slug: {
          type: Sequelize.TEXT
        },
        postsCount: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        locked: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        CategoryId: {
          type: Sequelize.INTEGER
        },
        UserId: {
          type: Sequelize.INTEGER
        },
        PollQuestionId: {
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
    return queryInterface.dropTable("Threads");
  }
};
