const express = require("express");
const router = express.Router();

const { Sequelize, Log, Thread, User, Category } = require("../models");

const Errors = require("../lib/errors");
const now = new Date();
const lastWeek = new Date(
  now.getUTCFullYear(),
  now.getUTCMonth(),
  now.getUTCDate() - 6
);

const processLogsForLineChart = logs => {
  const normalizedDateLogs = logs.map(log => {
    const date = new Date(log.createdAt);
    date.setHours(0, 0, 0);
    return { createdAt: date };
  });

  const pageViewsObj = normalizedDateLogs.reduce((obj, log) => {
    if (!obj[log.createdAt]) {
      obj[log.createdAt] = { date: log.createdAt, pageViews: 1 };
    } else {
      obj[log.createdAt].pageViews++;
    }
    return obj;
  }, {});

  for (let i = 0; i < 7; i++) {
    const date = new Date(lastWeek);
    date.setUTCDate(date.getUTCDate() + i);

    if (!pageViewsObj[date]) {
      pageViewsObj[date] = {
        date,
        pageViews: 0
      };
    }
  }

  const pageViewsArr = Object.keys(pageViewsObj).map(date => {
    return pageViewsObj[date];
  });

  const pageViewsSorted = pageViewsArr.sort((a, b) => {
    if (a.date < b.date) {
      return -1;
    } else if (a.date > b.date) {
      return 1;
    } else {
      return 0;
    }
  });

  return pageViewsSorted;
};

router.post("/", async (req, res, next) => {
  try {
    let thread, user;
    if (req.body.route === "thread") {
      thread = await Thread.findById(req.body.resourceId);

      if (!thread) {
        throw Errors.sequelizeValidation(Sequelize, {
          error: "thread does not exist",
          value: req.body.resourceId
        });
      }
    } else if (
      req.body.route === "userPosts" ||
      req.body.route === "userThreads"
    ) {
      user = await User.findById(req.body.resourceId);

      if (!user) {
        throw Errors.sequelizeValidation(Sequelize, {
          error: "user does not exist",
          value: req.body.resourceId
        });
      }
    } else if (
      (req.body.route === "settingsGeneral" ||
        req.body.route === "settingsAccount") &&
      !req.session.loggedIn
    ) {
      throw Errors.requestNotAuthorized;
    }

    const log = await Log.create({
      route: req.body.route
    });

    if (thread) {
      await log.setThread(thread);
    }
    if (user) {
      await log.setUser(user);
    }
    if (req.session.username) {
      const sessionUser = await User.findOne({
        where: { username: req.session.username }
      });

      await log.setSessionUser(sessionUser);
    }

    res.json(log.toJSON());
  } catch (e) {
    next(e);
  }
});

module.exports = router;
