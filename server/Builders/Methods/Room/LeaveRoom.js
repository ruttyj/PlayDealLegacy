module.exports = function({
    makeProps,
    isDef,
    AddressedResponse,
    registry,
    makeResponse,
    makeConsumerFallbackResponse,
    handleRoom,
})
{
    return function (props)
    {
        const [subject, action] = ["ROOM", "LEAVE"];
        const addressedResponses = new AddressedResponse();

        let status = "failure";
        return handleRoom(
            props,
            ({ room, personManager, thisPerson, thisPersonId, roomManager }) => {
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
                            registry.execute('PEOPLE.GET_KEYED', makeProps(props, {
                                personId: thisPersonId,
                            }))
                        );

                        addressedResponses.addToBucket(
                            "default",
                            registry.execute('PEOPLE.DISCONNECT', makeProps(props, {
                                personId: thisPerson.getId(),
                            }))
                        );
                    } else {
                        let otherPeople = personManager.getOtherConnectedPeople(thisPerson);

                        if (isDef(otherPeople[0])) {
                            if (thisPerson.hasTag("host")) {
                                addressedResponses.addToBucket(
                                    "everyone",
                                    registry.execute('PEOPLE.SET_HOST', makeProps(props, {
                                        personId: otherPeople[0].getId(),
                                    }))
                                );
                            }
                        } else {
                            console.log('#### DELETE ROOM no one else here');
                            roomManager.deleteRoom(room.getId())
                        }


                        // Remove person from room
                        addressedResponses.addToBucket(
                            "everyone",
                            registry.execute('PEOPLE.REMOVE', makeProps(props, {
                                personId: thisPersonId,
                            }))
                        );
                    }
                }

                return addressedResponses;
            },
            makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    
    }
}