function buildRespondToStealPropertyAction({
    isDef,
    handleTransactionResponse,
    Affected,
})
{
    return function (props)
    {
        let doTheThing = function (consumerData) {
            let { cardId, requestId, responseKey } = consumerData;
            let {
                checkpoints,
                game,
                thisPersonId,
                _Affected,
            } = consumerData;
        
            let validResponses = {
                accept: 1,
                decline: 1,
            };
        
            let currentTurn = game.getCurrentTurn();
            let requestManager = currentTurn.getRequestManager();
        
            let request = requestManager.getRequest(requestId);
        
            if (
                isDef(request) &&
                !request.getTargetSatisfied() &&
                request.getTargetKey() === thisPersonId &&
                request.getType() === "stealProperty"
            ) {
                if (isDef(responseKey) && isDef(validResponses[responseKey])) {
                let { transaction } = request.getPayload();
        
                if (isDef(transaction)) {
        
                    if (responseKey === "decline") {
                    let hand = game.getPlayerHand(thisPersonId);
                    if (hand.hasCard(cardId)) {
        
                        //can the card decline the request
                        if (game.doesCardHaveTag(cardId, "declineRequest")) {
                        game.getActivePile().addCard(hand.giveCard(cardId));
        
                        _Affected.setAffected('ACTIVE_PILE');
                        _Affected.setAffected('HAND', thisPersonId, Affected.ACTION.UPDATE);
        
                        let doTheDecline = function ({
                            _Affected,
                            request,
                            checkpoints,
                        }) {
                            let { transaction } = request.getPayload();
                            let fromTarget = transaction
                            .get("fromTarget")
                            .get("property");
                            fromTarget.confirm(fromTarget.getRemainingList());
                            checkpoints.set("success", true);
                            request.setTargetSatisfied(true);
                            request.decline(consumerData);
                            request.close("decline");
        
                            _Affected.setAffected('REQUEST', request.getId(), Affected.ACTION.UPDATE);
                        };
        
                        if (game.doesCardHaveTag(cardId, "contestable")) {
                            let sayNoRequest = requestManager.makeJustSayNo(
                            request,
                            cardId
                            );
        
                            _Affected.setAffected('REQUEST', sayNoRequest.getId(), Affected.ACTION.CREATE);
                            _Affected.setAffected('PLAYER_REQUEST', sayNoRequest.getTargetKey(), Affected.ACTION.CREATE);
                            _Affected.setAffected('PLAYER_REQUEST', sayNoRequest.getAuthorKey(), Affected.ACTION.CREATE);
        
        
                            doTheDecline({
                            _Affected,
                            request,
                            checkpoints,
                            });
                        } else {
                            doTheDecline({
                            _Affected,
                            request,
                            checkpoints,
                            });
                        }
                        }
                    }
                    } else {
                    if (responseKey === "accept") {
                        // Move proposed properties to their colleciton areas
        
                        let targetPropertyIds = transaction
                        .get("fromTarget")
                        .get("property")
                        .getRemainingList();
                        targetPropertyIds.forEach((targetPropertyId) => {
                        let collection = game.getCollectionThatHasCard(
                            targetPropertyId
                        );
                        if (isDef(collection)) {
                            collection.removeCard(targetPropertyId);
                            transaction
                            .get("fromTarget")
                            .get("property")
                            .confirm(targetPropertyId);
                            game.cleanUpFromCollection(
                            collection.getPlayerKey(),
                            collection
                            );
                            transaction
                            .getOrCreate("toAuthor")
                            .getOrCreate("property")
                            .add(targetPropertyId);
        
                            _Affected.setAffected('COLLECTION', collection.getId(), Affected.ACTION.UPDATE);
                            _Affected.setAffected('PLAYER_COLLECTION', collection.getPlayerKey(), Affected.ACTION.UPDATE);
        
                        }
                        });
        
                        request.setTargetSatisfied(true);
                        request.accept(consumerData);
                        request.setStatus("accept");
        
                        _Affected.setAffected('REQUEST', requestId, Affected.ACTION.UPDATE);
                        checkpoints.set("success", true);
                    }
                    }
                }
                }
            }
        };
    
        let result = handleTransactionResponse(
            "RESPONSES",
            "RESPOND_TO_STEAL_PROPERTY",
            props,
            doTheThing
        );
        return result;
    }
}

module.exports = buildRespondToStealPropertyAction;
