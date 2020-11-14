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
            let room = roomManager.getRoomByCode(roomCode);
            if (isDef(room)) {
                let personManager = room.getPersonManager();
                if (isDef(personManager)) {
                    let myClientId = thisClientKey;
                    let person = personManager.getPersonByClientId(myClientId);
                    let newProps = {
                        ...props,
                        roomCode,
                        thisClientKey: `${props.thisClientKey}`,
                        thisRoomCode: roomCode,
                        room,
                        thisRoom: room,
                        personManager,
                    };
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
                            responses.reduce(myClientId, clientIds)
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