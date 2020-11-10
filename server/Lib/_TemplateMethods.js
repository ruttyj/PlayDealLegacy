/**
 * Build a People Method Provider
 * @SEARCH_REPLACE Template
 * Provides methods for a socket to be able to listen with
 * const buildRegisterTemplateMethods = require(`${serverFolder}/Lib/Template/`);
 */
function buildRegisterTemplateMethods({
    
    serverFolder,
    commonDeps,
    els,
    isDef,
    isDefNested,
    isFunc,
    isStr,
    isArr,
    getNestedValue,
    log,
    jsonEncode,
    getArrFromProp,

    //-------------------
    OrderedTree,
    Affected,
    ClientManager,
    RoomManager,
    GameInstance,
    SocketResponseBuckets,
    KeyedRequest,
    PUBLIC_SUBJECTS,
    PRIVATE_SUBJECTS,
    registry,

    //-------------------
    mThisClientId,
    mStrThisClientId,
    thisClientKey: mStrThisClientId,
    thisClient,
    clientManager,
    roomManager,
    cookieTokenManager,
    //-------------------

    makeProps,
    makeResponse,
    makeKeyedResponse,

    getAllKeyedResponse,
    packageCheckpoints,
    getAllPlayers,
    canGameStart,
    createGameInstance,
    canPersonRemoveOtherPerson,

    makePersonSpecificResponses,
    makeConsumerFallbackResponse,
    makeRegularGetKeyed,

    handleRoom,
    handlePerson,

    handleGame,

    _myTurnConsumerBase,
    handleMyTurn,
    handCardConsumer,
    makeConsumer,
    handleTransactionResponse,
    handleTransferResponse,
    handleRequestCreation,
    handleCollectionBasedRequestCreation,
})
{
    function registerTemplateMethods(registry)
    {
     
    }
    return registerTemplateMethods;
}

module.exports = buildRegisterTemplateMethods;
