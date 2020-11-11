/**
 * JoinRoom
 * @SEARCH_REPLACE : JoinRoom | joinRoom
 * const buildJoinRoom = require(`${serverFolder}/Lib/Room/JoinRoom`);
 */
function buildJoinRoom({
    PUBLIC_SUBJECTS,
    makeResponse,
    isDef,
    getNestedValue,
    setNestedValue,
    AddressedResponse,
    els,
    handleRoom,
    cookieTokenManager,
    thisClientKey,
    thisClient,
})
{
    function joinRoom(props)
    {
        const [subject, action] = ["ROOM", "JOIN"];
        const addressedResponses = new AddressedResponse();

        let { roomCode, username } = props;
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
                          person.setClient(thisClient);
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
                PUBLIC_SUBJECTS.PEOPLE.ME({
                  roomCode,
                })
              );

              if (personManager.getConnectedPeopleCount() === 1) {
                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS.PEOPLE.SET_HOST({
                    roomCode,
                    personId,
                  })
                );
              }

              // send room data
              addressedResponses.addToBucket(
                "default",
                PUBLIC_SUBJECTS.ROOM.GET_CURRENT({ roomCode })
              );

              // Get the full player list for myself
              addressedResponses.addToBucket(
                "default",
                PUBLIC_SUBJECTS.PEOPLE.GET_ALL_KEYED({
                  roomCode,
                })
              );

              // Let everyone else know the new users has joined
              addressedResponses.addToBucket(
                "everyoneElse",
                PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                  personId,
                  roomCode,
                })
              );

              addressedResponses.addToBucket(
                "default",
                PUBLIC_SUBJECTS.PEOPLE.GET_HOST({
                  roomCode,
                })
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
                  PUBLIC_SUBJECTS.PROPERTY_SETS.GET_ALL_KEYED({
                    roomCode,
                  })
                );
                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS.CARDS.GET_ALL_KEYED({
                    roomCode,
                  })
                );

                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["PLAYERS"].GET({
                    roomCode,
                    person,
                  })
                );

                // @TODO store client side
                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS.GAME.GET_CONFIG({
                    roomCode,
                  })
                );

                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["PLAYER_HANDS"].GET_KEYED({
                    roomCode,
                    person,
                    peopleIds: allPlayerIds,
                    receivingPeopleIds: [thisPersonId],
                  })
                );

                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS.PLAYER_BANKS.GET_ALL_KEYED({
                    roomCode,
                    person,
                  })
                );

                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["COLLECTIONS"].GET_ALL_KEYED({
                    roomCode,
                    peopleIds: allPlayerIds,
                  })
                );
                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["PLAYER_COLLECTIONS"].GET_ALL_KEYED({
                    roomCode,
                    peopleIds: allPlayerIds,
                  })
                );
                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["DRAW_PILE"].GET({ roomCode })
                );
                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["ACTIVE_PILE"].GET({ roomCode })
                );

                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["DISCARD_PILE"].GET({ roomCode })
                );

                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["GAME"].STATUS({ roomCode })
                );

                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["PLAYER_REQUESTS"].GET_KEYED({
                    roomCode,
                    peopleIds: allPlayerIds,
                  })
                );
                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["REQUESTS"].GET_ALL_KEYED({ roomCode })
                );

                addressedResponses.addToBucket(
                  "default",
                  PUBLIC_SUBJECTS["PLAYER_TURN"].GET({ roomCode })
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
    return joinRoom;
}

module.exports = buildJoinRoom;
