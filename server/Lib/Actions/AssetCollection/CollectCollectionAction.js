/**
 * COLLECT_COLLECTION
 * const buildCollectCollectionAction = require(`${serverFolder}/Lib/Actions/CollectCollectionAction`);
 */
function buildCollectCollectionAction({
    isDef,
    Affected,
    handleTransferResponse,
    registry,
})
{
    function collectCollectionAction(props)
    {
        let doTheThing = function (consumerData) {
            let { requestId } = consumerData;
            let {
              _Affected,
              transfering,
              checkpoints,
              game,
              thisPersonId,
              addressedResponses,
            } = consumerData;
            let playerManager = game.getPlayerManager();
      
            // if card is in list of transfer cards and has not already been processed
            checkpoints.set("isValidTransferCard", false);
            if (transfering.has("collection")) {
              let transferToMe = transfering.get("collection");
              let collectionIds = transferToMe.getRemainingList();
      
              collectionIds.forEach((collectionId) => {
                let collection = game
                  .getCollectionManager()
                  .getCollection(collectionId);
                if (isDef(collection)) {
                  // should already be dissacoated but make sure
                  playerManager.disassociateCollectionFromPlayer(collectionId);
      
                  //add to new player
                  playerManager.associateCollectionToPlayer(
                    collectionId,
                    thisPersonId
                  );
                  transferToMe.confirm(collectionId);
      
                  checkpoints.set("success", true);
                  _Affected.setAffected('REQUEST', requestId, Affected.ACTION.UPDATE);
                  _Affected.setAffected('COLLECTION', collection.getId(), Affected.ACTION.UPDATE);
                  _Affected.setAffected('PLAYER_COLLECTION', collection.getPlayerKey(), Affected.ACTION.UPDATE);
                }
              });
      
              if (game.checkWinConditionForPlayer(thisPersonId)) {
                addressedResponses.addToBucket(
                  "everyone",
                  registry.execute('GAME.STATUS', makeProps(props))
                );
              }
            }
          };
      
          let result = handleTransferResponse(
            "RESPONSES",
            "COLLECT_COLLECTION",
            props,
            doTheThing
          );
          return result;
        
    }
    return collectCollectionAction;
}

module.exports = buildCollectCollectionAction;
