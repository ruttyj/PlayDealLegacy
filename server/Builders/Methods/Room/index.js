const builderFolder = `../../../Builders`

const buildCreateRoom                 = require(`${builderFolder}/Methods/Room/CreateRoom`)
const buildJoinRoom                   = require(`${builderFolder}/Methods/Room/JoinRoom`)
const buildCheckExists                = require(`${builderFolder}/Methods/Room/CheckExists`)
const buildGetRandomRoom              = require(`${builderFolder}/Methods/Room/GetRandomRoomCode`)
const buildGetCurrentRoomCode         = require(`${builderFolder}/Methods/Room/GetCurrentRoomCode`)
const buildGetRoom                    = require(`${builderFolder}/Methods/Room/GetRoom`)
const buildGetAllRooms                = require(`${builderFolder}/Methods/Room/GetAllRooms`)
const buildLeaveRoom                  = require(`${builderFolder}/Methods/Room/LeaveRoom`)
const buildRegisterPeopleMethods      = require(`${builderFolder}/Methods/People/`)
const buildRegisterChatMethods        = require(`${builderFolder}/Methods/Chat/`)

module.exports = function({
    AddressedResponse,
    //-------------------------
    isDef,
    isStr,
    isArr,
    els,
    getNestedValue,
    setNestedValue,
    getArrFromProp, 
    //-------------------
    roomManager,
    cookieTokenManager,
    makeProps,
    //-------------------
    makeResponse,
    createGameInstance,
    makeConsumerFallbackResponse,
    //-------------------
    handleRoom,
    handlePerson,
    canPersonRemoveOtherPerson,
})
{

    return class RoomActionProvider
    {
        up(registry)
        {
            let registerChatMethods   = buildRegisterChatMethods({
                isDef,
                AddressedResponse,
                makeResponse,
                makeConsumerFallbackResponse,
                handlePerson,
                makeProps,
              })
              registerChatMethods(registry) // @TODO down


              let registerPeopleMethods = buildRegisterPeopleMethods({
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
                makeProps,
              })

            registerPeopleMethods(registry) // @TODO down

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

        down(registry)
        {
            registry.remove('ROOM.GET_RANDOM_CODE')
            registry.remove('ROOM.EXISTS')
            registry.remove('ROOM.CREATE')
            registry.remove('ROOM.JOIN')
            registry.remove('ROOM.GET_CURRENT')
            registry.remove('ROOM.GET_KEYED')
            registry.remove('ROOM.GET_All_KEYED')
            registry.remove('ROOM.LEAVE')
        }
    } 
}
