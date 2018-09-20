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

router.post("/", async (req, res, next) => {
  let validationErrors = [];

  try {
    await Ban.canCreateThreads(req.session.username);

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

module.exports = router;
