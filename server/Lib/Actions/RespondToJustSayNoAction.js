function buildRespondToJustSayNoAction({
    handleGame, AddressedResponse, makeConsumerFallbackResponse, handleTransactionResponse, PUBLIC_SUBJECTS
})
{
    function respondToJustSayNoAction(props)
    {
        let subject = "RESPONSES";
        let action = "RESPOND_TO_JUST_SAY_NO";
        const addressedResponses = new AddressedResponse();
        return handleGame(
          props,
          ({game}) => {
            return handleTransactionResponse(
              PUBLIC_SUBJECTS,
              subject,
              action,
              props,
              game.respondToJustSayNo
            );
          },
          makeConsumerFallbackResponse({ subject, action, addressedResponses })
        );
    }
    return respondToJustSayNoAction;
}

module.exports = buildRespondToJustSayNoAction;