function buildTurnStartingDrawAction({
    makeProps,
    AddressedResponse,
    
    makeConsumerFallbackResponse,
    handleMyTurn,
    makeResponse,
})
{
    return function (props)
    {
        let subject = "MY_TURN";
        let action = "TURN_STARTING_DRAW";
        const addressedResponses = new AddressedResponse();
        return handleMyTurn(
          props,
          (props2) => {
            let { roomCode, game, thisPersonId, actionRegistry } = props2;

            if (game.getCurrentTurn().canDrawTurnStartingCards()) {
              // Draw Card from deck ------------------------------------

              // Get hand before
              let handBefore = game.getPlayerHand(thisPersonId).serialize();

              // Draw cards
              game.playerTurnStartingDraw(thisPersonId);

              // Get hand after
              let handAfter = game.getPlayerHand(thisPersonId).serialize();

              let cardIdsBefore = handBefore.cardIds;
              let cardIdsAfter = handAfter.cardIds;
              let cardIdsDelta = cardIdsAfter.filter(
                (n) => !cardIdsBefore.includes(n)
              );

              // Let people know --------------------------------------------------------
              addressedResponses.addToBucket(
                AddressedResponse.EVERYONE_BUCKET,
                actionRegistry.execute('PLAYERS.PERSON_DREW_CARDS_KEYED', makeProps(props, {
                  personId: thisPersonId,
                  cardIds: cardIdsDelta,
                }))
              );

              addressedResponses.addToBucket(
                AddressedResponse.DEFAULT_BUCKET,
                actionRegistry.execute('DRAW_PILE.GET', makeProps(props))
              );

              // Update everyone with my new hand
              let allPlayerIds = game.getAllPlayerKeys();
              addressedResponses.addToBucket(
                AddressedResponse.DEFAULT_BUCKET,
                actionRegistry.execute('PLAYER_HANDS.GET_KEYED', makeProps(props, {
                  roomCode,
                  personId: thisPersonId,
                  receivingPeopleIds: allPlayerIds,
                }))
              );

              // Confirm this executed
              addressedResponses.addToBucket(
                AddressedResponse.DEFAULT_BUCKET,
                makeResponse({
                  subject,
                  action,
                  status: "success",
                  payload: null,
                })
              );

              // Update current turn state
              addressedResponses.addToBucket(
                AddressedResponse.EVERYONE_BUCKET,
                actionRegistry.execute('PLAYER_TURN.GET', makeProps(props))
              );
              //___________________________________________________________________________
            }

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    }
}

module.exports = buildTurnStartingDrawAction;
