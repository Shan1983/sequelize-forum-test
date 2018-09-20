"use strict";

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable("user_post", {
      postId: Sequelize.INTEGER,
      userId: Sequelize.INTEGER,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable("user_post");
  }
};
