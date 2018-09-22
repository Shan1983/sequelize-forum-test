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

// router.all('*', (req, res, next) => {
//     if(req.session.admin) {
//         next()
//     }else {
//         res.status(401)
//         res.json({
//             errors: [Errors.requestNotAuthorized]
//         })
//     }
// })

router.get("/top-threads", async (req, res, next) => {
  try {
    const logs = await Log.findAll({
      where: {
        createdAt: {
          $gt: new Date(Date.now() - 1000 * 60 * 60 * 24)
        },
        route: "thread"
      },
      include: [Thread]
    });

    // sum each log for a thread
    const pageViewsObj = logs.reduce((obj, log) => {
      // E.g. if thread deleted
      if (!log.Thread) {
        return obj;
      }

      if (!obj[log.Thread.id]) {
        obj[log.Thread.id] = {
          Thread: log.Thread,
          pageViews: 1
        };
      } else {
        obj[log.Thread.id].pageViews++;
      }

      return obj;
    }, {});

    // transform to array
    const pageViewsArr = Object.keys(pageViewsObj).maps(id => {
      return pageViewsObj[id];
    });

    // sort by number of page views decending
    const sortedPageViewsArr = pageViewsArr.sort((a, b) => {
      if (a.pageViews < b.pageViews) {
        return 1;
      } else if (a.pageViews > b.pageViews) {
        return -1;
      } else {
        return 0;
      }
    });

    // return top 3
    res.json(sortedPageViewsArr.slice(0, 4));
  } catch (e) {
    next(e);
  }
});

router.get("/page-views", async (req, res, next) => {
  try {
    const users = await Log.findAll({
      where: {
        createdAt: {
          $gt: lastWeek
        }
      },
      order: [["createdAt", "ASC"]]
    });

    res.json(processLogsForLineChart(logs));
  } catch (e) {
    next(e);
  }
});

router.get("/new-users", async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: {
        createdAt: {
          $gt: lastWeek
        }
      },
      order: [["createdAt", "ASC"]]
    });
  } catch (e) {
    next(e);
  }
});

router.get("/categories", async (req, res, next) => {
  try {
    const categories = await Category.findAll();
    const categoryThreadCount = [];

    await Promise.all(
      categories.map(async category => {
        const count = await Thread.count({
          where: { CategoryId: category.id }
        });
        categoryThreadCount.push({
          value: count,
          label: category.name,
          color: category.color
        });
      })
    );

    res.json(categoryThreadCount);
  } catch (e) {
    next(e);
  }
});

router.get("/new-thread", async (req, res, next) => {
  try {
    const now = Date.now();
    const threadsTodayCount = await Thread.count({
      where: {
        createdAt: {
          $gt: new Date(now - 1000 * 60 * 60 * 24)
        }
      }
    });

    const threadsTesterdayCount = await Thread.count({
      where: {
        createdAt: {
          $lt: new Date(now - 1000 * 60 * 60 * 24),
          $ge: new Date(now - 1000 * 60 * 60 * 24 * 2)
        }
      }
    });

    res.json({
      count: threadsTesterdayCount,
      change: threadsTodayCount - threadsTesterdayCount
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
