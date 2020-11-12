function buildLeaveRoom({
    makeProps,
    isDef,
    AddressedResponse,
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
        const addressedResponses = new AddressedResponse();

        let status = "failure";
        return handleRoom(
            props,
            ({ roomCode, room, personManager, thisPerson, thisPersonId }) => {
            if (isDef(thisPerson)) {
                status = "success";
                let payload = {
                personId: thisPerson.getId(),
                };
                addressedResponses.addToBucket(
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
                addressedResponses.addToBucket(
                    "everyoneElse",
                    PUBLIC_SUBJECTS.PEOPLE.GET_KEYED(makeProps(props, {
                        personId: thisPersonId,
                    }))
                );

                addressedResponses.addToBucket(
                    "default",
                    PRIVATE_SUBJECTS.PEOPLE.DISCONNECT(makeProps(props, {
                        personId: thisPerson.getId(),
                    }))
                );
                } else {
                if (thisPerson.hasTag("host")) {
                    let otherPeople = personManager.getOtherConnectedPeople(
                    thisPerson
                    );
                    if (isDef(otherPeople[0])) {
                    addressedResponses.addToBucket(
                        "everyone",
                        PUBLIC_SUBJECTS.PEOPLE.SET_HOST(makeProps(props, {
                            personId: otherPeople[0].getId(),
                        }))
                    );
                    } else {
                    //@TODO no one left in room
                    }
                }

                // Remove person from room
                addressedResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS.PEOPLE.REMOVE(makeProps(props, {
                        personId: thisPerson.getId(),
                    }))
                );
                }
            }

            return addressedResponses;
            },
            makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    
    }
    return leaveRoom;
}

module.exports = buildLeaveRoom;
