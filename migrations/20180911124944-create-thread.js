"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable(
      "threads",
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
        categoryId: {
          type: Sequelize.INTEGER
        },
        userId: {
          type: Sequelize.INTEGER
        },
        pollQuestionId: {
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
    return queryInterface.dropTable("threads");
  }
};
