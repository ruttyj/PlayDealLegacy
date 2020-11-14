/**
 * Build a People Method Provider
 * 
 * Provides methods for a socket to be able to listen with
 * const buildPeopleMethodsProvider = require(`${serverFolder}/Lib/People/`);
 */
function buildRegisterPeopleMethods({
    makeProps,
    isDef,
    isStr,
    getArrFromProp,
    AddressedResponse,
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
      registry.public('PEOPLE.UPDATE_MY_NAME', function(props) {
        const [subject, action] = ["PEOPLE", "UPDATE_MY_NAME"];
        const addressedResponses = new AddressedResponse();
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
                addressedResponses.addToBucket(
                  "everyone",
                  registry.execute('PEOPLE.GET_KEYED', makeProps(props, {
                    personId: thisPersonId,
                    roomCode,
                  }))
                );
              }
            }

            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PEOPLE.ME', function(props) {
        // roomCode
        const [subject, action] = ["PEOPLE", "ME"];
        const addressedResponses = new AddressedResponse();
        return handlePerson(
          props,
          (props2) => {
            let { thisPersonId, thisPerson } = props2;

            let status = "success";
            let payload = {
              me: thisPersonId,
            };

            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );
            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PEOPLE.GET_HOST', function(props) {
        // roomCode
        const [subject, action] = ["PEOPLE", "GET_HOST"];
        const addressedResponses = new AddressedResponse();
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

            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PEOPLE.SET_HOST', function(props) {
        // roomCode, personId
        const [subject, action] = ["PEOPLE", "SET_HOST"];
        const addressedResponses = new AddressedResponse();
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
                addressedResponses.addToBucket(
                  "everyone",
                  makeResponse({ subject, action, status, payload })
                );
              }
            } else {
              addressedResponses.addToBucket(
                "default",
                makeResponse({ subject, action, status, payload })
              );
            }

            addressedResponses.addToBucket(
              "default",
              registry.execute('PEOPLE.GET_HOST', makeProps(props))
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PEOPLE.GET_ALL_KEYED', function(props) {
        let subject = "PEOPLE";
        let action = "GET_ALL_KEYED";
        let status = "failure";

        let payload = null;
        const addressedResponses = new AddressedResponse();
        let { roomCode } = props;
        let room = roomManager.getRoomByCode(roomCode);
        if (isDef(room)) {
          status = "success";
          let personManager = room.getPersonManager();
          let peopleIds = personManager
            .getConnectedPeople()
            .map((person) => person.getId());

          addressedResponses.addToBucket(
            "default",
            registry.execute('PEOPLE.GET_KEYED', makeProps(props, {
              peopleIds,
            }))
          );
        }
        addressedResponses.addToBucket(
          "default",
          makeResponse({ subject, action, status, payload })
        );

        return addressedResponses;
      });
      registry.public('PEOPLE.GET_KEYED', function(props) {
        const addressedResponses = new AddressedResponse();
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
            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status, payload })
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PEOPLE.REMOVE', function(props) {
        const addressedResponses = new AddressedResponse();
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
              addressedResponses.addToBucket(
                "everyone",
                makeResponse({ subject, action, status, payload, message })
              );
            } else {
              addressedResponses.addToBucket(
                "default",
                makeResponse({ subject, action, status, payload, message })
              );
            }

            if (wasHostRemoved) {
              let nextHost = personManager.findPerson((firstPerson) =>
                firstPerson.isConnected()
              );
              if (isDef(nextHost)) {
                addressedResponses.addToBucket(
                  "everyone",
                  registry.execute('PEOPLE.SET_HOST', makeProps(props, {
                    personId: nextHost.getId(),
                  }))
                );
              }
            }

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.public('PEOPLE.UPDATE_MY_STATUS', function(props) {
        const [subject, action] = ["PEOPLE", "UPDATE_MY_STATUS"];
        const addressedResponses = new AddressedResponse();
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
            addressedResponses.addToBucket(
              "default",
              makeResponse({ subject, action, status: requestStatus, payload })
            );

            addressedResponses.addToBucket(
              "everyone",
              registry.execute('PEOPLE.GET_KEYED', makeProps(props, {
                personId: thisPersonId,
              }))
            );

            addressedResponses.addToBucket(
              "default",
              registry.execute('GAME.CAN_START', makeProps(props))
            );
            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
      registry.private('PEOPLE.DISCONNECT', function(props) {
        // when game is in progeress and the user loses connection or closes the browser
        const addressedResponses = new AddressedResponse();
        const [subject, action] = ["PEOPLE", "DISCONNECT"];
        let status = "failure";
        let payload = {};
        console.log('handlePerson DISCONNECT');

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

            addressedResponses.addToBucket(
              "everyone",
              registry.execute('PEOPLE.GET_KEYED', makeProps(props, {
                peopleIds: disconnectedIds,
              }))
            );

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      });
    }
    return registerRoomMethods;
}

module.exports = buildRegisterPeopleMethods;
