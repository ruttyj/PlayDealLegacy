module.exports = function buildMiddlewareWrapper({ 
    isDef,
    isFunc,
    BaseMiddleware,
    Response,
})
{
    return class MiddlewareWrapper
    {
        constructor(callback, fallback=null)
        {
            this.mCallback = callback
            this.mFallback = fallback
            
            this.mBeforeMiddlewareRoot
            this.mAfterMiddlewareRoot
            this.mDoneMiddlewareRoot

            this.mBeforeMiddlewareTop
            this.mAfterMiddlewareTop
            this.mDoneMiddlewareTop

            this._init()
        }

        _init()
        {
            this.mBeforeMiddlewareRoot = new BaseMiddleware()
            this.mAfterMiddlewareRoot  = new BaseMiddleware()
            this.mDoneMiddlewareRoot   = new BaseMiddleware()

            this.mBeforeMiddlewareTop  = this.mBeforeMiddlewareRoot
            this.mAfterMiddlewareTop   = this.mAfterMiddlewareRoot
            this.mDoneMiddlewareTop    = this.mDoneMiddlewareRoot
        }

        before(middleware=null)
        {
            if (isDef(middleware)) {
                if (isDef(this.mBeforeMiddlewareTop)){
                    this.mBeforeMiddlewareTop.then(middleware)
                }
                this.mBeforeMiddlewareTop = middleware
            }

            return this
        }

        after(middleware=null)
        {
            if (isDef(middleware)) {
                if (isDef(this.mAfterMiddlewareTop)) {
                    this.mAfterMiddlewareTop.then(middleware)
                }
                this.mAfterMiddlewareTop = middleware
            }

            return this
        }

        done(middleware=null)
        {
            if (isDef(middleware)) {
                if (isDef(this.mDoneMiddlewareTop)) {
                    this.mDoneMiddlewareTop.then(middleware)
                }
                this.mDoneMiddlewareTop = middleware
            }

            return this
        }
    
        getFallback(primaryFallback = null)
        {
            if (isFunc(primaryFallback)) {
                return primaryFallback
            }
            return this.mFallback 
        }

        //execute(rnew Request('getRoom', {code: 'ABC'}))
        execute(request=null, response=null, fallback = null)
        {
            if (!isDef(response)) {
                response = new Response();
            }
            try {
                this.mBeforeMiddlewareRoot.check(request, response)
                this.mCallback(request, response)
                this.mAfterMiddlewareRoot.check(request, response)
            } catch (e) {
                let callbackMethod = this.getFallback(fallback)
                if (isFunc(callbackMethod)) {
                    callbackMethod(request, response, e)
                }
            }

            this.mDoneMiddlewareRoot.check(request, response)

            return response;
        }
    }
}
