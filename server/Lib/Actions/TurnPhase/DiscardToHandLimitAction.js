
/**
 * DISCARD_REMAINING
 * DiscardToHandLimitAction
 * const buildDiscardToHandLimitAction = require(`${serverFolder}/Lib/Actions/DiscardToHandLimitAction`);
 */
function buildDiscardToHandLimitAction({
    els, isDef,
    AddressedResponse,
    PUBLIC_SUBJECTS,
    makeConsumerFallbackResponse,
    handleMyTurn,
    makeResponse,
})
{
    function discardToHandLimitAction(props)
    {
        let subject = "MY_TURN";
        let action = "DISCARD_REMAINING";
        const socketResponses = new AddressedResponse();
        return handleMyTurn(
          props,
          (props2) => {
            let status = "failure";
            let {
              cardIds,
              game,
              personManager,
              hand,
              currentTurn,
              roomCode,
              thisPersonId,
            } = props2;
            cardIds = els(cardIds, []);

            // Limit the number of cards one can discard
            let hasWildCard = false;
            let wildCardIds = [];
            let temp = [];
            let remainingCountToDiscard =
              hand.getCount() - game.getHandMaxCardCount();
            if (remainingCountToDiscard > 0) {
              for (let i = 0; i < remainingCountToDiscard; ++i) {
                if (isDef(cardIds[i])) {
                  temp.push(cardIds[i]);
                  if (game.doesCardHaveTag(cardIds[i], "wild")) {
                    wildCardIds.push(cardIds[i]);
                    hasWildCard = true;
                  }
                }
              }
            }
            cardIds = temp;

            // Transfer the specified cards to the discard pile
            let giveCards = hand.giveCardsById(cardIds);
            game.getDiscardPile().addCards(giveCards);

            //@TODO repeated code which could be cleaned with PLAYER_TURN.GET
            remainingCountToDiscard =
              hand.getCount() - game.getHandMaxCardCount();

            let payload = null;
            // still remaining cards
            if (remainingCountToDiscard > 0) {
              status = "discard";
              // might be redundant including this data - may be used to trigger animations- undecided
              payload = {
                remainingCountToDiscard,
              };
              //--------------------------------------------------------------------------------------
            } else {
              // Discarded everything required
              status = "success";

              currentTurn.proceedToNextPhase(true);
              currentTurn.removePhaseData();
            }

            if (hasWildCard) {
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.CARDS.GET_KEYED({
                  roomCode,
                  cardId: wildCardIds,
                })
              );
            }

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
            socketResponses.addToBucket(
              "everyone",
              makeResponse({ subject, action, status, payload })
            );
            socketResponses.addToBucket(
              "everyone",
              PUBLIC_SUBJECTS["DISCARD_PILE"].GET({ roomCode })
            );
            socketResponses.addToBucket(
              "everyone",
              PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
              );
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      
    }
    return discardToHandLimitAction;
}

module.exports = buildDiscardToHandLimitAction;
