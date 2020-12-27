const rootFolder   = `../../..`
const sharedFolder = `${rootFolder}/shared`

// Obtain Builders
const BuildBaseApp = require(`${sharedFolder}/Builders/App`)

module.exports = function()
{
    // Build App
    const App = BuildBaseApp({  })
    const app = new App()

    // Obtain Providers & provide to app
    const RouterProvider = require(`${sharedFolder}/Providers/Functional/RouterProvider`)
    const routerSeriveProvider = new RouterProvider()
    routerSeriveProvider.provide(app)

    return app;
};