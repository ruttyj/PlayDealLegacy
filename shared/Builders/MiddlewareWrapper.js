module.exports = function buildMiddlewareWrapper({ 
    isDef,
    isFunc,
    isArr,
    BaseMiddleware,
    CallbackMiddleware,
    Response,
})
{

    // @TODO move to seprate file
    class MiddlewareBucket 
    {
        constructor() 
        {
            this.mTop = new BaseMiddleware()
            this.mRoot = this.mTop
        }

        add(mxd)
        {
            const bucket = this;
            if (isArr(mxd)) {
                mxd.forEach(item => {
                    bucket.add(item)
                })
            } else {
                let assign = mxd;
                if (isFunc(mxd)) {
                    // If Function wrap with custom middleware
                    assign = new CallbackMiddleware(mxd);
                } 
                if (isDef(assign)){
                    if (isDef(this.mTop)){
                        this.mTop.then(assign)
                    }
                    this.mTop = assign
                }
            }
        }

        check(...args)
        {
            this.mRoot.check(...args)
        }
    }

    return class MiddlewareWrapper
    {
        constructor(callback, fallback=null)
        {
            this.mCallback = callback
            this.mFallback = fallback
            
            this.mMiddlewareBuckets = new Map()

            this._initDefaultBuckets()
        }

        _initDefaultBuckets()
        {
            this._newBucket('BEFORE')
            this._newBucket('AFTER')
            this._newBucket('DONE')
        }

        _newBucket(key) 
        {
            let bucket = new MiddlewareBucket()
            this.mMiddlewareBuckets.set(key, bucket)

            return bucket;
        }

        _getBucket(key)
        {
            return this.mMiddlewareBuckets.get(key)
        }


        before(mxd = null)
        {
            this._getBucket('BEFORE').add(mxd)

            return this
        }

        after(mxd = null)
        {
            this._getBucket('AFTER').add(mxd)

            return this
        }

        done(mxd = null)
        {
            this._getBucket('DONE').add(mxd)

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
                response = new Response()
            }
            try {
                this._getBucket('BEFORE').check(request, response)
                this.mCallback(request, response)
                this._getBucket('AFTER').check(request, response)
            } catch (e) {
                let callbackMethod = this.getFallback(fallback)
                if (isFunc(callbackMethod)) {
                    callbackMethod(request, response, e)
                }
            }
            this._getBucket('DONE').check(request, response)

            return response
        }
    }
}
