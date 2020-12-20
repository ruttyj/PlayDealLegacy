function buildAttemptFinishTurnAction({
    AddressedResponse,
    makeProps,
    makeConsumerFallbackResponse,
    handleMyTurn,
    makeResponse,
})
{
  return function (props)
  {
      let subject = "MY_TURN";
      let action = "FINISH_TURN";
      const addressedResponses = new AddressedResponse();

      return handleMyTurn(
        props,
        (consumerData) => {
          let {
            game,
            hand,
            currentTurn,
            thisPersonId,
            actionRegistry,
          } = consumerData;
          let status = "failure";
          //-------------------------------------------------------

          //                       Game logic

          //-------------------------------------------------------
          if (currentTurn.getPhaseKey() === "draw") {
            status = "draw";
          }

          if (currentTurn.getPhaseKey() === "action") {
            currentTurn.proceedToNextPhase(true);
          }

          if (currentTurn.getPhaseKey() === "discard") {
            let remaining = hand.getCount() - game.getHandMaxCardCount();
            //Have person discard extra cards
            if (remaining > 0) {
              currentTurn.setPhaseData({
                remainingCountToDiscard: remaining,
              });
            } else {
              // Cards have been discarded
              currentTurn.proceedToNextPhase(true);
              currentTurn.removePhaseData();
            }
          }

          if (currentTurn.getPhaseKey() === "done") {
            addressedResponses.addToBucket(
              AddressedResponse.EVERYONE_BUCKET,
              actionRegistry.execute('PLAYER_REQUESTS.REMOVE_ALL', makeProps(consumerData))
            );
            addressedResponses.addToBucket(
              AddressedResponse.EVERYONE_BUCKET,
              actionRegistry.execute('REQUESTS.REMOVE_ALL', makeProps(consumerData))
            );
            game.nextPlayerTurn();
            status = "success";
          }

          addressedResponses.addToBucket(
            AddressedResponse.EVERYONE_BUCKET,
            actionRegistry.execute('PLAYER_REQUESTS.REMOVE_ALL', makeProps(consumerData))
          );
          addressedResponses.addToBucket(
            AddressedResponse.EVERYONE_BUCKET,
            actionRegistry.execute('REQUESTS.REMOVE_ALL', makeProps(consumerData))
          );

          //-------------------------------------------------------

          //                        Response

          //-------------------------------------------------------
          // Confirm action
          let payload = null;

          // Emit updated player turn
          addressedResponses.addToBucket(
            AddressedResponse.EVERYONE_BUCKET,
            actionRegistry.execute('PLAYER_TURN.GET', makeProps(props))
          );

          addressedResponses.addToBucket(
            AddressedResponse.DEFAULT_BUCKET,
            makeResponse({ subject, action, status, payload })
          );

          if (game.checkWinConditionForPlayer(thisPersonId)) {
            addressedResponses.addToBucket(
              AddressedResponse.EVERYONE_BUCKET,
              actionRegistry.execute('GAME.STATUS', makeProps(props))
            );
          }

          return addressedResponses;
        },
        makeConsumerFallbackResponse({ subject, action, addressedResponses })
      );
  }
}

module.exports = buildAttemptFinishTurnAction;
