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
            registry,
        }))
            
        registry.public(['MY_TURN', 'VALUE_COLLECTION'], buildRequestValueAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            handleGame, 
            isDefNested,
            handleRequestCreation,
            registry,
        }))
            
        registry.public(['RESPONSES', 'RESPOND_TO_COLLECT_VALUE'], buildRespondToCollectValueAction({
            ...commonDeps,
            makeConsumerFallbackResponse,
            makeResponse,
            handleGame, 
            handleTransactionResponse,
            registry,
        }))

    }
    return registerRequestValueMethods;
}

module.exports = buildRegisterRequestValueMethods;
