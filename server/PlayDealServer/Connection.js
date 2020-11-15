module.exports = function({
    utils,
    classes,
}) {
    let {
        els,
        isDef,
        isStr,
        isArr,
        jsonEncode,
    } = utils;

    let {
        AddressedResponse,
    } = classes;

    return class Connection 
    {
        constructor({socket, server})
        {
            this.socket = socket
            this.server = server
        }

        registerEvents()
        {
            let connection = this
            let socket = this.socket
            
            socket.on("request",    (jsonData)  => connection.onTrigger(jsonData))
            socket.on("disconnect", ()          => connection.onDisconnected())
            connection.onConnected()
        }

        onConnected()
        {
            let connection = this
            let server = connection.server
            let socket = connection.socket

            server.clientManager.addClient(socket);
        }

        onTrigger(jsonData)
        {
            let connection = this
            let socket = connection.socket
            let server = connection.server

            let registry        = server.registry
            let handleRoom      = server.handleRoom

            let connectionId = String(socket.id)
            const addressedResponses = new AddressedResponse()
            let requests = isStr(jsonData) ? JSON.parse(jsonData) : jsonData
            let clientPersonMapping = {}

            if (isArr(requests)) {
                requests.forEach((request) => {
                    let requestResponses = new AddressedResponse()

                    let eventType;
                    if (isDef(request.type)) {
                        eventType = request.type
                    } else {
                        eventType = `${request.subject}.${request.action}`
                    }

                    let payload = els(request.props, els(request.payload, {}))
                    let props   = els(request.props, {})
                    // Add client data to props
                    payload.thisClientKey   = socket.id
                    payload.thisClient      = socket
                    requestResponses.addToBucket("default", registry.execute(eventType, payload))

                    // Collect person Ids
                    let clientIdsMap = {}
                    clientIdsMap[connectionId] = true
                    handleRoom(props, ({ personManager }) => {
                        personManager.getConnectedPeople().forEach((person) => {
                            let personConnectionId = String(person.getClientId());
                            clientIdsMap[personConnectionId] = true
                            clientPersonMapping[personConnectionId] = person
                        });
                    });

                    // Assing the buckets of reponses to the relevent clients
                    let clientIds = Object.keys(clientIdsMap)
                    addressedResponses.addToBucket(requestResponses.reduce(connectionId, clientIds))
                });
            }

            // Emit to "me" since I am always available
            if (addressedResponses.specific.has(String(connectionId))) {
                socket.emit("response", jsonEncode(addressedResponses.specific.get(connectionId)))
            }
            // Emit to other relevent people collected from the above requests
            Object.keys(clientPersonMapping).forEach((clientId) => {
                if (connectionId !== clientId) {
                    let person = clientPersonMapping[clientId]
                    if (addressedResponses.specific.has(clientId)) {
                        person.emit("response", jsonEncode(addressedResponses.specific.get(clientId)))
                    }
                }
            });
        }
        
        onDisconnected()
        {
            let connection  = this
            let server      = connection.server
            let socket      = connection.socket

            let roomManager         = server.roomManager
            let cookieTokenManager  = server.cookieTokenManager
            let clientManager       = server.clientManager

            let socketId        = socket.id
            let affectedRooms   = roomManager.getRoomsForClientId(socketId)
           
            cookieTokenManager.dissociateClient(socketId)
        
            if (isDef(affectedRooms)) {
              affectedRooms.forEach((room) => {
                // Construct a leave roomevent
                let leaveRoomEvent = {
                    type:     "ROOM.LEAVE",
                    payload:  { roomCode: room.getCode() },
                }

                // List of events to execute
                let eventList = [
                    leaveRoomEvent
                ]

                // trigger leave room event
                connection.onTrigger(JSON.stringify(eventList))
        
                // Handle leave room since the above handler requires the room to exist to notify people
                let roomPersonManager = room.getPersonManager()
                if (roomPersonManager.getConnectedPeopleCount() === 0) {
                  roomManager.deleteRoom(room.getId())
                }

              })// end foreach affected room
            }

            clientManager.removeClient(socket)
            server.onDisconnected(connection)
        }
    }
}