module.exports = function ({
    isStr,
    isArr,
    isDef,
    isFunc,
    SocketRoute,
    SocketRequest,
    SocketResponse,
}) {
    return class Registry {
        constructor()
        {
            this.mPrivateEvents = {};

            this.mPublicEvents  = {};
            this.mPublicRoutes  = {}; // replacing mPublicEvents with a (request, response) signature
        }

        on(identifier, fn)
        {
            let socketRoute = new SocketRoute(fn)
            let token = this._processToken(identifier)
            this.mPublicRoutes[token] = socketRoute;
            return socketRoute;
        }
    
        trigger(identifier, socketRequest, socketResponse, fallback = null)
        {
            let token = this._processToken(identifier)
            if (isDef(this.mPublicRoutes[token])) {
                return this.mPublicRoutes[token].execute(socketRequest, socketResponse, fallback)
            }
        }

        // Ment to adapt to the old way
        triggerUsingProps(identifier, props, response = null)
        {
            let token = this._processToken(identifier)

            let socketRequest   = new SocketRequest(token)
            let socketResponse  = new SocketResponse(token)
            socketRequest.setProps(props)
            // Support legacy
            // This will allow you to access the same data the same way as legacy but with the added benifit of the new interface - for migration #runOnComment
            socketRequest.unpackAttrs(props)

            return this.trigger(token, socketRequest, socketResponse)

            if (isDef(response) && response instanceof SocketResponse) {
                socketResponse.mergeAddressedResponses(addressedResponse, mergeMethod = 'default')
            }

            return socketResponse.getAddressedResponse()
        }

        public(identifier, fn)
        {
            identifier = this._processIdentifier(identifier);
           
            if (isArr(identifier)) {
                let [subject, action] = identifier;
                this.mPublicEvents[`${subject}.${action}`] = fn;
            }
        }
    
        private(identifier, fn)
        {
            identifier = this._processIdentifier(identifier);

            if (isArr(identifier)) {
                let [subject, action] = identifier;
                this.mPrivateEvents[`${subject}.${action}`] = fn;
            }
        }

        remove(identifier)
        {
            let deleted = false
            identifier = this._processIdentifier(identifier);
            if (isArr(identifier)) {
                let [subject, action] = identifier;
                let token = `${subject}.${action}`;

                if (isDef(this.mPublicEvents[token])){
                    delete this.mPublicEvents[token]
                    deleted = true
                }
                
                if (!deleted) {
                    if (isDef(this.mPrivateEvents[subject])){
                        delete this.mPrivateEvents[token]
                       
                        deleted = true
                    }
                }
            }
            return deleted
        }
        _processIdentifier(identifier)
        {
            if(isStr(identifier)) {
                identifier = String(identifier).split('.');
            }
            return identifier;
        }

        _processToken(identifier)
        {
            let token = identifier;
            if (isArr(identifier)) {
                token = identifier.join('.');
            }
            return token;
        }
    
        getAllPublic()
        {
            return this.mPublicEvents;
        }
    
        getAllPrivate()
        {
            return this.mPrivateEvents;
        }

        execute(identifier, props, response = null)
        {
            const registry = this;

            identifier = registry._processIdentifier(identifier);
            let [subject, action] = identifier;
            let token = `${subject}.${action}`;
            
            let fn;
            
            fn = registry.mPublicEvents[token];

            if (!isFunc(fn)) {
                fn = registry.mPrivateEvents[token];
            }

            if (!isFunc(fn)) {
                if (isDef(registry.mPublicRoutes[token])) {
                    fn = (props) => {
                        console.log({identifier, props})
                        return registry.triggerUsingProps(identifier, props, response)
                    }
                }
            }

            if (isFunc(fn)) {
                return fn(props);
            }
            
            return null;
        }
    }
}