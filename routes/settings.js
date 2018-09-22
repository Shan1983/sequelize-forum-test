const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");
const { Settings, Sequelize } = require("../models");

// AUTH - ADMIN
// router.all("*", (req, res, next) => {
//   if (req.session.admin) {
//     next();
//   } else {
//     res.status(401);
//     res.json({
//       errors: [Errors.requestNotAuthorized]
//     });
//   }
// });

// GET - return the current settings
router.get("/", async (req, res, next) => {
  try {
    const settings = await Settings.get();

    if (!settings) {
      throw Errors.noSettings;
    }

    res.json(settings.toJSON());
  } catch (e) {
    next(e);
  }
});

// PUT - change the settings
router.put("/", async (req, res, next) => {
  try {
    let params = {};

    if (req.body.forumName) {
      params.forumName = req.body.forumName;
    }

    if (req.body.forumDescription !== undefined) {
      params.forumDescription = req.body.forumDescription;
    }

    if (req.body.showDescription !== undefined) {
      params.showDescription = req.body.showDescription;
    }

    const updatedSettings = await Settings.set(params);

    res.json(updatedSettings.toJSON(), params);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
