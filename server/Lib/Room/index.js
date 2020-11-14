/**
 * Build a Room Method Provider
 * 
 * Provides methods for a socket to be able to listen with
 * const buildRoomMethodsProvider = require(`${serverFolder}/Lib/Room/`);
 */
function buildRegisterRoomMethods({
    AddressedResponse,
    //-------------------------
    buildCreateRoom,
    buildJoinRoom,
    buildCheckExists,
    buildGetRandomRoom,
    buildGetCurrentRoomCode,
    buildGetRoom,
    buildGetAllRooms,
    buildLeaveRoom,
    //-------------------------
    isDef,
    els,
    getNestedValue,
    setNestedValue,
    getArrFromProp, 
    //-------------------
    roomManager,
    cookieTokenManager,
    //-------------------
    makeProps,
    makeResponse,
    createGameInstance,
    makeConsumerFallbackResponse,

    //-------------------
    handleRoom,
})
{
    function registerRoomMethods(registry)
    {
        let getCurrentRoom = buildGetCurrentRoomCode({
            makeProps,
            isDef,
            AddressedResponse,
            roomManager,
            makeResponse,
        })
        let getKeyed = buildGetRoom({
            makeProps,
            isDef,
            getArrFromProp,
            AddressedResponse,
            roomManager,
            makeResponse,
        })
        let getAllKeyed = buildGetAllRooms({
            makeProps,
            AddressedResponse,
            registry,
            roomManager,
            makeResponse,
        })
        let leaveRoom =  buildLeaveRoom({
            makeProps,
            isDef,
            AddressedResponse,
            registry,
            makeResponse,
            makeConsumerFallbackResponse,
            handleRoom,
        })
        let getRandomRoom = buildGetRandomRoom({
            makeProps,
            AddressedResponse,
            roomManager,
            makeResponse,
        })
        let createRoom = buildCreateRoom({
            makeProps,
            makeResponse,
            isDef,
            AddressedResponse,
            els,
            roomManager,
            createGameInstance,
        })
        let joinRoom = buildJoinRoom({
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
        let checkRoomExists = buildCheckExists({
            makeProps,
            makeResponse,
            isDef,
            AddressedResponse,
            getArrFromProp,
            roomManager,
        })

        registry.public('ROOM.GET_RANDOM_CODE',    getRandomRoom);
        registry.public('ROOM.EXISTS',             checkRoomExists)
        registry.public('ROOM.CREATE',             createRoom);
        registry.public('ROOM.JOIN',               joinRoom)
        registry.public('ROOM.GET_CURRENT',        getCurrentRoom);
        registry.public('ROOM.GET_KEYED',          getKeyed);
        registry.public('ROOM.GET_All_KEYED',      getAllKeyed);
        registry.public('ROOM.LEAVE',              leaveRoom);
    }
    return registerRoomMethods;
}

module.exports = buildRegisterRoomMethods;
