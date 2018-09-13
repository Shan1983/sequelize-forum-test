"use strict";
const randomColor = require("randomcolor");
const slug = require("slug");

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: `The category name can't be empty.`
          },
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(
                `The category name must be a string`
              );
            }
          }
        }
      },
      value: {
        type: DataTypes.STRING,
        unique: true
      },
      color: {
        type: DataTypes.STRING,
        defaultValue() {
          return randomColor({ luminosity: "bright" });
        },
        validate: {
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(`The color must be a string`);
            }
          }
        }
      }
    },
    {
      hooks: {
        beforeCreate(category) {
          if (!category.name) {
            throw new sequelize.ValidationError(
              `The category name can't be empty`
            );
          } else {
            const cat_name = slug(category.name).toLowerCase();
            category.value = cat_name;
          }
        }
      }
    }
  );
  Category.associate = function(models) {
    Category.hasMany(models.Thread);
  };
  Category.prototype.includeOptions = (from, limit) => {
    const models = sequelize.models;

    return [
      {
        model: models.User,
        attributes: ["username", "createdAt", "color", "picture", "updated"]
      }
    ];
  };
  return Category;
};
