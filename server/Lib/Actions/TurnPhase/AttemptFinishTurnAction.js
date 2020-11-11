/**
 * FINISH_TURN
 * @SEARCH_REPLACE : AttemptFinishTurnAction | attemptFinishTurnAction
 * const buildAttemptFinishTurnAction = require(`${serverFolder}/Lib/Actions/AttemptFinishTurnAction`);
 */
function buildAttemptFinishTurnAction({
    SocketResponseBuckets,
    PUBLIC_SUBJECTS,
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
        const socketResponses = new SocketResponseBuckets();

        return handleMyTurn(
          props,
          (consumerData) => {
            let {
              game,
              hand,
              currentTurn,
              roomCode,
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
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(
                  makeProps(consumerData)
                )
              );
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData))
              );
              game.nextPlayerTurn();
              status = "success";
            }

            socketResponses.addToBucket(
              "everyone",
              PUBLIC_SUBJECTS.PLAYER_REQUESTS.REMOVE_ALL(
                makeProps(consumerData)
              )
            );
            socketResponses.addToBucket(
              "everyone",
              PUBLIC_SUBJECTS.REQUESTS.REMOVE_ALL(makeProps(consumerData))
            );

            //-------------------------------------------------------

            //                        Response

            //-------------------------------------------------------
            // Confirm action
            let payload = null;

            // Emit updated player turn
            socketResponses.addToBucket(
              "everyone",
              PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
            );

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

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
    }
    return attemptFinishTurnAction;
}

module.exports = buildAttemptFinishTurnAction;
