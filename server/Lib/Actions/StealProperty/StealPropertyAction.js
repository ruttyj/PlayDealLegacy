/**
 * StealPropertyAction
 * STEAL_PROPERTY
 * const buildStealPropertyAction = require(`${serverFolder}/Lib/Actions/StealPropertyAction`);
 */
function buildStealPropertyAction({
    handleRequestCreation,
    PUBLIC_SUBJECTS,
    Affected,
    Transaction,
    isDef,
})
{
    function stealPropertyAction(props)
    {
        function doTheThing(theGoods) {
            let { cardId, myPropertyCardId, theirPropertyCardId } = theGoods;
            let { thisPersonId, _Affected, checkpoints } = theGoods;
      
            let { game, requestManager, currentTurn } = theGoods;
      
            let hand = game.getPlayerHand(thisPersonId);
            let activePile = game.getActivePile();
      
            checkpoints.set("isValidSwapPropertyActionCard", false);
            if (game.doesCardHaveTag(cardId, "stealProperty")) {
              checkpoints.set("isValidSwapPropertyActionCard", true);
      
              // Their collection?
              let theirCollection = game.getCollectionThatHasCard(
                theirPropertyCardId
              );
              checkpoints.set("isTheirCollection", false);
              if (isDef(theirCollection)) {
                if (
                  String(theirCollection.getPlayerKey()) !== String(thisPersonId)
                ) {
                  checkpoints.set("isTheirCollection", true);
      
                  // Are valid cards? Augments might affect this in the future
                  let isValidCards = true;
                  checkpoints.set("isValidCards", false);
      
                  checkpoints.set("isTheirCollectionNotFull", false);
                  if (!theirCollection.isFull()) {
                    checkpoints.set("isTheirCollectionNotFull", true);
                  }
      
                  isValidCards = checkpoints.get("isTheirCollectionNotFull");
      
                  // are they tagged as property?
                  if (isValidCards) {
                    let isTheirCardProperty = game.doesCardHaveTag(
                      theirPropertyCardId,
                      "property"
                    );
      
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
      
                    let request = requestManager.createRequest({
                      type: "stealProperty",
                      authorKey: thisPersonId,
                      targetKey: theirCollection.getPlayerKey(),
                      status: "open",
                      actionNum: actionNum,
                      payload: {
                        actionNum: actionNum,
                        actionCardId: cardId,
                        transaction: transaction,
                      },
                      description: `Steal properties`,
                    });
                   
                    _Affected.setAffected('REQUEST', request.getId(), Affected.ACTION.UPDATE)
                    _Affected.setAffected('ACTIVE_PILE');
                    checkpoints.set("success", true);
                  }
                }
              }
            }
          }
      
          return handleRequestCreation(
            "MY_TURN",
            "STEAL_PROPERTY",
            props,
            doTheThing
          );
        
    }
    return stealPropertyAction;
}

module.exports = buildStealPropertyAction;
