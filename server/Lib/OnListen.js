module.exports = function({
    els,
    isDef,
    isStr,
    isArr,
    jsonEncode,
    AddressedResponse,
    registry,
    thisClient,
    handleRoom,
})
{
    const subjectMap = registry.getAllPublic();
    return function (encodedData)
    {
        let connectionId = String(thisClient.id);
        const addressedResponses = new AddressedResponse();
        let requests = isStr(encodedData) ? JSON.parse(encodedData) : encodedData;
        let clientPersonMapping = {};
    
        if (isArr(requests)) {
          requests.forEach((request) => {
            let requestResponses = new AddressedResponse();
    
            let subject = request.subject;
            let action = request.action;
            let props = els(request.props, {});

            request.thisClient    = thisClient;
            request.thisClientKey = thisClient.id;
            props.thisClientKey   = thisClient.id;
            props.thisClient      = thisClient;
    
            if (isDef(subjectMap[subject])) {
              if (isDef(subjectMap[subject][action])) {
                // @TODO add a way of limiting the props which can be passed to method from the client
                // We may want to push data to clients but not allow it to be abused
                let actionResult = subjectMap[subject][action](props);
    
                requestResponses.addToBucket("default", actionResult);
              }
            }
    
            // Collect person Ids
            let clientIdsMap = {};
            clientIdsMap[connectionId] = true;
            handleRoom(props, ({ personManager }) => {
              personManager.getConnectedPeople().forEach((person) => {
                clientIdsMap[String(person.getClientId())] = true;
                clientPersonMapping[String(person.getClientId())] = person;
              });
            });
    
            // Assing the buckets of reponses to the relevent clients
            let clientIds = Object.keys(clientIdsMap);
            addressedResponses.addToBucket(
              requestResponses.reduce(connectionId, clientIds)
            );
          });
        }
    
        // Emit to "me" since I am always available
        if (addressedResponses.specific.has(String(connectionId))) {
          let resp = addressedResponses.specific.get(connectionId);
          thisClient.emit("response", jsonEncode(resp));
        }
        // Emit to other relevent people collected from the above requests
        Object.keys(clientPersonMapping).forEach((clientId) => {
          if (connectionId !== clientId) {
            let person = clientPersonMapping[clientId];
            if (addressedResponses.specific.has(clientId)) {
              let resp = addressedResponses.specific.get(clientId);
              person.emit("response", jsonEncode(resp));
            }
          }
        });
    }
}

