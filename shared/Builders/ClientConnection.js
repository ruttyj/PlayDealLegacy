    const SOCKET_RESPONSE_JSON = 'json';
    const SOCKET_RESPONSE_BUFFER = 'b_';
    const SOCKET_DISCONNECT = 'disconnect';

    /**
     * ClientConnector
     * @param {*} param0 
     */

    module.exports = function buildClientConnection({
        makeListnerTree,
        isDef,
        isArr,
        fromEventCode,
    })
    {
    return class ClientConnection 
    {
        constructor()
        {
            this.bufferMiddleware = new Map(); // @TODO replace with middleware map
        }

        injectDeps()
        {

        }

        connect(socket)
        {
            const clientConnection = this;
            
            // Json Responses
            // Handle response where data is in pure json
            // Can contain multiple responses
            socket.on(SOCKET_RESPONSE_JSON, (jsonData) => {
                clientConnection.handleJsonResponse(jsonData)
            })

            // Typed Array Buffer
            // Handle response where data is encoded into a typed Array Buffer
            // Does not support polymorphic data so data will be delivered in multiple responses
            // #Important 
            //   It will depend on the communication method IE Socket / UDP / Peer
            //   wither these messages will arrive in order or even at all !!
            Object.keys(fromEventCode).forEach(code => {
                let key = fromEventCode[code];
                let eventKey = `${SOCKET_RESPONSE_BUFFER}${code}`;
                socket.on(eventKey, (bufferData) => {
                    // This data will need to be converted to a model before processing
                    //key, code, bufferData
                })
            })

            socket.on(SOCKET_DISCONNECT, () => {
                // #NOP #TODO
            })
        }

        handleBufferResponse(bufferData)
        {
            // #TODO

        }

        handleJsonResponse(jsonData)
        {
            const clientConnection = this;
            let data = JSON.parse(jsonData)
            if (isArr(data)) {
                data.forEach(data => {
                    clientConnection.handleJsonResponseItem(data)
                })
            } else {
                clientConnection.handleJsonResponseItem(data)
            }
        }

        handleJsonResponseItem(data)
        {
            // #TODO
        }
    }
}