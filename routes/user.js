const express = require("express");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const router = express.Router();

const Errors = require("../lib/errors");

const {
  User,
  Post,
  ProfilePicrure,
  AdminToken,
  Thread,
  Category,
  Sequelize,
  Ip,
  Ban
} = require("../models");

const pagination = require("../lib/pagination");

// session set up
const setUserSession = (req, res, username, userId, admin) => {
  req.session.loggedIn = true;
  req.session.username = username;
  req.session.userId = userId;

  res.cookie("username", username);

  // Not for security, this is just so the client can
  // show/Hide certain parts of the UI
  // user can change these settings but the server will have final say over
  // everything a user does
  res.cookie("admin", !!admin);

  if (admin) {
    req.session.admin = true;
  }
};

// Auth - protect all routes
// router.all('*', (req, res, next) => {
//   if(req.session.username) {
//     next()
//   }else {
//     res.status(401)
//     res.json({
//       errors: [Errors.requestNotAuthorized]
//     })
//   }
// })

// Auth - Admin
// router.all('*', (req, res, next) => {
//   if(req.session.admin) {
//     next()
//   }else {
//     res.status(401)
//     res.json({
//       errors: [Errors.requestNotAuthorized]
//     })
//   }
// })

// POST - create a new user
router.post("/", async (req, res, next) => {
  try {
    await Ban.isIpBanned(req.ip);

    const userParams = {
      username: req.body.username,
      hash: req.body.password,
      admin: false
    };

    if (req.body.admin && (await User.canBeAdmin(req.body.token))) {
      userParams.admin = true;
    }

    const user = await User.create(userParams);
    await Ip.createIfNotExists(req.ip, user);

    setUserSession(req, res, user.username, user.id, userParams.admin);
    res.json(user.toJSON());
  } catch (e) {
    next(e);
  }
});

// GET - get the user and the users posts/threads
router.get("/:username", async (req, res, next) => {
  try {
    const queryObj = {
      attributes: { exclude: ["hash"] },
      where: { username: req.params.username }
    };

    if (req.params.posts) {
      const { from, limit } = pagination.getPaginationProps(req.query, true);

      const postInclude = {
        model: Post,
        include: Post.includeOptions(),
        limit,
        order: [["id", "DESC"]]
      };

      if (from !== null) {
        postInclude.where = { id: { $lte: from } };
      }

      queryObj.include = [postInclude];

      const user = await User.findOne(queryObj);
      if (!user) {
        throw Errors.accountDoesNotExist;
      }

      const meta = await user.getMeta(limit);

      res.json(Object.assign(user.toJSON(limit), { meta }));
    } else if (req.query.threads) {
      let queryStr = "";

      Object.keys(req.query).forEach(query => {
        queryStr += `&${query}=${req.query[query]}`;
      });

      res.redirect(
        `api/v1/category/ALL?username${rea.params.username}${queryStr}`
      );
    } else {
      const user = await User.fondOne(queryObj);
      if (!user) {
        throw Errors.accountDoesNotExist;
      }
      res.json(user.toJSON());
    }
  } catch (e) {
    next(e);
  }
});

// POST - user login
router.post(":username/login", async (req, res, next) => {
  try {
    await Ban.isIpBanned(req.ip, req.params.username);

    const user = await User.findOne({
      where: { username: req.params.username }
    });

    if (user) {
      if (await user.comparePassword(req.body.password)) {
        await Ip.createIfNotExist(req.ip, user);

        setUserSession(req, res, user.username, user.id, user.admin);

        res.json({
          username: user.username,
          admin: user.admin,
          success: true
        });
      } else {
        res.status(401);
        res.json({
          errors: [Errors.invalidLoginCredentials]
        });
      }
    } else {
      res.status(401);
      res.json({
        errors: [Errors.invalidLoginCredentials]
      });
    }
  } catch (e) {
    next(e);
  }
});

