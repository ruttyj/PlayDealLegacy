module.exports = function buildDepsWithoutRegistry(
  {
    els,
    isDef,
    getArrFromProp,
    AddressedResponse,
  }
){

  function makeProps(props, data = {})
  {
    return { 
      connection    : props.connection, 
      roomCode      : props.roomCode, 
      thisClientKey : props.thisClientKey,
      thisClient    : props.thisClient,
      ...data 
    };
  }
  
  function makeResponse({ event, status, subject, action, payload, message })
  {
  
    if (isDef(event)) {
      let temp = event.split('.')
      subject = temp[0]
      action = temp[1]
    }
    let result = {
      status: status,
      subject: subject,
      action: action,
      payload: payload,
    };
  
    if (isDef(message)) {
      result.message = message;
    }
  
    return result;
  }
  
  function makeKeyedResponse(keyedRequest)
  {
    var subject, action, props, nomenclature, getData, fallback;
  
    subject   = keyedRequest.getSubject();
    action    = keyedRequest.getAction();
    props     = keyedRequest.getProps();
    getData   = keyedRequest.getDataFn();
    nomenclature  = {
                    plural:   keyedRequest.getPluralKey(),
                    singular: keyedRequest.getSingularKey(),
                  };
    fallback = keyedRequest.getFallback();
  
    fallback = els(fallback, undefined);
    const addressedResponses = new AddressedResponse();
  
    let keys = getArrFromProp(props, nomenclature, fallback);
  
    let status = "failure";
    let payload = {
      items: {},
      order: [],
    };
    keys.forEach((key) => {
      payload.items[key] = getData(key);
      payload.order.push(key);
    });
    if (payload.order.length > 0) {
      status = "success";
    }
  
    addressedResponses.addToBucket(
      "default",
      makeResponse({ subject, action, status, payload })
    );
    return addressedResponses;
  }
  
  
  /**
   * Will generate resposnes for each respective person regarding the relevent information
   * 
   * @param {function} getMyData      data for the owner of the info              IE: cards in my hand
   * @param {function} getOtherData   data from the perspective of other people   IE: card count of my opponents
   * @param.props[receivingPeopleIds|receivingPersonId] {array|string}   People who will receive the information
   * @param.props[peopleIds|personId] {array|string}                     The players who's information changed - assumed this person by default
   */
  function makePersonSpecificResponses({
    subject,
    action,
    props,
    getMyData,
    getOtherData,
  }) {
    let { personManager, thisPersonId } = props;
    const addressedResponses = new AddressedResponse();
  
    // People who will receive the information
    let receivingPeopleIds = getArrFromProp(
      props,
      {
        plural: "receivingPeopleIds",
        singular: "receivingPersonId",
      },
      thisPersonId
    );
  
    // The players who's information changed - assumed this person by default
    let peopleIds = Array.from(
      new Set(
        getArrFromProp(
          props,
          {
            plural: "peopleIds",
            singular: "personId",
          },
          thisPersonId
        )
      )
    );
  
    if (isDef(peopleIds)) {
      // for each person receiving the data
      receivingPeopleIds.forEach((receivingPersonId) => {
        let receivingPerson = personManager.getPerson(receivingPersonId);
        if (isDef(receivingPerson)) {
          let status = "success";
          let payload = {
            items: {},
            order: [],
          };
          // Generate iHaveAHand data from the perspective of the recipient
          peopleIds.forEach((ownerPersonId) => {
            if (receivingPersonId === ownerPersonId) {
              payload.items[ownerPersonId] = getMyData(ownerPersonId);
            } else {
              payload.items[ownerPersonId] = getOtherData(
                ownerPersonId,
                receivingPersonId
              );
            }
            payload.order.push(ownerPersonId);
          });
          addressedResponses.addToSpecific(
            receivingPerson.getSocketId(),
            makeResponse({
              subject,
              action,
              status,
              payload,
            })
          );
        }
      });
    } else {
      console.log("users not defined");
    }
    return addressedResponses;
  }
  
  function makeConsumerFallbackResponse({ event, subject, action, addressedResponses })
  {
    if (isDef(event)) {
      let temp = event.split('.')
      subject = temp[0]
      action = temp[1]
    }
    return function (checkpoints) {
      let serializecheckpoints = {
        items: {},
        order: [],
      };
  
      let message = null;
      checkpoints.forEach((val, key) => {
        serializecheckpoints.items[key] = val;
        serializecheckpoints.order.push(key);
        if (!isDef(message) && !val) {
          message = `Query failed because this was not true: ${key}.`;
        }
      });
  
      addressedResponses.addToBucket(
        "default",
        makeResponse({
          subject,
          action,
          message,
          status: "failure",
          payload: serializecheckpoints,
        })
      );
      return addressedResponses;
    };
  }
  

  return {
    makeProps,
    makeResponse,
    makeKeyedResponse,
    makePersonSpecificResponses,
    makeConsumerFallbackResponse,
  }
}