module.exports = function buildBaseMiddleware({
    BaseMiddleware
}){
    return class CallbackMiddleware extends BaseMiddleware
    {
        constructor(callback = () => {})
        {
            super();
            this.mCallback = callback
        }

        check(request, response) {
            this.mCallback(request, response)
            this.next(request, response)
        }
    }
}
