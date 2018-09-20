"use strict";

const crypto = require("crypto");

module.exports = (sequelize, DataTypes) => {
  const adminToken = sequelize.define(
    "AdminToken",
    {
      token: {
        type: DataTypes.STRING,
        defaultValue() {
          return crypto.randomBytes(64).toString("hex");
        },
        validate: {
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(`Token must be a string`);
            }
          }
        }
      }
    },
    {
      instanceMethods: {
        isValid() {
          const ms = Date.now() - this.createdAt;
          const daysMs = 1000 * 60 * 60 * 24;

          return ms / daysMs < 1;
        }
      }
    }
  );
  return adminToken;
};
