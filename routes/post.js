const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");

const {
  User,
  Thread,
  Post,
  Notification,
  Ban,
  Sequelize,
  sequelize
} = require("../models");

// AUTH
// router.all('*', (req, res, next) => {
//     if(req.session.loggedIn) {
//         next()
//     }else {
//         res.status(401)
//         res.json({
//             errors: [Errors.requestNotAuthorizeds]
//         })
//     }
// })

// GET - get a post by id
router.get("/:post_id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.post_id, {
      include: Post.includeOptions()
    });

    if (!post) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "post does not exist",
        path: "id"
      });
    }

    res.json(post.toJSON());
  } catch (e) {
    next(e);
  }
});

// PUT - add a like to post
router.put("/:post_id/like", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const user = await User.findOne({
      where: { username: req.sessiion.username }
    });

    if (!post) {
      throw Errors.invalidParameter("id", "post does not exist");
    }

    if (post.userId === user.id) {
      throw Errors.cannotLikeOwnPost;
    }

    await post.addLikes(user);

    res.json({
      success: true
    });
  } catch (e) {
    next(e);
  }
});

// DELETE - remove a like
router.delete("/:post_id/like", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.post_id);
    const user = await User.findOne({
      where: { username: req.session.username }
    });

    if (!post) {
      throw Errors.invalidParameter("id", "post does not exist");
    }

    await post.removeLikes(user);

    res.json({
      success: true
    });
  } catch (e) {
    next(e);
  }
});

// POST - create a new post
router.post("/", async (req, res, next) => {
  let thread,
    replyingToPost,
    post,
    uniqueMentions = [];

  try {
    // check if the user is banned
    await Ban.canCreatePosts(req.session.username);

    if (req.body.mentions) {
      uniqueMentions = Notification.filterMentions(req.body.mentions);
    }

    thread = await Thread.findOne({
      where: { id: req.body.threadId }
    });

    const user = await User.findOne({
      where: { username: req.session.username }
    });

    if (!thread) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "thread does not exist",
        path: "id"
      });
    }

    if (req.body.replyingToId) {
      replyingToPost = await Post.getReplyingToPost(
        req.body.replyingToId,
        thread
      );
      post = await Post.create({
        content: req.body.content,
        postNumber: thread.postsCount
      });
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
