function buildRequestValueAction({
    handleRequestCreation,
    Affected,
    Transaction,
    isDefNested,
    isDef,
})
{
    return function (props)
    {
        
        function doTheThing(theGoods) {
            let { cardId } = theGoods;
            let { thisPersonId, _Affected, checkpoints } = theGoods;
      
            let { game, requestManager, currentTurn } = theGoods;
            let { augments, targetPeopleIds } = theGoods;
      
            let hand = game.getPlayerHand(thisPersonId);
            let activePile = game.getActivePile();
            activePile.addCard(hand.giveCard(game.getCard(cardId)));
            _Affected.setAffected('ACTIVE_PILE');
      
            currentTurn.setActionPreformed("REQUEST", game.getCard(cardId));
            //let augmentUsesActionCount = game.getConfig(CONFIG.ACTION_AUGMENT_CARDS_COST_ACTION, true);
            //if(augmentUsesActionCount){
            //  validAugmentCardsIds.forEach(augCardId => {
            //    currentTurn.setActionPreformed("REQUEST", game.getCard(cardId));
            //  })
            //}
            let actionNum = currentTurn.getActionCount();
      
            let card = game.getCard(cardId);
            if (isDefNested(card, ["action", "collectValue"])) {
              targetPeopleIds.forEach((targetPersonId) => {
                if (isDef(targetPersonId)) {
                  let transaction = Transaction();
                  transaction.getOrCreate("toAuthor");
                  let value = card.action.collectValue;
                  let request = requestManager.createRequest({
                    type: "collectValue",
                    authorKey: thisPersonId,
                    targetKey: targetPersonId,
                    status: "open",
                    actionNum: actionNum,
                    payload: {
                      actionNum: actionNum,
                      amountDue: value,
                      amountRemaining: value,
                      baseValue: value,
                      actionCardId: cardId,
                      transaction: transaction,
                      augments: augments,
                    },
                    description: `Collect Debt`,
                  });
                  
                  _Affected.setAffected('REQUEST', request.getId(), Affected.ACTION.UPDATE);
                  checkpoints.set("success", true);
                }
              });
            }
          }
      
          return handleRequestCreation(
            "MY_TURN",
            "VALUE_COLLECTION",
            props,
            doTheThing
          );
        
    }
}

module.exports = buildRequestValueAction;
