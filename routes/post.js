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

// AUTH - ADMIN
// router.all("*", (req, res, next) => {
//   if (!req.session.admin) {
//     res.status(401);
//     res.json({
//       errors: [Errors.requestNotAuthorized]
//     });
//   } else {
//     next();
//   }
// });

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
      where: { username: req.session.username }
    });

    if (!post) {
      throw Errors.invalidParameter("id", "post does not exist");
    }

    if (post.UserId === user.id) {
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
    await Ban.canCreatePost(req.session.username);

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
      replyingToPost = await Post.getReplyToPost(req.body.replyingToId, thread);
      post = await Post.create({
        content: req.body.content,
        postNumber: thread.postsCount
      });

      await post.setReplyingTo(replyingToPost);
      await replyingToPost.addReplies(post);

      let replyNotification = await Notification.createPostNotification({
        usernameTo: replyingToPost.User.username,
        userFrom: user,
        type: "reply",
        post: post
      });

      await replyNotification.emitNotificationMessage(
        req.app.get("io-users"),
        req.app.get("io")
      );
    } else {
      post = await Post.create({
        content: req.body.content,
        postNumber: thread.postsCount
      });
    }

    await post.setUser(user);
    await post.setThread(thread);
    await thread.increment("postsCount");

    if (uniqueMentions.length) {
      const ioUsers = req.app.get("io-users");
      const io = req.app.get("io");

      uniqueMentions.forEach(async mention => {
        const mentionNotification = await Notification.createPostNotification({
          usernameTo: mention,
          userFrom: user,
          type: "mention",
          post
        });

        await mentionNotification.emitNotificationMessage(ioUsers, io);
      });
    }

    res.json(
      await post.reload({
        include: Post.includeOptions()
      })
    );

    req.app
      .get("io")
      .to(`thread/${thread.id}`)
      .emit("new post", {
        postNumber: thread.postsCount,
        content: post.content,
        username: user.username
      });
  } catch (e) {
    next(e);
  }
});

router.delete("/:post_id", async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.post_id);
    if (!post) {
      throw Errors.sequelizeValidation(Sequelize, {
        error: "post does not exist",
        path: "id"
      });
    }

    await post.update({
      content: "[This post has been removed by an administrator]",
      removed: true
    });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
