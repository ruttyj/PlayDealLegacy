function buildRespondToJustSayNoAction({
    handleGame, AddressedResponse, makeConsumerFallbackResponse, handleTransactionResponse, PUBLIC_SUBJECTS
})
{
    function respondToJustSayNoAction(props)
    {
        let subject = "RESPONSES";
        let action = "RESPOND_TO_JUST_SAY_NO";
        const socketResponses = new AddressedResponse();
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
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
    }
    return respondToJustSayNoAction;
}

module.exports = buildRespondToJustSayNoAction;