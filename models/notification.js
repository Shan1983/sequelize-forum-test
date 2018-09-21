"use strict";

const Errors = require("../lib/errors");

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
    {
      interacted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      type: DataTypes.ENUM("mention", "thread update", "reply")
    },
    {
      classMethods: {
        associate(models) {
          Notification.hasOne(models.PostNotification);
          Notification.belongsTo(models.User);
        },
        async filterMentions(mentions) {
          // if mentions is not an array of strings, kill it
          if (
            !Array.isArray(mentions) ||
            mentions.filter(m => typeof m !== "string").length
          ) {
            throw Errors.sequelizeValidation(sequelize, {
              error: `mentions must be an array of strings`,
              value: mentions
            });
          }

          return mentions.filter((mention, pos, self) => {
            return self.indexOf(mention) === pos;
          });
        },
        //props include: username, usernameTo, post, amd type
        async createPostNotification(props) {
          const { PostNotification, User, Post } = sequelize.models;

          const userTo = await User.findOne({
            where: { username: props.usernameTo }
          });

          if (!userTo) {
            return null;
          }

          const notification = await Notification.create({ type: props.type });
          const postNotification = await PostNotification.create();

          await postNotification.setUser(props.userFrom);
          await postNotification.setPost(props.post);

          await notification.setPostNotification(postNotification);
          await notification.setUser(userTo);

          const reloadedNotification = await notification.reload({
            include: [
              {
                model: PostNotification,
                include: [
                  Post,
                  {
                    model: User,
                    attributes: ["createdAt", "username", "color"]
                  }
                ]
              }
            ]
          });

          return reloadedNotification;
        }
      },
      instanceMethods: {
        async emitNotificationMessage(ioUsers, io) {
          const User = sequelize.models.User;

          const user = await User.findById(this.UserId);

          if (ioUsers[user.username]) {
            console.log(ioUsers);
            io.to(ioUsers[user.username]).emit("notification", this.toJSON());
          }
        }
      }
    }
  );

  return Notification;
};
