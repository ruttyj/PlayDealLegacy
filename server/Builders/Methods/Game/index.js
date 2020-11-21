const builderFolder = `../../../Builders`

/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * Change color of set / move cards around at "done" phase
 * 
 */

const buildChangeCardActiveSetAction                = require(`${builderFolder}/Events/ChangeCardActiveSetAction`)

const buildRegisterCardMethods                      = require(`${builderFolder}/Methods/Card/`)

// From Hand
const buildAddCardToBankAction                      = require(`${builderFolder}/Events/FromHand/AddCardToBankAction`)
const buildAddPropertyToNewCollectionAction         = require(`${builderFolder}/Events/FromHand/AddPropertyToNewCollectionAction`)
const buildAddPropertyToExitingCollectionAction     = require(`${builderFolder}/Events/FromHand/AddPropertyToExitingCollectionAction`)
const buildAddSetAugmentToExistingCollectionAction  = require(`${builderFolder}/Events/FromHand/AddSetAugmentToExistingCollectionAction`)
const buildAddSetAugmentToNewCollectionAction       = require(`${builderFolder}/Events/FromHand/AddSetAugmentToNewCollectionAction`)

// Turn based
const buildTurnStartingDrawAction                   = require(`${builderFolder}/Events/TurnPhase/TurnStartingDrawAction`)
const buildAttemptFinishTurnAction                  = require(`${builderFolder}/Events/TurnPhase/AttemptFinishTurnAction`)
const buildDiscardToHandLimitAction                 = require(`${builderFolder}/Events/TurnPhase/DiscardToHandLimitAction`)

// From Collection
const buildTransferPropertyToNewCollectionFromExistingAction          = require(`${builderFolder}/Events/FromCollection/TransferPropertyToNewCollectionFromExistingAction`)
const buildTransferPropertyToExistingCollectionFromExistingAction     = require(`${builderFolder}/Events/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`)
const buildTransferSetAugmentToExistingCollectionFromExistingAction   = require(`${builderFolder}/Events/FromCollection/TransferSetAugmentToExistingCollectionFromExistingAction`)
const buildTransferSetAugmentToNewCollectionFromExistingAction        = require(`${builderFolder}/Events/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`)

// Request Value
const buildChargeRentAction                         = require(`${builderFolder}/Events/RequestValue/ChargeRentAction`)
const buildRequestValueAction                       = require(`${builderFolder}/Events/RequestValue/RequestValueAction`)
const buildRespondToCollectValueAction              = require(`${builderFolder}/Events/RequestValue/RespondToCollectValueAction`)

// Request Response 
const buildRespondToJustSayNoAction                 = require(`${builderFolder}/Events/RespondToJustSayNoAction`)

const buildDrawCardsAction                          = require(`${builderFolder}/Events/DrawCardsAction`)

// Asset Collection
const buildAcknowledgeCollectNothingAction          = require(`${builderFolder}/Events/AssetCollection/AcknowledgeCollectNothingAction`)
const buildCollectCardToBankAutoAction              = require(`${builderFolder}/Events/AssetCollection/CollectCardToBankAutoAction`)
const buildCollectCardToBankAction                  = require(`${builderFolder}/Events/AssetCollection/CollectCardToBankAction`)
const buildCollectCardToCollectionAction            = require(`${builderFolder}/Events/AssetCollection/CollectCardToCollectionAction`)
const buildCollectCollectionAction                  = require(`${builderFolder}/Events/AssetCollection/CollectCollectionAction`)

// Swap Property
const buildSwapPropertyAction                       = require(`${builderFolder}/Events/SwapProperty/SwapPropertyAction`)
const buildRespondToPropertySwapAction              = require(`${builderFolder}/Events/SwapProperty/RespondToPropertySwapAction`)

// Steal Property
const buildStealPropertyAction                      = require(`${builderFolder}/Events/StealProperty/StealPropertyAction`)
const buildRespondToStealPropertyAction             = require(`${builderFolder}/Events/StealProperty/RespondToStealPropertyAction`)

// Steal Collection
const buildStealCollectionAction                    = require(`${builderFolder}/Events/StealCollection/StealCollectionAction`)
const buildRespondToStealCollection                 = require(`${builderFolder}/Events/StealCollection/RespondToStealCollection`)
  

