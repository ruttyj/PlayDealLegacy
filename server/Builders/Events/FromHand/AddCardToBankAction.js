function buildAddCardToBankAction({
    makeProps,
    makeConsumerFallbackResponse,
    registry,
    makeResponse,
    isDef,
    handCardConsumer,
    AddressedResponse,
    log,
})
{
    return function (props)
    {
        let subject = "MY_TURN";
        let action = "ADD_CARD_TO_MY_BANK_FROM_HAND";
        const addressedResponses = new AddressedResponse();
        let status = "failure";
        return handCardConsumer(
          props,
          (props2, checkpoints) => {
            checkpoints.set("junk", false); // @TODO for some reason this is still needed

            let { cardId } = props2;
            let { hand, roomCode, game, thisPersonId } = props2;
            if (game.getCurrentTurn().getPhaseKey() === "action") {

              let card = hand.getCardById(cardId);
              if (isDef(card)) {

                if (game.getCurrentTurn().isWithinActionLimit()) {

                  if (game.canCardBeAddedToBank(card)) {

                    let isWildCard = game.doesCardHaveTag(card, "wild");

                    let bank = game.getPlayerBank(thisPersonId);
                    let hand = game.getPlayerHand(thisPersonId);
                    bank.addCard(hand.giveCard(cardId));
                    game.getCurrentTurn().setActionPreformed("BANK", card);

                    status = "success";

                    //PLAYER_HANDS
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
                    //PLAYER_BANKS
                    addressedResponses.addToBucket(
                      AddressedResponse.DEFAULT_BUCKET,
                      registry.execute('PLAYER_BANKS.GET_KEYED', makeProps(props, {
                        roomCode,
                        personId: thisPersonId,
                        receivingPeopleIds: allPlayerIds,
                      }))
                    );

                    //PLAYER_TURN
                    // Update current turn state
                    addressedResponses.addToBucket(
                      AddressedResponse.EVERYONE_BUCKET,
                      registry.execute('PLAYER_TURN.GET', makeProps(props))
                    );

                    // Wildcard could be any set, let other know
                    if (isWildCard) {
                      addressedResponses.addToBucket(
                        AddressedResponse.EVERYONE_BUCKET,
                        registry.execute('CARDS.GET_KEYED', makeProps(props, {cardId}))
                      );
                    }

                    // Confirm this executed
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
                  } else {
                    log("!canCardBeAddedToBank");
                  }
                }
              }
            }

            return addressedResponses;
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    }
}

module.exports = buildAddCardToBankAction;
