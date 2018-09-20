const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");
const pagination = require("../lib/pagination");

const {
  User,
  Thread,
  Category,
  Post,
  Ban,
  Report,
  Sequelize
} = require("../models");

// // AUTH
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

// // AUTH - ADMIN
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

// GET - get a thread by id
router.get("/:thread_id", async (req, res, next) => {
  try {
    const { from, limit } = pagination.getPaginationProps(req.query);
    const thread = await Thread.findById(req.params.thread_id, {
      include: Thread.includedOptions(from, limit)
    });

    console.log(thread);

    if (!thread) {
      throw Errors.invalidParameter("id", "Thread does not exist");
    }

    const meta = thread.getMeta(limit);

    res.json(Object.assign(thread.toJSON(), { meta }));
  } catch (e) {
    console.log(e);
    next(e);
  }
});

// POST - create a new thread
router.post("/", async (req, res, next) => {
  let validationErrors = [];

  try {
    await Ban.canCreateThread(req.session.username);

    const category = await Category.findOne({
      where: { value: req.body.category }
    });

    if (!category) {
      throw Errors.invalidCategory;
    }

    const user = await User.findOne({
      where: {
        username: req.session.username
      }
    });

    const thread = await Thread.create({
      name: req.body.name
    });

    await thread.setCategory(category);
    await thread.setUser(user);

    res.json(
      await thread.reload({
        include: [
          {
            model: User,
            attributes: ["username", "createdAt", "updatedAt", "id"]
          },
          Category
        ]
      })
    );
  } catch (e) {
    next(e);
  }
});

// DELETE - remove a thread
router.delete("/:thread_id", async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.thread_id);

    if (!thread) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "invalid thread id",
        value: req.params.thread_id
      });
    } else {
      // collect all the reports for a thread, and delete those too
      const post = await Post.findAll({
        where: { threadId: thread.id },
        include: [Report]
      });

      const reports = posts
        .map(post => post.Reports)
        .reduce((a, b) => a.concat(b), []);
      const destroyPromises = reports.map(report => report.destroy());

      await Promise.all(destroyPromises);
      await Post.destroy({ where: { threadId: thread.id } });
      await thread.destroy();

      res.json({
        success: true
      });
    }
  } catch (e) {
    next(e);
  }
});

// PUT - update a thread
router.put("/:thread_id", async (req, res, next) => {
  try {
    const thread = await Thread.findById(req.params.thread_id);

    if (!thread) {
      res.status(400);
      res.json({
        errors: [Errors.invalidParameter("threadId", "thread does not exist")]
      });
    } else {
      if (req.body.locked) {
        await thread.update({ locked: true });
      } else {
        await thread.update({ locked: false });
      }

      res.json({
        success: true
      });
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
