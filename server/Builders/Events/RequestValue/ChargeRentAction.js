function buildChargeRentAction({ 
    AddressedResponse,
    makeConsumerFallbackResponse,
    handleGame,
    handleCollectionBasedRequestCreation,
  }) {

  return function (props) {
    const subject = "MY_TURN";
      const action = "CHARGE_RENT";
      const addressedResponses = new AddressedResponse();
      return handleGame(
        props,
        (consumerData) => {
          let { game } = consumerData;
          return handleCollectionBasedRequestCreation(
            subject,
            action,
            props,
            game.requestRent,
          );
        },
        makeConsumerFallbackResponse({ subject, action, addressedResponses })
      );
    }
}

module.exports = buildChargeRentAction;