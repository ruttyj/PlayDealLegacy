module.exports = function buildSocketRoute({ 
  isDef,
  isFunc,
  BaseMiddleware,
  makeConsumerFallbackResponse,
})
{
  return class SocketRoute
  {
    constructor(routeMethod)
    {
      this.mRouteMethod = routeMethod
      
      this.mRootBeforeMiddleware
      this.mRootAfterMiddleware

      this.mTopBeforeMiddleware
      this.mTopAfterMiddleware
    }

    _init()
    {
      this.mRootBeforeMiddleware = new BaseMiddleware()
      this.mRootAfterMiddleware  = new BaseMiddleware()

      this.mTopBeforeMiddleware  = this.mRootBeforeMiddleware
      this.mTopAfterMiddleware   = this.mRootAfterMiddleware
    }

    before(middleware)
    {
      if (isDef(middleware)) {
        this.mTopBeforeMiddleware.then(middleware)
        this.mTopBeforeMiddleware = middleware
      }

      return this
    }

    after(middleware)
    {
      if (isDef(middleware)) {
        this.mTopAfterMiddleware.then(middleware)
        this.mTopAfterMiddleware = middleware
      }
      return this
    }

    execute(socketRequest, socketResponse, fallback = null)
    {
      try {
        this.mRootBeforeMiddleware.check(socketRequest)

        this.mRouteMethod(socketRequest, socketResponse)

        this.mRootAfterMiddleware.check(socketResponse)
      } catch (e) {
        if (isFunc(fallback)) {
          fallback(socketRequest, socketResponse, e)
        } else {
          makeConsumerFallbackResponse({
            event:              socketRequest.getEvent(),
            addressedResponses: socketResponse.getAddressedResponse() 
          })
        }
      }
    }
  }
}
