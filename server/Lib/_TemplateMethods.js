module.exports = function({
    
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
    AddressedResponse,
    KeyedRequest,
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

