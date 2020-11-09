/**
 * SwapPropertyAction
 * SWAP_PROPERTY
 * @SEARCH_REPLACE : SwapPropertyAction | swapPropertyAction
 * const buildSwapPropertyAction = require(`${serverFolder}/Lib/Actions/SwapPropertyAction`);
 */
function buildSwapPropertyAction({
    PUBLIC_SUBJECTS,
    handleRequestCreation,
    Affected,
    Transaction,
    isDef,
})
{
    function swapPropertyAction(props)
    {
        function doTheThing(theGoods) {
            let { cardId, myPropertyCardId, theirPropertyCardId } = theGoods;
            let { thisPersonId, _Affected, checkpoints } = theGoods;
      
            let { game, requestManager, currentTurn } = theGoods;
      
            let hand = game.getPlayerHand(thisPersonId);
            let activePile = game.getActivePile();
      
            //let augmentUsesActionCount = game.getConfig(CONFIG.ACTION_AUGMENT_CARDS_COST_ACTION, true);
            //if(augmentUsesActionCount){
            //  validAugmentCardsIds.forEach(augCardId => {
            //    currentTurn.setActionPreformed("REQUEST", game.getCard(cardId));
            //  })
            //}
      
            let actionCard = game.getCard(cardId);
            checkpoints.set("isValidSwapPropertyActionCard", false);
            if (game.doesCardHaveTag(cardId, "swapProperty")) {
              checkpoints.set("isValidSwapPropertyActionCard", true);
      
              // My collection?
              let myCollection = game.getCollectionThatHasCard(myPropertyCardId);
              checkpoints.set("isMyCollection", false);
              if (isDef(myCollection)) {
                if (
                  String(myCollection.getPlayerKey()) === String(thisPersonId)
                ) {
                  checkpoints.set("isMyCollection", true);
      
                  // Their collection?
                  let theirCollection = game.getCollectionThatHasCard(
                    theirPropertyCardId
                  );
                  checkpoints.set("isTheirCollection", false);
                  if (isDef(theirCollection)) {
                    if (
                      String(theirCollection.getPlayerKey()) !==
                      String(thisPersonId)
                    ) {
                      checkpoints.set("isTheirCollection", true);
      
                      // Are valid cards? Augments might affect this in the future
                      let isValidCards = true;
                      checkpoints.set("isValidCards", false);
      
                      checkpoints.set("isTheirCollectionNotFull", false);
                      if (!theirCollection.isFull()) {
                        checkpoints.set("isTheirCollectionNotFull", true);
                      }
      
                      checkpoints.set("isMyCollectionNotFull", false);
                      if (!myCollection.isFull()) {
                        checkpoints.set("isMyCollectionNotFull", true);
                      }
      
                      isValidCards =
                        checkpoints.get("isTheirCollectionNotFull") &&
                        checkpoints.get("isMyCollectionNotFull");
      
                      // are they tagged as property?
                      if (isValidCards) {
                        let isMyCardProperty = game.doesCardHaveTag(
                          myPropertyCardId,
                          "property"
                        );
                        let isTheirCardProperty = game.doesCardHaveTag(
                          theirPropertyCardId,
                          "property"
                        );
      
                        checkpoints.set("isMyCardProperty", false);
                        if (isMyCardProperty) {
                          checkpoints.set("isMyCardProperty", true);
                        } else {
                          isValidCards = false;
                        }
      
                        checkpoints.set("isTheirCardProperty", false);
                        if (isTheirCardProperty) {
                          checkpoints.set("isTheirCardProperty", true);
                        } else {
                          isValidCards = false;
                        }
                      }
      
                      if (isValidCards) {
                        checkpoints.set("isValidCards", true);
      
                        activePile.addCard(hand.giveCard(game.getCard(cardId)));
                        _Affected.setAffected('ACTIVE_PILE');
      
                        currentTurn.setActionPreformed(
                          "REQUEST",
                          game.getCard(cardId)
                        );
                        // Log action preformed
                        let actionNum = currentTurn.getActionCount();
      
                        let transaction = Transaction();
                        transaction
                          .getOrCreate("fromTarget")
                          .getOrCreate("property")
                          .add(theirPropertyCardId);
                        transaction
                          .getOrCreate("fromAuthor")
                          .getOrCreate("property")
                          .add(myPropertyCardId);
      
                        let request = requestManager.createRequest({
                          type: "swapProperty",
                          authorKey: thisPersonId,
                          targetKey: theirCollection.getPlayerKey(),
                          status: "open",
                          actionNum: actionNum,
                          payload: {
                            actionNum: actionNum,
                            actionCardId: cardId,
                            transaction: transaction,
                          },
                          description: `Swap properties`,
                        });
      
                        _Affected.setAffected('REQUEST', request.getId(), Affected.ACTION.UPDATE)
                        _Affected.setAffected('ACTIVE_PILE');
      
                        checkpoints.set("success", true);
                      }
                    }
                  }
                }
              }
            }
          }
      
          return handleRequestCreation(
            PUBLIC_SUBJECTS,
            "MY_TURN",
            "SWAP_PROPERTY",
            props,
            doTheThing
          );
    }
    return swapPropertyAction;
}

module.exports = buildSwapPropertyAction;
