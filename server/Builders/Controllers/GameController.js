function buildGameController({
    makeResponse,
    AddressedResponse,
})
{
    class GameController 
    {
        _canGameStart(game, personManager)
        {
            // Are there enough people to play?
            let readyPeople = personManager.filterPeople(
                (person) => (person.isConnected() && person.getStatus() === "ready")
            );
            let isAcceptablePlayerCount = game.isAcceptablePlayerCount(readyPeople.length)

            // Does everyone have an acceptable status?
            let acceptableStatuses = ["ready"]
            let isEveryoneReady = personManager.doesAllSatisfy(
                (person) => (person.isConnected() && acceptableStatuses.includes(person.getStatus()))
            )

            return (isEveryoneReady && isAcceptablePlayerCount);
        }

        canStartGame(req, res) 
        {
            // roomCode
            const [subject, action] = ["GAME", "CAN_START"]
            const addressedResponses = new AddressedResponse()
            let { room, personManager } = props2

            let game = room.getGame()
            let canStart = canGameStart(game, personManager)

            let host = personManager.findPerson(
                (person) => person.hasTag("host")
            )

            let status = "success"
            let payload = {
                value: canStart,
            }
            addressedResponses.addToSpecific(
                host.getSocketId(),
                makeResponse({ subject, action, status, payload })
            )

            return addressedResponses
        }
    }
}
