module.exports = function buildRouter({ 
    Route,
    isDef,
    isStr,
    isFunc,
    Request,
})
{
    return class Router
    {
        constructor()
        {
            this.mMap = new Map()
            this.mContext = {}
        }

        setContext(context)
        {
            if (isDef(context)) {
                this.mContext = context
            } else {
                this.mContext = {}
            }
        }

        getContext()
        {
            return  this.mContext
        }

        getExecutionContext(localContext = {})
        {
            return {...this.mContext, ...localContext}
        }

        get(routeKey)
        {
            if (!this.mMap.has(routeKey)) {
                return null;
            }
            return this.mMap.get(routeKey)
        }

        set(routeKey, route)
        {
            if (isStr(routeKey)) {
                if (isDef(route)) {
                    this.mMap.set(routeKey, route)
                } else {
                    // remove
                }
            }
            return route
        }

        add(route=null)
        {
            if (isDef(route) && route instanceof Route) {
                let routeKey = route.getKey()
                this.set(routeKey, route)
                return route;
            }
        }

        execute(routeKey, props = {}, localContext = {})
        {
            let route = this.get(routeKey)
            if (isDef(route) && isFunc(route.execute)) {
                route.execute(new Request(routeKey, props, this.getExecutionContext(localContext)))
            }
        }
    }
}