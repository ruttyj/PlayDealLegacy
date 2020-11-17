module.exports = function({
    isDef,
    isFunc,
    AddressedResponse,
    roomManager,
})
{
    return function (props, fn, fallback = undefined) {
        let { roomCode, thisClientKey } = props;
        let checkpoints = new Map();
        let reducedResponses = new AddressedResponse();
        let responses = null;

        if (isDef(roomCode)) {
            let room = roomManager.getRoom(roomCode);
            if (isDef(room)) {
                let personManager = room.getPersonManager();
                if (isDef(personManager)) {
                    let newProps = {
                        ...props,
                        thisClientKey: `${props.thisClientKey}`,

                        roomCode,
                        thisRoomCode: roomCode,
                        roomManager,
                        room,
                        thisRoom: room,

                        personManager,
                    };
                    let person = personManager.getPersonByClientId(thisClientKey);
                    if (isDef(person)) {
                        Object.assign(newProps, {
                            person,
                            thisPersonId: person.getId(),
                            thisPerson: person,
                        });
                    }
                    responses = fn(newProps, checkpoints);
                    if (isDef(responses)) {
                        let clientPersonMapping = {};
                        personManager.getConnectedPeople().forEach((person) => {
                            clientPersonMapping[String(person.getClientId())] = true;
                        });
                        let clientIds = Object.keys(clientPersonMapping);
                        reducedResponses.addToBucket(
                            responses.reduce(thisClientKey, clientIds)
                        );
                    }
                    return responses;
                }
            }
        }
        if (!isDef(responses) && isFunc(fallback)) {
            return fallback(checkpoints);
        }
        return fallback;
    }
}