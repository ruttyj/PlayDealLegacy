function buildAcknowledgeCollectNothingAction({
    Affected,
    handleTransactionResponse,
})
{
  return function (props)
  {
    let doTheThing = function (consumerData) {
      let { _Affected, checkpoints, request, thisPersonId } = consumerData;
      _Affected.setAffected('REQUEST', request.getId(), Affected.ACTION.UPDATE);
      _Affected.setAffected('BANK', thisPersonId, Affected.ACTION.UPDATE);
      checkpoints.set("success", true);
    };

    return handleTransactionResponse(
      "RESPONSES",
      "ACKNOWLEDGE_COLLECT_NOTHING",
      props,
      doTheThing
    );
  }
}

module.exports = buildAcknowledgeCollectNothingAction;
