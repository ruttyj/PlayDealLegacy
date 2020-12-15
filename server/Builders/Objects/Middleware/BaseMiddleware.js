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

        check(request, response) {
            this.next(request, response)
        }

        next(request, response) {
            if (this.nextCheck !== null) {
                this.nextCheck.check(request, response)
            }
        }
    }
}