/**
 * Build a People Method Provider
 * @SEARCH_REPLACE RequestValue
 * Provides methods for a socket to be able to listen with
 * const buildRegisterRequestValueMethods = require(`${serverFolder}/Lib/RequestValue/`);
 */
function buildRegisterRequestValueMethods({
    commonDeps,
    isDefNested,
    buildRespondToCollectValueAction,
    buildChargeRentAction,
    buildRequestValueAction,
    makeResponse,
    makeConsumerFallbackResponse,
    handleGame,
    handleTransactionResponse,
    handleRequestCreation,
    handleCollectionBasedRequestCreation,
})
{
    function registerRequestValueMethods(registry)
    {
      // CHARGE RENT
      registry.public(['MY_TURN', 'CHARGE_RENT'], buildChargeRentAction({
                ...commonDeps,
                makeConsumerFallbackResponse,
                handleGame,
                handleCollectionBasedRequestCreation,
                makeConsumerFallbackResponse,
            })
            )
            
        registry.public(['MY_TURN', 'VALUE_COLLECTION'], buildRequestValueAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            handleGame, 
            isDefNested,
            handleRequestCreation,
            })
        )
            

        registry.public(['RESPONSES', 'RESPOND_TO_COLLECT_VALUE'], buildRespondToCollectValueAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            handleGame, 
            handleTransactionResponse,
            })
        )

    }
    return registerRequestValueMethods;
}

module.exports = buildRegisterRequestValueMethods;
