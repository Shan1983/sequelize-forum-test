"use strict";
module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define(
    "Setting",
    {
      forumName: {
        type: DataTypes.STRING,
        validate: {
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(
                `Forum name must be a string`
              );
            }
          }
        }
      },
      forumDescription: {
        type: DataTypes.STRING,
        validate: {
          isString(val) {
            if (typeof val !== "string") {
              throw new sequelize.ValidationError(
                `Forum description must be a string`
              );
            }
          }
        }
      },
      showDescription: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {}
  );
  Setting.associate = function(models) {
    // associations can be defined here
  };
  Setting.prototype.set = values => {
    values.id = 1;
    return Setting.upsert(values);
  };

  Setting.prototype.get = () => {
    return Setting.findbyId(1);
  };

  return Setting;
};
