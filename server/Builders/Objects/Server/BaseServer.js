
module.exports = function buildBaseServer() {
  return class BaseServer {
    constructor()
    {
      this.clientManager;
    }

    getSocketManager(){
      return this.clientManager;
    }
  }
}