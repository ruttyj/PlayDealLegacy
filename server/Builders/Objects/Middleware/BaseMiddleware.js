module.exports = function buildBaseMiddleware({
  isDef
}){
  return class BaseMiddleware 
  {
    constructor(parent = null)
    {
      this.nextCheck = null;
      if (isDef(parent)) {
        parent.then(this);
      }
    }
  
    then(nextCheck) {
      this.nextCheck = nextCheck;
    }

    check(socketRequest) {
      this.next(socketRequest)
    }

    next(socketRequest) {
      if (this.nextCheck !== null) {
        this.nextCheck.check(socketRequest)
      }
    }
  }
}