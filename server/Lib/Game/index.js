/**
 * Build a People Method Provider
 * 
 * Provides methods for a socket to be able to listen with
 * const buildRegisterGameMethods = require(`${serverFolder}/Lib/Game/`);
 */
function buildRegisterGameMethods({
    enabled,
    els,
    isDef,
    isDefNested,
    isFunc,
    isArr,
    log,
    getArrFromProp,
    //-------------------
    Affected,
    Transaction,
    AddressedResponse,
    KeyedRequest,
    PUBLIC_SUBJECTS,
    PRIVATE_SUBJECTS,
    //-------------------
    thisClientKey,
    roomManager,
    //-------------------
    makeProps,
    makeResponse,
    makeKeyedResponse,
    makePersonSpecificResponses,
    makeConsumerFallbackResponse,
    makeRegularGetKeyed,

    getAllKeyedResponse,
    packageCheckpoints,
    canGameStart,
    createGameInstance,

    handleRoom,
    handlePerson,
    handleGame,
    handleMyTurn,
    handCardConsumer,
    handleTransactionResponse,
    handleTransferResponse,
    handleRequestCreation,
    handleCollectionBasedRequestCreation,

    buildAttemptFinishTurnAction,
    buildDiscardToHandLimitAction,
    buildChargeRentAction,
    buildRequestValueAction,
    buildRespondToCollectValueAction,
    buildAcknowledgeCollectNothingAction,
    buildCollectCardToBankAutoAction,
    buildCollectCardToBankAction,
    buildCollectCardToCollectionAction,
    buildCollectCollectionAction,
    buildStealPropertyAction,
    buildRespondToStealPropertyAction,
    buildSwapPropertyAction,
    buildRespondToPropertySwapAction,
    buildDrawCardsAction,
    buildChangeCardActiveSetAction,
    buildRespondToJustSayNoAction,
    buildAddCardToBankAction,
    buildAddPropertyToNewCollectionAction,
    buildAddPropertyToExitingCollectionAction,
    buildAddSetAugmentToExistingCollectionAction,
    buildAddSetAugmentToNewCollectionAction,
    buildTransferPropertyToNewCollectionFromExistingAction,
    buildTransferPropertyToExistingCollectionFromExistingAction,
    buildTransferSetAugmentToExistingCollectionFromExistingAction,
    buildTransferSetAugmentToNewCollectionFromExistingAction, 
    buildStealCollectionAction,
    buildRespondToStealCollection,  
    buildTurnStartingDrawAction,
    buildRegisterRequestValueMethods,
    buildRegisterCollectionsMethods,
    buildRegisterCardMethods,
    buildRegisterPlayerMethods,
})
{

    const commonDeps = {
        // Helpers
        isDef, isArr, isFunc, 
        getArrFromProp, packageCheckpoints, makeProps,
        // Reference
        PUBLIC_SUBJECTS,
        PRIVATE_SUBJECTS,
        // Structures
        Affected, 
        Transaction,
        AddressedResponse,
        // Props
        myClientId: thisClientKey,
        roomManager, 
      }

    function registerGameMethods(registry)
    {
        Object.assign(PUBLIC_SUBJECTS, {
            GAME: {
              /**
               * @PROPS {String} roomCode
               */
              GET_UPDATED_PILES: (props) => {
                const { roomCode } = props;
        
                const addressedResponses = new AddressedResponse();
                if (isDef(roomCode)) {
                  addressedResponses.addToBucket(
                    "default",
                    PUBLIC_SUBJECTS["DRAW_PILE"].GET({ roomCode })
                  );
        
                  addressedResponses.addToBucket(
                    "default",
                    PUBLIC_SUBJECTS["DISCARD_PILE"].GET({ roomCode })
                  );
        
                  addressedResponses.addToBucket(
                    "default",
                    PUBLIC_SUBJECTS["ACTIVE_PILE"].GET({ roomCode })
                  );
                }
                return addressedResponses;
              },
              RESET: (props) => {
                const [subject, action] = ["GAME", "RESET"];
                const addressedResponses = new AddressedResponse();
                return handleRoom(
                  props,
                  (consumerData) => {
                    const { room } = consumerData;
                    let status = "success";
                    let payload = null;
        
                    createGameInstance(room);
        
                    addressedResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(
                        makeProps(consumerData)
                      )
                    );
                    addressedResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData))
                    );
        
                    addressedResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return addressedResponses;
                  },
                  addressedResponses
                );
              },
              UPDATE_CONFIG: (props) => {
                const [subject, action] = ["GAME", "UPDATE_CONFIG"];
                let payload = null;
                let status = "failure";
                const addressedResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (consumerData, checkpoints) => {
                    const { config } = consumerData;
                    const { roomCode, room } = consumerData;
        
                    const game = room.getGame();
        
                    // Only alter config before the game has started
                    checkpoints.set("gameHasNotYetStarted", false);
                    if (!game.isGameStarted()) {
                      checkpoints.set("gameHasNotYetStarted", true);
                      if (isDef(config)) {
                        status = "success";
                        game.updateConfig(config);
                      }
                    }
                    addressedResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS.GAME.GET_CONFIG({ roomCode })
                    );
                    addressedResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return addressedResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, addressedResponses })
                );
              },
              GET_CONFIG: (props) => {
                const [subject, action] = ["GAME", "GET_CONFIG"];
                let payload = null;
                let status = "failure";
                const addressedResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (consumerData) => {
                    const { room } = consumerData;
        
                    const game = room.getGame();
        
                    status = "success";
                    payload = {
                      updatedConfig: isDef(game) ? game.getConfig() : null,
                    };
        
                    addressedResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return addressedResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, addressedResponses })
                );
              },
              STATUS: (props) => {
                // roomCode
                const [subject, action] = ["GAME", "STATUS"];
                const addressedResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (props2) => {
                    let { room } = props2;
        
                    const game = room.getGame();
                    let isGameStarted = isDef(game) ? game.isGameStarted() : false;
                    let isGameOver = isDef(game) ? game.isGameOver() : false;
                    let isInProgress = isGameStarted && !isGameOver;
                    let winningCondition = isDef(game)
                      ? game.getWinningCondition()
                      : null;
        
                    let status = "success";
                    let payload = {
                      isGameStarted,
                      isInProgress,
                      isGameOver,
                      winningCondition: winningCondition,
                    };
                    addressedResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
                    return addressedResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, addressedResponses })
                );
              },
              START: (props) => {
                const [subject, action] = ["GAME", "START"];
                const addressedResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (consumerData) => {
                    let { roomCode, personManager, thisPerson, room } = consumerData;
                    let game = room.getGame();
                    let canStart = canGameStart(game, personManager);
                    if (thisPerson.hasTag("host") && canStart) {
                      // Find the people in the room who are ready
                      let attendingPeople = personManager.filterPeople(
                        (person) =>
                          person.isConnected() && person.getStatus() === "ready"
                      );
        
                      // Add players to game from list of people
                      attendingPeople.forEach((person) => {
                        game.createPlayer(person.getId());
                      });
        
                      // Initialize game
                      game.startGame();
                      game.nextPlayerTurn();
        
                      // broadcast initial game data
                      let peopleIds = attendingPeople.map((person) => person.getId());
                      let specificPropsForEveryone = {
                        roomCode,
                        peopleIds: peopleIds,
                        receivingPeopleIds: peopleIds,
                      };
        
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(
                          makeProps(consumerData)
                        )
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData))
                      );
        
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["PROPERTY_SETS"].GET_ALL_KEYED({ roomCode })
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["CARDS"].GET_ALL_KEYED({ roomCode })
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["PLAYERS"].GET({ roomCode })
                      );
                      addressedResponses.addToBucket(
                        "default",
                        PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED(
                          specificPropsForEveryone
                        )
                      );
                      addressedResponses.addToBucket(
                        "default",
                        PUBLIC_SUBJECTS["PLAYER_BANKS"].GET_KEYED(
                          specificPropsForEveryone
                        )
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["COLLECTIONS"].GET_ALL_KEYED({
                          roomCode,
                          peopleIds: peopleIds,
                        })
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_ALL_KEYED({
                          roomCode,
                          peopleIds: peopleIds,
                        })
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["DRAW_PILE"].GET({ roomCode })
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["ACTIVE_PILE"].GET({ roomCode })
                      );
        
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["DISCARD_PILE"].GET({ roomCode })
                      );
        
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["GAME"].STATUS({ roomCode })
                      );
        
                      addressedResponses.addToBucket(
                        "everyone",
                        makeResponse({
                          subject,
                          action,
                          status: "success",
                          payload: null,
                        })
                      );
                      addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                      );
                    }
                    return addressedResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, addressedResponses })
                );
              },
              CAN_START: (props) => {
                // roomCode
                const [subject, action] = ["GAME", "CAN_START"];
                const addressedResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (props2) => {
                    let { room, personManager } = props2;
        
                    let game = room.getGame();
                    let canStart = canGameStart(game, personManager);
                    let host = personManager.findPerson((person) =>
                      person.hasTag("host")
                    );
                    if (isDef(host)) {
                      let status = "success";
                      let payload = {
                        value: canStart,
                      };
                      addressedResponses.addToSpecific(
                        host.getClientId(),
                        makeResponse({ subject, action, status, payload })
                      );
                    }
                    return addressedResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, addressedResponses })
                );
              },
            },
          });
    
    
    // REACT WITH JUST_SAY_NO
    if (enabled.justSayNo) {
        registry.public(['RESPONSES', 'RESPOND_TO_JUST_SAY_NO'],
          buildRespondToJustSayNoAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            handleGame, 
            handleTransactionResponse,
          })
        )
      }
  
      // STEAL COLLECTION
      if (enabled.stealCollection) {
        registry.public(['MY_TURN', 'STEAL_COLLECTION'],
          buildStealCollectionAction({
            ...commonDeps,
            handleRequestCreation,
          })
        )
  
        registry.public(['RESPONSES', 'RESPOND_TO_STEAL_COLLECTION'],
          buildRespondToStealCollection({
            ...commonDeps,
            handleTransactionResponse,
          })     
        )
      }
  
      // STEAL_PROPERTY
      if (enabled.stealProperty) {
        registry.public(['MY_TURN', 'STEAL_PROPERTY'],
          buildStealPropertyAction({
            ...commonDeps,
            handleRequestCreation,
          }) 
        )
  
        registry.public(['RESPONSES', 'RESPOND_TO_STEAL_PROPERTY'],
          buildRespondToStealPropertyAction({
            ...commonDeps,
            handleTransactionResponse,
          }) 
        )
      }
  
      // SWAP_PROPERTY
      if (enabled.swapProperty) {    
        registry.public(['MY_TURN', 'SWAP_PROPERTY'],
          buildSwapPropertyAction({
            ...commonDeps,
            handleRequestCreation,
          }) 
        )
  
        registry.public(['RESPONSES', 'RESPOND_TO_PROPERTY_SWAP'],
          buildRespondToPropertySwapAction({
            ...commonDeps,
            handleTransactionResponse
          }) 
        )
      }
  
  
      // Turn based
      if (1) {
        registry.public(['MY_TURN','TURN_STARTING_DRAW'],
          buildTurnStartingDrawAction({
            ...commonDeps,
            AddressedResponse,
            PUBLIC_SUBJECTS,
            makeConsumerFallbackResponse,
            handleMyTurn,
            makeResponse,
          }) 
        )
  
        registry.public(['MY_TURN', 'FINISH_TURN'],
          buildAttemptFinishTurnAction({
            ...commonDeps,
            AddressedResponse,
            PUBLIC_SUBJECTS,
            makeConsumerFallbackResponse,
            handleMyTurn,
            makeResponse,
            makeProps,
          }) 
        )
  
        registry.public(['MY_TURN', 'DISCARD_REMAINING'],
          buildDiscardToHandLimitAction({
            ...commonDeps,
            AddressedResponse,
            PUBLIC_SUBJECTS,
            makeConsumerFallbackResponse,
            handleMyTurn,
            makeResponse,
            makeProps,
            els,
          }) 
        )
      }
  
      // COLLECT CARDS
      if (enabled.collectCards) {
        registry.public(['RESPONSES', 'ACKNOWLEDGE_COLLECT_NOTHING'],
          buildAcknowledgeCollectNothingAction({
            ...commonDeps,
            handleTransactionResponse
          }) 
        )
  
        registry.public(['RESPONSES', 'COLLECT_CARD_TO_BANK_AUTO'],
          buildCollectCardToBankAutoAction({
            ...commonDeps,
            handleTransferResponse,
          }) 
        )
  
        registry.public(['RESPONSES', 'COLLECT_CARD_TO_BANK'],
          buildCollectCardToBankAction({
            ...commonDeps,
            handleTransferResponse,
          }) 
        )
  
        registry.public(['RESPONSES', 'COLLECT_CARD_TO_COLLECTION'],
          buildCollectCardToCollectionAction({
            ...commonDeps,
            handleTransferResponse,
          }) 
        )
          
        registry.public(['RESPONSES','COLLECT_COLLECTION'],
          buildCollectCollectionAction({
            ...commonDeps,
            handleTransferResponse
          }) 
        )
      }
  
  
        
    // Add From Hand
    if (1) {
        registry.public('MY_TURN.ADD_CARD_TO_MY_BANK_FROM_HAND',
          buildAddCardToBankAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
            log,
          })
        )
  
        registry.public('MY_TURN.ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND',
          buildAddPropertyToNewCollectionAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
            log,
          })
        )
  
        registry.public('MY_TURN.ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND',
          buildAddPropertyToExitingCollectionAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
            log,
          })
        )
  
        registry.public('MY_TURN.ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND',
          buildAddSetAugmentToExistingCollectionAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
          })
        )
  
        registry.public('MY_TURN.TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND',
          buildAddSetAugmentToNewCollectionAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
            handleMyTurn,
          })
        )
      }
  
  
      // Transfer From Collections
      if (1) {
        registry.public('MY_TURN.TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION',
          buildTransferPropertyToNewCollectionFromExistingAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
            handleMyTurn,
          })
        )
        registry.public('MY_TURN.TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION',
          buildTransferPropertyToExistingCollectionFromExistingAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
            handleMyTurn,
          })
        )
  
        registry.public('MY_TURN.TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION',
          buildTransferSetAugmentToExistingCollectionFromExistingAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
            handleMyTurn,
          })
        )
  
        registry.public('MY_TURN.TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION',
          buildTransferSetAugmentToNewCollectionFromExistingAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            packageCheckpoints,
            handCardConsumer,
            handleMyTurn,
          })
        )
      }
    

      
    // Draw Cards
    registry.public('MY_TURN.PLAY_PASS_GO',
    buildDrawCardsAction({
      ...commonDeps,
      makeConsumerFallbackResponse,
      makeResponse,
      handCardConsumer,
    })
  )
 // Card Manipulation
 registry.public('MY_TURN.CHANGE_CARD_ACTIVE_SET',
 buildChangeCardActiveSetAction({
   ...commonDeps,
   makeResponse,
   handleMyTurn,
   makeConsumerFallbackResponse,
   packageCheckpoints,
   makeResponse,
 })
)

    // REQUEST VALUE
    let registerRequestValueMethods =  buildRegisterRequestValueMethods({
        commonDeps,
        isDefNested,
        buildRespondToCollectValueAction,
        buildChargeRentAction,
        buildRequestValueAction,
        makeResponse,
        makeConsumerFallbackResponse,
        handleGame,
        handleTransactionResponse,
        handleRequestCreation,
        handleCollectionBasedRequestCreation,
      })
      registerRequestValueMethods(registry)



      // Piles
    Object.assign(PUBLIC_SUBJECTS, {
        DISCARD_PILE: {
          GET: (props) => {
            let subject = "DISCARD_PILE";
            let action = "GET";
            const addressedResponses = new AddressedResponse();
            return handleGame(
              props,
              (props2) => {
                let { game } = props2;
                let payload = game.getDiscardPile().serialize();
                addressedResponses.addToBucket(
                  "default",
                  makeResponse({ subject, action, status: "success", payload })
                );
    
                return addressedResponses;
              },
              makeConsumerFallbackResponse({ subject, action, addressedResponses })
            );
          },
        },
        ACTIVE_PILE: {
          GET: (props) => {
            let subject = "ACTIVE_PILE";
            let action = "GET";
            const addressedResponses = new AddressedResponse();
            return handleGame(
              props,
              (props2) => {
                let { game } = props2;
                let payload = game.getActivePile().serialize();
                addressedResponses.addToBucket(
                  "default",
                  makeResponse({ subject, action, status: "success", payload })
                );
    
                return addressedResponses;
              },
              makeConsumerFallbackResponse({ subject, action, addressedResponses })
            );
          },
        },
        DRAW_PILE: {
          GET: (props) => {
            let subject = "DRAW_PILE";
            let action = "GET";
            const addressedResponses = new AddressedResponse();
            return handleGame(
              props,
              ({ game }) => {
                // Takes no action
                // Current count of card in deck
                let payload = {
                  count: game.getDeckCardCount(),
                };
                addressedResponses.addToBucket(
                  "default",
                  makeResponse({ subject, action, status: "success", payload })
                );
                //___________________________________________________________
                return addressedResponses;
              },
              makeConsumerFallbackResponse({ subject, action, addressedResponses })
            );
          },
        },
      });

      
    let registerCollectionsMethods = buildRegisterCollectionsMethods({
        isDef,
        AddressedResponse,
        KeyedRequest,
        PUBLIC_SUBJECTS,
        makeResponse,
        makeKeyedResponse,
        getAllKeyedResponse,
        makeConsumerFallbackResponse,
        makeRegularGetKeyed,
        handleGame,
      })
      registerCollectionsMethods(registry);
  

    // Card related
    let registerCardMethods = buildRegisterCardMethods({
        AddressedResponse,
        KeyedRequest,
        PUBLIC_SUBJECTS,
        makeResponse,
        makeKeyedResponse,
        getAllKeyedResponse,
        makeConsumerFallbackResponse,
        handleGame,
      })
      registerCardMethods();
  

      // Current Turn
    if (1) {
        Object.assign(PUBLIC_SUBJECTS, {
          PLAYER_TURN: {
            GET: (props) => {
              let subject = "PLAYER_TURN";
              let action = "GET";
              const addressedResponses = new AddressedResponse();
              return handleGame(
                props,
                (consumerData) => {
                  let { game, thisPersonId } = consumerData;
                  let currentTurn = game.getCurrentTurn();
      
                  if (currentTurn.getPhaseKey() === "discard") {
                    let thisPlayerHand = game.getPlayerHand(thisPersonId);
                    let remaining =
                      thisPlayerHand.getCount() - game.getHandMaxCardCount();
                    if (remaining > 0) {
                      currentTurn.setPhaseData({
                        remainingCountToDiscard: remaining,
                      });
                    }
                  }
      
                  let payload = game.getCurrentTurn().serialize();
      
                  addressedResponses.addToBucket(
                    "default",
                    makeResponse({ subject, action, status: "success", payload })
                  );
      
                  //addressedResponses.addToBucket("default", PUBLIC_SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(makeProps(consumerData)));
                  //addressedResponses.addToBucket("default", PUBLIC_SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData)));
      
                  return addressedResponses;
                },
                makeConsumerFallbackResponse({ subject, action, addressedResponses })
              );
            },
          },
        })
      }

      
    // Requests
    Object.assign(PUBLIC_SUBJECTS, {
        REQUESTS: {
          ...makeRegularGetKeyed({
            SUBJECTS: PUBLIC_SUBJECTS,
            subject: "REQUESTS",
            singularKey: "requestId",
            pluralKey: "requestIds",
            makeGetDataFn: ({ game, subject, action }, checkpoints) => (
              requestId
            ) => {
              let result = null;
              let data = game
                .getCurrentTurn()
                .getRequestManager()
                .getRequest(requestId);
    
              if (isDef(data)) {
                checkpoints.set("requestExists", true);
                result = data.serialize();
              }
              return result;
            },
            makeGetAllKeysFn: ({ game, subject, action }, checkpoints) => () => {
              let result = game
                .getCurrentTurn()
                .getRequestManager()
                .getAllRequestIds();
              return result;
            },
            makeGetAlMyKeysFn: (
              { game, thisPersonId, subject, action },
              checkpoints
            ) => () => {
              let result = game
                .getCurrentTurn()
                .getRequestManager()
                .getAllRequestIdsForPlayer(thisPersonId);
              return result;
            },
          }),
          REMOVE_ALL: (props) => {
            let subject = "REQUESTS";
            let action = "REMOVE_ALL";
            let status = "failure";
            let payload = null;
            const addressedResponses = new AddressedResponse();
            return handleGame(
              props,
              (consumerData) => {
                status = "success";
                addressedResponses.addToBucket(
                  "default",
                  makeResponse({ subject, action, status, payload })
                );
                return addressedResponses;
              },
              makeConsumerFallbackResponse({ subject, action, addressedResponses })
            );
          },
        },
        PLAYER_REQUESTS: {
          GET_KEYED: (props) => {
            //props: { roomCode, (peopleIds|personId)}
            let subject = "PLAYER_REQUESTS";
            let action = "GET_KEYED";
            const addressedResponses = new AddressedResponse();
    
            return handleGame(
              props,
              (consumerData) => {
                let { game } = consumerData;
    
                let myKeyedRequest = KeyedRequest();
                myKeyedRequest.setAction(action);
                myKeyedRequest.setSubject(subject);
                myKeyedRequest.setPluralKey("peopleIds");
                myKeyedRequest.setSingularKey("personId");
                myKeyedRequest.setDataFn((personId) => {
                  return game
                    .getRequestManager()
                    .getAllRequestIdsForPlayer(personId);
                });
                myKeyedRequest.setProps(consumerData);
    
                //deliver data
                addressedResponses.addToBucket(
                  "default",
                  makeKeyedResponse(myKeyedRequest)
                );
    
                return addressedResponses;
              },
              makeConsumerFallbackResponse({ subject, action, addressedResponses })
            );
          },
          REMOVE_ALL: (props) => {
            let subject = "REQUESTS";
            let action = "PLAYER_REQUESTS";
            let status = "failure";
            let payload = null;
            const addressedResponses = new AddressedResponse();
            return handleGame(
              props,
              (consumerData) => {
                status = "success";
                addressedResponses.addToBucket(
                  "default",
                  makeResponse({ subject, action, status, payload })
                );
                return addressedResponses;
              },
              makeConsumerFallbackResponse({ subject, action, addressedResponses })
            );
          },
        },
      });
        
        // Players
        let registerPlayerMethods = buildRegisterPlayerMethods({
            isDef,
            isArr,
            AddressedResponse,
            PUBLIC_SUBJECTS,
            makeResponse,
            makePersonSpecificResponses,
            makeConsumerFallbackResponse,
            handleGame,
        })

        registerPlayerMethods(registry)
    }
    return registerGameMethods;
}

module.exports = buildRegisterGameMethods;
