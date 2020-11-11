/**
 * Build a People Method Provider
 * 
 * Provides methods for a socket to be able to listen with
 * const buildPeopleMethodsProvider = require(`${serverFolder}/Lib/People/`);
 */
function buildRegisterPeopleMethods({
    isDef,
    isStr,
    getArrFromProp,
    AddressedResponse,
    PUBLIC_SUBJECTS,
    PRIVATE_SUBJECTS,
    roomManager,
    makeResponse,
    canPersonRemoveOtherPerson,
    makeConsumerFallbackResponse,
    handleRoom,
    handlePerson,
})
{
    function registerRoomMethods(registry)
    {
        Object.assign(PUBLIC_SUBJECTS, {
            PEOPLE: {
              UPDATE_MY_NAME: function(props) {
                // roomCode
                const [subject, action] = ["PEOPLE", "UPDATE_MY_NAME"];
                const socketResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (props2) => {
                    let { roomCode, thisPersonId, thisPerson, username } = props2;
                    let status = "failure";
                    let payload = null;
        
                    let usernameMaxLength = 20;
                    if (isStr(username)) {
                      username = String(username).trim();
                      if (username.length < usernameMaxLength) {
                        status = "success";
                        thisPerson.setName(username);
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                            personId: thisPersonId,
                            roomCode,
                          })
                        );
                      }
                    }
        
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              ME: function(props) {
                // roomCode
                const [subject, action] = ["PEOPLE", "ME"];
                const socketResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (props2) => {
                    let { thisPersonId, thisPerson } = props2;
        
                    let status = "success";
                    let payload = {
                      me: thisPersonId,
                    };
        
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              GET_HOST: function(props) {
                // roomCode
                const [subject, action] = ["PEOPLE", "GET_HOST"];
                const socketResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (props2) => {
                    let { personManager } = props2;
        
                    let payload = {};
                    let status = "failure";
                    let host = null;
                    let hostPerson = personManager.findPerson((person) =>
                      person.hasTag("host")
                    );
                    if (isDef(hostPerson)) {
                      status = "success";
                      host = hostPerson.getId();
                    }
        
                    payload.host = host;
        
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              SET_HOST: function(props) {
                // roomCode, personId
                const [subject, action] = ["PEOPLE", "SET_HOST"];
                const socketResponses = new AddressedResponse();
                return handlePerson(
                  props,
                  (props2) => {
                    let { personId } = props;
                    let { roomCode, personManager, thisPerson } = props2;
                    let isCurrentHost = isDef(thisPerson) && thisPerson.hasTag("host");
        
                    let payload = {};
                    let status = "failure";
        
                    if (personManager.getConnectedPeopleCount() <= 1 || isCurrentHost) {
                      if (isDef(personId) && personManager.hasPerson(personId)) {
                        let currentHost = personManager.findPerson((person) =>
                          person.hasTag("host")
                        );
                        if (isDef(currentHost)) {
                          currentHost.removeTag("host");
                        }
        
                        let newHost = personManager.getPerson(personId);
                        newHost.addTag("host");
        
                        status = "success";
                        payload.host = personId;
                        socketResponses.addToBucket(
                          "everyone",
                          makeResponse({ subject, action, status, payload })
                        );
                      }
                    } else {
                      socketResponses.addToBucket(
                        "default",
                        makeResponse({ subject, action, status, payload })
                      );
                    }
        
                    socketResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS.PEOPLE.GET_HOST({
                        roomCode,
                      })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              GET_ALL_KEYED: function(props) {
                let subject = "PEOPLE";
                let action = "GET_ALL_KEYED";
                let status = "failure";
        
                let payload = null;
                const socketResponses = new AddressedResponse();
                let { roomCode } = props;
                let room = roomManager.getRoomByCode(roomCode);
                if (isDef(room)) {
                  status = "success";
                  let personManager = room.getPersonManager();
                  let peopleIds = personManager
                    .getConnectedPeople()
                    .map((person) => person.getId());
        
                  socketResponses.addToBucket(
                    "default",
                    PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                      peopleIds,
                      roomCode,
                    })
                  );
                }
                socketResponses.addToBucket(
                  "default",
                  makeResponse({ subject, action, status, payload })
                );
        
                return socketResponses;
              },
              GET_KEYED: function(props) {
                const socketResponses = new AddressedResponse();
                const [subject, action] = ["PEOPLE", "GET_KEYED"];
                let peopleIds = getArrFromProp(props, {
                  plural: "peopleIds",
                  singular: "personId",
                });
        
                let payload = {
                  items: {},
                  order: [],
                };
        
                return handleRoom(
                  props,
                  ({ room, personManager }) => {
                    let personFoundCount = 0;
                    peopleIds.forEach((personId) => {
                      let person = personManager.getPerson(personId);
                      if (isDef(person)) {
                        ++personFoundCount;
                        payload.items[personId] = person.serialize();
                        payload.order.push(personId);
                      }
                    });
        
                    let status = personFoundCount > 0 ? "success" : "failure";
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status, payload })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              REMOVE: function(props) {
                const socketResponses = new AddressedResponse();
                const [subject, action] = ["PEOPLE", "REMOVE"];
                let message = "Failed to remove people.";
        
                return handlePerson(
                  props,
                  (props2) => {
                    let status = "failure";
                    let { roomCode, personManager, thisPerson, thisPersonId } = props2;
        
                    let peopleIds = getArrFromProp(
                      props,
                      {
                        plural: "peopleIds",
                        singular: "personId",
                      },
                      thisPersonId
                    );
                    let payload = {
                      ids: [],
                    };
        
                    // Foreach person beign removed
                    let removedPersonCount = 0;
                    let wasHostRemoved = false;
                    peopleIds.forEach((personId) => {
                      let person = personManager.getPerson(personId);
                      if (isDef(person)) {
                        // Can I removed by this person
                        if (canPersonRemoveOtherPerson(thisPerson, person)) {
                          ++removedPersonCount;
                          payload.ids.push(personId);
        
                          person.disconnect();
                          personManager.removePersonById(person.getId());
        
                          // If it was the host who left, assing new host
                          let wasHost = person.hasTag("host");
                          if (wasHost) wasHostRemoved = true;
                        }
                      }
                    });
        
                    if (removedPersonCount > 0) {
                      status = "success";
                      message = `Removed ${removedPersonCount} people successfully.`;
                      socketResponses.addToBucket(
                        "everyone",
                        makeResponse({ subject, action, status, payload, message })
                      );
                    } else {
                      socketResponses.addToBucket(
                        "default",
                        makeResponse({ subject, action, status, payload, message })
                      );
                    }
        
                    if (wasHostRemoved) {
                      let nextHost = personManager.findPerson((firstPerson) =>
                        firstPerson.isConnected()
                      );
                      if (isDef(nextHost)) {
                        socketResponses.addToBucket(
                          "everyone",
                          PUBLIC_SUBJECTS.PEOPLE.SET_HOST({
                            roomCode,
                            personId: nextHost.getId(),
                          })
                        );
                      }
                    }
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
              UPDATE_MY_STATUS: function(props) {
                const [subject, action] = ["PEOPLE", "UPDATE_MY_STATUS"];
                const socketResponses = new AddressedResponse();
                let payload = null;
                let requestStatus = "failure";
                return handlePerson(
                  props,
                  ({ roomCode, room, personManager, person, thisPersonId }) => {
                    let { status } = props;
        
                    let allowedStatuses = ["ready", "not_ready"];
                    if (allowedStatuses.includes(status)) {
                      person.setStatus(String(status));
                    }
        
                    requestStatus = "success";
                    socketResponses.addToBucket(
                      "default",
                      makeResponse({ subject, action, status: requestStatus, payload })
                    );
        
                    socketResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                        personId: thisPersonId,
                        roomCode,
                      })
                    );
        
                    socketResponses.addToBucket(
                      "default",
                      PUBLIC_SUBJECTS.GAME.CAN_START({ roomCode })
                    );
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
            },
          });
          Object.assign(PRIVATE_SUBJECTS, {
            
            PEOPLE: {
              DISCONNECT: function(props) {
                // when game is in progeress and the user loses connection or closes the browser
                const socketResponses = new AddressedResponse();
                const [subject, action] = ["PEOPLE", "DISCONNECT"];
                let status = "failure";
                let payload = {};
                return handlePerson(
                  props,
                  (props2) => {
                    let { roomCode, personManager, thisPerson, thisPersonId } = props2;
                    let peopleIds = getArrFromProp(
                      props,
                      {
                        plural: "peopleIds",
                        singular: "personId",
                      },
                      thisPersonId
                    );
        
                    // Foreach person beign removed
                    let disconnectedIds = [];
                    peopleIds.forEach((personId) => {
                      let person = personManager.getPerson(personId);
                      if (isDef(person)) {
                        disconnectedIds.push(person.getId());
                        person.disconnect();
                      }
                    });
        
                    socketResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS.PEOPLE.GET_KEYED({
                        peopleIds: disconnectedIds,
                        roomCode,
                      })
                    );
        
                    return socketResponses;
                  },
                  makeConsumerFallbackResponse({ subject, action, socketResponses })
                );
              },
            },
          });
    }
    return registerRoomMethods;
}

module.exports = buildRegisterPeopleMethods;
