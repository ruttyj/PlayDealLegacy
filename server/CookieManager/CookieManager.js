const cookieParser = require("cookie-parser");

function CookieManager() {
  cookieParser.JSONCookie("token");
}

module.exports = CookieManager;
