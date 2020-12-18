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
const buildRouter               = require(`../../shared/Builders/Router`)    // #Shared
const buildRoute                = require(`../../shared/Builders/Route`)     // #Shared
const buildMiddlewareWrapper    = require(`../../shared/Builders/MiddlewareWrapper`) // #Shared

const buildSocketRequest        = require(`${serverFolder}/Builders/Objects/Socket/SocketRequest`)    // #Server
const buildSocketResponse       = require(`${serverFolder}/Builders/Objects/Socket/SocketResponse`)   // #Server
const buildAddressedResponse    = require(`${serverFolder}/Builders/Objects/AddressedResponse`)       // #Server
const buildAffected             = require(`${serverFolder}/Builders/Objects/Affected`)
const buildOrderedTree          = require(`${serverFolder}/Builders/Objects/OrderedTree`)
const buildBaseMiddleware       = require(`${serverFolder}/Builders/Objects/Middleware/BaseMiddleware`)
const buildCallbackMiddleware   = require(`${serverFolder}/Builders/Objects/Middleware/CallbackMiddleware`)


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
const CallbackMiddleware = buildCallbackMiddleware({ BaseMiddleware })
const MiddlewareWrapper = buildMiddlewareWrapper({
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
                        })
class MockController 
{
    sayMessage(req, res)
    {
        let props     = req.getProps()
        let context   = req.getContext()

        // create item
        let id = 11;
        context.messages[id] = {
            event: 'SAY.MESSAGE',
            data:  props.message,
        }

        // log affected to everyone
        res.addAffected('MESSAGE', id, Affected.ACTION.CREATE, TO_EVERYONE)
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


        // Define some default middleware to be reused for multiple routes
        let defaultBeforeMiddleware = [
            (req) => {
                let context = req.getContext()
                context.middleware = []
                context.messages = {}
            },
            (req) => {
                let context = req.getContext()
                context.middleware.push('default before 1')
            }
        ]

        let defaultAfterMiddleware = [
            (req, res) => {
                let context = req.getContext()
                context.middleware.push('affectedToResponse')

                // No real point to add to mesasges at this point
                // We could just respond directly in the done 
                // without going though responses
                let messages = context.messages
                let messagesIds = res.affected.getIdsAffected('MESSAGE')
                messagesIds.forEach(messageId => {
                    res.getAddressedResponse().addToBucket('DEFAULT', {
                        evernt:  'GET.MESSAGE',
                        status: 'success',
                        payload: messages[messageId]
                    })
                })
            }
        ]

        let defaultDoneMiddleware = [
            (req, res) => {
                let props   = req.getProps()
                let context = req.getContext()
        
                let responses = res.getAddressedResponse()
                let affected  = res.getAffectedContainer()

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
            }
        ]



        // Add Say message route
        router
            .add(new Route('SAY.MESSAGE', (...args) => {
                // Execute controller
                mockController.sayMessage(...args)
            }))
            .before(defaultBeforeMiddleware)
            .before((req) => {
                req.context.middleware.push('before 1')
            })
            .before((req) => {
                req.context.middleware.push('before 2')
            })
            .after((req) => {
                req.context.middleware.push('after 1')
            })
            .after((req) => {
                req.context.middleware.push('after 1')
            })
            .after(defaultAfterMiddleware)
            // Finalize
            .done(defaultDoneMiddleware)




        // Execute a route
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
