function buildRespondToJustSayNoAction({
    handleGame, 
    AddressedResponse, 
    makeConsumerFallbackResponse, 
    handleTransactionResponse, 
})
{
    return function (props)
    {
        let subject = "RESPONSES";
        let action = "RESPOND_TO_JUST_SAY_NO";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          ({game}) => {
            return handleTransactionResponse(
              subject,
              action,
              props,
              game.respondToJustSayNo
            );
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    }
}

module.exports = buildRespondToJustSayNoAction;