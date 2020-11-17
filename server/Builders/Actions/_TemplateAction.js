/**
 * @SEARCH_REPLACE : TemplateAction | templateAction
 * const buildTemplateAction = require(`${serverFolder}/Builders/Room/TemplateAction`);
 */
function buildTemplateAction({
    serverFolder,
    //-------------------------

    buildCreateRoom,
    buildJoinRoom,
    buildCheckExists,
    buildGetRandomRoom,

    //-------------------------
    // @WARNING - duplicated variables
    commonDeps,

    //-------------------------
    els,
    isDef,
    getArrFromProp,

    //-------------------
    AddressedResponse,

    //-------------------
    mStrThisClientId,
    thisClient,
    roomManager,
    cookieTokenManager,
    //-------------------

    makeResponse,

    packageCheckpoints,
    createGameInstance,
    makeConsumerFallbackResponse,

    handleRoom,
    handleMyTurn,
    handCardConsumer,
})
{
    function templateAction(props)
    {
       
    }
    return templateAction;
}

module.exports = buildTemplateAction;
