/**
 * AddCardToBankAction
 * ADD_CARD_TO_MY_BANK_FROM_HAND
 * @SEARCH_REPLACE : AddCardToBankAction | addCardToBankAction
 * const buildAddCardToBankAction = require(`${serverFolder}/Lib/Actions/AddCardToBankAction`);
 */
function buildAddCardToBankAction({
    makeConsumerFallbackResponse,
    PUBLIC_SUBJECTS,
    makeResponse,
    packageCheckpoints,
    isDef,
    handCardConsumer,
    AddressedResponse,
    log,
})
{
    function addCardToBankAction(props)
    {

        let subject = "MY_TURN";
        let action = "ADD_CARD_TO_MY_BANK_FROM_HAND";
        const socketResponses = new AddressedResponse();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            checkpoints.set("isActionPhase", false);
            checkpoints.set("isCardInHand", false);
            checkpoints.set("cardCanBeAddedToBank", false);

            let { cardId } = props2;
            let { hand, roomCode, game, personManager, thisPersonId } = props2;
            if (game.getCurrentTurn().getPhaseKey() === "action") {
              checkpoints.set("isActionPhase", true);

              let card = hand.getCardById(cardId);
              if (isDef(card)) {
                checkpoints.set("isCardInHand", true);

                checkpoints.set("isWithinActionLimit", false);
                if (game.getCurrentTurn().isWithinActionLimit()) {
                  checkpoints.set("isWithinActionLimit", true);

                  if (game.canCardBeAddedToBank(card)) {
                    checkpoints.set("cardCanBeAddedToBank", true);

                    let isWildCard = game.doesCardHaveTag(card, "wild");

                    let bank = game.getPlayerBank(thisPersonId);
                    let hand = game.getPlayerHand(thisPersonId);
                    bank.addCard(hand.giveCard(cardId));
                    game.getCurrentTurn().setActionPreformed("BANK", card);

                    status = "success";

                    //PLAYER_HANDS
                    // Update everyone with my new hand
                    let allPlayerIds = game.getAllPlayerKeys();
                    socketResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                        roomCode,
                        personId: thisPersonId,
                        receivingPeopleIds: allPlayerIds,
                      })
                    );
                    //PLAYER_BANKS
                    socketResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS["PLAYER_BANKS"].GET_KEYED({
                        roomCode,
                        personId: thisPersonId,
                        receivingPeopleIds: allPlayerIds,
                      })
                    );

                    //PLAYER_TURN
                    // Update current turn state
                    socketResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                    );

                    // Wildcard could be any set, let other know
                    if (isWildCard) {
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.CARDS.GET_KEYED({ roomCode, cardId })
                      );
                    }

                    //ADD_CARD_TO_MY_BANK_FROM_HAND
                    // Confirm this executed
                    let payload = {
                      checkpoints: packageCheckpoints(checkpoints),
                    };
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );

                    if (game.checkWinConditionForPlayer(thisPersonId)) {
                      socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
                      );
                    }
                  } else {
                    log("!canCardBeAddedToBank");
                  }
                }
              }
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      
    }
    return addCardToBankAction;
}

module.exports = buildAddCardToBankAction;










