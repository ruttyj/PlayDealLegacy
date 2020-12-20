module.exports = function buildApp({ 
})
{
    return class App
    {
        constructor()
        {
            this.mSocketRouter = null
            this.mServices = new Map()
            this.mManagers = new Map()
            this.mContext = {} // general objects
        }

        addContext(additionalContext)
        {
            this.mContext = { ...this.mContext, ...additionalContext }
        }

        getContext()
        {
            return this.mContext
        }
        get context () {
            return this.getContext()
        }
    }
  }
