/**
 * COLLECT_CARD_TO_COLLECTION
 * const buildCollectCardToCollectionAction = require(`${serverFolder}/Lib/Actions/CollectCardToCollectionAction`);
 */
function buildCollectCardToCollectionAction({
    isDef,
    Affected,
    handleTransferResponse,
    PUBLIC_SUBJECTS,
})
{
    function collectCardToCollectionAction(props)
    {

        let doTheThing = function (consumerData) {
            let { cardId, requestId, collectionId } = consumerData;
            let {
              _Affected,
              transfering,
              checkpoints,
              game,
              thisPersonId,
              player,
              roomCode,
              addressedResponses,
            } = consumerData;
            let playerManager = game.getPlayerManager();
            let status = "failure";
      
            // if card is in list of transfer cards and has not already been processed
            if (transfering.has("property")) {
              let transferPropertiesToMe = transfering.get("property");
              let cardIds = transferPropertiesToMe.getRemainingList();
              if (cardIds.includes(cardId)) {
                let card = game.getCard(cardId);
                let collection;
      
                // If my collection is specified to transfer to
                if (isDef(collectionId)) {
                  if (player.hasCollectionId(collectionId)) {
                    let transformCollection = game.canAddCardToCollection(
                      cardId,
                      collectionId
                    );
                    let decidedPropertySetKey =
                      transformCollection.newPropertySetKey;
                    let canBeAdded = transformCollection.canBeAdded;
      
                    if (canBeAdded) {
                      collection = game
                        .getCollectionManager()
                        .getCollection(collectionId);
                      if (
                        collection.getPropertySetKey() !== decidedPropertySetKey
                      ) {
                        collection.setPropertySetKey(decidedPropertySetKey);
                      }
                      collection.addCard(cardId);
                      transferPropertiesToMe.confirm(cardId);
                      status = "success";
                    }
                    // if is augment card and cannot be placed in specified set, add to junk set
                    else if (game.isCardSetAugment(card)) {
                      collection = game.getOrCreateUselessCollectionForPlayer(
                        thisPersonId
                      );
                      collection.addCard(cardId);
                      transferPropertiesToMe.confirm(cardId);
                      status = "success";
                    }
                  }
                } else {
                  collection = playerManager.createNewCollectionForPlayer(
                    thisPersonId
                  );
                  collection.addCard(cardId);
                  transferPropertiesToMe.confirm(cardId);
                  status = "success";
                }
      
                if (isDef(collection) && status === "success") {
      
                  // @TODO move this above to correctly reflect create / update
                  _Affected.setAffected('REQUEST', requestId, Affected.ACTION.UPDATE);
                  _Affected.setAffected('COLLECTION', collection.getId(), Affected.ACTION.UPDATE);
                  _Affected.setAffected('PLAYER_COLLECTION', collection.getPlayerKey(), Affected.ACTION.UPDATE);
      
                  checkpoints.set("success", true);
      
                  if (game.checkWinConditionForPlayer(thisPersonId)) {
                    addressedResponses.addToBucket(
                      "everyone",
                      PUBLIC_SUBJECTS.GAME.STATUS(makeProps(props))
                    );
                  }
                }
              }
            }
          };
      
          let result = handleTransferResponse(
            PUBLIC_SUBJECTS,
            "RESPONSES",
            "COLLECT_CARD_TO_COLLECTION",
            props,
            doTheThing
          );
          return result;
        
    }
    return collectCardToCollectionAction;
}

module.exports = buildCollectCardToCollectionAction;
