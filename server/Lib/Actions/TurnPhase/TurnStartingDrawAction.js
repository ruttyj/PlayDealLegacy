/**
 * TurnStartingDrawAction
 * MY_TURN TURN_STARTING_DRAW
 * const buildTurnStartingDrawAction = require(`${serverFolder}/Lib/Actions/TurnStartingDrawAction`);
 */
function buildTurnStartingDrawAction({
    SocketResponseBuckets,
    PUBLIC_SUBJECTS,
    makeConsumerFallbackResponse,
    handleMyTurn,
    makeResponse,
})
{
    function turnStartingDrawAction(props)
    {
        let subject = "MY_TURN";
        let action = "TURN_STARTING_DRAW";
        const socketResponses = SocketResponseBuckets();
        return handleMyTurn(
          props,
          (props2) => {
            let { roomCode, game, personManager, thisPersonId } = props2;

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
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS.PLAYERS.PERSON_DREW_CARDS_KEYED({
                  roomCode,
                  personId: thisPersonId,
                  cardIds: cardIdsDelta,
                })
              );

              socketResponses.addToBucket(
                "default",
                PUBLIC_SUBJECTS["DRAW_PILE"].GET({ roomCode })
              );

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

              // Confirm this executed
              socketResponses.addToBucket(
                "default",
                makeResponse({
                  subject,
                  action,
                  status: "success",
                  payload: null,
                })
              );

              // Update current turn state
              socketResponses.addToBucket(
                "everyone",
                PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
              );
              //___________________________________________________________________________
            }

            return socketResponses;
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
    }
    return turnStartingDrawAction;
}

module.exports = buildTurnStartingDrawAction;
