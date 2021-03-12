module.exports = function({ els, isDef, isStr, isArr, jsonEncode, AddressedResponse }) {
    return class Connection 
    {
        constructor({socket, server})
        {
            this.id = String(socket.id);
            this.socket = socket
            this.server = server
        }

        /**
         * Attach the events to the socket
         */
        registerEvents()
        {
            let connection = this
            let socket = this.socket
            
            socket.on("request",    (jsonData)  => connection.onTrigger(jsonData))
            socket.on("disconnect", ()          => connection.onDisconnected())
            connection.onConnected()
        }

        /**
         * When connection is initialized and ready to do the conconnect logic
         */
        onConnected()
        {
            let connection = this
            let server = connection.server
            let socket = connection.socket

            server.clientManager.addClient(socket);
        }

        /**
         * Responsible for communication with client socket
         * 
         * Example: 
         *  [
         *      {
         *          type:       "connect",
         *          payload:    {
         *                          "roomCode": "ABC"
         *                      }
         *      }
         *  ]
         * @param string jsonData   JSON encoded array of events to preform 
         */
        onTrigger(jsonData)
        {
            let connection      = this
            let socket          = connection.socket
            let server          = connection.server
            let registry        = server.registry
            let handleRoom      = server.handleRoom

            let events              = isStr(jsonData) ? JSON.parse(jsonData) : jsonData
            let clientPersonMapping = {}

            //==================================================

            //          Trigger actions for each event

            const resultResponses = new AddressedResponse()
            if (isArr(events)) {
                events.forEach((request) => {
                    // Get event type
                    let eventType;
                    if (isDef(request.type)) {
                        eventType = request.type
                    } else { // legacy
                        eventType = `${request.subject}.${request.action}`
                    }

                    // Add additional data to payload
                    let payload = els(request.props, els(request.payload, {}))
                    payload.thisClientKey   = socket.id
                    payload.thisClient      = socket

                    // Collect the addressed responses
                    let eventResponses = new AddressedResponse()
                    eventResponses.addToBucket("default", registry.execute(eventType, payload))

                    // @TODO need reference to Room and handleRoom
                    // Collect person Ids
                    let clientIdsMap = {}
                    clientIdsMap[connection.id] = true
                    handleRoom(payload, ({ personManager }) => {
                        personManager.getConnectedPeople().forEach((person) => {
                            let personConnectionId = String(person.getClientId())
                            clientIdsMap[personConnectionId] = true
                            clientPersonMapping[personConnectionId] = person
                        });
                    });

                    // Merge the results for the room into the list of final addressed responses
                    const myId = connection.id;
                    const everyoneIds = Object.keys(clientIdsMap)
                    resultResponses.addToBucket(eventResponses.reduce(myId, everyoneIds))
                });
            }

            //==================================================

            //        Send responses to addressed sockets

            // Emit to "me" since I am always available
            if (resultResponses.specific.has(String(connection.id))) {
                socket.emit("response", jsonEncode(resultResponses.specific.get(connection.id)))
            }

            // Emit to other relevent people collected from the above events
            Object.keys(clientPersonMapping).forEach((clientId) => {
                if (connection.id !== clientId) {
                    let person = clientPersonMapping[clientId]
                    if (resultResponses.specific.has(clientId)) {
                        person.emit("response", jsonEncode(resultResponses.specific.get(clientId)))
                    }
                }
            });
        }
        
        /**
         * When connection ends
         */
        onDisconnected()
        {
            let connection          = this
            let server              = connection.server
            let socket              = connection.socket
            let roomManager         = server.roomManager
            let cookieTokenManager  = server.cookieTokenManager
            let clientManager       = server.clientManager

            let socketId            = socket.id
            let affectedRooms       = roomManager.getRoomsForSocketId(socketId)
           
            // Remove socket from cookieToken
            cookieTokenManager.dissociateClient(socketId)
        
            if (isDef(affectedRooms)) {
              affectedRooms.forEach((room) => {
                //---------------------------------------------
                // Leave room
                // Construct a leave roomevent
                let leaveRoomEvent = {
                    type:       "ROOM.LEAVE",
                    payload:    { 
                                    roomCode: room.getCode() 
                                },
                }
                connection.onTrigger(JSON.stringify([leaveRoomEvent]))
        
                //---------------------------------------------
                // Delete Room
                // Handle leave room since the above handler requires the room to exist to notify people
                if (room.getPersonManager().getConnectedPeopleCount() === 0) {
                  roomManager.deleteRoom(room.getId())
                }
                
              })// end foreach affected room
            }

            clientManager.removeClient(socket)
            server.onDisconnected(connection)
        }
    }
}