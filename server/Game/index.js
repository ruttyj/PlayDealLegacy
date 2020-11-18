const serverFolder              = '..'
const builderFolder             = `${serverFolder}/Builders`
const thisDir                   = '.'
const builderPlayDealFolder     = `${builderFolder}/Objects/PlayDeal`

const {
  els,
  isDef,
  isArr,
  isObj,
  isFunc,
  isDefNested,
  getNestedValue,
  getKeyFromProp,
  reduceToKeyed,
  recursiveBuild,
  reduceArrayToMap,
  arrSum, 
  makeMap,
  makeVar,
  makeList,
  makeListener,
  emptyFunction,
  emptyFunc,
  stateSerialize,
} = require(`${thisDir}/utils.js`)

const buildAffected             = require(`${serverFolder}/Builders/Objects/Affected`)
const buildOrderedTree          = require(`${serverFolder}/Builders/Objects/OrderedTree`)
const pluralize                 = require(`pluralize`)
const deckTemplate              = require("./card/deckTemplate_testDeck");
const constants                 = require(`${thisDir}/config/constants.js`)
const buildGame                 = require(`${builderPlayDealFolder}/Game`)
const cardUtils                 = require(`./card/cardUtils`)
const buildCardContainer        = require(`${builderPlayDealFolder}/CardContainer`)
const buildCardManager          = require(`${builderPlayDealFolder}/CardManager`)
const buildTransfer             = require(`${builderPlayDealFolder}/Transfer/Transfer`)
const buildWealthTransfer       = require(`${builderPlayDealFolder}/Transfer/WealthTransfer`)
const buildTransaction          = require(`${builderPlayDealFolder}/Transfer/Transaction`)
const buildPlayerRequest        = require(`${builderPlayDealFolder}/PlayerRequest`)
const buildPlayerRequestManager = require(`${builderPlayDealFolder}/PlayerRequestManager`)
const buildPlayer               = require(`${builderPlayDealFolder}/Player`)
const buildPlayerTurn           = require(`${builderPlayDealFolder}/PlayerTurn`)
const buildPlayerTurnManager    = require(`${builderPlayDealFolder}/PlayerTurnManager`);
const buildPlayerManager        = require(`${builderPlayDealFolder}/PlayerManager`)
const buildCollection           = require(`${builderPlayDealFolder}/Collection`)
const buildCollectionManager    = require(`${builderPlayDealFolder}/CollectionManager`)
                                    

const OrderedTree               = buildOrderedTree()
const Affected                  = buildAffected({OrderedTree})
const Transfer                  = buildTransfer({
                                    makeVar, makeMap, isDef, isArr
                                  })
const WealthTransfer            = buildWealthTransfer({
                                    Transfer,
                                    isObj, isDef, arrSum, makeMap,
                                  });
const Transaction               = buildTransaction({
                                    isObj,
                                    isDef,
                                    arrSum,
                                    makeMap,
                                    WealthTransfer
                                  });
const PlayerRequest             =  buildPlayerRequest({
                                    makeVar,
                                    emptyFunction,
                                    isDef,
                                    isFunc,
                                    isArr,
                                    recursiveBuild,
                                    getNestedValue,
                                  });
const PlayerRequestManager        = buildPlayerRequestManager({
                                      makeVar,
                                      isDef,
                                      isObj,
                                      makeListener,
                                      makeMap,
                                      emptyFunc,
                                      Transaction,
                                      Affected,
                                      PlayerRequest,
                                    });
const CardContainer               = buildCardContainer({
                                      isDef,
                                      isArr,
                                      makeVar,
                                      makeList,
                                      getKeyFromProp,
                                      reduceArrayToMap,
                                      cardUtils,
                                      constants
                                    })
const Player                      = buildPlayer({
                                      makeVar, makeList, CardContainer
                                    })     
const PlayerTurn                  = buildPlayerTurn({
                                      isDef, makeVar, PlayerRequestManager
                                    });
const PlayerTurnManager           = buildPlayerTurnManager({
                                        isDef, 
                                        PlayerTurn,
                                    })
const Collection                  = buildCollection({
                                      isDef,
                                      makeVar,
                                      makeList,
                                      stateSerialize,
                                      getKeyFromProp,
                                      constants
                                    });
const CollectionManager           = buildCollectionManager({
                                      isDef,
                                      makeVar,
                                      makeMap,
                                      getKeyFromProp,
                                      Collection
                                    });
const PlayerManager               = buildPlayerManager({
                                      isDef, isDefNested, isObj, makeMap, getKeyFromProp,
                                      TurnManager: PlayerTurnManager,
                                      CollectionManager,
                                      Player,
                                      constants
                                    })
                 
                                    
 
  
 const CardManager                = buildCardManager({
                                    deckTemplate,
                                    constants,
                                    els,
                                    isDef,
                                    isArr,
                                    makeList,
                                    getKeyFromProp,
                                    makeMap,
                                  })
      
module.exports = buildGame({
  els,
  isDef,
  isArr,
  isDefNested,
  getNestedValue,
  getKeyFromProp,
  reduceToKeyed,
  pluralize,

  Affected,
  Transaction,
  TurnManager: PlayerTurnManager,
  CardManager,
  PlayerManager,
  CardContainer,

  constants,
});