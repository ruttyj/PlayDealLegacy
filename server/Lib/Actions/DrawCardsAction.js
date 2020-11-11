/**
 * PLAY_PASS_GO
 * DrawCardsAction
 * const buildDrawCardsAction = require(`${serverFolder}/Lib/Actions/DrawCardsAction`);
 */
function buildDrawCardsAction({
    makeConsumerFallbackResponse,
    makeResponse,
    PUBLIC_SUBJECTS,
    handCardConsumer,
    AddressedResponse,
})
{
    function drawCardsAction(props)
    {

        let subject = "MY_TURN";
        let action = "PLAY_PASS_GO";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        let payload = null;
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              cardId,
              hand,
              card,
              roomCode,
              game,
              personManager,
              currentTurn,
              thisPersonId,
            } = props2;
            checkpoints.set("isActionPhase", false);
            checkpoints.set("isDrawCard", false);
            checkpoints.set("canPlayCard", false);

            if (currentTurn.getPhaseKey() === "action") {
              checkpoints.set("isActionPhase", true);
              // CARD IS PASS GO
              if (card.type === "action" && card.class === "draw") {
                checkpoints.set("isDrawCard", true);
                let drawQty = card.drawCards.amount;

                if (game.getCurrentTurn().isWithinActionLimit()) {
                  checkpoints.set("canPlayCard", true);

                  let handBefore = game.getPlayerHand(thisPersonId).serialize();

                  let activePile = game.getActivePile();
                  activePile.addCard(hand.giveCard(card));
                  game.drawNCards(thisPersonId, drawQty);

                  // update action state after action preformed
                  currentTurn.setActionPreformed("DRAW_CARDS", card);
                  status = "success";
                  let handAfter = game.getPlayerHand(thisPersonId).serialize();

                  let cardIdsBefore = handBefore.cardIds;
                  let cardIdsAfter = handAfter.cardIds;
                  let cardIdsDelta = cardIdsAfter.filter(
                    (n) => !cardIdsBefore.includes(n)
                  );

                  // Let people know ---------------------------------------------------------

                  // updated card piles
                  addressedResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS["GAME"].GET_UPDATED_PILES({ roomCode })
                  );

                  // Cards Drawn
                  addressedResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS.PLAYERS.PERSON_DREW_CARDS_KEYED({
                      roomCode,
                      personId: thisPersonId,
                      cardIds: cardIdsDelta,
                    })
                  );

                  // Update everyone with my new hand
                  let allPlayerIds = game.getAllPlayerKeys();
                  addressedResponses.addToBucket(
                    "default",
                    PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                      roomCode,
                      personId: thisPersonId,
                      receivingPeopleIds: allPlayerIds,
                    })
                  );

                  addressedResponses.addToBucket(
                    "default",
                    makeResponse({ subject, action, status, payload })
                  );

                  // update player turn - must be last
                  addressedResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
                  );

                  if (game.checkWinConditionForPlayer(thisPersonId)) {
                    addressedResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
                    );
                  }

                  return addressedResponses;
                }
              }
            }

            // confirm action for async await
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
    return drawCardsAction;
}

module.exports = buildDrawCardsAction;
