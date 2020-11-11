function buildChargeRentAction({ 
    // Objects
    AddressedResponse,

    // Socket Methods
    PUBLIC_SUBJECTS,
    makeConsumerFallbackResponse,
    handleGame,
    handleCollectionBasedRequestCreation,
  }) {

  function ChargeRentAction(props) {
    const subject = "MY_TURN";
      const action = "CHARGE_RENT";
      const socketResponses = new AddressedResponse();

      return handleGame(
        props,
        (consumerData) => {
          let { game } = consumerData;
          return handleCollectionBasedRequestCreation(
            PUBLIC_SUBJECTS,
            subject,
            action,
            props,
            game.requestRent,
          );
        },
        makeConsumerFallbackResponse({ subject, action, socketResponses })
      );
    }

  return ChargeRentAction;
}

module.exports = buildChargeRentAction;