const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");

const { User, Ban, Sequelize } = require("../models");

// AUTH - ADMIN
// router.all("*", (req, res, next) => {
//   if (!req.session.loggedIn && !req.session.admin) {
//     res.status(401);
//     res.json({
//       errors: [Errors.requestNotAuthorized]
//     });
//   }else {
//       next()
//   }
// });

// POST - ban a user
router.post("/", async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { username: req.body.username } });
    if (!user) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "user does not exist",
        value: req.body.username
      });
    }

    // do the ban
    const ban = await Ban.create({
      message: req.body.message,
      canCreateThreads: req.body.canCreateThreads,
      canCreatePosts: req.body.canCreatePosts,
      ipBanned: req.body.ipBanned
    });

    await ban.setUser(user);

    const result = await ban.reload({
      include: [{ model: User, attributes: ["username"] }]
    });

    res.json(result.toJSON());
  } catch (e) {
    next(e);
  }
});

// GET - list all currently banned users
router.get("/", async (req, res, next) => {
  try {
    const bans = await Ban.findAll({
      include: [User]
    });

    res.json(bans.map(b => b.toJSON()));
  } catch (e) {
    next(e);
  }
});

// DELETE - un-ban a user
router.delete("/:ban_id", async (req, res, next) => {
  try {
    const ban = await Ban.findById(req.params.ban_id);

    if (!ban) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "ban does not exist",
        value: req.params.ban_id
      });
    }

    await ban.destroy();
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
