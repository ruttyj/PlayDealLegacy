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
    res.header("Access-Control-Allow-Origin", "*");
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
  let token = getNestedValue(req, ["cookies", "token"], null);
  let clientId = getNestedValue(req, ["cookies", "io"], null);
  console.log(
    "fresh baked cookies",
    JSON.stringify(getNestedValue(res, ["cookies"], null), null, 2)
  );
  let tokenData = null;
  if (!isDef(token)) {
    // Generate token / data
    token = cookieTokenManager.generateToken();

    res.cookie("token", token);
    tokenData = cookieTokenManager.get(token);
  } else if (isDef(token) && !cookieTokenManager.has(token)) {
    // Token exists but not in manager -> create record
    cookieTokenManager.set(token, {});
    tokenData = cookieTokenManager.get(token);
  } else {
    // get token data
    tokenData = cookieTokenManager.get(token);
    console.log("token", JSON.stringify({ token, tokenData }));
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