module.exports = function ({
  els,
  isDef,
  isDefNested,
  isFunc,
  isArr,
  log,
  getArrFromProp,

  Affected,
  Transaction,
  AddressedResponse,
  KeyedRequest,

  roomManager,

  makeProps,
  makeResponse,
  makeKeyedResponse,
  makePersonSpecificResponses,
  makeConsumerFallbackResponse,
  makeRegularGetKeyed,

  getAllKeyedResponse,
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
})
{
  const commonDeps = {
    // Helpers
    isDef, isArr, isFunc, 
    getArrFromProp, makeProps,
    // Structures
    Affected, 
    Transaction,
    AddressedResponse,
    // Props
    roomManager, 
  }

  class BaseActionProvider
  {
    up(registry)
    {
    }

    down(registry)
    {
      //registry.remove()
    }
  }  
  
  class GameCoreActionProvider
  {
    up(registry)
    {
      registry.public(`GAME.GET_UPDATED_PILES`, (props) => {
        const { roomCode } = props;

        const addressedResponses = new AddressedResponse();
        if (isDef(roomCode)) {
          addressedResponses.addToBucket(
            "default",
            registry.execute('DRAW_PILE.GET', makeProps(props))
          );

          addressedResponses.addToBucket(
            "default",
            registry.execute('DISCARD_PILE.GET', makeProps(props))
          );

          addressedResponses.addToBucket(
            "default",
            registry.execute('ACTIVE_PILE.GET', makeProps(props))
          );
        }
        return addressedResponses;
      })
      registry.public(`GAME.RESET`, (props) => {
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
              registry.execute('PLAYER_REQUESTS.REMOVE_ALL', makeProps(consumerData))
            );
            addressedResponses.addToBucket(
              "everyone",
              registry.execute('REQUESTS.REMOVE_ALL', makeProps(consumerData))
            );

            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          addressedResponses
        );
      })
      registry.public(`GAME.UPDATE_CONFIG`, (props) => {
        const [subject, action] = ["GAME", "UPDATE_CONFIG"];
        let payload = null;
        let status = "failure";
        const addressedResponses = new AddressedResponse();
        return handlePerson(
          props,
          (consumerData, checkpoints) => {
            const { config } = consumerData;
            const { room } = consumerData;

            const game = room.getGame();

            // Only alter config before the game has started
            if (!game.isGameStarted()) {
              if (isDef(config)) {
                status = "success";
                game.updateConfig(config);
              }
            }
            addressedResponses.addToBucket(
              "default",
              registry.execute('GAME.GET_CONFIG', makeProps(consumerData))
            );
            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`GAME.GET_CONFIG`, (props) => {
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
      })
      registry.public(`GAME.STATUS`, (props) => {
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
              })
      registry.public(`GAME.START`, (props) => {
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
                registry.execute('PLAYER_REQUESTS.REMOVE_ALL', makeProps(consumerData))
              );
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('REQUESTS.REMOVE_ALL', makeProps(consumerData))
              );

              addressedResponses.addToBucket(
                "everyone",
                registry.execute('PROPERTY_SETS.GET_ALL_KEYED', makeProps(consumerData))
              );
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('CARDS.GET_ALL_KEYED', makeProps(consumerData))
              );
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('PLAYERS.GET', makeProps(consumerData))
              );
              addressedResponses.addToBucket(
                "default",
                registry.execute('PLAYER_HANDS.GET_KEYED', makeProps(consumerData, specificPropsForEveryone))
              );
              addressedResponses.addToBucket(
                "default",
                registry.execute('PLAYER_BANKS.GET_KEYED', makeProps(consumerData, specificPropsForEveryone))
              );
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('COLLECTIONS.GET_ALL_KEYED', makeProps(consumerData, {peopleIds}))
              );
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('PLAYER_COLLECTIONS.GET_ALL_KEYED', makeProps(consumerData, {peopleIds}))
              );
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('DRAW_PILE.GET', makeProps(consumerData))
              );
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('ACTIVE_PILE.GET', makeProps(consumerData))
              );

              addressedResponses.addToBucket(
                "everyone",
                registry.execute('DISCARD_PILE.GET', makeProps(consumerData))
              );

              addressedResponses.addToBucket(
                "everyone",
                registry.execute('GAME.STATUS', makeProps(consumerData))
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
                registry.execute('PLAYER_TURN.GET', makeProps(consumerData))
              );
            }
            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`GAME.CAN_START`, (props) => {
        // roomCode
        const [subject, action] = ["GAME", "CAN_START"];
        const addressedResponses = new AddressedResponse();
        return handlePerson(
          props,
          (props2) => {
            let { room, personManager } = props2;

            let game = room.getGame();
            let canStart = canGameStart(game, personManager);

            let host = personManager.findPerson(
              (person) => person.hasTag("host")
            );

            let status = "success";
            let payload = {
              value: canStart,
            };
            addressedResponses.addToSpecific(
              host.getClientId(),
              makeResponse({ subject, action, status, payload })
            );
            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
    }

    down(registry)
    {
      registry.remove(`GAME.GET_UPDATED_PILES`)
      registry.remove(`GAME.RESET`)
      registry.remove(`GAME.UPDATE_CONFIG`)
      registry.remove(`GAME.GET_CONFIG`)
      registry.remove(`GAME.STATUS`)
      registry.remove(`GAME.START`)
      registry.remove(`GAME.CAN_START`)
    }
  }

  class TurnBaseActionProvider
  {
    up(registry)
    {
      registry.public(`PLAYER_TURN.GET`, (props) => {
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

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })
      registry.public(`MY_TURN.TURN_STARTING_DRAW`, buildTurnStartingDrawAction({
        ...commonDeps,
        registry,
        AddressedResponse,
        makeConsumerFallbackResponse,
        handleMyTurn,
        makeResponse,
      }))
      registry.public(`MY_TURN.FINISH_TURN`, buildAttemptFinishTurnAction({
        ...commonDeps,
        registry,
        AddressedResponse,
        makeConsumerFallbackResponse,
        handleMyTurn,
        makeResponse,
        makeProps,
      }))
      registry.public(`MY_TURN.DISCARD_REMAINING`, buildDiscardToHandLimitAction({
        ...commonDeps,
        registry,
        AddressedResponse,
        makeConsumerFallbackResponse,
        handleMyTurn,
        makeResponse,
        makeProps,
        els,
      }) )

    }

    down(registry)
    {
      registry.remove(`PLAYER_TURN.GET`)
      registry.remove(`MY_TURN.TURN_STARTING_DRAW`)
      registry.remove(`MY_TURN.FINISH_TURN`)
      registry.remove(`MY_TURN.DISCARD_REMAINING`)
    }
  }  

  class PileActionProvider
  {
    up(registry)
    {
      registry.public(`DISCARD_PILE.GET`, (props) => {
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
      })
      registry.public(`ACTIVE_PILE.GET`, (props) => {
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
      })
      registry.public(`DRAW_PILE.GET`, (props) => {
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
      })
    }

    down(registry)
    {
      registry.remove(`DISCARD_PILE.GET`)
      registry.remove(`ACTIVE_PILE.GET`)
      registry.remove(`DRAW_PILE.GET`)
    }
  }  

  class BankActionProvider
  {
    up(registry)
    {
      registry.public('MY_TURN.ADD_CARD_TO_MY_BANK_FROM_HAND', buildAddCardToBankAction({
          ...commonDeps,
          registry,
          makeConsumerFallbackResponse,
          makeResponse,
          handCardConsumer,
          log,
        })
      )
    }

    down(registry)
    {
      registry.remove('MY_TURN.ADD_CARD_TO_MY_BANK_FROM_HAND')
    }
  }  

  class CollectionFromHandActionProvider
  {
    up(registry)
    {
      // Collection From Hand
      registry.public('MY_TURN.ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND', buildAddPropertyToNewCollectionAction({
        ...commonDeps,
        registry,
        makeConsumerFallbackResponse,
        makeResponse,
        handCardConsumer,
        log,
      })
    )
      registry.public('MY_TURN.ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND', buildAddPropertyToExitingCollectionAction({
          ...commonDeps,
          registry,
          makeConsumerFallbackResponse,
          makeResponse,
          handCardConsumer,
          log,
        })
      )
      registry.public('MY_TURN.ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND', buildAddSetAugmentToExistingCollectionAction({
          ...commonDeps,
          registry,
          makeConsumerFallbackResponse,
          makeResponse,
          handCardConsumer,
        })
      )
      registry.public('MY_TURN.TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND', buildAddSetAugmentToNewCollectionAction({
          ...commonDeps,
          registry,
          makeConsumerFallbackResponse,
          makeResponse,
          handCardConsumer,
          handleMyTurn,
        })
      )

    }

    down(registry)
    {
      registry.remove('MY_TURN.ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND')
      registry.remove('MY_TURN.ADD_PROPERTY_TO_EXISTING_COLLECTION_FROM_HAND')
      registry.remove('MY_TURN.ADD_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_HAND')
      registry.remove('MY_TURN.TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_HAND')
    }
  }  

  class BetweenCollectionActionProvider
  {
    up(registry)
    {
      registry.public('MY_TURN.TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION', buildTransferPropertyToNewCollectionFromExistingAction({
        ...commonDeps,
        registry,
        makeConsumerFallbackResponse,
        makeResponse,
        handCardConsumer,
        handleMyTurn,
      }))
      registry.public('MY_TURN.TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION', buildTransferPropertyToExistingCollectionFromExistingAction({
        ...commonDeps,
        registry,
        makeConsumerFallbackResponse,
        makeResponse,
        handCardConsumer,
        handleMyTurn,
      }))
      registry.public('MY_TURN.TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION', buildTransferSetAugmentToExistingCollectionFromExistingAction({
        ...commonDeps,
        registry,
        makeConsumerFallbackResponse,
        makeResponse,
        handCardConsumer,
        handleMyTurn,
      }))
      registry.public('MY_TURN.TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION', buildTransferSetAugmentToNewCollectionFromExistingAction({
        ...commonDeps,
        registry,
        makeConsumerFallbackResponse,
        makeResponse,
        handCardConsumer,
        handleMyTurn,
      }))
    }

    down(registry)
    {
      registry.remove('MY_TURN.TRANSFER_PROPERTY_TO_NEW_COLLECTION_FROM_COLLECTION')
      registry.remove('MY_TURN.TRANSFER_PROPERTY_TO_EXISTING_COLLECTION_FROM_COLLECTION')
      registry.remove('MY_TURN.TRANSFER_SET_AUGMENT_TO_EXISTING_COLLECTION_FROM_COLLECTION')
      registry.remove('MY_TURN.TRANSFER_SET_AUGMENT_TO_NEW_COLLECTION_FROM_COLLECTION')
    }
  }  

  class RequestCoreActionProvider
  {
    up(registry)
    {
      let requestStuff = makeRegularGetKeyed({
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
      })
      registry.public(`REQUESTS.GET_KEYED`, requestStuff.GET_KEYED);
      registry.public(`REQUESTS.GET_ALL_KEYED`, requestStuff.GET_ALL_KEYED);
      registry.public(`REQUESTS.GET_ALL_MY_KEYED`, requestStuff.GET_ALL_MY_KEYED);
      registry.public(`REQUESTS.REMOVE_KEYED`, requestStuff.REMOVE_KEYED);
      registry.public(`REQUESTS.REMOVE_ALL`, (props) => {
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
      });
    
       // PlayerREquestActions
      registry.public(`PLAYER_REQUESTS.GET_KEYED`, (props) => {
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
      })
      registry.public(`PLAYER_REQUESTS.REMOVE_ALL`, (props) => {
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
      })

    }

    down(registry)
    {
      registry.remove(`REQUESTS.GET_KEYED`)
      registry.remove(`REQUESTS.GET_ALL_KEYED`)
      registry.remove(`REQUESTS.GET_ALL_MY_KEYED`)
      registry.remove(`REQUESTS.REMOVE_KEYED`)
      registry.remove(`REQUESTS.REMOVE_ALL`)

      registry.remove(`PLAYER_REQUESTS.GET_KEYED`)
      registry.remove(`PLAYER_REQUESTS.REMOVE_ALL`)
    }
  }  


  class RequestCounterActionProvider
  {
    up(registry)
    {
      // REACT WITH JUST_SAY_NO
      registry.public(`RESPONSES.RESPOND_TO_JUST_SAY_NO`, buildRespondToJustSayNoAction({
        ...commonDeps,
        registry,
        makeConsumerFallbackResponse,
        makeResponse,
        handleGame, 
        handleTransactionResponse,
      }))
    }

    down(registry)
    {
      registry.remove(`RESPONSES.RESPOND_TO_JUST_SAY_NO`)
    }
  }  

  class ResourceCollectionActionProvider
  {
    up(registry)
    {
      registry.public(`RESPONSES.ACKNOWLEDGE_COLLECT_NOTHING`, buildAcknowledgeCollectNothingAction({
        ...commonDeps,
        registry,
        handleTransactionResponse
      }))
      registry.public(`RESPONSES.COLLECT_CARD_TO_BANK_AUTO`, buildCollectCardToBankAutoAction({
        ...commonDeps,
        registry,
        handleTransferResponse,
      }))
      registry.public(`RESPONSES.COLLECT_CARD_TO_BANK`, buildCollectCardToBankAction({
        ...commonDeps,
        registry,
        handleTransferResponse,
      }) )
      registry.public(`RESPONSES.COLLECT_CARD_TO_COLLECTION`, buildCollectCardToCollectionAction({
        ...commonDeps,
        registry,
        handleTransferResponse,
      }) )
      registry.public(`RESPONSES.COLLECT_COLLECTION`, buildCollectCollectionAction({
        ...commonDeps,
        registry,
        handleTransferResponse
      }) )
    }

    down(registry)
    {
      registry.remove(`RESPONSES.ACKNOWLEDGE_COLLECT_NOTHING`)
      registry.remove(`RESPONSES.COLLECT_CARD_TO_BANK_AUTO`)
      registry.remove(`RESPONSES.COLLECT_CARD_TO_BANK`)
      registry.remove(`RESPONSES.COLLECT_CARD_TO_COLLECTION`)
      registry.remove(`RESPONSES.COLLECT_COLLECTION`)
    }
  }  

  class StealCollectionActionProvider
  {
    up(registry)
    {
      registry.public(`MY_TURN.STEAL_COLLECTION`, buildStealCollectionAction({
        ...commonDeps,
        registry,
        handleRequestCreation,
      }))
      registry.public(`RESPONSES.RESPOND_TO_STEAL_COLLECTION`, buildRespondToStealCollection({
          ...commonDeps,
          registry,
          handleTransactionResponse,
        }))
    }

    down(registry)
    {
      registry.remove(`MY_TURN.STEAL_COLLECTION`)
      registry.remove(`RESPONSES.RESPOND_TO_STEAL_COLLECTION`)
    }
  }  

  class StealPropertyActionProvider
  {
    up(registry)
    {
      registry.public(`MY_TURN.STEAL_PROPERTY`, buildStealPropertyAction({
        ...commonDeps,
        registry,
        handleRequestCreation,
      }))
      registry.public(`RESPONSES.RESPOND_TO_STEAL_PROPERTY`, buildRespondToStealPropertyAction({
        ...commonDeps,
        registry,
        handleTransactionResponse,
      }) )
    }

    down(registry)
    {
      registry.remove(`MY_TURN.STEAL_PROPERTY`)
      registry.remove(`RESPONSES.RESPOND_TO_STEAL_PROPERTY`)
    }
  }  

  class SwapPropertyActionProvider
  {
    up(registry)
    {
      registry.public(`MY_TURN.SWAP_PROPERTY`, buildSwapPropertyAction({
        ...commonDeps,
        registry,
        handleRequestCreation,
      }) )
      registry.public(`RESPONSES.RESPOND_TO_PROPERTY_SWAP`, buildRespondToPropertySwapAction({
        ...commonDeps,
        registry,
        handleTransactionResponse
      }))

    }
    down(registry)
    {
      registry.remove(`MY_TURN.SWAP_PROPERTY`)
      registry.remove(`RESPONSES.RESPOND_TO_PROPERTY_SWAP`)
    }
  }  

  class DrawCardActionProvider
  {
    up(registry)
    {
      registry.public('MY_TURN.PLAY_PASS_GO', buildDrawCardsAction({
        ...commonDeps,
        registry,
        makeConsumerFallbackResponse,
        makeResponse,
        handCardConsumer,
      }))
    }

    down(registry)
    {
      registry.remove('MY_TURN.PLAY_PASS_GO')
    }
  }  

  class CardActionProvider
  {
    up(registry)
    {
      let registerCardMethods = buildRegisterCardMethods({
        registry,
        makeProps,
        AddressedResponse,
        KeyedRequest,
        makeResponse,
        makeKeyedResponse,
        getAllKeyedResponse,
        makeConsumerFallbackResponse,
        handleGame,
      })
      registerCardMethods(registry);
      // Card Manipulation
      registry.public('MY_TURN.CHANGE_CARD_ACTIVE_SET', buildChangeCardActiveSetAction({
        ...commonDeps,
        registry,
        makeResponse,
        handleMyTurn,
        makeConsumerFallbackResponse,
        makeResponse,
      }))
    }

    down(registry)
    {
      registry.remove('MY_TURN.CHANGE_CARD_ACTIVE_SET')
      // @TODO
    }
  }  

  class RequestValueActionProvider
  {
    up(registry)
    {
      // CHARGE RENT
      registry.public('MY_TURN.CHARGE_RENT', buildChargeRentAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          handleGame,
          handleCollectionBasedRequestCreation,
          makeConsumerFallbackResponse,
          registry,
      }))
          
      registry.public('MY_TURN.VALUE_COLLECTION', buildRequestValueAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          handleGame, 
          isDefNested,
          handleRequestCreation,
          registry,
      }))
          
      registry.public('RESPONSES.RESPOND_TO_COLLECT_VALUE', buildRespondToCollectValueAction({
          ...commonDeps,
          makeConsumerFallbackResponse,
          makeResponse,
          handleGame, 
          handleTransactionResponse,
          registry,
      }))
    }

    down(registry)
    {
      registry.remove('MY_TURN.CHARGE_RENT')
      registry.remove('MY_TURN.VALUE_COLLECTION')
      registry.remove('RESPONSES.RESPOND_TO_COLLECT_VALUE')
    }
  }  
  
  class PlayerActionProvider
  {
    up(registry)
    {
      registry.public('PLAYERS.GET', (props) => {
        const [subject, action] = ["PLAYERS", "GET"];
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            let { game } = consumerData;

            let status = "failure";
            let payload = null;
            let playerManager = game.getPlayerManager();
            if (isDef(playerManager)) {
              let allPlayerKeys = playerManager.getAllPlayerKeys();
              if (isArr(allPlayerKeys)) {
                status = "success";
                payload = {
                  order: allPlayerKeys,
                };
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
      });
      registry.public('PLAYERS.PERSON_DREW_CARDS_KEYED', (props) => {
        let subject = "PLAYERS";
        let action = "PERSON_DREW_CARDS_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          ({ cardIds, game, personId }) => {
            // Takes no action

            // Let people know the cards drawn -------------------------
            let status = "failure";
            let payload = null;
            if (isDef(cardIds) && isArr(cardIds)) {
              status = "success";
              payload = {
                count: cardIds.length,
                peopleIds: [personId],
                items: {},
              };
              payload.items[personId] = {
                count: cardIds.length,
                cardIds: cardIds,
                cards: cardIds.map((id) => game.getCard(id)),
              };
            }
            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      },);
      registry.public('PLAYER_HANDS.GET_KEYED', (props) => {
        const [subject, action] = ["PLAYER_HANDS", "GET_KEYED"];
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (props2) => {
            let { game } = props2;
            let getMyData = (ownerPersonId) => {
              let playerHand = game.getPlayerHand(ownerPersonId);
              if (isDef(playerHand)) return playerHand.serialize();
              return null;
            };

            let getOtherData = (ownerPersonId, viewerPersonId = null) => {
              let playerHand = game.getPlayerHand(ownerPersonId);
              let handCount = 0;
              if (isDef(playerHand)) {
                handCount = playerHand.getCount();
              }
              return {
                count: handCount,
              };
            };

            addressedResponses.addToBucket(
              "default",
              makePersonSpecificResponses({
                props: props2,
                getMyData,
                getOtherData,
                subject,
                action,
              })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PLAYER_HANDS.GET_ALL_KEYED', (props) => {
        let subject = "PLAYER_HANDS";
        let action = "GET_ALL_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (props2) => {
            let { game } = props2;

            let peopleIds = game.getAllPlayerKeys().map((person) =>
              person.getId()
            );

            
            addressedResponses.addToBucket(
              "default",
              registry.execute(`${subject}.GET_KEYED`, makeProps(props, {
                ...props2,
                peopleIds,
              }))
            );

            // Confirm
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
      });
      registry.public('PLAYER_BANKS.GET_KEYED', (props) => {
        let subject = "PLAYER_BANKS";
        let action = "GET_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (props2) => {
            let { game } = props2;
            let getBankData = (ownerPersonId) => {
              const playerBank = game.getPlayerBank(ownerPersonId);
              if (isDef(playerBank)) {
                return playerBank.serialize();
              }
              return null;
            };

            addressedResponses.addToBucket(
              "default",
              makePersonSpecificResponses({
                props: props2,
                getMyData: getBankData,
                getOtherData: getBankData,
                subject,
                action,
              })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PLAYER_BANKS.GET_ALL_KEYED', (props) => {
        let subject = "PLAYER_BANKS";
        let action = "GET_ALL_KEYED";
        const addressedResponses = new AddressedResponse();

        console.log('handleGame PLAYER_BANKS  GET_ALL_KEYED')



        return handleGame(
          props,
          (props2) => {
            let { personManager, game } = props2;

            addressedResponses.addToBucket(
              "default",
              makeResponse({
                subject,
                action,
                status: "success",
                payload: null,
              })
            );

            let peopleIds = game.getAllPlayerKeys();
            addressedResponses.addToBucket(
              "default",
              registry.execute(`${subject}.GET_KEYED`, makeProps(props, {
                ...props,
                peopleIds,
              }))
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });

    }

    down(registry)
    {
      registry.remove('PLAYERS.GET')
      registry.remove('PLAYERS.PERSON_DREW_CARDS_KEYED')
      registry.remove('PLAYER_HANDS.GET_KEYED')
      registry.remove('PLAYER_HANDS.GET_ALL_KEYED')
      registry.remove('PLAYER_BANKS.GET_KEYED')
      registry.remove('PLAYER_BANKS.GET_KEYED')
      registry.remove('PLAYER_BANKS.GET_ALL_KEYED')
    }
  }  
  
  class CollectionCoreActionProvider
  {
    up(registry)
    {
      registry.public(`PLAYER_COLLECTIONS.GET_KEYED`, (props) => {
        //props: { roomCode, (peopleIds|personId)}
        let subject = "PLAYER_COLLECTIONS";
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
                .getPlayerManager()
                .getAllCollectionIdsForPlayer(personId);
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
      })
      registry.public(`PLAYER_COLLECTIONS.GET_ALL_KEYED`, (props) => {
        //props: {roomCode}
        let subject = "PLAYER_COLLECTIONS";
        let action = "GET_ALL_KEYED";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            // Config
            let { game, personManager } = consumerData;

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

            let myKeyedRequest = KeyedRequest();
            myKeyedRequest.setAction(action);
            myKeyedRequest.setSubject(subject);
            myKeyedRequest.setPluralKey("peopleIds");
            myKeyedRequest.setSingularKey("personId");
            myKeyedRequest.setProps(consumerData);
            myKeyedRequest.setAllKeysFn(() =>
                game.getAllPlayerKeys()
            );

            // Get data
            addressedResponses.addToBucket(
              "default",
              getAllKeyedResponse(myKeyedRequest)
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      })

      let collectionStuff = makeRegularGetKeyed({
        subject:      "COLLECTIONS",
        singularKey:  "collectionId",
        pluralKey:    "collectionIds",
        makeGetDataFn: ({ game }) => (collectionId) => {
          let result = game.getCollectionManager().getCollection(collectionId);
          if (isDef(result)) {
            return result.serialize();
          }
        },
        makeGetAllKeysFn: ({ game }) => () => {
          return game.getCollectionManager().getAllCollectionIds();
        },
        makeGetAlMyKeysFn: ({ game, thisPersonId }) => () => {
          return game
            .getPlayerManager()
            .getAllCollectionIdsForPlayer(thisPersonId);
        },
      })
      registry.public(`COLLECTIONS.GET_KEYED`,        collectionStuff.GET_KEYED);
      registry.public(`COLLECTIONS.GET_ALL_KEYED`,    collectionStuff.GET_ALL_KEYED);
      registry.public(`COLLECTIONS.GET_ALL_MY_KEYED`, collectionStuff.GET_ALL_MY_KEYED);
      registry.public(`COLLECTIONS.REMOVE_KEYED`,     collectionStuff.REMOVE_KEYED);
    }

    down(registry)
    {
      registry.remove(`PLAYER_COLLECTIONS.GET_KEYED`)
      registry.remove(`PLAYER_COLLECTIONS.GET_ALL_KEYED`)
      registry.remove(`COLLECTIONS.GET_KEYED`)
      registry.remove(`COLLECTIONS.GET_ALL_KEYED`)
      registry.remove(`COLLECTIONS.GET_ALL_MY_KEYED`)
      registry.remove(`COLLECTIONS.REMOVE_KEYED`)
    }
  }  



  class CheatActionProvider
  {
    up(registry)
    {
      registry.public(`CHEAT.DUMP_STATE`, (props) => {
        const [subject, action] = ["CHEAT", "DUMP_STATE"];
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          (consumerData) => {
            let { game } = consumerData;
            if (game.constants.IS_TEST_MODE) {
              
              let status = "success";
              let payload = game.serialize();
  
              // Might as well display to everyone if we are cheating....
              addressedResponses.addToBucket(
                "everyone",
                makeResponse({ subject, action, status, payload })
              );
            }
  
            return addressedResponses;
          }
        );
      })
  
    }

    down(registry)
    {
      registry.remove(`CHEAT.DUMP_STATE`)
    }
  }  



  return class GameActionProvider 
  {
    constructor()
    {
      this.gameCoreActions                = new GameCoreActionProvider()
      this.turnBaseActions                = new TurnBaseActionProvider()
      this.pileActions                    = new PileActionProvider()
      this.bankActions                    = new BankActionProvider()
      this.collectionFromHandActions      = new CollectionFromHandActionProvider()
      this.betweenCollectionActions       = new BetweenCollectionActionProvider()

      this.requestCoreActions             = new RequestCoreActionProvider()
      this.requestCounterActions          = new RequestCounterActionProvider()
      this.resourceCollectionActions      = new ResourceCollectionActionProvider()
      this.stealCollectionActions         = new StealCollectionActionProvider()
      this.stealPropertyActions           = new StealPropertyActionProvider()
      this.swapPropertyActions            = new SwapPropertyActionProvider()
      this.drawCardActions                = new DrawCardActionProvider()
      this.cardActions                    = new CardActionProvider()
      this.requestValueActionProvider     = new RequestValueActionProvider()
      this.playerActionProvider           = new PlayerActionProvider()
      this.collectionCoreActionProvider   = new CollectionCoreActionProvider()
      this.cheatActionProvider            = new CheatActionProvider()
    }
    up(registry)
    {
      this.gameCoreActions.up(registry)

      this.playerActionProvider.up(registry)
      this.pileActions.up(registry)
      this.cardActions.up(registry)

      this.turnBaseActions.up(registry)
      this.bankActions.up(registry)

      this.collectionCoreActionProvider.up(registry)
      this.collectionFromHandActions.up(registry)
      this.betweenCollectionActions.up(registry)
      
      this.drawCardActions.up(registry)

      this.requestCoreActions.up(registry)
      this.requestValueActionProvider.up(registry)
      this.stealCollectionActions.up(registry)
      this.stealPropertyActions.up(registry)
      this.swapPropertyActions.up(registry)
      this.resourceCollectionActions.up(registry)
      this.requestCounterActions.up(registry)

      this.cheatActionProvider.up(registry)
    }
    
    down(registry)
    {
      this.gameCoreActions.up(registry)

      this.playerActionProvider.up(registry)
      this.pileActions.up(registry)
      this.cardActions.up(registry)

      this.turnBaseActions.up(registry)
      this.bankActions.up(registry)

      this.collectionCoreActionProvider.up(registry)
      this.collectionFromHandActions.up(registry)
      this.betweenCollectionActions.up(registry)
      
      this.drawCardActions.up(registry)

      this.requestCoreActions.up(registry)
      this.requestValueActionProvider.up(registry)
      this.stealCollectionActions.up(registry)
      this.stealPropertyActions.up(registry)
      this.swapPropertyActions.up(registry)
      this.resourceCollectionActions.up(registry)
      this.requestCounterActions.up(registry)

      this.cheatActionProvider.up(registry)
    }
  }
}
