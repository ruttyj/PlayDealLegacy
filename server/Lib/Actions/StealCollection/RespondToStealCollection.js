/**
 * RESPOND_TO_STEAL_COLLECTION
 */
function buildRespondToStealCollection({
    isDef, 
    PUBLIC_SUBJECTS,
    handleTransactionResponse,
    Affected,
})
{
    function respondToStealCollection(props)
    {
          let doTheThing = function (consumerData) {
            let { cardId, requestId, responseKey } = consumerData;
            let {
              _Affected,
              checkpoints,
              game,
              thisPersonId,
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
              request.getType() === "stealCollection"
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
                        _Affected.setAffected('HAND', thisPersonId, Affected.ACTION.UPDATE);
                        _Affected.setAffected('ACTIVE_PILE');
      
                        let doTheDecline = function ({
                          _Affected,
                          request,
                          checkpoints,
                        }) {
                          let { transaction } = request.getPayload();
                          let fromTarget = transaction
                            .get("fromTarget")
                            .get("collection");
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
      
      
      
                          doTheDecline({
                            request,
                            _Affected,
                            checkpoints,
                          });
                        } else {
                          doTheDecline({
                            request,
                            _Affected,
                            checkpoints,
                          });
                        }
                      }
                    }
                  } else {
                    if (responseKey === "accept") {
                      // Move proposed properties to their colleciton areas
                      
      
                      let targetIds = transaction
                        .get("fromTarget")
                        .get("collection")
                        .getRemainingList();
      
                      targetIds.forEach((collectionId) => {
                        let collection = game
                          .getCollectionManager()
                          .getCollection(collectionId);
                        if (isDef(collection)) {
                          game
                            .getPlayerManager()
                            .disassociateCollectionFromPlayer(collection);
      
                          transaction
                            .get("fromTarget")
                            .get("collection")
                            .confirm(collectionId);
                          transaction
                            .getOrCreate("toAuthor")
                            .getOrCreate("collection")
                            .add(collectionId);
      
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
            PUBLIC_SUBJECTS,
            "RESPONSES",
            "RESPOND_TO_STEAL_COLLECTION",
            props,
            doTheThing
          );
          return result;
    }
    return respondToStealCollection;
}

module.exports = buildRespondToStealCollection;
