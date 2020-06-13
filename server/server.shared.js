const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors"); // cross domain
const request = require("request");
const url = require("url");
const proxy = require("express-http-proxy");
const { isDef, getNestedValue } = require("./utils/helperMethods");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const testAPIRouter = require("./routes/testAPI");
const CookieTokenManager = require("./CookieTokenManager");
const cookieTokenManager = CookieTokenManager.getInstance();

function addToApp_before(app) {
  app.use(cors());

  app.use(function (req, res, next) {
    //res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  // view engine setup
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "jade");

  app.use(logger("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
}

function attachCookieToResponse(req, res) {
  console.log("attachCookieToResponse");
  // Make token and ensure object is associated
  let token = getNestedValue(req, ["cookies", "token"], null);
  if (!isDef(token)) {
    token = cookieTokenManager.generateToken();
    console.log("A", token);

    res.cookie("token", token, {
      expires: new Date(Date.now() + 900000),
      httpOnly: true,
    });

    console.log("generate and attach cookie token", token);
  } else if (isDef(token) && !cookieTokenManager.has(token)) {
    // Token exists but not in manager -> create record
    cookieTokenManager.set(token, {});
    console.log("B", token);
    console.log("attach cookie token data", token);
  }
}

function addToApp_after(app) {
  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    next(createError(404));
  });

  // error handler
  app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render("error");
  });
}

module.exports = {
  addToApp_after,
  addToApp_before,
  attachCookieToResponse,
};
