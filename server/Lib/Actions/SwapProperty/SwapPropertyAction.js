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
            if (game.doesCardHaveTag(cardId, "swapProperty")) {
              // My collection?
              let myCollection = game.getCollectionThatHasCard(myPropertyCardId);
              if (isDef(myCollection)) {
                if (
                  String(myCollection.getPlayerKey()) === String(thisPersonId)
                ) {
                  // Their collection?
                  let theirCollection = game.getCollectionThatHasCard(
                    theirPropertyCardId
                  );
                  if (isDef(theirCollection)) {
                    if (
                      String(theirCollection.getPlayerKey()) !==
                      String(thisPersonId)
                    ) {
                      // Are valid cards? Augments might affect this in the future
                      let isValidCards = true;
                      let isTheirCollectionNotFull = false;
                      if (!theirCollection.isFull()) {
                        isTheirCollectionNotFull = true;
                      }
      
                      let isMyCollectionNotFull = false;
                      if (!myCollection.isFull()) {
                        isMyCollectionNotFull = true;
                      }
      
                      isValidCards = isTheirCollectionNotFull && isMyCollectionNotFull;
      
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
      
                        if (!isMyCardProperty) {
                          isValidCards = false;
                        }
      
                        if (!isTheirCardProperty) {
                          isValidCards = false;
                        }
                      }
      
                      if (isValidCards) {
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
            "MY_TURN",
            "SWAP_PROPERTY",
            props,
            doTheThing
          );
    }
    return swapPropertyAction;
}

module.exports = buildSwapPropertyAction;
