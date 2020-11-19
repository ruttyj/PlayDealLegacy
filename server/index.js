#!/usr/bin/env node
const serverFolder        = `.`
const builderFolder       = `${serverFolder}/Builders`
const utils               = require(`${serverFolder}/utils/index.js`)
const buildPlaydealServer = require(`${builderFolder}/Objects/Server`)


const cookie  = require(`cookie`);
const app     = require(`${serverFolder}/server.dev.js`);
const debug   = require(`debug`)(`server:server`);
const http    = require(`http`);

const CookieTokenManager = require(`${serverFolder}/CookieTokenManager`);
const cookieTokenManager = CookieTokenManager.getInstance();

const { isDef } = require(`${serverFolder}/utils/helperMethods`);

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || `3001`);
app.set(`port`, port);

/**
 * Create HTTP hostserver.
 */

const server = http.createServer(app);
const PlayDealServer = buildPlaydealServer({utils});
const playDealServer = new PlayDealServer();

const io = require(`socket.io`)(server);
io.on(`connection`, (thisClient) => {

  // @TODO this could be moved into playDealServer
  // Associate socket to cookie
  let cookies = cookie.parse(thisClient.request.headers.cookie);
  if (isDef(cookies.token) && isDef(thisClient.id)) {
    console.log(`associateTokenAndClient`, cookies.token, thisClient.id);
    cookieTokenManager.associateTokenAndClient(cookies.token, thisClient.id);
  }


  // Attach socket handlers
  playDealServer.onConnected(thisClient);

});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on(`error`, onError);
server.on(`listening`, onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server `error` event.
 */

function onError(error) {
  if (error.syscall !== `listen`) {
    throw error;
  }

  var bind = typeof port === `string` ? `Pipe ` + port : `Port ` + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case `EACCES`:
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case `EADDRINUSE`:
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server `listening` event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === `string` ? `pipe ${addr}` : `port ${addr.port}`;
  debug(`Listening on ${bind}`);
}
