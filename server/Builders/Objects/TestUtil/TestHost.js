module.exports = function buildTestHost({ makeListenerMap, makeVar })
{
  // Used to simulate a Socket.IO host
  function TestHost(onConnected) {
    const mIdBase = 111111;
    const mState = {};
    const mTopId = makeVar(mState, "topId", 0);
    const mHost = makeListenerMap();

    // Create client side connection equivalent of socket.io's io() method
    function io() {
      const toClient = makeListenerMap();
      const toServer = makeListenerMap();

      mTopId.inc();
      let id = mTopId.get() * mIdBase;

      // Client side communicate with server
      const client = {
        id,
        on: toClient.on,
        once: toClient.once,
        emit: toServer.emit
      };

      // Server side communicate with client
      const server = {
        id,
        on: toServer.on,
        once: toServer.once,
        emit: toClient.emit
      };
      // Execute connection and attach server side client listeners
      mHost.once("connection", onConnected);
      mHost.emit("connection", server);

      return client;
    }

    return {
      io
    };
  }
  return TestHost
}