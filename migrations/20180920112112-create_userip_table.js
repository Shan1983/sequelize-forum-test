"use strict";

module.exports = {
  up: function(queryInterface, Sequelize) {
    return queryInterface.createTable(
      "userip",
      {
        IpId: Sequelize.INTEGER,
        UserId: Sequelize.INTEGER,
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE
      },
      {
        charset: "utf8mb4"
      }
    );
  },

  down: function(queryInterface, Sequelize) {
    return queryInterface.dropTable("userip");
  }
};
