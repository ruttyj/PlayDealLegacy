const serverFolder = '../../';
const buildCoreFuncs = require(`${serverFolder}/Lib/Actions/ActionsCore`);
const BaseAction = require(`./BaseAction`);



function buildChargeRentAction({ 
    // Helper methods
    isDef, isArr, isFunc, getArrFromProp,

    // Objects
    Affected, SocketResponseBuckets, Transaction,

    // Dependencies
    roomManager, 
    
    // Props linked to socket instance
    myClientId, 

    // Formatters
    packageCheckpoints,

    // Socket Methods
    PUBLIC_SUBJECTS
  }) {

  
  let {
    makeProps,
    makeResponse,
    makeConsumerFallbackResponse,
    handleRoom,
    handlePerson,
    handleGame,
    makeConsumer,
    handCardConsumer,
    myTurnConsumerBase,
    handleCollectionBasedRequestCreation,
    handleRequestCreation,
  } = buildCoreFuncs({
    isDef, isArr, isFunc, getArrFromProp,
    Affected, SocketResponseBuckets,
    roomManager, myClientId,
    packageCheckpoints,
    PUBLIC_SUBJECTS
  })

  class StealCollectionAction extends BaseAction {

      constructor() {
          super();
      }

      execute(props) {
        const subject = "MY_TURN";
        const action = "CHARGE_RENT";
        const socketResponses = SocketResponseBuckets();

        return handleGame(
          props,
          (consumerData, checkpoints) => {
            let { game, personManager, thisPersonId } = consumerData;
            return handleCollectionBasedRequestCreation(
              PUBLIC_SUBJECTS,
              subject,
              action,
              props,
              game.requestRent
            );
          },
          makeConsumerFallbackResponse({ subject, action, socketResponses })
        );
      }

  }

  return StealCollectionAction;
}

module.exports = buildChargeRentAction;