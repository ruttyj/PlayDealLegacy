/**
 * Build a Room Method Provider
 * 
 * Provides methods for a socket to be able to listen with
 * const buildRoomMethodsProvider = require(`${serverFolder}/Lib/Room/`);
 */
function buildRegisterRoomMethods({
    SocketResponseBuckets,
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
    PUBLIC_SUBJECTS,
    PRIVATE_SUBJECTS,
    
    //-------------------
    thisClientKey,
    thisClient,
    roomManager,
    cookieTokenManager,
    //-------------------
    
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
            isDef,
            SocketResponseBuckets,
            roomManager,
            makeResponse,
        })
        let getKeyed = buildGetRoom({
            isDef,
            getArrFromProp,
            SocketResponseBuckets,
            roomManager,
            makeResponse,
        })
        let getAllKeyed = buildGetAllRooms({
            SocketResponseBuckets,
            PUBLIC_SUBJECTS,
            roomManager,
            makeResponse,
        })
        let leaveRoom =  buildLeaveRoom({
            isDef,
            SocketResponseBuckets,
            PUBLIC_SUBJECTS,
            PRIVATE_SUBJECTS,
            makeResponse,
            makeConsumerFallbackResponse,
            handleRoom,
        })
        let getRandomRoom = buildGetRandomRoom({
            SocketResponseBuckets,
            roomManager,
            makeResponse,
        })
        let createRoom = buildCreateRoom({
            makeResponse,
            isDef,
            SocketResponseBuckets,
            els,
            roomManager,
            createGameInstance,
        })
        let joinRoom = buildJoinRoom({
            PUBLIC_SUBJECTS,
            makeResponse,
            isDef,
            getNestedValue,
            setNestedValue,
            SocketResponseBuckets,
            els,
            handleRoom,
            cookieTokenManager,
            thisClientKey,
            thisClient,
        })
        let checkRoomExists = buildCheckExists({
            makeResponse,
            isDef,
            SocketResponseBuckets,
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
