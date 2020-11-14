/**
 * StealPropertyAction
 * STEAL_PROPERTY
 * const buildStealPropertyAction = require(`${serverFolder}/Lib/Actions/StealPropertyAction`);
 */
function buildStealPropertyAction({
    handleRequestCreation,
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
      
            if (game.doesCardHaveTag(cardId, "stealProperty")) {
              // Their collection?
              let theirCollection = game.getCollectionThatHasCard(
                theirPropertyCardId
              );
              if (isDef(theirCollection)) {
                if (
                  String(theirCollection.getPlayerKey()) !== String(thisPersonId)
                ) {
                  // Are valid cards? Augments might affect this in the future
                  let isValidCards = true;
                  if (!theirCollection.isFull()) {
                    isValidCards = true;
                  }
      
                  // are they tagged as property?
                  if (isValidCards) {
                    let isTheirCardProperty = game.doesCardHaveTag(
                      theirPropertyCardId,
                      "property"
                    );
      
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
