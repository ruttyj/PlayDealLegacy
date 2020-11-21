module.exports = function ({
    AddressedResponse,
    clientManager,
    makeResponse,
})
{
  return class ConnectionActionProvider
  {
    up(registry)
    {
      registry.public(`CLIENTS.GET_ONLINE_STATS`, (props) => {
        const addressedResponses = new AddressedResponse();
        const subject = "CLIENTS";
        const action = "GET_ONLINE_STATS";
        const status = "success";
        const payload = {
          peopleOnlineCount: clientManager.count(),
        };
  
        let { thisClientKey } = props;
  
        addressedResponses.addToBucket(
          "default",
          makeResponse({ subject, action, status, payload })
        );
  
        const reducedResponses = new AddressedResponse();
        reducedResponses.addToBucket(
          addressedResponses.reduce(thisClientKey, [thisClientKey])
        );
        return reducedResponses;
      })
    }

    down(registry)
    {
      registry.remove(`CLIENTS.GET_ONLINE_STATS`)
    }
  }  
}