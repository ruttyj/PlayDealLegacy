const serverFolder = '../../';
const buildCoreFuncs = require(`${serverFolder}/Lib/Actions/ActionsCore`);
const BaseAction = require(`./BaseAction`);



function buildStealCollectionAction({ 
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

      execute(handlerProps) 
      {
        function doTheThing(props) {
          let { 
            game, 
            requestManager, currentTurn,
            cardId, theirCollectionId, thisPersonId,
            _Affected, checkpoints,
          } = props;
    
          let hand = game.getPlayerHand(thisPersonId);
          let activePile = game.getActivePile();
    
          checkpoints.set("isValidActionCard", false);
          if (game.doesCardHaveTag(cardId, "stealCollection")) {
            checkpoints.set("isValidActionCard", true);
    
            let theirCollection = game
              .getCollectionManager()
              .getCollection(theirCollectionId);
            let collectionOwnerId = theirCollection.getPlayerKey();
            checkpoints.set("isValidCollection", false);
            if (String(collectionOwnerId) !== String(thisPersonId)) {
              checkpoints.set("isValidCollection", true);
    
              checkpoints.set("isValidPropertySetKey", false);
              if (
                !game.constants.NON_PROPERTY_SET_KEYS.includes(
                  theirCollection.getPropertySetKey
                )
              ) {
                checkpoints.set("isValidPropertySetKey", true);
    
                checkpoints.set("isCompleteCollection", false);
                if (theirCollection.isFull()) {
                  checkpoints.set("isCompleteCollection", true);
    
                  // Use card
                  activePile.addCard(hand.giveCard(game.getCard(cardId)));
                  currentTurn.setActionPreformed(
                    "REQUEST",
                    game.getCard(cardId)
                  );
                  _Affected.setAffected('ACTIVE_PILE');
    
                  // Log action preformed
                  let actionNum = currentTurn.getActionCount();
    
                  let transaction = Transaction();
                  transaction
                    .getOrCreate("fromTarget")
                    .getOrCreate("collection")
                    .add(theirCollectionId);
    
                  let request = requestManager.createRequest({
                    type: "stealCollection",
                    authorKey: thisPersonId,
                    targetKey: theirCollection.getPlayerKey(),
                    status: "open",
                    actionNum: actionNum,
                    payload: {
                      actionNum: actionNum,
                      actionCardId: cardId,
                      transaction: transaction,
                    },
                    description: `Steal collection`,
                  });
                  
                  _Affected.setAffected('REQUEST', request.getId(), Affected.ACTION.UPDATE);
                  _Affected.setAffected('ACTIVE_PILE');
    
                  checkpoints.set("success", true);
                }
              }
            }
          }
        }
        
        return handleRequestCreation(
          "MY_TURN",
          "STEAL_COLLECTION",
          handlerProps,
          doTheThing
        );
      }

  }

  return StealCollectionAction;
}

module.exports = buildStealCollectionAction;