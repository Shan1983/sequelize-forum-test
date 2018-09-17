"use strict";

const sharp = require("sharp");

module.exports = (sequelize, DataTypes) => {
  const ProfilePicture = sequelize.define(
    "ProfilePicture",
    {
      file: DataTypes.BLOB("long"),
      mimetype: DataTypes.STRING
    },
    {}
  );
  ProfilePicture.associate = function(models) {
    ProfilePicture.belongsTo(models.User);
  };

  ProfilePicture.hook("beforeUpdate", (profilePicture, options, cb) => {
    sharp(profilePicture.file)
      .resize(400, 400)
      .max()
      .toBuffer((err, buff) => {
        profilePicture.file = buff;
        cb(err || null, options);
      });
  });
  return ProfilePicture;
};
