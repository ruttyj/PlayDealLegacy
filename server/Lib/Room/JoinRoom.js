module.exports = function ({
    makeProps,
    registry,
    makeResponse,
    isDef,
    getNestedValue,
    setNestedValue,
    AddressedResponse,
    els,
    handleRoom,
    cookieTokenManager,
})
{
    return function (props)
    {
        const [subject, action] = ["ROOM", "JOIN"];
        const addressedResponses = new AddressedResponse();

        let { roomCode, username, thisClientKey, thisClient } = props;
        username = els(username, "Player");
        return handleRoom(
          props,
          (consumerData) => {
            let { room, personManager } = consumerData;
            let token = cookieTokenManager.getTokenForClientId(
              thisClientKey
            );

            // Check if user can reconnect
            let person;
            let hasReconnnected = false;
            let game = room.getGame();
            if (isDef(game)) {
              if (game.isGameStarted() || game.isGameOver()) {
                if (isDef(token)) {
                  let tokenData = cookieTokenManager.get(token);
                  if (isDef(tokenData)) {
                    let tokenDataPersonList = getNestedValue(
                      tokenData,
                      ["room", roomCode],
                      null
                    );
                    if (
                      isDef(tokenDataPersonList) &&
                      isArr(tokenDataPersonList)
                    ) {
                      for (let i = 0; i < tokenDataPersonList.length; ++i) {
                        let data = tokenDataPersonList[i];
                        let { personId } = data;

                        if (
                          personManager.hasPerson(personId) &&
                          !personManager.getPerson(personId).isConnected()
                        ) {
                          person = personManager.getPerson(personId);
                          person.connect(thisClient);
                          personManager.associateClientIdToPersonId(
                            thisClient.id,
                            person.getId()
                          );
                          person.setStatus("ready");
                          hasReconnnected = true;
                          break;
                        }
                      }
                    }
                  }
                }
              }
            }

            if (!isDef(person)) {
              person = personManager.createPerson(thisClient, username);
            }

            let status = "";
            let payload = null;

            if (isDef(person)) {
              let personId = person.getId();

              // associate cookie to session
              if (isDef(token)) {
                let tokenData = cookieTokenManager.get(token);
                if (isDef(tokenData)) {
                  let tokenDataPersonList = getNestedValue(
                    tokenData,
                    ["room", roomCode],
                    []
                  );

                  let hasDataAlready = tokenDataPersonList.find(
                    (l) => l.personId === personId
                  );
                  if (!isDef(hasDataAlready)) {
                    tokenDataPersonList.push({
                      roomCode,
                      personId,
                    });
                    setNestedValue(
                      tokenData,
                      ["room", roomCode],
                      tokenDataPersonList
                    );
                  }
                }
              }

              addressedResponses.addToBucket(
                "default",
                registry.execute('PEOPLE.ME', makeProps(props))
              );

              if (personManager.getConnectedPeopleCount() === 1) {
                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PEOPLE.SET_HOST', makeProps(props, {
                    personId,
                  }))
                );
              }

              // send room data
              addressedResponses.addToBucket(
                "default",
                registry.execute('ROOM.GET_CURRENT', makeProps(props))
              );

              // Get the full player list for myself
              addressedResponses.addToBucket(
                "default",
                registry.execute('PEOPLE.GET_ALL_KEYED', makeProps(props))
              );

              // Let everyone else know the new users has joined
              addressedResponses.addToBucket(
                "everyoneElse",
                registry.execute('PEOPLE.GET_KEYED', makeProps(props, {personId}))
              );

              addressedResponses.addToBucket(
                "default",
                registry.execute('PEOPLE.GET_HOST', makeProps(props))
              );

              let payload = {
                personId,
              };
              // Confirm action
              status = "success";

              

              addressedResponses.addToBucket(
                "everyone",
                makeResponse({
                  subject,
                  action,
                  status,
                  payload,
                })
              );

              if (game.isGameStarted() && !game.isGameOver()) {
                let thisPersonId = person.getId();
                let allPlayerIds = game.getAllPlayerKeys();

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PROPERTY_SETS.GET_ALL_KEYED', makeProps(props))
                );
                addressedResponses.addToBucket(
                  "default",
                  registry.execute('CARDS.GET_ALL_KEYED', makeProps(props))
                );

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PLAYERS.GET', makeProps(props, {person}))
                );

                // @TODO store client side
                addressedResponses.addToBucket(
                  "default",
                  registry.execute('GAME.GET_CONFIG', makeProps(props))
                );

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PLAYER_HANDS.GET_KEYED', makeProps(props, {
                    person,
                    peopleIds: allPlayerIds,
                    receivingPeopleIds: [thisPersonId],
                  }))
                );

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PLAYER_BANKS.GET_ALL_KEYED', makeProps(props, {person}))
                );

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('COLLECTIONS.GET_ALL_KEYED', makeProps(props, {peopleIds: allPlayerIds}))
                );
                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PLAYER_COLLECTIONS.GET_ALL_KEYED', makeProps(props, {peopleIds: allPlayerIds}))
                );
                addressedResponses.addToBucket(
                  "default",
                  registry.execute('DRAW_PILE.GET', makeProps(props))
                );
                addressedResponses.addToBucket(
                  "default",
                  registry.execute('ACTIVE_PILE.GET', makeProps(props))
                );

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('DISCARD_PILE.GET', makeProps(props))
                );

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('GAME.STATUS', makeProps(props))
                );

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PLAYER_REQUESTS.GET_KEYED', makeProps(props, {peopleIds: allPlayerIds}))
                );
                addressedResponses.addToBucket(
                  "default",
                  registry.execute('REQUESTS.GET_ALL_KEYED', makeProps(props))
                );

                addressedResponses.addToBucket(
                  "default",
                  registry.execute('PLAYER_TURN.GET', makeProps(props))
                );
              }

              addressedResponses.addToBucket(
                "default",
                makeResponse({
                  subject,
                  action: "I_JOINED_ROOM",
                  status: "success",
                  payload: null,
                })
              );
            }
            return addressedResponses;
          },
          addressedResponses
        );
    }
}
