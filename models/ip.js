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
    {
      classMethods: {
        associate(models) {
          Ip.belongsToMany(models.User, { through: "UserIp" });
        },
        async createIfNotExists(ipAddress, user) {
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
        }
      }
    }
  );

  return Ip;
};
