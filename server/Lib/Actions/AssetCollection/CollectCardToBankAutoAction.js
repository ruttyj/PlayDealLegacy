/**
 * COLLECT_CARD_TO_BANK_AUTO
 * const buildCollectCardToBankAutoAction = require(`${serverFolder}/Lib/Actions/CollectCardToBankAutoAction`);
 */
function buildCollectCardToBankAutoAction({
    PUBLIC_SUBJECTS,
    handleTransferResponse,
    Affected,
})
{
    function collectCardToBankAutoAction(props)
    {
        let doTheThing = function (consumerData) {
            let {
                request,
                _Affected,
                playerBank,
                transfering,
                checkpoints,
                thisPersonId,
                roomCode,
                socketResponses,
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
                socketResponses.addToBucket(
                    "everyone",
                    PUBLIC_SUBJECTS.GAME.STATUS({ roomCode })
                );
                }
            }
        };
        return handleTransferResponse(
            PUBLIC_SUBJECTS,
            "RESPONSES",
            "COLLECT_CARD_TO_BANK_AUTO",
            props,
            doTheThing
        );
    
    }
    return collectCardToBankAutoAction;
}

module.exports = buildCollectCardToBankAutoAction;
