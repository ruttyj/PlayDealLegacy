const request = require("request");
const express = require("express");
const path = require("path");

const usersRouter = require("./routes/users");
const testAPIRouter = require("./routes/testAPI");
const {
  addToApp_before,
  attachCookieToResponse,
  addToApp_after,
} = require("./server.shared.js");

const app = express();

// Call common logic for before
addToApp_before(app);

app.use(
  /.*\/main\.js/,
  express.static(path.join(__dirname, "../client/build/main.js"))
);
app.use(express.static(path.join(__dirname, "../client/build/")));
app.use("/audio", express.static(path.join(__dirname, "../client/src/audio")));
app.use("/img", express.static(path.join(__dirname, "../client/src/img")));
app.use("/users", usersRouter);
app.use("/testAPI", testAPIRouter);
app.get("*", (req, res) => {
  attachCookieToResponse(req, res);
  res.sendFile(path.join(__dirname, "../client/build/index.html"));
});

// Call common logic for after
addToApp_after(app);

module.exports = app;
