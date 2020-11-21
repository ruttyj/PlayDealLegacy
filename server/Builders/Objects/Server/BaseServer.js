
module.exports = function buildBaseServer() {
  return class BaseServer {
    constructor()
    {
      this.socketManager;
    }

    getSocketManager(){
      return this.socketManager;
    }
  }
}