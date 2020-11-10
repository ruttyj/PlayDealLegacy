/**
 * GET_KEYED
 * LeaveRoom
 * @SEARCH_REPLACE : LeaveRoom | leaveRoom
 * const buildLeaveRoom = require(`${serverFolder}/Lib/Room/LeaveRoom`);
 */
function buildLeaveRoom({
    isDef,
    SocketResponseBuckets,
    PUBLIC_SUBJECTS,
    PRIVATE_SUBJECTS,
    makeResponse,
    makeConsumerFallbackResponse,
    handleRoom,
})
{
    function leaveRoom(props)
    {
       
        const [subject, action] = ["ROOM", "LEAVE"];
        const socketResponses = SocketResponseBuckets();

        let status = "failure";
        return handleRoom(
            props,
            ({ roomCode, room, personManager, thisPerson, thisPersonId }) => {
            if (isDef(thisPerson)) {
                status = "success";
                let payload = {
                personId: thisPerson.getId(),
                };
                socketResponses.addToBucket(
                "everyone",
                makeResponse({
                    subject,
                    action,
                    status,
                    payload,
                })
                );

                let reconnectAllowed = false;

                let game = room.getGame();
                if (isDef(game)) {
                let playerManager = game.getPlayerManager();
                // game is in process
                if (game.isGameStarted() && !game.isGameOver()) {
                    reconnectAllowed = true;
                }

                if (reconnectAllowed) {
                    if (playerManager.hasPlayer(thisPersonId)) {
                    reconnectAllowed = true;
                    } else {
                    reconnectAllowed = false;
                    }
                }
                }

                if (reconnectAllowed) {
                socketResponses.addToBucket(
                    "everyoneElse",
                    PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                    personId: thisPersonId,
                    roomCode,
                    })
                );

                socketResponses.addToBucket(
                    "default",
                    PRIVATE_SUBJECTS.PEOPLE.DISCONNECT({
                    roomCode,
                    personId: thisPerson.getId(),
                    })
                );
                } else {
                if (thisPerson.hasTag("host")) {
                    let otherPeople = personManager.getOtherConnectedPeople(
                    thisPerson
                    );
                    if (isDef(otherPeople[0])) {
                    socketResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.PEOPLE.SET_HOST({
                        roomCode,
                        personId: otherPeople[0].getId(),
                        })
                    );
                    } else {
                    //@TODO no one left in room
                    }
                }

                // Remove person from room
                socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS.PEOPLE.REMOVE({
                    roomCode,
                    personId: thisPerson.getId(),
                    })
                );
                }
            }

            return socketResponses;
            },
            makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
    
    }
    return leaveRoom;
}

module.exports = buildLeaveRoom;
