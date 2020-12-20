/**
 * RouterProvider.js
 */
const rootFolder   = `../..`;
const sharedFolder = `${rootFolder}/shared`;
const serverFolder = `${rootFolder}/server`;
const {
    isDef,
    isArr,
    isStr,
    isFunc,
    makeMap,
    stateSerialize,
} = require(`${sharedFolder}/Utils/`) // #Server
const buildRouter               = require(`${sharedFolder}/Builders/Router`)
const buildRoute                = require(`${sharedFolder}/Builders/Route`)
const buildMiddlewareWrapper    = require(`${sharedFolder}/Builders/MiddlewareWrapper`)
const buildSocketRequest        = require(`${serverFolder}/Builders/Objects/Socket/SocketRequest`)          // #Server
const buildSocketResponse       = require(`${serverFolder}/Builders/Objects/Socket/SocketResponse`)         // #Server
const buildAddressedResponse    = require(`${serverFolder}/Builders/Objects/AddressedResponse`)             // #Server
const buildAffected             = require(`${serverFolder}/Builders/Objects/Affected`)                      // #Server
const buildOrderedTree          = require(`${serverFolder}/Builders/Objects/OrderedTree`)                   // #Server
const buildBaseMiddleware       = require(`${serverFolder}/Builders/Objects/Middleware/BaseMiddleware`)     // #Server
const buildCallbackMiddleware   = require(`${serverFolder}/Builders/Objects/Middleware/CallbackMiddleware`) // #Server

module.exports = class RouterProvider
{
    getRequirements()
    {
        // Will retrun the context keys required to execute
        // NOP
    }

    provide(app)
    {
        // Constants
        const TO_EVERYONE = 'everyone'

        // Classes
        const AddressedResponse = buildAddressedResponse({ stateSerialize, makeMap, isDef, isArr})
        const SocketRequest     = buildSocketRequest({
                                    AddressedResponse,
                                })
        const OrderedTree       = buildOrderedTree()
        const Affected          = buildAffected({OrderedTree})
        const SocketResponse    = buildSocketResponse({
                                    AddressedResponse,
                                    Affected,
                                })

        const BaseMiddleware     = buildBaseMiddleware({ isDef })
        const CallbackMiddleware = buildCallbackMiddleware({ BaseMiddleware })
        const MiddlewareWrapper  = buildMiddlewareWrapper({
                                    Response: SocketResponse,
                                    CallbackMiddleware,
                                    BaseMiddleware,
                                    isDef,
                                    isFunc,
                                    isArr,
                                })
        const Route             = buildRoute({
                                    MiddlewareWrapper
                                })

        const Router            = buildRouter({ 
                                    Route,
                                    isDef,
                                    isStr,
                                    isFunc,
                                    Request: SocketRequest,
                                    Response: SocketResponse,
                                })
                                
        app.addContext({
            TO_EVERYONE,
            AddressedResponse,
            SocketRequest,
            OrderedTree,
            Affected,
            SocketResponse,
            BaseMiddleware,
            CallbackMiddleware,
            MiddlewareWrapper,
            Route,
            Router,
        })
    }
}