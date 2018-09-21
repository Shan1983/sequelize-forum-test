const express = require("express");
const router = express.Router();

const Errors = require("../lib/errors");
const AdminToken = require("../models").AdminToken;

router.post("/", async (req, res, next) => {
  try {
    if (!req.session.loggedIn && !req.session.admin) {
      throw Errors.requestNotAuthorized;
    } else {
      const token = await AdminToken.create();
      res.json(token.toJSON());
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
