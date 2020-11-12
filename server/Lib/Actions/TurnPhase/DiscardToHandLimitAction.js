
/**
 * DISCARD_REMAINING
 * DiscardToHandLimitAction
 * const buildDiscardToHandLimitAction = require(`${serverFolder}/Lib/Actions/DiscardToHandLimitAction`);
 */
function buildDiscardToHandLimitAction({
    makeProps,
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
        const addressedResponses = new AddressedResponse();
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
              addressedResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.CARDS.GET_KEYED(makeProps(props, {
                  cardId: wildCardIds,
                }))
              );
            }

            // Update everyone with my new hand
            let allPlayerIds = game.getAllPlayerKeys();
            addressedResponses.addToBucket(
              "default",
              PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED(makeProps(props, {
                roomCode,
                personId: thisPersonId,
                receivingPeopleIds: allPlayerIds,
              }))
            );
            addressedResponses.addToBucket(
              "everyone",
              makeResponse({ subject, action, status, payload })
            );
            addressedResponses.addToBucket(
              "everyone",
              PUBLIC_SUBJECTS["DISCARD_PILE"].GET(makeProps(props))
            );
            addressedResponses.addToBucket(
              "everyone",
              PUBLIC_SUBJECTS["PLAYER_TURN"].GET(makeProps(props))
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              addressedResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.GAME.STATUS(makeProps(props))
              );
            }

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      
    }
    return discardToHandLimitAction;
}

module.exports = buildDiscardToHandLimitAction;
