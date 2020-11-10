/**
 * @SEARCH_REPLACE Player
 * Provides methods for a socket to be able to listen with
 * const buildRegisterPlayerMethods = require(`${serverFolder}/Lib/Player/`);
 */
function buildRegisterPlayerMethods({
    isDef,
    isArr,
    SocketResponseBuckets,
    PUBLIC_SUBJECTS,
    makeResponse,
    getAllPlayers,
    makePersonSpecificResponses,
    makeConsumerFallbackResponse,
    handleGame,
})
{
    function registerPlayerMethods(registry)
    {
        Object.assign(PUBLIC_SUBJECTS, {
            PLAYERS: {
              GET: (props) => {
                const [subject, action] = ["PLAYERS", "GET"];
                const socketResponses = SocketResponseBuckets();
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
        
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              PERSON_DREW_CARDS_KEYED: (props) => {
                let subject = "PLAYERS";
                let action = "PERSON_DREW_CARDS_KEYED";
                const socketResponses = SocketResponseBuckets();
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
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              }, // end PLAYERS.PERSON_DREW_CARDS_KEYED
            },
            
            PLAYER_HANDS: {
              /**
               * GET PLAYER HAND
               * The information will be tailored for each recipient.
               *
               * @param.props[receivingPeopleIds|receivingPersonId] {array|string}   People who will receive the information
               * @param.props[peopleIds|personId] {array|string}                     The players who's information changed - assumed this person by default
               */
              // props = {roomCode, personId, (receivingPeopleIds|receivingPersonId), (peopleIds|personId)}
              GET_KEYED: (props) => {
                const [subject, action] = ["PLAYER_HANDS", "GET_KEYED"];
                const socketResponses = SocketResponseBuckets();
        
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
        
                    socketResponses.addToBucket(
                      "default",
                      makePersonSpecificResponses({
                        props: props2,
                        getMyData,
                        getOtherData,
                        subject,
                        action,
                      })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              GET_ALL_KEYED: (props) => {
                let subject = "PLAYER_HANDS";
                let action = "GET_ALL_KEYED";
                const socketResponses = SocketResponseBuckets();
                return handleGame(
                  props,
                  (props2) => {
                    let { personManager, game } = props2;
        
                    let peopleIds = getAllPlayers(game, personManager).map((person) =>
                      person.getId()
                    );
        
                    socketResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS[subject].GET_KEYED({
                        ...props2,
                        peopleIds,
                      })
                    );
        
                    // Confirm
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({
                        subject,
                        action,
                        status: "success",
                        payload: null,
                      })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
            },
            PLAYER_BANKS: {
              GET_KEYED: (props) => {
                let subject = "PLAYER_BANKS";
                let action = "GET_KEYED";
                const socketResponses = SocketResponseBuckets();
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
        
                    socketResponses.addToBucket(
                      "default",
                      makePersonSpecificResponses({
                        props: props2,
                        getMyData: getBankData,
                        getOtherData: getBankData,
                        subject,
                        action,
                      })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              GET_ALL_KEYED: (props) => {
                let subject = "PLAYER_BANKS";
                let action = "GET_ALL_KEYED";
                const socketResponses = SocketResponseBuckets();
                return handleGame(
                  props,
                  (props2) => {
                    let { personManager, game } = props2;
        
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({
                        subject,
                        action,
                        status: "success",
                        payload: null,
                      })
                    );
        
                    let peopleIds = getAllPlayers(game, personManager).map((person) =>
                      person.getId()
                    );
                    socketResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS[subject].GET_KEYED({
                        ...props,
                        peopleIds,
                      })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
            },
          })
    }
    return registerPlayerMethods;
}

module.exports = buildRegisterPlayerMethods;
