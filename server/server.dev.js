const request = require("request");
const express = require("express");
const path = require("path");
const createError = require("http-errors");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors"); // cross domain
const { isDef, getNestedValue } = require("./utils/helperMethods");

const portNumber = 3000; // font-end port number
const app = express();

const CookieTokenManager = require("./CookieTokenManager");
const cookieTokenManager = CookieTokenManager.getInstance();

// Call common logic for before
app.use(cors());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/audio", express.static(path.join(__dirname, "../client/src/audio")));
app.use("/img", express.static(path.join(__dirname, "../client/src/img")));
app.get(/.*\/main\.js/, (req, res) => {
  request(`http://localhost:${portNumber}/main.js`)
    .on("error", (err) => res.sendFile("loading.html", { root: __dirname }))
    .pipe(res);
});
app.get(/.*/, (req, res) => {
  // Make token and ensure object is associated
  let token = getNestedValue(req, ["cookies", "token"], null);
  if (!isDef(token)) {
    token = cookieTokenManager.generateToken();

    res.cookie("token", token, {
      expires: new Date(Date.now() + 88888888), // just over 24 hours
      httpOnly: true,
    });

    console.log("generate and attach cookie token", token);
  } else if (isDef(token) && !cookieTokenManager.has(token)) {
    // Token exists but not in manager -> create record
    cookieTokenManager.set(token, {});
  }
  request(`http://localhost:${portNumber}/`)
    .on("error", (err) => res.sendFile("loading.html", { root: __dirname }))
    .pipe(res);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;