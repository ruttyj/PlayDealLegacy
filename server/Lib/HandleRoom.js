function buildHandleRoom({
    isDef,
    isFunc,
    SocketResponseBuckets,
    mStrThisClientId,
    roomManager,
})
{
    return function (props, fn, fallback = undefined) {
        let { roomCode } = props;
        // define which points were reached before failure
        let checkpoints = new Map();
        checkpoints.set("roomCode", false);
        checkpoints.set("room", false);
        checkpoints.set("personManager", false);

        let reducedResponses = SocketResponseBuckets();
        let responses = null;

        if (isDef(roomCode)) {
            checkpoints.set("roomCode", true);
            let room = roomManager.getRoomByCode(roomCode);
            if (isDef(room)) {
            checkpoints.set("room", true);
            let personManager = room.getPersonManager();
            if (isDef(personManager)) {
                checkpoints.set("personManager", true);

                let myClientId = mStrThisClientId;
                let person = personManager.getPersonByClientId(myClientId);

                let newProps = {
                ...props,
                roomCode,
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

module.exports = buildHandleRoom;
