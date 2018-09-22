const express = require("express");
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const SequelizeStore = require("connect-session-sequelize")(
  expressSession.Store
);
const path = require("path");
const helmet = require("helmet");
const compression = require("compression");
const app = express();

// models
const { sequelize } = require("./models");

// web sockets
const sockets = require("./lib/sockets");

// config - port, set session secret
const port = process.env.PORT || 3000;
const sessionSecret = process.env.SESSION_SECRET || "shhh its secret";

// middlewares
app.use(helmet());
app.use(compression());
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
sessionStore.sync().then(response => console.log("database has been synced"));

// set proxy if in production
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}
app.use(session);

// routes
app.use("/api/v1/user", require("./routes/user"));
app.use("/api/v1/admin_token", require("./routes/adminToken"));
app.use("/api/v1/category", require("./routes/category"));
app.use("/api/v1/thread", require("./routes/thread"));
app.use("/api/v1/post", require("./routes/post"));
app.use("/api/v1/ban", require("./routes/ban"));
app.use("/api/v1/log", require("./routes/log"));
app.use("/api/v1/notification", require("./routes/notifications"));
app.use("/api/v1/poll", require("./routes/poll"));
app.use("/api/v1/report", require("./routes/report"));
app.use("/api/v1/search", require("./routes/search"));
app.use("/api/v1/settings", require("./routes/settings"));

// general error handler
app.use(require("./lib/errorHandler"));

// set static html page for frontend
// TODO: add app.use and path to handle html for SPA

// start everything up
const main = () => {
  const server = app.listen(port, () => {
    console.log(`Listening on ${port}`);

    // set global variables
    app.locals.appStarted = true;

    // emit started event
    app.emit("appStarted");
  });

  sockets.init(app, server, session);
};

// server setup
if (process.env.NODE_ENV === "test") {
  // sync db then start the server
  sequelize.sync({ force: true }).then(main);
} else {
  main();
}

module.exports = app;
