/**
 * FINISH_TURN
 * @SEARCH_REPLACE : AttemptFinishTurnAction | attemptFinishTurnAction
 * const buildAttemptFinishTurnAction = require(`${serverFolder}/Lib/Actions/AttemptFinishTurnAction`);
 */
function buildAttemptFinishTurnAction({
    AddressedResponse,
    registry,
    makeProps,
    makeConsumerFallbackResponse,
    handleMyTurn,
    makeResponse,
})
{
    function attemptFinishTurnAction(props)
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
                "everyone",
                registry.execute('PLAYER_REQUESTS.REMOVE_ALL', makeProps(consumerData))
              );
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('REQUESTS.REMOVE_ALL', makeProps(consumerData))
              );
              game.nextPlayerTurn();
              status = "success";
            }

            addressedResponses.addToBucket(
              "everyone",
              registry.execute('PLAYER_REQUESTS.REMOVE_ALL', makeProps(consumerData))
            );
            addressedResponses.addToBucket(
              "everyone",
              registry.execute('REQUESTS.REMOVE_ALL', makeProps(consumerData))
            );

            //-------------------------------------------------------

            //                        Response

            //-------------------------------------------------------
            // Confirm action
            let payload = null;

            // Emit updated player turn
            addressedResponses.addToBucket(
              "everyone",
              registry.execute('PLAYER_TURN.GET', makeProps(props))
            );

            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              addressedResponses.addToBucket(
                "everyone",
                registry.execute('GAME.STATUS', makeProps(props))
              );
            }

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    }
    return attemptFinishTurnAction;
}

module.exports = buildAttemptFinishTurnAction;
