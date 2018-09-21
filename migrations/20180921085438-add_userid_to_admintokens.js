"use strict";

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.addColumn("adminTokens", "UserId", {
      type: Sequelize.INTEGER
    });
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.removeColumn("adminTokens", "UserId");
  }
};
