const express = require("express");
const router = express.Router();

const pagination = require("../lib/pagination");
let Errors = require("../lib/errors");

// get the required models
const { Category, Post, Thread, User, Sequelize } = require("../models");

// GET category index
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll();

    res.json(categories);
  } catch (e) {
    res.status(500);
    res.json({
      errors: [Errors.unknown]
    });
  }
});

// GET category by query
router.get("/:category", async (req, res, next) => {
  try {
    let threads, threadLatestPost, resThreads, user;
    const { from, limit } = pagination.getPaginationProps(req.query, true);

    if (req.query.username) {
      user = await User.findOne({ where: { username: req.query.username } });
    }

    // organise whats included with a thread
    const threadInclude = order => {
      const options = {
        model: Thread,
        order: [["id", "DESC"]],
        limit,
        where: {},
        include: [
          Category,
          {
            model: User,
            attributes: ["username", "createdAt", "id", "color", "picture"]
          },
          {
            model: Post,
            limit: 1,
            order: [["id", order]],
            include: [{ model: User, attributes: ["username", "id"] }]
          }
        ]
      };

      // check if user is correct
      if (user) {
        options.where.userId = user.id;
      }

      // check from prop
      if (from !== null) {
        options.where.id = { $lte: from };
      }

      return [options];
    };

    if (req.params.category === "ALL") {
      threads = await Thread.findAll(threadInclude("ASC")[0]);
      threadLatestPost = await Thread.findAll(threadInclude("DESC")[0]);
    } else {
      threads = await Category.findOne({
        where: { value: req.params.category },
        include: threadInclude("ASC")
      });

      threadLatestPost = await Category.findOne({
        where: { value: req.params.category },
        include: threadInclude("DESC")
      });
    }

    if (!threads) {
      throw Errors.invalidParameter("category", "category does not exists");
    }

    if (Array.isArray(threads)) {
      resThreads = {
        name: "All",
        value: "ALL",
        Threads: threads,
        meta: {}
      };

      threadLatestPost = { Threads: threadLatestPost };
    } else {
      resThreads = threads.toJSON();
      resThreads.meta = {};
    }

    threadLatestPost.Threads.forEach((thread, i) => {
      const first = resThreads.Threads[i].Posts[0];
      const latest = thread.Posts[0];

      if (first.id === latest.id) {
        return;
      }

      resThreads.Threads[i].Posts.push(latest);
    });

    const nextId = await pagination.getNextIdDesc(
      Thread,
      user ? { userId: user.id } : {},
      resThreads.Threads
    );

    if (nextId) {
      resThreads.meta.nextURL = `/api/v1/category/${
        req.params.category
      }?&limit=${limit}&from=${nextId - 1}`;

      if (user) {
        resThreads.meta.URL += `&username=${user.username}`;
      }

      resThreads.meta.nextThreadsCount = await pagination.getNextCount(
        Thread,
        resThreads.Threads,
        limit,
        user ? { userId: user.id } : {},
        true
      );
    } else {
      resThreads.meta.nextURL = null;
      resThreads.meta.nextThreadsCount = 0;
    }

    res.json(resThreads);
  } catch (e) {
    console.log(e);
    return res.json(e);
  }
});

// protect routes
router.all("*", (req, res, next) => {
  if (!req.session.admin) {
    res.status(401);
    res.json({
      errors: [Errors.requestNotAuthorized]
    });
  } else {
    next();
  }
});

module.exports = router;
