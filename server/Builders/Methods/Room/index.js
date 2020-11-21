const builderFolder = `../../../Builders`

const buildCreateRoom                 = require(`${builderFolder}/Methods/Room/CreateRoom`)
const buildJoinRoom                   = require(`${builderFolder}/Methods/Room/JoinRoom`)
const buildCheckExists                = require(`${builderFolder}/Methods/Room/CheckExists`)
const buildGetRandomRoom              = require(`${builderFolder}/Methods/Room/GetRandomRoomCode`)
const buildGetCurrentRoomCode         = require(`${builderFolder}/Methods/Room/GetCurrentRoomCode`)
const buildGetRoom                    = require(`${builderFolder}/Methods/Room/GetRoom`)
const buildGetAllRooms                = require(`${builderFolder}/Methods/Room/GetAllRooms`)
const buildLeaveRoom                  = require(`${builderFolder}/Methods/Room/LeaveRoom`)

module.exports = function({
    AddressedResponse,
    //-------------------------
    isDef,
    els,
    isArr,
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
    return function (registry)
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
            isArr,
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
}