// POST - logout user
router.post("/:username/logout", async (req, res, next) => {
  req.session.destroy(() => {
    res.clearCookie("username");
    res.clearCookie("admin");
    res.json({
      success: true
    });
  });
});

// GET - get the users profile picture
router.get("/:username/picture", async (req, res, next) => {
  try {
    user = await User.findOne({
      where: { username: req.params.username }
    });

    if (!user) {
      throw Errors.accountDoesNotExist;
    }

    const picture = await ProfilePicrure.findOne({
      where: { userId: user.id }
    });

    if (!picture) {
      res.status(404);
      res.end("");
    } else {
      res.writeHead(200, {
        "Content-Type": picture.mimetype,
        "Content-disposition": "attachment;filename=profile",
        "Content-Length": picture.file.length
      });

      res.end(new Buffer(picture.file, "binary"));
    }
  } catch (e) {
    next(e);
  }
});

// multer setup
const upload = multer({
  storage: multer.memoryStorage()
});

// POST - upload a new profile picture
router.post("/:username/picture", async (req, res, next) => {
  try {
    if (req.session.username !== req.params.username) {
      throw Errors.requestNotAuthorized;
    } else {
      const user = await User.findById(req.session.userId);
      const picture = await ProfilePicture.findOne({
        where: { userId: user.id }
      });
      const pictureObj = {
        file: req.file.buffer,
        mimetype: req.file.mimetype
      };

      // if the user hasnt yet set up a picture
      if (!picture) {
        picture = await ProfilePicrure.create(pictureObj);
        await picture.setUser(user);
      } else {
        await picture.update(pictureObj);
      }

      // hack to force the browser to reload background images
      await user.update({
        picture: `api/v1/user/${
          req.session.username
        }/picture?rand=${Date.now()}`
      });

      res.json(user.toJSON());
    }
  } catch (e) {
    next(e);
  }
});

// DELETE - remove a users picture completely
router.delete("/:username/picture", async (req, res, next) => {
  try {
    if (req.session.username !== req.params.username) {
      throw Errors.requestNotAuthorized;
    } else {
      const user = await User.findById(req.session.userId);
      const picture = await ProfilePicrure.findOne({
        where: { userId: user.id }
      });

      // kill the users picture from the db
      await user.update({
        picture: null
      });

      // now remove it perminately from the db
      await picture.destroy();

      res.json(user.toJSON());
    }
  } catch (e) {
    next(e);
  }
});

// PUT update users data
router.put("/:username", async (req, res, next) => {
  try {
    if (req.session.username !== req.params.username) {
      throw Errors.requestNotAuthorized;
    }

    if (req.body.description !== undefined) {
      const user = await User.update(
        { description: req.body.description },
        { where: { username: req.session.username } }
      );
      res.json({ success: true });
    } else if (
      req.body.currentPassword !== undefined &&
      req.body.newPassword !== undefined
    ) {
      const user = await User.findOne({
        where: { username: req.session.username }
      });

      await user.updatePassword(req.body.currentPassword, req.body.newPassword);

      res.json({
        success: true
      });
    } else {
      res.json({ success: false });
    }
  } catch (e) {
    next(e);
  }
});

// DELETE - remove a users account
router.delete("/:username", async (req, res, next) => {
  try {
    if (req.session.username !== req.params.username) {
      throw Errors.requestNotAuthorized;
    }

    const user = await User.findOne({
      where: { username: req.session.username }
    });

    // good bye user
    await user.destroy();

    req.session.destroy(() => {
      res.clearCookie("username");
      res.clearCookie("admin");
      res.json({
        success: true
      });
    });
  } catch (e) {
    next(e);
  }
});

// GET - return all users that are admins
router.get("/", async (req, res, next) => {
  try {
    if (req.query.admin) {
      const admins = await User.findAll({
        where: { admin: true },
        attributes: {
          exclude: ["hash"]
        }
      });

      res.json(admins);
    } else {
      res.json({});
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
