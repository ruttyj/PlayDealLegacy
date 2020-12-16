const rootFolder   = `../..`;
const sharedFolder = `${rootFolder}/shared`;
const serverFolder = `${rootFolder}/server`;

const {
    els,
    isDef,
    isArr,
    isObj,
    isStr,
    isFunc,
    isDefNested,
    getNestedValue,
    getKeyFromProp,
    reduceToKeyed,
    recursiveBuild,
    reduceArrayToMap,
    arrSum, 
    makeMap,
    makeVar,
    makeList,
    makeListener,
    emptyFunction,
    emptyFunc,
    stateSerialize,
} = require(`../../server/utils/`)
const buildRouter  = require(`../../shared/Builders/Router`)    // #Shared
const buildRoute   = require(`../../shared/Builders/Route`)     // #Shared
const buildMiddlewareWrapper = require(`../../shared/Builders/MiddlewareWrapper`) // #Shared

const buildSocketRequest     = require(`${serverFolder}/Builders/Objects/Socket/SocketRequest`)    // #Server
const buildSocketResponse    = require(`${serverFolder}/Builders/Objects/Socket/SocketResponse`)   // #Server
const buildAddressedResponse = require(`${serverFolder}/Builders/Objects/AddressedResponse`)       // #Server
const buildAffected          = require(`${serverFolder}/Builders/Objects/Affected`)
const buildOrderedTree       = require(`${serverFolder}/Builders/Objects/OrderedTree`)
const buildBaseMiddleware    = require(`${serverFolder}/Builders/Objects/Middleware/BaseMiddleware`)



// Provider ----------------------------

// Constants
const TO_EVERYONE = 'everyone'

// Classes
const AddressedResponse = buildAddressedResponse({isDef, isArr, makeMap, stateSerialize})
const SocketRequest     = buildSocketRequest({
                            AddressedResponse,
                        })
const OrderedTree       = buildOrderedTree()
const Affected          = buildAffected({OrderedTree})
const SocketResponse    = buildSocketResponse({
                            AddressedResponse,
                            Affected,
                        })

const BaseMiddleware    = buildBaseMiddleware({ isDef })
const MiddlewareWrapper = buildMiddlewareWrapper({
                            isDef,
                            isFunc,
                            BaseMiddleware,
                            Response: SocketResponse,
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
                        })


class BaseController {

}

class MockController extends BaseController {
    sayMessage(req, res, fallback)
    {
        let props   = req.getProps()
        let context = req.getContext()

        let responses = res.getAddressedResponse()
        let affected  = res.getAffected()

        res.add({
            event: 'SAY.MESSAGE',
            data:  props.message,
        }, TO_EVERYONE)


        affected.setAffected('MESSAGE', 25, Affected.ACTION.CREATE)
        console.log('SAY.MESSAGE', {
            props,
            context,
            responses: JSON.stringify(responses.serialize()),
            affected:  JSON.stringify(affected.serialize()),
        })
    }
}



//======================================



describe("Shared", async function () {
    it(`Should do the thing`, async () => {

        const mockController = new MockController()

        const router = new Router()

        router.add(new Route('SAY.MESSAGE', (req, res, fallback) => {
            mockController.sayMessage(req, res, fallback)
        }));

        const context = {
            iAm: 'A Joke'
        }
        const props = {
            message: 'Something funny'
        }
        router.execute('SAY.MESSAGE', props, context)

        /*
        Pseudo Code :: Structure of a Socket Request 

        // Define Managers
        const roomManager = new RoomManager()
        const connectionManager = new ConnectionManager()
        
        // Define Controllers
        const roomController = new RoomController()
        const router = new Router()

        // Define Middleware
        const populateConnectionMiddleware = new PopulateConnectionMiddleware()
        const transmitResponseMiddleware = new TransmitResponseMiddleware()

        // Define Router
        router.setContext({
            router,
            roomManager,
            roomController,
        })

        // Define Route
        router
            .add(new Route('ROOM.JOIN', (...args) => roomController.joinRoom(...args)))
            .before(populateConnectionMiddleware)
            .done(transmitResponseMiddleware)


        // Define Socket
        socket.on(eventCodeFor('ROOM.JOIN'), (data) => {
            const props = {
                data: data
            }
            const context = {
                connectionId: socket.id
            }
            router.execute('ROOM.JOIN', props, context)
        })
        */
    });
}); // end App description
