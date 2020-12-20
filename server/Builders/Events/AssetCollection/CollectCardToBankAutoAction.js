function buildCollectCardToBankAutoAction({
    registry,
    handleTransferResponse,
    Affected,
})
{
    return function (props)
    {
        let doTheThing = function (consumerData) {
            let {
                request,
                _Affected,
                playerBank,
                transfering,
                checkpoints,
                thisPersonId,
                addressedResponses,
                game,
            } = consumerData;
            if (transfering.has("bank")) {
                transfering
                .get("bank")
                .getRemainingList()
                .forEach((cardId) => {
                    playerBank.addCard(cardId);
                    transfering.get("bank").confirm(cardId);
                });

                _Affected.setAffected('REQUEST', request.getId(), Affected.ACTION.UPDATE);
                _Affected.setAffected('BANK');
                checkpoints.set("success", true);

                if (game.checkWinConditionForPlayer(thisPersonId)) {
                    addressedResponses.addToBucket(
                        AddressedResponse.EVERYONE_BUCKET,
                        registry.execute('GAME.STATUS', makeProps(props))
                    );
                }
            }
        };
        return handleTransferResponse(
            "RESPONSES",
            "COLLECT_CARD_TO_BANK_AUTO",
            props,
            doTheThing
        );
    
    }
}

module.exports = buildCollectCardToBankAutoAction;
