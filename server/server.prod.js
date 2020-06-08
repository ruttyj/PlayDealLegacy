const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors"); // cross domain
const request = require("request");
const url = require("url");
const proxy = require("express-http-proxy");

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const testAPIRouter = require("./routes/testAPI");

const app = express();
app.use(cors());

//const gameProxy = proxy("http://localhost:3000/", {
//  forwardPath: (req) => "http://localhost:3000/build",
//});
//
//const gameScriptProxy = proxy("http://localhost:3000/main.js", {
//  forwardPath: (req) => "http://localhost:3000/build/main.js",
//});

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
//app.use(express.static(path.join(__dirname, "public")));

app.use(
  /.*\/main\.js/,
  express.static(path.join(__dirname, "../client/build/main.js"))
);
app.use(express.static(path.join(__dirname, "../client/build/")));
app.use("/audio", express.static(path.join(__dirname, "../client/src/audio")));
app.use("/img", express.static(path.join(__dirname, "../client/src/img")));

//app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/testAPI", testAPIRouter);

app.get("*", (req, res) => {
  res.sendfile(path.join(__dirname, "../client/build/index.html"));
});

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

module.exports = app;
