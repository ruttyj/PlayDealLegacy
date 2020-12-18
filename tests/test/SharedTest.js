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
    makeMap,
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
const buildCustomMiddleware  = require(`${serverFolder}/Builders/Objects/Middleware/CustomMiddleware`)


// ###############################

//          PROVIDERS 

// ###############################

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

const BaseMiddleware    = buildBaseMiddleware({ isDef })
const CustomMiddleware = buildCustomMiddleware({ BaseMiddleware })
const MiddlewareWrapper = buildMiddlewareWrapper({
                            isDef,
                            isFunc,
                            BaseMiddleware,
                            CustomMiddleware,
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
class MockController 
{
    sayMessage(req, res, fallback)
    {
        let props   = req.getProps()
        let affected  = res.getAffected()


        // Add a response for everyone
        res.add({
            event: 'SAY.MESSAGE',
            data:  props.message,
        }, TO_EVERYONE)


        affected.setAffected('MESSAGE', 25, Affected.ACTION.CREATE)
    }
}
//_____________________________________




// ###############################

//             TESTS 

//###############################
describe("Shared", async function () {
    it(`Should do the thing`, async () => {

        const mockController = new MockController()

        const router = new Router()




        router
            .add(new Route('SAY.MESSAGE', (...args) => {
                // Execute controller
                mockController.sayMessage(...args)
            }))
            // Add "middleware" array to context 
            .before((req) => {
                let context = req.getContext()
                if (!isDef(context.middleware)) {
                    context.middleware = [];
                }
            })
            // add "before 1"
            .before((req) => {
                let context = req.getContext()
                context.middleware.push('before 1')
            })
            // add "before 2"
            .before((req) => {
                let context = req.getContext()
                context.middleware.push('before 2')
            })
            // add "after 1"
            .after((req) => {
                let context = req.getContext()
                context.middleware.push('after 1')
            })
            // Finalize
            .done((req, res) => {
                let props   = req.getProps()
                let context = req.getContext()
        
                let responses = res.getAddressedResponse()
                let affected  = res.getAffected()
        
                console.log(req.getEvent(), {
                    request: {
                        props: JSON.stringify(props),
                        context: JSON.stringify(context),
                    },
                    response: {
                        responses: JSON.stringify(responses.serialize()),
                        affected:  JSON.stringify(affected.serialize()),
                    }
                })
            })



        const context = {
            like: 'joke'
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
