const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");
const { User, AdminToken, Sequelize } = require("../models");

// router.post("/", async (req, res, next) => {
//   try {
//     if (!req.session.loggedIn && !req.session.admin) {
//       throw Errors.requestNotAuthorized;
//     } else {
//       const token = await AdminToken.create();
//       res.json(token.toJSON());
//     }
//   } catch (e) {
//     next(e);
//   }
// });

router.post("/:username/demote", async (req, res, next) => {
  try {
    if (!req.session.loggedIn && !req.session.admin) {
      throw Errors.requestNotAuthorized;
    } else {
      const user = await User.findOne({
        where: { username: req.params.username }
      });

      if (!user) {
        throw Errors.sequelizeValidation(Sequelize, {
          error: "user does not exist",
          value: req.params.username
        });
      }

      const token = await AdminToken.findOne({
        where: { UserId: user.id }
      });

      await token.destroy();
      await user.update({
        TokenId: null
      });

      req.session.destroy(() => {
        res.clearCookie("username");
        res.clearCookie("admin");
        res.json({
          success: true
        });
      });
    }
  } catch (e) {
    next(e);
  }
});

router.post("/:username/promote", async (req, res, next) => {
  try {
    if (!req.session.loggedIn && !req.session.admin) {
      throw Errors.requestNotAuthorized;
    } else {
      const user = await User.findOne({
        where: { username: req.params.username }
      });

      if (!user) {
        throw Errors.sequelizeValidation(Sequelize, {
          error: "user does not exist",
          value: req.params.username
        });
      }

      const token = await AdminToken.create({
        UserId: user.id
      });
      await token.setUser(user);
      if (User.canBeAdmin(token)) {
        await user.update({ admin: true });

        res.json(
          await token.reload({
            include: [
              {
                model: User,
                attributes: [
                  "username",
                  "createdAt",
                  "updatedAt",
                  "id",
                  "admin"
                ]
              }
            ]
          })
        );
      }
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
