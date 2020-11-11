module.exports = function({
    els,
    isDef,
    isStr,
    isArr,
    jsonEncode,
    AddressedResponse,
    registry,
    mStrThisClientId,
    thisClient,
    handleRoom,
})
{
    const subjectMap = registry.getAllPublic();
    function onListen(encodedData)
    {
        const socketResponses = new AddressedResponse();
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
            clientIdsMap[mStrThisClientId] = true;
            handleRoom(props, ({ personManager }) => {
              personManager.getConnectedPeople().forEach((person) => {
                clientIdsMap[String(person.getClientId())] = true;
                clientPersonMapping[String(person.getClientId())] = person;
              });
            });
    
            // Assing the buckets of reponses to the relevent clients
            let clientIds = Object.keys(clientIdsMap);
            socketResponses.addToBucket(
              requestResponses.reduce(mStrThisClientId, clientIds)
            );
          });
        }
    
        // Emit to "me" since I am always available
        if (socketResponses.specific.has(String(mStrThisClientId))) {
          let resp = socketResponses.specific.get(mStrThisClientId);
          thisClient.emit("response", jsonEncode(resp));
        }
        // Emit to other relevent people collected from the above requests
        Object.keys(clientPersonMapping).forEach((clientId) => {
          if (mStrThisClientId !== clientId) {
            let person = clientPersonMapping[clientId];
            if (socketResponses.specific.has(clientId)) {
              let resp = socketResponses.specific.get(clientId);
              person.emit("response", jsonEncode(resp));
            }
          }
        });
    }
    return onListen;
}

