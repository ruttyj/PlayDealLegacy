function buildStealCollectionAction({ 
    Affected, Transaction, 
    handleRequestCreation,
  }) {
  return function (handlerProps) {
    function doTheThing(props) {
      let { 
        game, 
        requestManager, currentTurn,
        cardId, theirCollectionId, thisPersonId,
        // Wrapper will act on these
        _Affected, checkpoints,
      } = props;

      let hand = game.getPlayerHand(thisPersonId);
      let activePile = game.getActivePile();

      if (game.doesCardHaveTag(cardId, "stealCollection")) {

        let theirCollection = game
          .getCollectionManager()
          .getCollection(theirCollectionId);
        let collectionOwnerId = theirCollection.getPlayerKey();
        if (String(collectionOwnerId) !== String(thisPersonId)) {

          if (
            !game.constants.NON_PROPERTY_SET_KEYS.includes(
              theirCollection.getPropertySetKey
            )
          ) {
            if (theirCollection.isFull()) {
              // Use card
              activePile.addCard(hand.giveCard(game.getCard(cardId)));
              currentTurn.setActionPreformed(
                "REQUEST",
                game.getCard(cardId)
              );
              _Affected.setAffected('ACTIVE_PILE');

              // Log action preformed
              let actionNum = currentTurn.getActionCount();

              let transaction = Transaction();
              transaction
                .getOrCreate("fromTarget")
                .getOrCreate("collection")
                .add(theirCollectionId);

              let request = requestManager.createRequest({
                type: "stealCollection",
                authorKey: thisPersonId,
                targetKey: theirCollection.getPlayerKey(),
                status: "open",
                actionNum: actionNum,
                payload: {
                  actionNum: actionNum,
                  actionCardId: cardId,
                  transaction: transaction,
                },
                description: `Steal collection`,
              });
              
              _Affected.setAffected('REQUEST', request.getId(), Affected.ACTION.UPDATE);
              _Affected.setAffected('ACTIVE_PILE');

              checkpoints.set("success", true);
            }
          }
        }
      }
    }
    
    return handleRequestCreation(
      "MY_TURN",
      "STEAL_COLLECTION",
      handlerProps,
      doTheThing
    );
  }
}

module.exports = buildStealCollectionAction;