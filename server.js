const express = require("express");
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(
  expressSession.Store
);
const path = require("path");
const app = express();

// models
const { sequelize } = require("./models");

// web sockets

// config - port, set session secret
const port = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET || "shhh its secret";

// middlewares
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// sessions
const sessionStore = new SequelizeStore({ db: sequelize });
const session = expressSession({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: true,
  store: sessionStore
});
// set up the intial session
sessionStore.sync();
// set proxy if in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(session);

// routes
app.use("/api/v1/category", require("./routes/category"));

// general error handler
app.use(require("./lib/errorHandler"));

// set static assets

// start everything up
const main = () => {
  const server = app.listen(port, () => {
    console.log(`Listening on ${port}`);

    // set global variables
    app.locals.appStarted = true;

    // emit started event
  });
};

// server setup
if (process.env.NODE_ENV === "test") {
  // sync db then start the server
  sequelize.sync({ force: true }).then(main);
} else {
  main();
}

module.exports = app;
