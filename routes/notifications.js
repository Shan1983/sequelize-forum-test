const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");
const { Notification, User, Post, PostNotification } = require("../models");

// AUTH
// router.all('*', (req, res, next) => {
//     if(req.session.loggedIn) {
//         next()
//     }else {
//         res.status(401)
//         res.json({
//             errors: [Errors.requestNotAuthorized]
//         })
//     }
// })

// GET - get all notifications for a user
router.get("/", async (req, res, next) => {
  try {
    const Notifications = await Notification.findAll({
      where: {
        UserId: req.session.UserId
      },
      order: [["id", "DESC"]],
      include: [
        {
          model: PostNotification,
          include: [
            Post,
            { model: User, attributes: ["createdAt", "username", "color"] }
          ]
        }
      ]
    });

    const unreadCount = Notifications.reduce((acc, val) => {
      return val.read ? acc : acc + 1;
    }, 0);

    res.json({ Notifications, unreadCount });
  } catch (e) {
    next(e);
  }
});

// PUT - mark notification as read
router.put("/", async (req, res, next) => {
  try {
    await Notification.update(
      { read: true },
      {
        where: {
          UserId: req.session.Userid,
          read: false
        }
      }
    );
  } catch (e) {
    next(e);
  }
});

// PUT - mark notification as been interacted with
router.put("/:id", async (req, res, next) => {
  try {
    const updatedRows = await Notification.update(
      { interacted: true, read: true },
      {
        where: {
          UserId: req.session.UserId,
          id: req.params.id
        }
      }
    );

    if (updatedRows[0] === 0) {
      res.status(400);
      res.json({
        errors: [Errors.invalidParameter("id", "invalid notificiation id")]
      });
    } else {
      res.json({ success: true });
    }
  } catch (e) {
    next(e);
  }
});

// DELETE  - remove a notification
router.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await Notification.destroy({
      where: {
        UserId: req.session.UserId,
        id: req.params.id
      }
    });

    if (deleted) {
      res.json({ success: true });
    } else {
      res.status(400);
      res.json({
        errors: [Errors.invalidParameter("id", "invalid notification id")]
      });
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
