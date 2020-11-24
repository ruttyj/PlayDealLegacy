module.exports = function() {
  return class BaseConnection 
  {
      constructor({socket, server})
      {
          const connection = this;
          connection.id = String(socket.id);
          connection.socket = socket
          connection.server = server
      }
      registerEvents(){}
      unregisterEvents(){}
      onConnected(){}
      onDisconnected(){}
      onTrigger(){}

      getServer()
      {
        const connection = this
        return connection.server
      }
  }
}