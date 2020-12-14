function buildDrawCardsAction({
    makeProps,
    makeConsumerFallbackResponse,
    makeResponse,
    registry,
    handCardConsumer,
    AddressedResponse,
})
{
    return function (props)
    {
        let subject = "MY_TURN";
        let action = "PLAY_PASS_GO";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        let payload = null;
        return handCardConsumer(
          props,
          (props2) => {
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

            if (currentTurn.getPhaseKey() === "action") {
              // CARD IS PASS GO
              if (card.type === "action" && card.class === "draw") {
                let drawQty = card.drawCards.amount;

                if (game.getCurrentTurn().isWithinActionLimit()) {

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
                    registry.execute('GAME.GET_UPDATED_PILES', makeProps(props))
                  );

                  // Cards Drawn
                  addressedResponses.addToBucket(
                    "everyone",
                    registry.execute('PLAYERS.PERSON_DREW_CARDS_KEYED', makeProps(props, {
                      personId: thisPersonId,
                      cardIds: cardIdsDelta,
                    }))
                  );

                  // Update everyone with my new hand
                  let allPlayerIds = game.getAllPlayerKeys();
                  addressedResponses.addToBucket(
                    "default",
                    registry.execute('PLAYER_HANDS.GET_KEYED', makeProps(props, {
                      personId: thisPersonId,
                      receivingPeopleIds: allPlayerIds,
                    }))
                  );

                  addressedResponses.addToBucket(
                    "default",
                    makeResponse({ subject, action, status, payload })
                  );

                  
                  addressedResponses.addToBucket(
                    "everyone",
                    registry.execute('PLAYER_TURN.GET', makeProps(props))
                  );

                  
                  //registry.execute('PLAYER_TURN.GET', request, response)


                  if (game.checkWinConditionForPlayer(thisPersonId)) {
                    addressedResponses.addToBucket(
                      "everyone",
                      registry.execute('GAME.STATUS', makeProps(props))
                    );
                  }

                  return addressedResponses;
                }
              }
            }

            // confirm action for async await
            payload = {
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
}

module.exports = buildDrawCardsAction;
