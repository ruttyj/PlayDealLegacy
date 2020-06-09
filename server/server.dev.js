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

app.use("/users", usersRouter);
app.use("/testAPI", testAPIRouter);
app.use("/audio", express.static(path.join(__dirname, "../client/src/audio")));
app.use("/img", express.static(path.join(__dirname, "../client/src/img")));
app.get(/.*\/main\.js/, (req, res) => {
  request("http://localhost:3000/main.js")
    .on("error", (err) => res.sendFile("loading.html", { root: __dirname }))
    .pipe(res);
});
app.get(/.*/, (req, res) => {
  attachCookieToResponse(req, res);
  request("http://localhost:3000/")
    .on("error", (err) => res.sendFile("loading.html", { root: __dirname }))
    .pipe(res);
});

// Call common logic for after
addToApp_after(app);

module.exports = app;
