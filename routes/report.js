const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");

const { User, Post, Report, Sequelize } = require("../models");

// AUTH
// router.all("*", (req, res, next) => {
//   if (req.session.loggedIn) {
//     next();
//   } else {
//     res.status(401);
//     res.json({
//       errors: [Errors.requestNotAuthorized]
//     });
//   }
// });

const isAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.status(401);
    res.json({
      errors: [Errors.requestNotAuthorized]
    });
  }
};

// POST - report a post
router.post("/", async (req, res, next) => {
  try {
    const post = await Post.findById(req.body.postId);

    if (!post) {
      throw Report.invalidPostId(req.body.postId);
    }

    const user = await User.findOne({
      where: {
        username: req.session.username
      }
    });

    const report = await Report.create({ reason: req.body.reason });
    report.setFlaggedByUser(user);
    report.setPost(post);

    res.json({
      success: true,
      message: "An admin will view your report shortly"
    });
  } catch (e) {
    next(e);
  }
});

// GET - get the current reports
router.get("/", isAdmin, async (req, res, next) => {
  try {
    const reports = await Report.findAll({
      include: [
        { model: User, as: "FlaggedByUser" },
        { model: Post, include: Post.includeOptions }
      ]
    });

    res.json(reports);
  } catch (e) {
    next(e);
  }
});

// DELETE - remove a report
router.delete("/:id", isAdmin, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      throw Report.invalidPostId(req.params.id);
    }

    await report.destroy();

    res.json({
      success: true
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
