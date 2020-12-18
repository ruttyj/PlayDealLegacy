module.exports = function buildRoute({ 
    MiddlewareWrapper,
})
{
    return class Route
    {
        constructor(key, routeMethod)
        {
            this.mKey = key
            this.mRouteCallback = new MiddlewareWrapper(routeMethod)
        }
    
        getKey()
        {
            return this.mKey;
        }

        before(middleware = null)
        {
            this.mRouteCallback.before(middleware)
            return this;
        }
    
        after(middleware = null)
        {
            this.mRouteCallback.after(middleware)
            return this;
        }

        done(middleware = null)
        {
            this.mRouteCallback.done(middleware)
            return this;
        }
    
        execute(socketRequest, socketResponse = null, fallback = null)
        {
            return this.mRouteCallback.execute(socketRequest, socketResponse, fallback)
        }
    }
  }
