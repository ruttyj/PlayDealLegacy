const builderFolder = `../../Builders/`

const builderFolder = `../../Builders/`


/**
 * 
 * TODO #$%^&$#^&$%#^&%$^&%$#%^&$%
 * if discard and actions still remain offer them to play remaining actions
 * When accepting payment from rent place in set if can be placed in set (when no previous set existed)
 * Change color of set / move cards around at "done" phase
 * 
 */

const buildChangeCardActiveSetAction                = require(`${builderFolder}/Events/ChangeCardActiveSetAction`)

const buildRegisterCardMethods                      = require(`${builderFolder}/Methods/Card/`)

// From Hand
const buildAddCardToBankAction                      = require(`${builderFolder}/Events/FromHand/AddCardToBankAction`)
const buildAddPropertyToNewCollectionAction         = require(`${builderFolder}/Events/FromHand/AddPropertyToNewCollectionAction`)
const buildAddPropertyToExitingCollectionAction     = require(`${builderFolder}/Events/FromHand/AddPropertyToExitingCollectionAction`)
const buildAddSetAugmentToExistingCollectionAction  = require(`${builderFolder}/Events/FromHand/AddSetAugmentToExistingCollectionAction`)
const buildAddSetAugmentToNewCollectionAction       = require(`${builderFolder}/Events/FromHand/AddSetAugmentToNewCollectionAction`)

// Turn based
const buildTurnStartingDrawAction                   = require(`${builderFolder}/Events/TurnPhase/TurnStartingDrawAction`)
const buildAttemptFinishTurnAction                  = require(`${builderFolder}/Events/TurnPhase/AttemptFinishTurnAction`)
const buildDiscardToHandLimitAction                 = require(`${builderFolder}/Events/TurnPhase/DiscardToHandLimitAction`)

// From Collection
const buildTransferPropertyToNewCollectionFromExistingAction          = require(`${builderFolder}/Events/FromCollection/TransferPropertyToNewCollectionFromExistingAction`)
const buildTransferPropertyToExistingCollectionFromExistingAction     = require(`${builderFolder}/Events/FromCollection/TransferPropertyToExistingCollectionFromExistingAction`)
const buildTransferSetAugmentToExistingCollectionFromExistingAction   = require(`${builderFolder}/Events/FromCollection/TransferSetAugmentToExistingCollectionFromExistingAction`)
const buildTransferSetAugmentToNewCollectionFromExistingAction        = require(`${builderFolder}/Events/FromCollection/TransferSetAugmentToNewCollectionFromExistingAction`)

// Request Value
const buildChargeRentAction                         = require(`${builderFolder}/Events/RequestValue/ChargeRentAction`)
const buildRequestValueAction                       = require(`${builderFolder}/Events/RequestValue/RequestValueAction`)
const buildRespondToCollectValueAction              = require(`${builderFolder}/Events/RequestValue/RespondToCollectValueAction`)

// Request Response 
const buildRespondToJustSayNoAction                 = require(`${builderFolder}/Events/RespondToJustSayNoAction`)

const buildDrawCardsAction                          = require(`${builderFolder}/Events/DrawCardsAction`)

// Asset Collection
const buildAcknowledgeCollectNothingAction          = require(`${builderFolder}/Events/AssetCollection/AcknowledgeCollectNothingAction`)
const buildCollectCardToBankAutoAction              = require(`${builderFolder}/Events/AssetCollection/CollectCardToBankAutoAction`)
const buildCollectCardToBankAction                  = require(`${builderFolder}/Events/AssetCollection/CollectCardToBankAction`)
const buildCollectCardToCollectionAction            = require(`${builderFolder}/Events/AssetCollection/CollectCardToCollectionAction`)
const buildCollectCollectionAction                  = require(`${builderFolder}/Events/AssetCollection/CollectCollectionAction`)

// Swap Property
const buildSwapPropertyAction                       = require(`${builderFolder}/Events/SwapProperty/SwapPropertyAction`)
const buildRespondToPropertySwapAction              = require(`${builderFolder}/Events/SwapProperty/RespondToPropertySwapAction`)

// Steal Property
const buildStealPropertyAction                      = require(`${builderFolder}/Events/StealProperty/StealPropertyAction`)
const buildRespondToStealPropertyAction             = require(`${builderFolder}/Events/StealProperty/RespondToStealPropertyAction`)

// Steal Collection
const buildStealCollectionAction                    = require(`${builderFolder}/Events/StealCollection/StealCollectionAction`)
const buildRespondToStealCollection                 = require(`${builderFolder}/Events/StealCollection/RespondToStealCollection`)
  

const {
  els,
  isDef,
  isDefNested,
  isFunc,
  isArr,
  log,
  getArrFromProp,

  Affected,
  Transaction,
  AddressedResponse,
  KeyedRequest,

  roomManager,

  makeProps,
  makeResponse,
  makeKeyedResponse,
  makePersonSpecificResponses,
  makeConsumerFallbackResponse,
  makeRegularGetKeyed,

  getAllKeyedResponse,
  createGameInstance,

  handleRoom,
  handlePerson,
  handleGame,
  handleMyTurn,
  handCardConsumer,
  handleTransactionResponse,
  handleTransferResponse,
  handleRequestCreation,
  handleCollectionBasedRequestCreation,
}

module.exports = null