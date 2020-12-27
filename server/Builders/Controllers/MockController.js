// Random consts
module.exports = function buildMockController({ app })
{
    const TO_EVERYONE   = app.context.TO_EVERYONE
    const Affected      = app.context.Affected
    return class MockController
    {
        sayMessage(req, res)
        {
            let props     = req.getProps()
            let context   = req.getContext()
    
            // create item
            let id = 11
            context.messages[id] = {
                event: 'SAY.MESSAGE',
                data:  props.message,
            }
    
            // log affected to everyone
            res.addAffected('MESSAGE', id, Affected.ACTION.CREATE, TO_EVERYONE)
        }
    }
}