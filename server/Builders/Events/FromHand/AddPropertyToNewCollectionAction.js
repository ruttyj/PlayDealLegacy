function buildAddPropertyToNewCollectionAction({
    makeProps,
    makeConsumerFallbackResponse,
    registry,
    makeResponse,
    isDef,
    handCardConsumer,
    AddressedResponse,
})
{
    return function (props)
    {

        let subject = "MY_TURN";
        let action = "ADD_PROPERTY_TO_NEW_COLLECTION_FROM_HAND";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            let {
              cardId,
              card,
              hand,
              roomCode,
              game,
              thisPersonId,
            } = props2;

            // CARD IS PROPERTY
            if (game.isCardProperty(card)) {
              let isSuperWildCard = game.doesCardHaveTag(card, "superWild");
              let isWildCard = game.doesCardHaveTag(card, "wild");

              let decidedPropertySetKey;
              if (isSuperWildCard) {
                decidedPropertySetKey = game.constants.AMBIGUOUS_SET_KEY;
              } else {
                decidedPropertySetKey = card.set;
              }

              // BELONGS TO A hasPropertySet
              if (isDef(decidedPropertySetKey)) {

                let handBefore = hand.serialize();
                //
                let collection = game.playCardFromHandToNewCollection(
                  thisPersonId,
                  cardId
                );
                if (isDef(collection)) {
                  collection.setPropertySetKey(decidedPropertySetKey);
                  status = "success";

                  //Update collection contents
                  addressedResponses.addToBucket(
                    AddressedResponse.EVERYONE_BUCKET,
                    registry.execute('COLLECTIONS.GET_KEYED', makeProps(props, {
                      roomCode,
                      collectionId: collection.getId(),
                    }))
                  );

                  // Update who has what collection
                  addressedResponses.addToBucket(
                    AddressedResponse.EVERYONE_BUCKET,
                    registry.execute('PLAYER_COLLECTIONS.GET_KEYED', makeProps(props, {
                      personId: thisPersonId,
                    }))
                  );

                  if (isWildCard) {
                    addressedResponses.addToBucket(
                      AddressedResponse.EVERYONE_BUCKET,
                      registry.execute('CARDS.GET_KEYED', makeProps(props, {cardId}))
                    );
                  }

                  // Emit updated player turn
                  addressedResponses.addToBucket(
                    AddressedResponse.EVERYONE_BUCKET,
                    registry.execute('PLAYER_TURN.GET', makeProps(props))
                  );

                  // Update everyone with my new hand
                  let allPlayerIds = game.getAllPlayerKeys();
                  addressedResponses.addToBucket(
                    AddressedResponse.DEFAULT_BUCKET,
                    registry.execute('PLAYER_HANDS.GET_KEYED', makeProps(props, {
                      roomCode,
                      personId: thisPersonId,
                      receivingPeopleIds: allPlayerIds,
                    }))
                  );
                }
              }
            }

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              addressedResponses.addToBucket(
                AddressedResponse.EVERYONE_BUCKET,
                registry.execute('GAME.STATUS', makeProps(props))
              );
            }

            // confirm action for async await
            let payload = {};
            addressedResponses.addToBucket(
              AddressedResponse.DEFAULT_BUCKET,
              makeResponse({ subject, action, status, payload })
            );

            if (game.checkWinConditionForPlayer(thisPersonId)) {
              addressedResponses.addToBucket(
                AddressedResponse.EVERYONE_BUCKET,
                registry.execute('GAME.STATUS', makeProps(props))
              );
            }
            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
      
    }
}

module.exports = buildAddPropertyToNewCollectionAction;
