const express = require("express");
const router = express.Router();

const pagination = require("../lib/pagination");
let Errors = require("../lib/errors");

// get the required models
const { Category, Post, Thread, User, Sequelize } = require("../models");

// protect routes
router.all("*", (req, res, next) => {
  //   if (!req.session.admin) {
  //     res.status(401);
  //     res.json({
  //       errors: [Errors.requestNotAuthorized]
  //     });
  //   } else {
  //     next();
  //   }
  next();
});

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

    // return everything
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

    // return category doesn't exist error
    if (!threads) {
      throw Errors.invalidParameter("category", "category does not exists");
    }

    // check that threads is an array
    // otherwise build up as json
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

    // get the first and latest post
    // check if they match
    // if they do quit.
    // otherwise add them to the result thread array
    threadLatestPost.Threads.forEach((thread, i) => {
      const first = resThreads.Threads[i].Posts[0];
      const latest = thread.Posts[0];

      if (first.id === latest.id) {
        return;
      }

      resThreads.Threads[i].Posts.push(latest);
    });

    // PAGINATION
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

    return res.json(resThreads);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

// POST new category
router.post("/", async (req, res) => {
  try {
    // try and create a new category
    const category = await Category.create({
      name: req.body.name,
      // color is defaulted to a random color if empty
      color: req.body.color
    });

    return res.json(category.toJSON());
  } catch (e) {
    console.log(e);
    // check if its a constraint error
    if (e.name === `SequelizeUniqueConstraintError`) {
      res.status(400);
      res.json({
        errors: [Errors.categoryAlreadyExists]
      });
    } else {
      next(e);
    }
  }
});

// PUT - edit a category
router.put("/:category_id", async (req, res, next) => {
  try {
    const id = req.params.category_id;
    let obj = {};
    // grab the req values if any
    if (req.body.name) {
      obj.name = req.body.name;
    }

    if (req.body.color) {
      obj.color = req.body.color;
    }

    const affectedRows = await Category.update(obj, {
      where: { id }
    });

    // check if there are no affected rows
    // cause that means the user didnt pass an id
    // or they tried to pass an invalid id
    if (!affectedRows[0]) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "Category id is not valid",
        value: id
      });
    } else {
      // otherwise return the updated data
      const result = await Category.findById(id);
      res.json(result.toJSON());
    }
  } catch (e) {
    next(e);
  }
});

// DELETE - remove a category
router.delete("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    //if nothing is returned
    if (!category) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: `Category id does not exist`,
        value: req.params.id
      });
    }

    // setup 'Other' category
    const otherCategory = await Category.findOrCreate({
      where: { name: "Other" },
      defaults: { color: "#9a9a9a" }
    });

    // update the thread about the deletion,
    // thread now falls under 'Other'
    const transfer = await Thread.update(
      {
        CategoryId: otherCategory[0].id
      },
      {
        where: { CategoryId: req.params.id }
      }
    );

    // finally do the deletion
    await category.destroy();

    res.json({
      success: true,
      otherCategoryCreated: otherCategory[1] ? otherCategory : null
    });
  } catch (e) {
    console.log(e);
    next(e);
  }
});

module.exports = router;
