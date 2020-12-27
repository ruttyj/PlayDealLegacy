#!/usr/bin/env node
const serverFolder                = `.`
const sharedFolder                = `../shared`

const builderFolder               = `${serverFolder}/Builders`
const buildPlaydealServer         = require(`${builderFolder}/Objects/Server`)
const AppHelpers                  = require(`${builderFolder}/Objects/App/AppHelpers`)

const cookie                      = require(`cookie`)
const http                        = require(`http`)
const utils                       = require(`${sharedFolder}/Utils`)

const PlayDealServer              = buildPlaydealServer({utils})
const CookieTokenManager          = require(`${serverFolder}/CookieTokenManager`)

const cookieTokenManager          = CookieTokenManager.getInstance()

const app                         = require(`${serverFolder}/app.js`)
const { normalizePort, onError }  = AppHelpers()

/**
 * Get port from environment and store in Express.
 */
const port = normalizePort(process.env.PORT || `3001`)
app.set(`port`, port)

/**
 * Create HTTP hostserver.
 */
const server = http.createServer(app)
server.listen(port)
server.on(`error`, onError)

/**
 * Create Socket
 * Initialize PlayDeal
 */
const io = require(`socket.io`)(server)
const playDealServer  = new PlayDealServer()
io.on(`connection`, (thisClient) => {
  // @TODO this could be moved into playDealServer
  // Associate socket to cookie
  const { isDef } = utils
  let cookies = cookie.parse(thisClient.request.headers.cookie)
  if (isDef(cookies.token) && isDef(thisClient.id)) {
    console.log(`associateTokenAndClient`, cookies.token, thisClient.id)
    cookieTokenManager.associateTokenAndClient(cookies.token, thisClient.id)
  }
  // Attach socket handlers
  playDealServer.onConnected(thisClient)
});
