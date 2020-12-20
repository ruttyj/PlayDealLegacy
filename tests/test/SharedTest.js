const rootFolder   = `../..`;
const sharedFolder = `${rootFolder}/shared`;

const assert       = require("chai").assert;

// Obtain Builders
const BuildBaseApp = require(`../../shared/Builders/App`)


// Build App
const App = BuildBaseApp({})
const app = new App()
// Obtain Providers & provide to app
const RouterProvider = require(`${sharedFolder}/Providers/RouterProvider`)
const routerSeriveProvider = new RouterProvider()
routerSeriveProvider.provide(app)


// Random consts
const TO_EVERYONE   = app.context.TO_EVERYONE
const Affected      = app.context.Affected

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
        const Router = app.context.Router
        const Route = app.context.Route

        const mockController = new MockController()
        const router = new Router()

        // ===================================
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

                context.done = true
                /*
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
                //*/
            }
        ]


        // ===================================
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


        // ===================================
        // Execute a route
        const context = {
            like: 'joke'
        }
        const props = {
            message: 'Something funny'
        }
        const result = router.execute('SAY.MESSAGE', props, context)

        // ===================================
        // Test resulting state
        const req = result.request
        const res = result.response
        let serialized = {
            request: {
                props:   req.getProps(),
                context: req.getContext(),
            },
            response: {
                responses: res.getAddressedResponse().serialize(),
                affected:  res.getAffectedContainer().serialize(),
            }
        }
      
        assert.equal(serialized.request.props.message, "Something funny");
        assert.equal(serialized.request.context.like, "joke");
        assert.equal(serialized.request.context.done, true);
        assert.equal(JSON.stringify(serialized.request.context.middleware), '["default before 1","before 1","before 2","after 1","after 1","affectedToResponse"]');
        assert.equal(JSON.stringify(serialized.response.responses), '{"buckets":{"DEFAULT":[{"evernt":"GET.MESSAGE","status":"success","payload":{"event":"SAY.MESSAGE","data":"Something funny"}}]},"specific":{}}');
    });
}); // end App description
