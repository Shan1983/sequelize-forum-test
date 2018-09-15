"use strict";
module.exports = (sequelize, DataTypes) => {
  const Ip = sequelize.define(
    "Ip",
    {
      ip: {
        type: DataTypes.STRING,
        validate: {
          isIP: true
        }
      }
    },
    {}
  );
  Ip.associate = function(models) {
    Ip.belongsTo(models.User, { through: "UserIp" });
  };

  Ip.prototype.createIfNotExists = async (ipAddress, user) => {
    const existingIp = await Ip.findOne({
      where: { ip: ipAddress },
      include: [
        {
          model: sequelize.models.User,
          where: { id: user.id }
        }
      ]
    });

    if (!existingIp) {
      const ip = await Ip.create({
        ip: ipAddress
      });
      await ip.addUser(user);
    }
  };
  return Ip;
};
