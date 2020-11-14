/**
 * AcknowledgeCollectNothingAction
 * ACKNOWLEDGE_COLLECT_NOTHING
 * const buildAcknowledgeCollectNothingAction = require(`${serverFolder}/Lib/Actions/AcknowledgeCollectNothingAction`);
 */
function buildAcknowledgeCollectNothingAction({
    Affected,
    handleTransactionResponse,
})
{
    function acknowledgeCollectNothingAction(props)
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
    return acknowledgeCollectNothingAction;
}

module.exports = buildAcknowledgeCollectNothingAction;
