const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");
const { Post, Thread, Sequelize } = require("../models");

const limit = 10;

// GET - return search results
router.get("/", async (req, res, next) => {
  try {
    const q = req.query.q;
    const qRegEx = RegExp(q, "g");
    const offset = +req.query.offset || 0;

    const count = await Post.count({
      where: {
        content: { $like: `%${q}%` }
      }
    });

    const posts = await Post.findAll({
      where: {
        content: { $like: `%${q}%` }
      },
      order: [["id", "DESC"]],
      include: Post.includeOptions(),
      limit,
      offset
    });

    const returnPost = posts.map(p => {
      const result = p.toJSON();
      result.content = result.content.replace(qRegEx, `<b>${q}</b>`);
      return result;
    });

    const remainingResults = count - (offset + 10);
    let next;
    if (remainingResults < 0) {
      next = 0;
    } else if (remainingResults < 10) {
      next = remainingResults;
    } else {
      next = 10;
    }

    res.json({
      posts: returnPost,
      offset: offset + 10,
      next
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
