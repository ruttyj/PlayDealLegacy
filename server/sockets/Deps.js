function buildDeps({
    els,
    isDef,
    isFunc,
    isArr,
    getNestedValue,
    getArrFromProp,

    //-------------------
    Affected,
    GameInstance,
    AddressedResponse,
    KeyedRequest,
    registry,

    //-------------------
    roomManager,
    //-------------------
}){
    function makeProps(props, data = {})
    {
      return { 
        roomCode      : props.roomCode, 
        thisClientKey : props.thisClientKey,
        thisClient    : props.thisClient,
        ...data 
      };
    }

    function makeResponse({ status, subject, action, payload, message })
    {
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

    function getAllKeyedResponse(keyedRequest)
    {
      var subject, action, props, propName, getAllKeys;
      subject     = keyedRequest.getSubject();
      action      = keyedRequest.getAction();
      props       = keyedRequest.getProps();
      propName    = keyedRequest.getPluralKey();
      getAllKeys  = keyedRequest.getAllKeysFn();

      const addressedResponses = new AddressedResponse();
      addressedResponses.addToSpecific(
        "default",
        makeResponse({ subject, action, status: "success", payload: null })
      );
      let getProps = {
        subject,
        action,
        ...props,
      };
      getProps[propName] = getAllKeys();
      addressedResponses.addToBucket(
        "default",
        registry.execute(`${subject}.GET_KEYED`, makeProps(getProps, getProps))
      );

      return addressedResponses;
    }

    function packageCheckpoints(checkpoints)
    {
      if (isDef(checkpoints)) {
        let dumpCheckpoint = {};
        checkpoints.forEach((value, message) => (dumpCheckpoint[message] = value));
        return dumpCheckpoint;
      }
      return null;
    }

    function canGameStart(game, personManager)
    {

      // Are there enough people to play?
      let readyPeople = personManager.filterPeople(
        (person) => (person.isConnected() && person.getStatus() === "ready")
      );
      let isAcceptablePlayerCount = game.isAcceptablePlayerCount(readyPeople.length)

      // Does everyone have an acceptable status?
      let acceptableStatuses = ["ready"]
      let isEveryoneReady = personManager.doesAllSatisfy(
        (person) => (person.isConnected() && acceptableStatuses.includes(person.getStatus()))
      )

      return (isEveryoneReady && isAcceptablePlayerCount);
    }

    function createGameInstance(room)
    {
      let gameInstance = GameInstance();

      let constants = gameInstance.constants;
      gameInstance.newGame();
      gameInstance.updateConfig({
        [constants.CONFIG.SHUFFLE_DECK]: true,
        [constants.CONFIG.ALTER_SET_COST_ACTION]: false,
      });

      room.setGame(gameInstance);

      return gameInstance;
    }

    function canPersonRemoveOtherPerson(thisPerson, otherPerson)
    {
      return (
        thisPerson.hasTag("host") ||
        String(otherPerson.getId()) === String(thisPerson.getId())
      );
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
              receivingPerson.getClientId(),
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

    function makeConsumerFallbackResponse({ subject, action, addressedResponses })
    {
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
    
    function makeRegularGetKeyed({
      subject,
      singularKey,
      pluralKey,
      makeGetDataFn,
      makeGetAllKeysFn,
      makeGetAlMyKeysFn,
    }) {
      return {
        GET_KEYED: (props) => {
          //props: { roomCode, (collectionIds|collectionId)}
          let action = "GET_KEYED";
          const addressedResponses = new AddressedResponse();
          return handleGame(
            props,
            (consumerData, checkpoints) => {
              let upgradedData = { ...consumerData, subject, action };
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
              myKeyedRequest.setProps(upgradedData);
              myKeyedRequest.setSingularKey(singularKey);
              myKeyedRequest.setPluralKey(pluralKey);
              myKeyedRequest.setDataFn(makeGetDataFn(upgradedData, checkpoints));
  
              // deliver data
              addressedResponses.addToBucket(
                "default",
                makeKeyedResponse(myKeyedRequest)
              );
  
              return addressedResponses;
            },
            makeConsumerFallbackResponse({ subject, action, addressedResponses })
          );
        },
        GET_ALL_KEYED: (props) => {
          //props: {roomCode}
          let action = "GET_ALL_KEYED";
          const addressedResponses = new AddressedResponse();
          return handleGame(
            props,
            (consumerData, checkpoints) => {
              let upgradedData = { ...consumerData, subject, action };
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
              myKeyedRequest.setSingularKey(singularKey);
              myKeyedRequest.setPluralKey(pluralKey);
              myKeyedRequest.setProps(upgradedData);
              myKeyedRequest.setAllKeysFn(
                makeGetAllKeysFn(upgradedData, checkpoints)
              );
  
              // Get data
              addressedResponses.addToBucket(
                "default",
                getAllKeyedResponse(myKeyedRequest)
              );
  
              // confirm the all command
              addressedResponses.addToBucket(
                "default",
                makeResponse({
                  subject,
                  action,
                  status: "success",
                  payload: null,
                })
              );
  
              return addressedResponses;
            },
            makeConsumerFallbackResponse({ subject, action, addressedResponses })
          );
        },
        GET_ALL_MY_KEYED: (props) => {
          let action = "GET_ALL_MY_KEYED";
          const addressedResponses = new AddressedResponse();
          return handleGame(
            props,
            (consumerData, checkpoints) => {
              let upgradedData = { ...consumerData, subject, action };
              let myKeyedRequest = KeyedRequest();
              myKeyedRequest.setAction(action);
              myKeyedRequest.setSubject(subject);
              myKeyedRequest.setSingularKey(singularKey);
              myKeyedRequest.setPluralKey(pluralKey);
              myKeyedRequest.setProps(upgradedData);
              myKeyedRequest.setAllKeysFn(
                makeGetAlMyKeysFn(upgradedData, checkpoints)
              );
  
              // Get data
              addressedResponses.addToBucket(
                "default",
                getAllKeyedResponse(myKeyedRequest)
              );
  
              // confirm the all command
              addressedResponses.addToBucket(
                "default",
                makeResponse({
                  subject,
                  action,
                  status: "success",
                  payload: null,
                })
              );
  
              return addressedResponses;
            },
            makeConsumerFallbackResponse({ subject, action, addressedResponses })
          );
        },
        REMOVE_KEYED: (props) => {
          //props: { roomCode, (collectionIds|collectionId)}
          let action = "REMOVE_KEYED";
          const addressedResponses = new AddressedResponse();
          return handleGame(
            props,
            (consumerData) => {
              let status = "success";
              let nomenclature = {
                plural: pluralKey,
                singular: singularKey,
              };
              let payload = {
                removeItemsIds: getArrFromProp(props, nomenclature, []),
              };
              addressedResponses.addToBucket(
                "default",
                makeResponse({
                  subject,
                  action,
                  status: status,
                  payload: payload,
                })
              );
              return addressedResponses;
            },
            makeConsumerFallbackResponse({ subject, action, addressedResponses })
          );
        },
      };
    }


    //==================================================
  
    //                    CONSUMERS
  
    //==================================================

    // ensured the data required for a room is presant
    function handleRoom(props, fn, fallback = undefined) {
      let { roomCode, thisClientKey } = props;
      // define which points were reached before failure
      let checkpoints = new Map();
  
      let reducedResponses = new AddressedResponse();
      let responses = null;
      
      if (isDef(roomCode)) {
        let room = roomManager.getRoom(roomCode);
        if (isDef(room)) {
          let personManager = room.getPersonManager();
          if (isDef(personManager)) {
            let person = personManager.getPersonByClientId(thisClientKey);
  
            let newProps = {
              ...props,
              roomCode,
              thisRoomCode: roomCode,
              roomManager,
              room,
              thisRoom: room,
              personManager,
            };
            if (isDef(person)) {
              Object.assign(newProps, {
                person,
                thisPersonId: person.getId(),
                thisPerson: person,
              });
            }
  
            responses = fn(newProps, checkpoints);
  
            if (isDef(responses)) {
              let clientPersonMapping = {};
              personManager.getConnectedPeople().forEach((person) => {
                clientPersonMapping[String(person.getClientId())] = true;
              });
              let clientIds = Object.keys(clientPersonMapping);
  
              reducedResponses.addToBucket(
                responses.reduce(thisClientKey, clientIds)
              );
            }
            return responses;
          }
        }
      }
      if (!isDef(responses) && isFunc(fallback)) {
        return fallback(checkpoints);
      }
      return fallback;
    }
  
    function handlePerson(props, fn, fallback = undefined) {
      return handleRoom(
        props,
        function (props2, checkpoints) {
          const { room } = props2;
          let { thisClientKey} = props2;

          let personManager = room.getPersonManager();
          if (isDef(personManager)) {
            let person = personManager.getPersonByClientId(thisClientKey);
            if (isDef(person)) {
              checkpoints.set("person", true);
              return fn(
                {
                  personId: person.getId(),
                  person,
                  thisPersonId: person.getId(),
                  ...props2,
                },
                checkpoints
              );
            }
          }
          if (isFunc(fallback)) return fallback(checkpoints);
          return fallback;
        },
        fallback
      );
    }
  
    function handleGame(props, fn, fallback = undefined) {
      return handlePerson(
        props,
        function(props2, checkpoints) {
          let { room } = props2;
          let game = room.getGame();




          if (isDef(game)) {
            checkpoints.set("game", true);
            return fn(
              {
                ...props2,
                game,
              },
              checkpoints
            );
          } else {
            console.log("game not defined");
          }
          if (isFunc(fallback2)) return fallback2(checkpoints);
          return fallback2;
        },
        fallback
      );
    }
  
    function _myTurnConsumerBase(props, fn, fallback = undefined) {
      return handleGame(
        props,
        function(props2, checkpoints) {
          let { game, thisPersonId } = props2;
  
          let hand = game.getPlayerHand(thisPersonId);
          if (isDef(hand)) {
            if (game.isMyTurn(thisPersonId)) {
              return fn(
                {
                  ...props2,
                  hand,
                  currentTurn: game.getCurrentTurn(),
                },
                checkpoints
              );
            }
          }
          if (isFunc(fallback)) return fallback(checkpoints);
          return fallback;
        },
        fallback
      );
    }
  
    function handleMyTurn(props, fn, fallback = undefined) {
      let consumerCheck = (
        consumerData,
        checkpoints,
        addressedResponses,
        fn,
        setFailed
      ) => {
        let boolFailed = false;
        let { game } = consumerData;
        addressedResponses.addToBucket(
          "default",
          fn(
            {
              ...consumerData,
              currentTurn: game.getCurrentTurn(),
            },
            checkpoints
          )
        );
  
        setFailed(boolFailed);
      };
      
      return makeConsumer(
        consumerCheck,
        _myTurnConsumerBase,
        props,
        fn,
        fallback
      );
    }
  
    function handCardConsumer(props, fn, fallback = undefined) {
      return makeConsumer(
        function(
            consumerData,
            checkpoints,
            addressedResponses,
            fn,
            setFailed
        ){
            {
                let boolFailed = true;
                checkpoints.set("the card", false);
                checkpoints.set("isCardInHand", false);
          
                let { hand, game } = consumerData;
          
                let { cardId } = consumerData;
                if (isDef(cardId)) {
                  checkpoints.set("the card", true);
                  let card = hand.getCard(cardId);
                  if (isDef(card)) {
                    checkpoints.set("isCardInHand", true);
                    boolFailed = false;
          
                    addressedResponses.addToBucket(
                      "default",
                      fn(
                        {
                          ...consumerData,
                          card,
                          cardId,
                          hand,
                          currentTurn: game.getCurrentTurn(),
                        },
                        checkpoints
                      )
                    );
                  }
                }
          
                setFailed(boolFailed);
              }
        },
        _myTurnConsumerBase,
        props,
        fn,
        fallback
      );
    }
  
    function makeConsumer(
      consumerCheck,
      parentConsumer,
      props,
      fn,
      fallback = undefined
    ) {
      const addressedResponses = new AddressedResponse();
      return parentConsumer(
        props,
        function(consumerData, checkpoints) {
          let boolFailed = true;
  
          // If the consumer check adds checkpoints but are not met the function is considered a failure
          consumerCheck(
            consumerData,
            checkpoints,
            addressedResponses,
            fn,
            (val) => (boolFailed = val)
          );
  
          // If not all checkpoints were met
          checkpoints.forEach((value, key) => {
            if (!value) {
              boolFailed = true;
            }
          });
  
          if (boolFailed) {
            if (isFunc(fallback)) {
              let fallbackResult = fallback(checkpoints);
              addressedResponses.addToBucket("default", fallbackResult);
            } else {
              addressedResponses.addToBucket("default", fallback);
            }
          }
          return addressedResponses;
        },
        fallback
      );
    }
  
    function handleTransactionResponse(
      subject,
      action,
      props,
      theThing
    ) {
      const addressedResponses = new AddressedResponse();
      let status = "failure";
      let payload = null;
      return handleGame(
        props,
        function(consumerData, checkpoints) {
          let { requestId } = consumerData;
          let { roomCode, game, personManager, thisPersonId } = consumerData;

          
  
          let currentTurn = game.getCurrentTurn();
          let phaseKey = currentTurn.getPhaseKey();
          let requestManager = currentTurn.getRequestManager();
          let actionNum = currentTurn.getActionCount();
  
          // Request manager exists
          checkpoints.set("requestManagerExists", false);
          if (isDef(currentTurn) && isDef(requestManager)) {
            checkpoints.set("requestManagerExists", true);
  
            // Is request phase
  
            let player = game.getPlayer(thisPersonId);
            let playerBank = player.getBank();
            let request = requestManager.getRequest(requestId);
            checkpoints.set("isRequestDefined", false);
            if (isDef(request)) {
              checkpoints.set("isRequestDefined", true);
  
              let requestPayload = request.getPayload();
              let transaction = requestPayload.transaction;
  
              checkpoints.set("hasTransaction", false);
              if (isDef(transaction)) {
                checkpoints.set("hasTransaction", true);
  
                let isApplicable = false;
                let isAuthor = request.getAuthorKey() === thisPersonId;
                let isTarget = request.getTargetKey() === thisPersonId;
  
                if (isAuthor || isTarget) {
                  isApplicable = true;
                }
  
                // If is related to request
                checkpoints.set("isApplicable", false);
                if (isApplicable) {
                  checkpoints.set("isApplicable", true);
  
                  // Log what is to be reported back to the user
                  let _Affected = new Affected();
                  
  
                  // DO THE THING
                  checkpoints.set("success", false);
                  theThing({
                    thisPersonId,
                    actionNum,
                    _Affected,
                    request,
                    player,
                    playerBank,
                    transaction,
                    addressedResponses,
                    checkpoints,
                    ...consumerData,
                  });
                  if (checkpoints.get("success")) status = "success";
  
                  // If request is completed
                  if (transaction.isComplete() || transaction.isEmpty()) {
                    request.close(request.getStatus());
                    if (
                      requestManager.isAllRequestsClosed() &&
                      currentTurn.getPhaseKey() === "request"
                    ) {
                      currentTurn.proceedToNextPhase();
                      _Affected.setAffected('TURN');
                    }
                  }
  
                  
  
                  if (_Affected.isAffected('HAND')) {
                    let allPlayerIds = game.getAllPlayerKeys();
                    addressedResponses.addToBucket(
                      "default",
                      registry.execute('PLAYER_HANDS.GET_KEYED', 
                        makeProps(consumerData, {
                          personId: thisPersonId,
                          receivingPeopleIds: allPlayerIds,
                        })
                      )
                    );
                  }
  
  
                  
                  // COLLECTIONS
                  if (_Affected.isAffected('COLLECTION')) {
                    let updatedCollectionIds = _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE);
                    let removedCollectionIds = _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.REMOVE);
  
                    if (updatedCollectionIds.length > 0) {
                      addressedResponses.addToBucket(
                        "everyone",
                        registry.execute('COLLECTIONS.GET_KEYED', 
                          makeProps(consumerData, {
                            collectionIds: updatedCollectionIds,
                          })
                        )
                      );
                    }
  
                    if (removedCollectionIds.length > 0) {
                      addressedResponses.addToBucket(
                        "everyone",
                        registry.execute('COLLECTIONS.REMOVE_KEYED', 
                          makeProps(consumerData, {
                            collectionIds: removedCollectionIds,
                          })
                        )
                      );
                    }
                  }
  
  
                  // PLAYER COLLECTIONS
                  if (_Affected.isAffected('PLAYER_COLLECTION')) {
                    // Update who has what collection
                    addressedResponses.addToBucket(
                      "everyone",
                      registry.execute('PLAYER_COLLECTIONS.GET_KEYED', 
                        makeProps(consumerData, {
                          peopleIds: _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE),
                        })
                      )
                    );
                  }
  
                  // REQUESTS
                  if (_Affected.isAffected('REQUEST')) {
                    addressedResponses.addToBucket(
                      "everyone",
                      registry.execute('REQUESTS.GET_KEYED', 
                        makeProps(consumerData, {
                          requestIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                        })
                      )
                    );
                  }
  
                  if (_Affected.isAffected('PLAYER_REQUEST')) {
                    addressedResponses.addToBucket(
                      "everyone",
                      registry.execute('PLAYER_REQUESTS.GET_KEYED', 
                        makeProps(consumerData, {
                          peopleIds: _Affected.getIdsAffectedByAction("PLAYER_REQUEST", Affected.ACTION_GROUP.CHANGE),
                        })
                      )
                    );
                  }
  
                  // BANK
                  if (_Affected.isAffected('BANK')) {
                    let attendingPeople = personManager.filterPeople(
                      (person) =>
                        person.isConnected() && person.getStatus() === "ready"
                    );
                    let peopleIds = attendingPeople.map((person) =>
                      person.getId()
                    );
                    addressedResponses.addToBucket(
                      "default",
                      registry.execute('PLAYER_BANKS.GET_KEYED', 
                        makeProps(consumerData, {
                          peopleIds: thisPersonId,
                          receivingPeopleIds: peopleIds,
                        })
                      )
                    );
                  }
  
                  // PLAYER TURN
                  if (_Affected.isAffected('TURN')) {
                    addressedResponses.addToBucket(
                      "everyone",
                      registry.execute('PLAYER_TURN.GET', makeProps(props))
                    );
                  }
                }
              }
            }
          }
  
          payload = {
            checkpoints: packageCheckpoints(checkpoints),
          };
          addressedResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
  
          return addressedResponses;
        },
        makeConsumerFallbackResponse({ subject, action, addressedResponses })
      );
    }
  
    function handleTransferResponse(
      subject,
      action,
      props,
      theThing
    ) {
      const addressedResponses = new AddressedResponse();
      let status = "failure";
      let payload = null;
      return handleGame(
        props,
        function (consumerData, checkpoints) {
          let { requestId } = consumerData;
          let { roomCode, game, personManager, thisPersonId } = consumerData;
    
          let currentTurn = game.getCurrentTurn();
          let phaseKey = currentTurn.getPhaseKey();
          let requestManager = currentTurn.getRequestManager();
          let actionNum = currentTurn.getActionCount();
    
          // Request manager exists
          checkpoints.set("requestManagerExists", false);
          if (isDef(currentTurn) && isDef(requestManager)) {
            checkpoints.set("requestManagerExists", true);
    
            // Is request phase
            let player = game.getPlayer(thisPersonId);
            let playerBank = player.getBank();
            let request = requestManager.getRequest(requestId);
            checkpoints.set("isRequestDefined", false);
            if (isDef(request)) {
              checkpoints.set("isRequestDefined", true);
    
              let requestPayload = request.getPayload();
              let transaction = requestPayload.transaction;
    
              checkpoints.set("hasTransaction", false);
              if (isDef(transaction)) {
                checkpoints.set("hasTransaction", true);
    
                let isApplicable = false;
                let isAuthor = request.getAuthorKey() === thisPersonId;
                let isTarget = request.getTargetKey() === thisPersonId;
                let transferField = "";
                if (isAuthor) {
                  transferField = "toAuthor";
                  isApplicable = true;
                } else if (isTarget) {
                  transferField = "toTarget";
                  isApplicable = true;
                }
    
                // If is related to request
                checkpoints.set("isApplicable", false);
                if (isApplicable) {
                  if (transaction.has(transferField)) {
                    checkpoints.set("isApplicable", true);
    
                    // Get what is being transferd to me
                    let transfering = transaction.get(transferField);
    
                    // Log what is to be reported back to the user
                    let _Affected = new Affected();
    
                    // DO THE THING
                    checkpoints.set("success", false);
                    theThing({
                      request,
                      requestId,
                      _Affected,
                      actionNum,
                      player,
                      playerBank,
                      transaction,
                      transfering,
                      addressedResponses,
                      checkpoints,
                      ...consumerData,
                    });
    
                    if (checkpoints.get("success")) status = "success";
    
                    // If request is completed
                    if (transaction.isComplete() || transaction.isEmpty()) {
                      request.close(request.getStatus());
                      if (
                        requestManager.isAllRequestsClosed() &&
                        currentTurn.getPhaseKey() === "request"
                      ) {
                        currentTurn.proceedToNextPhase();
                        _Affected.setAffected('TURN');
                      }
                    }
    
                    
                    if (_Affected.isAffected('HAND')) {
                      let allPlayerIds = game.getAllPlayerKeys();
                      addressedResponses.addToBucket(
                        "default",
                        registry.execute('PLAYER_HANDS.GET_KEYED', 
                          makeProps(consumerData, {
                            personId: thisPersonId,
                            receivingPeopleIds: allPlayerIds,
                          })
                        )
                      );
                    }
    
                    // COLLECTIONS
                    
                    if (_Affected.isAffected('COLLECTION')) {
                      let updatedCollectionIds = _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE);
                      let removedCollectionIds = _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.REMOVE);
    
                      if (updatedCollectionIds.length > 0) {
                        addressedResponses.addToBucket(
                          "everyone",
                        registry.execute('COLLECTIONS.GET_KEYED', 
                            makeProps(consumerData, {
                              collectionIds: updatedCollectionIds,
                            })
                          )
                        );
                      }
    
                      if (removedCollectionIds.length > 0) {
                        addressedResponses.addToBucket(
                          "everyone",
                          registry.execute('COLLECTIONS.REMOVE_KEYED', 
                            makeProps(consumerData, {
                              collectionIds: removedCollectionIds,
                            })
                          )
                        );
                      }
                    }
                    // PLAYER COLLECTIONS
                    if (_Affected.isAffected('PLAYER_COLLECTION')) {
                      // Update who has what collection
                      addressedResponses.addToBucket(
                        "everyone",
                        registry.execute('PLAYER_COLLECTIONS.GET_KEYED', 
                          makeProps(consumerData, {
                            peopleIds: _Affected.getIdsAffectedByAction("PLAYER_COLLECTIONS", Affected.ACTION_GROUP.CHANGE),
                          })
                        )
                      );
                    }
    
                    // REQUESTS
                    if (_Affected.isAffected('REQUEST')) {
                      addressedResponses.addToBucket(
                        "everyone",
                        registry.execute('REQUESTS.GET_KEYED', 
                          makeProps(consumerData, {
                            requestIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                          })
                        )
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        registry.execute('PLAYER_REQUESTS.GET_KEYED', 
                          makeProps(consumerData, { personId: thisPersonId })
                        )
                      ); // maybe have to include other people
                    }
    
                    // BANK
                    if (_Affected.isAffected('BANK')) {
                      let attendingPeople = personManager.filterPeople(
                        (person) =>
                          person.isConnected() && person.getStatus() === "ready"
                      );
                      let peopleIds = attendingPeople.map((person) =>
                        person.getId()
                      );
                      addressedResponses.addToBucket(
                        "default",
                        registry.execute('PLAYER_BANKS.GET_KEYED', 
                          makeProps(consumerData, {
                            peopleIds: thisPersonId,
                            receivingPeopleIds: peopleIds,
                          })
                        )
                      );
                    }
    
                    // PLAYER TURN
                    if (_Affected.isAffected('TURN')) {
                      addressedResponses.addToBucket(
                        "everyone",
                        registry.execute('PLAYER_TURN.GET', makeProps(consumerData))
                      );
                    }
                  }
                }
              }
            }
          }
    
          payload = {
            checkpoints: packageCheckpoints(checkpoints),
          };
          addressedResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
    
          return addressedResponses;
        },
        makeConsumerFallbackResponse({ subject, action, addressedResponses })
      );
    }
  
    function handleRequestCreation(
      subject,
      action,
      props,
      doTheThing
    ) {
      const addressedResponses = new AddressedResponse();
      let status = "failure";
      let payload = null;
      return handCardConsumer(
        props,
        function(consumerData, checkpoints) {
          let { cardId } = consumerData;
          let targetPeopleIds = getArrFromProp(consumerData, {
            plural: "targetIds",
            singular: "targetId",
          });
  
          let { game, personManager, thisPersonId } = consumerData;
          let currentTurn = game.getCurrentTurn();
          let actionNum = currentTurn.getActionCount();
  
          // request manager exists?
          let requestManager = currentTurn.getRequestManager();
          checkpoints.set("requestManagerExists", false);
          if (isDef(requestManager)) {
            checkpoints.set("requestManagerExists", true);
  
            // Is action phase?
            checkpoints.set("action", false);
            if (currentTurn.getPhaseKey() === "action") {
              checkpoints.set("action", true);
              let hand = game.getPlayerHand(thisPersonId);
              let card = game.getCard(cardId);
              checkpoints.set("isValidCard", false);
              if (isDef(card) && game.isActionCard(card) && hand.hasCard(card)) {
                checkpoints.set("isValidCard", true);
  
                // Determine request cardnality
                let target = isDef(card.target) ? card.target : "one";
                if (target === "one") {
                  targetPeopleIds = [targetPeopleIds[0]];
                } else if (target === "all") {
                  let allPlayerIds = game.getAllPlayerKeys();
                  targetPeopleIds = allPlayerIds.filter(
                    (playerId) => String(playerId) !== String(thisPersonId)
                  );
                }
  
                //==========================================================
                let _Affected = new Affected();
                
                checkpoints.set("success", false);
                doTheThing({
                  ...consumerData,
                  actionNum,
                  requestManager,
                  checkpoints,
                  _Affected,
                  targetPeopleIds,
                  currentTurn,
                  thisPersonId,
                  addressedResponses,
                });
  
                if (checkpoints.get("success") === true) {
                  status = "success";
                }
  
                //==========================================================
  
                // Update current turn state
  
                // Update everyone with my new hand
                let allPlayerIds = game.getAllPlayerKeys();
               
                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PLAYER_HANDS.GET_KEYED', 
                    makeProps(consumerData, {
                      personId: thisPersonId,
                      receivingPeopleIds: allPlayerIds,
                    })
                  )
                );
                if (_Affected.isAffected('ACTIVE_PILE')) {
                  addressedResponses.addToBucket(
                    "everyone",
                    registry.execute('ACTIVE_PILE.GET', makeProps(consumerData))
                  );
                }
  
                if (_Affected.isAffected('COLLECTION')) {
                  addressedResponses.addToBucket(
                    "everyone",
                    registry.execute('COLLECTIONS.GET_KEYED', 
                      makeProps(consumerData, {
                        collectionIds: _Affected.getIdsAffectedByAction("COLLECTION", Affected.ACTION_GROUP.CHANGE),
                      })
                    )
                  );
                }
  
                if (_Affected.isAffected('PLAYER_COLLECTION')) {
                  // Update who has what collection
                  addressedResponses.addToBucket(
                    "everyone",
                    registry.execute('PLAYER_COLLECTIONS.GET_KEYED', 
                      makeProps(consumerData, {
                        peopleIds: _Affected.getIdsAffectedByAction("PLAYER_COLLECTION", Affected.ACTION_GROUP.CHANGE),
                      })
                    )
                  );
                }
  
                if (_Affected.isAffected('PLAYER_REQUEST')) {
                  addressedResponses.addToBucket(
                    "everyone",
                    registry.execute('PLAYER_REQUESTS.GET_KEYED', 
                      makeProps(consumerData, { peopleIds: targetPeopleIds })
                    )
                  );
                }
  
  
                if (_Affected.isAffected('REQUEST')) {
                  addressedResponses.addToBucket(
                    "everyone",
                    registry.execute('REQUESTS.GET_KEYED', 
                      makeProps(consumerData, {
                        requestIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                      })
                    )
                  );
                }
  
                addressedResponses.addToBucket(
                  "everyone",
                  registry.execute('PLAYER_TURN.GET', makeProps(consumerData))
                );
              }
            }
          }
  
          payload = {
            checkpoints: packageCheckpoints(checkpoints),
          };
          addressedResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
          return addressedResponses;
        },
        makeConsumerFallbackResponse({ subject, action, addressedResponses })
      );
    }
  
    function handleCollectionBasedRequestCreation(
      subject,
      action,
      props,
      doTheThing
    ) {
      const addressedResponses = new AddressedResponse();
      let status = "failure";
      let payload = null;
      return handCardConsumer(
        props,
        function (consumerData, checkpoints) {
          let { collectionId, cardId, augmentCardsIds } = consumerData;
          let targetPeopleIds = getArrFromProp(consumerData, {
            plural: "targetIds",
            singular: "targetId",
          });
  
          let { game, personManager, thisPersonId } = consumerData;
          let currentTurn = game.getCurrentTurn();
          let actionNum = currentTurn.getActionCount();
          // request manager exists?
          let requestManager = currentTurn.getRequestManager();
          checkpoints.set("requestManagerExists", false);
          if (isDef(requestManager)) {
            checkpoints.set("requestManagerExists", true);
  
            // Is action phase?
            checkpoints.set("action", false);
            if (currentTurn.getPhaseKey() === "action") {
              let collectionManager = game.getCollectionManager();
              checkpoints.set("action", true);
  
              if (isDef(collectionId)) {
                let collection = collectionManager.getCollection(collectionId);
  
                checkpoints.set("collectionExists", false);
                if (isDef(collection)) {
                  checkpoints.set("collectionExists", true);
                  let collectionPropertySetKey = collection.getPropertySetKey();
  
                  checkpoints.set("isMyCollection", false);
                  if (collection.getPlayerKey() === thisPersonId) {
                    checkpoints.set("isMyCollection", true);
  
                    let hand = game.getPlayerHand(thisPersonId);
                    let card = game.getCard(cardId);
                    checkpoints.set("isValidCard", false);
                    if (
                      isDef(card) &&
                      game.isRentCard(card) &&
                      hand.hasCard(card)
                    ) {
                      checkpoints.set("isValidCard", true);
  
                      let rentCardApplicableSets = game.getSetChoicesForCard(
                        card
                      );
                      checkpoints.set("rentCanBeChargedForThisCollection", false);
                      if (
                        rentCardApplicableSets.includes(collectionPropertySetKey)
                      ) {
                        checkpoints.set(
                          "rentCanBeChargedForThisCollection",
                          true
                        );
  
                        let activePile = game.getActivePile();
                        activePile.addCard(hand.giveCard(card));
  
                        // get rent value for collection
                        let rentValue = game.getRentValueOfCollection(
                          thisPersonId,
                          collectionId
                        );
  
                        // If rent augment ment cards exist alter value
                        let chargeValue = rentValue;
                        let validAugmentCardsIds = [];
                        let augments = {};
                        if (isArr(augmentCardsIds)) {
                          let augmentUsesActionCount = game.getConfig(
                            game.constants.CONFIG.ACTION_AUGMENT_CARDS_COST_ACTION,
                            true
                          );
                          let currentActionCount =
                            currentTurn.getActionCount() + 1; // +1 for the rent card
                          let additionalActionCountFromAugments = 0;
                          augmentCardsIds.forEach((augCardId) => {
                            if (
                              !augmentUsesActionCount ||
                              (augmentUsesActionCount &&
                                currentActionCount < currentTurn.getActionLimit())
                            ) {
                              let canApply = game.canApplyRequestAugment(
                                cardId,
                                augCardId,
                                validAugmentCardsIds,
                                augmentCardsIds
                              );
                              if (canApply) {
                                ++additionalActionCountFromAugments;
                                validAugmentCardsIds.push(augCardId);
                                let card = game.getCard(augCardId);
                                augments[augCardId] = getNestedValue(
                                  card,
                                  ["action", "agument"],
                                  {}
                                );
                              }
                            }
                          });
                          currentActionCount += additionalActionCountFromAugments;
                        }
  
                        let baseValue = chargeValue;
                        chargeValue = game.applyActionValueAugment(
                          validAugmentCardsIds,
                          chargeValue
                        );
  
                        // Determine request cardnality
                        let target = isDef(card.target) ? card.target : "one";
                        if (target === "one") {
                          targetPeopleIds = [targetPeopleIds[0]];
                        } else if (target === "all") {
                          let allPlayerIds = game.getAllPlayerKeys();
                          targetPeopleIds = allPlayerIds.filter(
                            (playerId) =>
                              String(playerId) !== String(thisPersonId)
                          );
                        }
  
                        // targetPeopleIds allPlayerIds augmentCardsIds  validAugmentCardsIds
                        //==========================================================
  
                        let _Affected = new Affected();
                        checkpoints.set("success", false);
  
                        doTheThing({
                          ...consumerData,
                          requestManager,
                          checkpoints,
                          baseValue: baseValue,
                          totalValue: chargeValue,
                          augments: {
                            cardIds: validAugmentCardsIds,
                            items: augments,
                          },
                          actionNum,
                          _Affected,
                          targetPeopleIds,
                          currentTurn,
                          collectionId,
                          thisPersonId,
                          addressedResponses,
                          validAugmentCardsIds,
                        }); //actuallly do it
  
                        if (checkpoints.get("success") === true) {
                          status = "success";
                        }
  
                        // Player Hands
                        let allPlayerIds = game.getAllPlayerKeys();
                        addressedResponses.addToBucket(
                          "default",
                          registry.execute('PLAYER_HANDS.GET_KEYED', 
                            makeProps(consumerData, {
                              personId: thisPersonId,
                              receivingPeopleIds: allPlayerIds,
                            })
                          )
                        );
  
                        // Active Pile
                        if (_Affected.isAffected('ACTIVE_PILE')) {
                          addressedResponses.addToBucket(
                            "everyone",
                            registry.execute('ACTIVE_PILE.GET', 
                              makeProps(consumerData)
                            )
                          );
                        }
  
                        // Requests
                        if (_Affected.isAffected('REQUEST')) {
                          addressedResponses.addToBucket(
                            "everyone",
                            registry.execute('PLAYER_REQUESTS.GET_KEYED', 
                              makeProps(consumerData, {
                                peopleIds: targetPeopleIds,
                              })
                            )
                          );
                          addressedResponses.addToBucket(
                            "everyone",
                            registry.execute('REQUESTS.GET_KEYED', 
                              makeProps(consumerData, {
                                requestIds: _Affected.getIdsAffectedByAction("REQUEST", Affected.ACTION_GROUP.CHANGE),
                              })
                            )
                          );
                        }
  
                        // Player Turn
                        addressedResponses.addToBucket(
                          "everyone",
                          registry.execute('PLAYER_TURN.GET', makeProps(consumerData))
                        );
                      }
                    }
                  }
                }
              }
            }
          }
  
          addressedResponses.addToBucket(
            "default",
            makeResponse({ subject, action, status, payload })
          );
  
          return addressedResponses;
        },
        makeConsumerFallbackResponse({ subject, action, addressedResponses })
      );
    }

    return {
        makeProps,
        makeResponse,
        makeKeyedResponse,

        getAllKeyedResponse,
        packageCheckpoints,
        canGameStart,
        createGameInstance,
        canPersonRemoveOtherPerson,

        makePersonSpecificResponses,
        makeConsumerFallbackResponse,
        makeRegularGetKeyed,

        handleRoom,
        handlePerson,

        handleGame,

        handleMyTurn,
        handCardConsumer,
        handleTransactionResponse,
        handleTransferResponse,
        handleRequestCreation,
        handleCollectionBasedRequestCreation,
    }
}

module.exports = buildDeps;