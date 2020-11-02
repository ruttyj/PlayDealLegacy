/**
 * TODO NODE: Not Exaustive list
 *
 *    Room
 *      People list
 *      Chat
 *        Send Text
 *        Send Emoji - emoji search
 *        Send Image
 *        Send Sounds
 *        Send Gif
 *        Block people
 *      Game
 *        Config
 *          Mode
 *        Actions
 *          ✅ Play action card
 *            ✅ Request,
 *               ✅ Request value
 *                    ✅ "Debt Collector" Card
 *                    ✅ "It's My Birthday" Card
 *                    ✅  Regular Rent Card (All People)
 *                    ✅  Any Rent Card (One Person)
 *              ✅ Request property
 *                 ✅ "Sly Deal" Card
 *              ✅ swap property
 *                 ✅ "Forced Deal" Card
 *              ✅ Request set
 *                 ✅ "Deal Breaker" Card
 *              ✅ Responses
 *            ❌ "Just say NO"
 *                  functional but bug exists on the 3rd consecutive response of a "Just say no".
 */

const pluralize = require("pluralize");
const constants = require("./config/constants.js");
const { CONFIG } = constants;
const {
  log,
  els,
  isDef,
  isArr,
  isDefNested,
  jsonLog,
  getNestedValue,
  makeVar,
  emptyFunction,
  getKeyFromProp,
  reduceToKeyed,
} = require("./utils.js");
const CardContainer = require("./card/cardContainer.js");
const PlayerManager = require("./player/playerManager.js");
const CardManager = require("./card/cardManager.js");
const TurnManager = require("./player/turnManager.js");

const Transaction = require(`./player/request/transfer/Transaction.js`);

/*
  class GameConfig {

    let mConfig = {
      mMinPlayerCount
      mMinPlayerCount
      mInitialCardCount
      mMaxCardCount

      drawCardCountAtTurnStart: 2,

      shuffleDeck: false,
      canWinBySetsOfSameColor: false,
      alterSetCostAction: false,
      testMode: false,
    };


    constructor() {}

    serialize(){
      return JSON.parse(JSON.stringify(mConfig))
    }

    unserialize(){

    }

  }


  class DeckTemplate {}
*/



let GameInstance = () => {


  let mConfig;
  let mMaxPlayerCount;
  let mMinPlayerCount;
  let mInitialCardCount;
  let mMaxCardCount;
  let mIsGameStarted;
  let mPlayerManager;
  let mCardManager;
  let mIsGameOver;
  let mWinningCondition;
  let mActivePile;
  let mDiscardPile;
  let mDeck;


  function reset() {
    mConfig = {
      shuffleDeck:              false,
      canWinBySetsOfSameColor:  false,
      alterSetCostAction:       false,
      testMode:                 false,
    };
    mMaxPlayerCount = 5;
    mMinPlayerCount = 2;
    mInitialCardCount = 5;
    mMaxCardCount = 7;
    mIsGameStarted = false;
    mPlayerManager = PlayerManager(getPublic());
    mCardManager = CardManager(getPublic());
    mIsGameOver = false;
    mWinningCondition = null;
    initActivePile();
    initDiscardPile();
    initDeck();
    initTurnManager();

    
    
  }

  //--------------------------------

  //          Composition

  //--------------------------------
  function getPlayerManager() {
    return mPlayerManager;
  }

  function getTurnManager() {
    return mTurnManager;
  }

  function getRequestManager() {
    let currentTurn = getCurrentTurn();
    if(isDef(currentTurn)){
      let requestManager = currentTurn.getRequestManager();
      if(isDef(requestManager)){
        return requestManager;
      }
    }
    return null;
  }

  //--------------------------------

  //          Life cycle

  //--------------------------------
  

  function setConfigShuffledDeck(val = true) {
    updateConfig({
      [CONFIG.SHUFFLE_DECK]: val,
    });
  }

  function getConfigShuffledDeck() {
    return mConfig[CONFIG.SHUFFLE_DECK];
  }

  function updateConfig(config) {
    if (isDef(config[CONFIG.SHUFFLE_DECK])) {
      mConfig[CONFIG.SHUFFLE_DECK] = Boolean(config[CONFIG.SHUFFLE_DECK]);
    }

    if (isDef(config[CONFIG.ALTER_SET_COST_ACTION])) {
      mConfig[CONFIG.ALTER_SET_COST_ACTION] = Boolean(
        config[CONFIG.ALTER_SET_COST_ACTION]
      );
    }
  }

  function getConfig(key = null, fallback = false) {
    if (isDef(key)) return getNestedValue(mConfig, key, fallback);
    return { ...mConfig };
  }

  function getConfigAlteringSetCostAction() {
    return mConfig.alterSetCostAction;
  }

  function newGame() {
    reset();
  }

  function isGameOver() {
    return mIsGameOver;
  }

  function gameOver() {
    mIsGameOver = true;
  }
  
  function getMinPlayerCount() {
    return mMinPlayerCount;
  }

  function getMaxPlayerCount() {
    return mMaxPlayerCount;
  }

  // checks the value not the players in the playerManager
  function isAcceptablePlayerCount(readyPersonCount) {
    return (
      getMinPlayerCount() <= readyPersonCount &&
      readyPersonCount <= getMaxPlayerCount()
    );
  }

  function canStartGame() {
    let playerManager = getPlayerManager();
    if (isDef(playerManager))
      return (
        !mIsGameStarted && playerManager.getPlayerCount() >= mMinPlayerCount
      );
    return false;
  }

  function startGame(dealCards = true) {
    mIsGameStarted = true;
    if (getConfigShuffledDeck()) mDeck.shuffle();
    if (dealCards) dealInitialCards();
  }

  function isGameStarted() {
    return mIsGameStarted;
  }

  function isGameOver() {
    return mIsGameOver;
  }

  function initTurnManager() {
    mTurnManager = TurnManager();
    mTurnManager.injectDeps({
      playerManager:  getPlayerManager(),
      gameRef:        getPublic(),
    })
    mTurnManager.newTurn();
  }

  function getCurrentTurn() {
    let turnManager = getTurnManager();
    if (isDef(turnManager)) {
      return turnManager.getCurrentTurn();
    }
    return null;
  }

  function nextPlayerTurn() {
    let turnManager = getTurnManager();
    if (isDef(turnManager)) {
      return turnManager.nextPlayerTurn();
    }
    return null;
  }

  function dealInitialCards() {
    let players = getAllPlayers();

    let playerHand;
    let player;
    let playerIndex = 0;
    player = players[playerIndex];
    playerHand = player.getHand();

    // @CHEAT
    /*
    let giveCards = [
      "RENT_BLUE_GREEN",
      "PROPERTY_BLUE_1",
      "JUST_SAY_NO",
    ];
    giveCards.forEach((cardKey) => {
      playerHand.addCard(
        mDeck.giveCard(mDeck.findCard((card) => card.key === cardKey))
      );
    });

    player = players[1];
    playerHand = player.getHand();
    giveCards = [
      "JUST_SAY_NO",
      "JUST_SAY_NO",
      "PROPERTY_BLUE_2",
      "RENT_BLUE_GREEN",
    ];
    giveCards.forEach((cardKey) => {
      playerHand.addCard(
        mDeck.giveCard(mDeck.findCard((card) => card.key === cardKey))
      );
    });

    if (isDef(players)) {
      playerIndex = 0;
      players.forEach((player) => {
        if (playerIndex > 1) {
          for (let i = 0; i < mInitialCardCount; ++i) {
            playerDrawCard(player.getKey());
          }
        }
        ++playerIndex;
      });
    }
    //*/

    //*
    if (isDef(players)) {
      for (let i = 0; i < mInitialCardCount; ++i) {
        players.forEach((player) => playerDrawCard(player.getKey()));
      }
    }
    //*/
  }

  //--------------------------------

  //          Look up

  //--------------------------------
  function getCardManager() {
    return mCardManager;
  }

  // Helper function to know what a card is
  function getCard(cardOrId) {
    return getCardManager().getCard(cardOrId);
  }

  function getCards(cardsOrIds) {
    let result = [];
    cardsOrIds.forEach((cardOrId) => {
      let card = getCard(cardOrId);
      if (isDef(card)) {
        result.push(card);
      }
    });
    return result;
  }

  function getAllCardsKeyed() {
    return getCardManager.getAllCardsKeyed();
  }

  function updateCardSet(cardOrId, chosenPropSet) {
    getCardManager().setCardActivePropertySet(cardOrId, chosenPropSet);
  }

  function lookUpCardById(cardOrId) {
    return getCard(cardOrId);
  }

  function getAllCardIds() {
    return getCardManager().getAllCardIds();
  }

  // What sets can a card be played in
  function getSetChoicesForCard(cardOrId) {
    return getCardManager().getPropertySetChoicesForCard(cardOrId);
  }

  function getPropertySets() {
    return getCardManager().getAllPropertySetsKeyed();
  }

  function getAllPropertySetKeys() {
    return getCardManager().getAllPropertySetKeys();
  }

  function getPropertySet(setKey) {
    return getCardManager().getPropertySet(setKey);
  }

  function getSetDetailsByKey(setKey) {
    return getPropertySet(setKey);
  }

  //--------------------------------

  //         Card Helpers

  //--------------------------------
  function findIndexOfCardById(arr, cardId) {
    return arr.findIndex((card) => card.id === cardId);
  }

  function removeCardByIndex(arr, index) {
    arr.splice(index, 1);
  }

  // Will return the card and remove it from source array
  function giveCardByIdFromArray(arr, cardId) {
    const index = findIndexOfCardById(arr, cardId);
    if (index > -1) {
      let card = arr[index];
      removeCardByIndex(arr, index);
      return card;
    }
    return false;
  }

  //--------------------------------

  //         Deck Related

  //--------------------------------
  function initDeck() {
    mDeck = CardContainer(getPublic());
    populateDeck();
  }

  function populateDeck() {
    mCardManager.generateCards();
    mDeck.replaceAllCards(mCardManager.getAllCards());
  }

  function getDeck() {
    return mDeck;
  }

  function getDeckCardCount() {
    return mDeck.count();
  }

  function deckHasCards() {
    return mDeck.count() > 0;
  }

  function recycleCards() {
    let discardPile = getDiscardPile();
    let activePile = getActivePile();
    let drawPile = getDeck();
    let allDiscardCards = discardPile.getAllCards();
    let activePileRecycleCards = activePile.getBottomCards(
      activePile.count() - 3
    );
    drawPile.addCards(discardPile.giveCards(allDiscardCards));
    drawPile.addCards(activePile.giveCards(activePileRecycleCards));
    drawPile.shuffle();
  }

  function drawCardFromDeck() {
    if (!deckHasCards()) {
      recycleCards();
    }
    let drawnCard = mDeck.pop();
    return drawnCard;
  }

  //--------------------------------

  //         Active Pile

  //--------------------------------
  function initActivePile() {
    mActivePile = CardContainer(getPublic());
  }
  function getActivePile() {
    return mActivePile;
  }

  //--------------------------------

  //         Discard Pile

  //--------------------------------
  function initDiscardPile() {
    mDiscardPile = CardContainer(getPublic());
  }
  function getDiscardPile() {
    return mDiscardPile;
  }

  //--------------------------------

  //         Card Filter

  //--------------------------------
  function isCardProperty(cardOrId) {
    let card = getCard(cardOrId);
    return card.type === "property";
  }

  function isActionCard(cardOrId) {
    let card = getCard(cardOrId);
    return card.type === "action";
  }
  function isRentCard(cardOrId) {
    let card = getCard(cardOrId);
    return doesCardHaveTag(card, "rent");
  }

  function isCardSetAugment(cardOrId) {
    let card = getCard(cardOrId);
    return card.type === "action" && card.class === "setAugment";
  }

  function canCardBeAddedToBank(cardOrId) {
    let card = getCard(cardOrId);
    return doesCardHaveTag(card, "bankable");
  }

  function isCardRentAugment(cardOrId) {
    let card = getCard(cardOrId);
    return doesCardHaveTag(card, "rentAugment");
  }
  function isRequestCard(cardOrId) {
    let card = getCard(cardOrId);
    return doesCardHaveTag(card, "request");
  }

  function doesCardHaveTag(cardOrId, tag) {
    let card = getCard(cardOrId);
    if (isDef(card.tags)) {
      return card.tags.includes(tag);
    }
    return false;
  }

  function doesCardHaveClass(cardOrId, className) {
    let card = getCard(cardOrId);
    return isDef(card.class) && card.class === "className";
  }

  function filterForTag(cardsOrIds, tag) {
    return cardsOrIds.filter((cardOrId) => doesCardHaveTag(cardOrId, tag));
  }

  //--------------------------------

  //       Player Related

  //--------------------------------
  function createPlayer(key) {
    if (canAddPlayer()) getPlayerManager().createPlayer(key);
  }
  function hasPlayer(key) {
    return getPlayerManager().hasPlayer(key);
  }

  function getPlayer(key) {
    return getPlayerManager().getPlayer(key);
  }

  function getAllPlayers() {
    let playerManager = getPlayerManager();
    if (isDef(playerManager)) return playerManager.getAllPlayers();
    return null;
  }

  function canAddPlayer() {
    let playerManager = getPlayerManager();

    // Game must not be started and limit not reached
    if (
      isDef(playerManager) &&
      playerManager.getPlayerCount() < mMaxPlayerCount
    ) {
      return !mIsGameStarted;
    }
    return false;
  }

  function canPreformActionById(cardOrId) {
    let currentTurn = getCurrentTurn();
    if (isDef(currentTurn)) {
      let actionCount = currentTurn.getActionCount();
      let actionLimit = currentTurn.getActionLimit();

      if (actionCount < actionLimit) {
        // Rent augment cards require another cards to be played with it
        // so it can't be your last card
        if (actionCount === actionLimit - 1) {
          let card = getCard(cardOrId);
          if (isDef(card) && !isCardRentAugment(card)) {
            return true;
          }
        } else {
          return true;
        }
      }
    }
    return false;
  }

  //--------------------------------

  //          Player Hand

  //--------------------------------
  function getPlayerHand(playerKey) {
    let player = getPlayer(playerKey);
    if (isDef(player)) return player.hand;
    return null;
  }

  // Draw a card
  function playerDrawCard(playerKey) {
    let playerHand = getPlayerHand(playerKey);
    if (isDef(playerHand)) playerHand.addCard(drawCardFromDeck());
  }

  // Draw cards at beginngin of turn
  function playerTurnStartingDraw(playerKey) {
    if (getCurrentTurn().canDrawTurnStartingCards()) {
      getCurrentTurn().setHasDrawnStartingCards();

      let cardCount = getPlayerHand(playerKey).getCount();
      let drawAmount = 2;
      if (cardCount === 0) drawAmount = 5;
      for (let i = 0; i < drawAmount; ++i) {
        playerDrawCard(playerKey);
      }
    }
  }

  function drawNCards(playerKey, drawAmount = 2) {
    for (let i = 0; i < drawAmount; ++i) {
      playerDrawCard(playerKey);
    }
  }

  //--------------------------------

  //          Player Bank

  //--------------------------------
  function getPlayerBank(playerKey) {
    let player = getPlayer(playerKey);
    if (isDef(player)) return player.bank;
    return null;
  }

  //--------------------------------

  //      Player Collections

  //--------------------------------
  function getCollectionManager() {
    return getPlayerManager().getCollectionManager();
  }

  function getPlayerCollectionById(playerKey, collectionId) {
    let collectionManager = getPlayerManager().getCollectionManager();
    let collection = collectionManager.getCollection(collectionId);
    if (isDef(collection) && collection.getPlayerKey() === playerKey) {
      return collection;
    }
    return null;
  }

  function isCollectionComplete(collectionOrId) {
    let collectionId = getKeyFromProp(collectionOrId, "getId()");
    let collection = getCollectionManager().getCollection(collectionId);

    let propertySetKey = collection.getPropertySetKey();
    if (isDef(propertySetKey)) {
      let setDetails = getSetDetailsByKey(propertySetKey);
      if (isDef(setDetails)) {
        if (collection.propertyCount() === setDetails.size) {
          return true;
        }
      }
    }

    return false;
  }

  function canAddCardToCollection(cardOrId, collectionOrId) {
    let canBeAdded = false;

    let card = getCard(cardOrId);
    let collection = getCollectionManager().getCollection(collectionOrId);
    let collectionPropertySetKey = collection.getPropertySetKey();
    let newPropertySetKey = collectionPropertySetKey;

    if (isCardSetAugment(card)) {
      if (collectionPropertySetKey === constants.USELESS_PROPERTY_SET_KEY) {
        canBeAdded = true;
      } else {
        canBeAdded = canApplyAugmentToSet(card, collection);
      }
    } else {
      let cardPropertySetKey = card.set;
      let isAlreadyTooFull = collection.isFull();
      //-----------------------------------------

      // IF CARD BEING ADDED IS AMBIGIOUS
      let isPropertySetAcceptable = [
        cardPropertySetKey,
        constants.AMBIGUOUS_SET_KEY,
      ].includes(collectionPropertySetKey);
      if (cardPropertySetKey === constants.AMBIGUOUS_SET_KEY) {
        let wildCardPropertySets = getSetChoicesForCard(card);
        // can wildcard be added to this set?
        if (wildCardPropertySets.includes(collectionPropertySetKey)) {
          isPropertySetAcceptable = true;
        }
      } else {
        newPropertySetKey = cardPropertySetKey;
      }

      //---------------------------------------

      // IF COLLECTON IS AMBIGIOUS

      // Get the data for property set it would change into
      let propertySet = getPropertySet(cardPropertySetKey);
      if (!isAlreadyTooFull && isDef(propertySet)) {
        // if there are not too many cards when this card is added, let it be added
        let newLimit = propertySet.size;
        let currentPropertyCount = collection.propertyCount();

        if (currentPropertyCount >= newLimit) {
          isAlreadyTooFull = true;
        }
      }

      canBeAdded = isPropertySetAcceptable && !isAlreadyTooFull;
    }
    return {
      newPropertySetKey,
      canBeAdded,
    };
  }

  function canApplyRequestAugment(
    actionCardId,
    augmentCardId,
    appliedAugmentCardIds = [],
    queuedAugmentCardIds = []
  ) {
    let pass = true;
    let actionCard = getCard(actionCardId);
    let augmentCard = getCard(augmentCardId);

    if (!isDef(actionCard) || !isDef(augmentCard)) {
      console.log(
        "something not defiend",
        isDef(actionCard),
        isDef(augmentCard)
      );
      return false;
    }

    let augment = augmentCard.actionAugment;
    if (!isDef(augment)) {
      console.log("not a action augment card");
      return false;
    }

    let requirements = augment.requires;
    if (isDef(requirements)) {
      let actionCardRequirements = requirements.actionCard;

      // Requirement for action card to have to be able to apply this augment
      if (isDef(actionCardRequirements)) {
        let actionCardTagsKeyed = reduceToKeyed(
          Array.from(new Set(getNestedValue(actionCard, "tags", [])))
        );
        let requiredTagsList = Array.from(
          new Set(getNestedValue(actionCardRequirements, "withTags", []))
        );
        let forbiddenTagsList = Array.from(
          new Set(getNestedValue(actionCardRequirements, "withoutTags", []))
        );

        if (pass && requiredTagsList.length > 0) {
          for (let i = 0; i < requiredTagsList.length; ++i) {
            let tag = requiredTagsList[i];
            if (!isDef(actionCardTagsKeyed[tag])) {
              console.log("actionCardMissing tag", actionCardTagsKeyed, tag);
              pass = false;
              break;
            }
          }
        }
        if (pass && forbiddenTagsList.length > 0) {
          for (let i = 0; i < forbiddenTagsList.length; ++i) {
            let tag = forbiddenTagsList[i];
            if (isDef(actionCardTagsKeyed[tag])) {
              console.log("forbiddenTagsList tag", actionCardTagsKeyed, tag);
              pass = false;
              break;
            }
          }
        }
      } // end action card requirements
    }
    // @TODO add other requirements when required

    return pass;
  }

  function canApplyAugmentToSet(augCard, collection) {
    let cardId = augCard.id;
    let requires = augCard.setAugment.requires;
    let requiresFullSet = els(requires.fullSet, false);
    let requiresCardsWithTagsInSet = isDef(requires.withTagsInSet);

    let isCompleteSet = isCollectionComplete(collection);

    let canBeApplied = true;

    let propertySetKey = collection.getPropertySetKey();

    if (propertySetKey === constants.USELESS_PROPERTY_SET_KEY) {
      return true;
    } else {
      // requries a full set - but set isn't full
      if (isDef(requiresFullSet) && !isCompleteSet) {
        // get or create useless set
        canBeApplied = false;
      }
      if (requiresCardsWithTagsInSet) {
        let requiredTags = Object.keys(requires.withTagsInSet);
        let forbiddenTags = getNestedValue(requires, "withoutTagsInSet", {});

        let foundTheForbiddenTag = false;
        let foundTagCount = {};
        collection.filterCards((card) => {
          if (card.id !== cardId) {
            els(card.tags, []).forEach((tag) => {
              foundTagCount[tag] = isDef(foundTagCount[tag])
                ? foundTagCount[tag] + 1
                : 1;

              //Is tag not allowed?
              if (isDef(forbiddenTags[tag])) {
                foundTheForbiddenTag = true;
              }
            });
          }
        });

        if (foundTheForbiddenTag) {
          canBeApplied = false;
        }

        requiredTags.forEach((tag) => {
          let reqTagCount = requires.withTagsInSet[tag];
          let found = els(foundTagCount[tag], 0);
          // insufficent count
          if (found < reqTagCount) {
            canBeApplied = false;
          }
        });
      }
    }

    return canBeApplied;
  }

  function getUselessCollectionForPlayer(thisPersonId) {
    return getPlayerManager().getOrCreateUselessCollectionForPlayer(
      thisPersonId
    );
  }

  function cleanUpFromCollection(thisPersonId, fromCollection) {
    let playerManager = getPlayerManager();
    let cardWasRemoved = false;

    let uselessSet = null;
    let hasSetAugment = fromCollection.augmentCount();
    if (hasSetAugment) {
      let augmentCards = fromCollection.getAllAugmentCards();
      augmentCards.forEach((augCard) => {
        let canApply = canApplyAugmentToSet(augCard, fromCollection);
        let removeCard = !canApply;
        if (removeCard) {
          fromCollection.removeCard(augCard);
          if (!isDef(uselessSet))
            uselessSet = playerManager.getOrCreateUselessCollectionForPlayer(
              thisPersonId
            );
          uselessSet.addCard(augCard);
          cardWasRemoved = true;
        }
      });
    }

    // Check the sets the cards are from
    let encounteredKeyObj = {};
    fromCollection.getAllPropertyCards().forEach((card) => {
      let propertySetKey = card.set;
      encounteredKeyObj[propertySetKey] = true;
    });
    let keys = Object.keys(encounteredKeyObj);

    // Only one set key -> No prob
    if (keys.length === 1) {
      fromCollection.setPropertySetKey(keys[0]);
    } else {
      // More than one in the set
      let filteredKeys = keys.filter(
        (item) => item !== constants.USELESS_PROPERTY_SET_KEY
      );
      // use the only non-wild
      if (filteredKeys.length === 1) {
        fromCollection.setPropertySetKey(filteredKeys[0]);
      }
      //else should never occure
    }

    if (fromCollection.cardCount() === 0) {
      // Remove collection if empty
      playerManager.removeCollection(fromCollection);
    } else if (cardWasRemoved) {
      // Recheck since depencies may have changed
      cleanUpFromCollection(thisPersonId, fromCollection);
    }
  }

  // Get value of Collection
  function getRentValueOfCollection(playerKey, collectionId) {
    let rent = 0;
    let collection = getPlayerCollectionById(playerKey, collectionId);
    if (isDef(collection)) {
      let propertySetKey = collection.getPropertySetKey();
      if (propertySetKey === constants.USELESS_PROPERTY_SET_KEY) {
        return 0;
      }

      let setkey = collection.getPropertySetKey();
      let cards = collection.allCards();

      let propertyCards = cards.filter(isCardProperty);
      let augmentingCards = cards.filter(isCardSetAugment);

      // Get rent based on property count for set
      let count = propertyCards.length;
      let setDetails = getSetDetailsByKey(setkey);
      if (isDef(setDetails)) {
        rent = setDetails.rent[String(count)];
      }

      if (augmentingCards.length > 0) {
        rent = applySetAugmentationToRent(augmentingCards, rent);
      }
    }
    return rent;
  }

  function augmentValue(field, cardsOrIds, value) {
    let result = value;
    let multiplyValue = null;
    cardsOrIds.forEach((cardOrId) => {
      let card = getCard(cardOrId);
      if (isDef(card[field])) {
        if (isDefNested(card, [field, `affect`, `inc`])) {
          result += parseFloat(card[field].affect.inc);
        }
        if (isDefNested(card, [field, `affects`, `multiply`])) {
          let scaleValue = parseFloat(card[field].affects.multiply);
          multiplyValue = isDef(multiplyValue)
            ? multiplyValue + scaleValue
            : scaleValue;
        }
      }
    });
    if (isDef(multiplyValue)) result = result * multiplyValue;
    return result;
  }

  function applyActionValueAugment(augmentCards, value) {
    return augmentValue("actionAugment", augmentCards, value);
  }

  function applySetAugmentationToRent(augmentCards, value) {
    return augmentValue("setAugment", augmentCards, value);
  }

  //--------------------------------

  //        Handle Play

  //--------------------------------
  function handlePlayingCard(playerKey, card, collectionId = null) {
    let currentTurn = getCurrentTurn();
    if (card.type === "cash") {
      currentTurn.setActionPreformed("BANK", card);
      let playerBank = getPlayerBank(playerKey);
      playerBank.addCard(card);
      return true;
    }
    return false;
  }

  function playCardById(playerKey, cardId, collectionId = null) {
    let status = "failure";

    if (canPreformActionById(cardId)) {
      try {
        let playerHand = getPlayerHand(playerKey);
        let card = playerHand.giveCardById(cardId);
        if (isDef(playerHand) && isDef(card)) {
          if (handlePlayingCard(playerKey, card, collectionId)) {
            status = "success";
          } else {
            playerHand.addCard(card);
          }
        }
      } catch (e) {
        console.log("ERROR", e);
      }
    }
    return status;
  }

  function playCardFromHandToNewCollection(playerKey, cardOrId) {
    if (canPreformActionById(cardOrId)) {
      let collection = getPlayerManager().createNewCollectionForPlayer(
        playerKey
      );
      let playerHand = getPlayerHand(playerKey);
      if (playerHand.hasCard(cardOrId)) {
        let card = playerHand.giveCard(cardOrId);
        getCurrentTurn().setActionPreformed("MODIFY_PROPERTY_COLLECTION", card);
        collection.addCard(card);
        return collection;
      }
    }
    return null;
  }

  function playCardToExistingCollection(playerKey, cardOrId, collectionOrId) {
    if (canPreformActionById(cardOrId)) {
      let collectionManager = getCollectionManager();
      let collection = collectionManager.getCollection(collectionOrId);
      if (isDef(collection)) {
        let playerHand = getPlayerHand(playerKey);
        if (collection.getPlayerKey() === playerKey) {
          if (isDef(playerHand)) {
            if (playerHand.hasCard(cardOrId)) {
              let card = playerHand.giveCard(cardOrId);
              getCurrentTurn().setActionPreformed(
                "MODIFY_PROPERTY_COLLECTION",
                card
              );
              collection.addCard(card);
              return collection;
            }
          }
        }
      }
    }
    return null;
  }

  function isMyTurn(playerKey) {
    return playerKey === getCurrentTurn().getPlayerKey();
  }

  function getHandMaxCardCount() {
    return mMaxCardCount;
  }

  function getPlayer(playerOrId) {
    return getPlayerManager().getPlayer(playerOrId);
  }

  function getCurrentTurnPlayer() {
    return getTurnManager().getCurrentTurnPlayer();
  }
  

  function getUselessPropertySetKey() {
    return constants.USELESS_PROPERTY_SET_KEY;
  }

  /**
   *
   * @param {Number} playerId
   *
   * @return {Object | Null} if result is defined player has won
   */
  function checkWinConditionForPlayer(playerId) {
    let player = getPlayer(playerId);
    let collectionManager = getCollectionManager();

    let result = null;

    // ----------------------------------------
    // @TODO  move to class config
    let canWinByTotalSetCount = true;
    let totalPropertySetWinningCount = 3;

    let canWinByDifferntFullSetCount = false; // NOT WORKING
    let winByDifferntFullSetCount = 3;
    //_________________________________________

    if (isDef(player)) {
      let playerCollectionIds = player.getAllCollectionIds();
      let fullSetIds = [];
      let fullPropertySetCounts = {};
      playerCollectionIds.forEach((collectionId) => {
        let collection = collectionManager.getCollection(collectionId);
        let propertySetKey = collection.getPropertySet();
        if (collection.isFull()) {
          let collectionId = collection.getId();

          // Log total count of complete sets
          fullSetIds.push(collectionId);
          // __________________________________

          // Log full set counts based on the set
          if (!isDef(fullPropertySetCounts[propertySetKey])) {
            fullPropertySetCounts[propertySetKey] = {
              count: 0,
              ids: [],
            };
          }
          fullPropertySetCounts[propertySetKey].count += 1;
          fullPropertySetCounts[propertySetKey].ids.push(collectionId);
          // __________________________________
        }
      });

      // Win by differnt set count
      if (canWinByDifferntFullSetCount) {
        let fullSetPropertyKeys = Object.keys(fullPropertySetCounts);
        if (fullSetPropertyKeys.length >= winByDifferntFullSetCount) {
          let winningCollectionIds = [];
          fullSetPropertyKeys.forEach((propertySetKey) => {
            let details = fullPropertySetCounts[propertySetKey];
            winningCollectionIds.push(details.ids[0]);
          });

          result = {
            status: "success",
            payload: {
              playerId: playerId,
              condition: "differentPropertySetCount",
              conditionLabel: `Win by having ${winByDifferntFullSetCount} complete ${pluralize(
                "collection",
                winByDifferntFullSetCount
              )}${winByDifferntFullSetCount > 0 ? " of different colors" : ""}`,
              detectedCount: fullSetIds.length,
              winningCount: winByDifferntFullSetCount,
              winningCollectionIds,
              playerCollectionIds,
            },
          };
        }
      }

      // Win by total count
      if (canWinByTotalSetCount) {
        if (fullSetIds.length >= totalPropertySetWinningCount) {
          let winningCollectionIds = fullSetIds;
          result = {
            status: "success",
            payload: {
              playerId: playerId,
              condition: "totalPropertySetCount",
              conditionLabel: `Win by having ${winByDifferntFullSetCount} complete ${pluralize(
                "collection",
                winByDifferntFullSetCount
              )}`,

              detectedCount: fullSetIds.length,
              winningCount: totalPropertySetWinningCount,
              winningCollectionIds,
              playerCollectionIds,
            },
          };
        }
      }
    }

    if (isDef(result)) {
      mIsGameOver = true;
      mWinningCondition = result;
      return true;
    } else {
      return false;
    }
  }

  function getWinningCondition() {
    if (isDef(mWinningCondition)) return mWinningCondition;
    return null;
  }

  // @Unsorted
  function getCardActionAugment(cardOrId) {
    let card = getCard(cardOrId);
    return els(card.actionAugment, null);
  }

  function getCollectionThatHasCard(cardOrId) {
    return getCollectionManager().getCollectionThatHasCard(cardOrId);
  }


  function serialize() {
    //let configManager = getConfigManager
    let playerManager = getPlayerManager();
    let requestManager = getRequestManager();
    let collectionManager = getCollectionManager();
    let cardManager = getCardManager();
    let deck = getDeck(); 
    let activePile = getActivePile();
    let discardPile = getDiscardPile();
    let turnManager = getTurnManager();

    let result = {
      playerManager:      isDef(playerManager)      ? playerManager.serialize()     : null,
      turnManager:        isDef(turnManager)        ? turnManager.serialize()       : null,
      requestManager:     isDef(requestManager)     ? requestManager.serialize()    : null,
      collectionManager:  isDef(collectionManager)  ? collectionManager.serialize() : null,
      cardManager:        isDef(cardManager)        ? cardManager.serialize()       : null,
      deck:               isDef(deck)               ? deck.serialize()              : null,
      activePile:         isDef(activePile)         ? getActivePile().serialize()   : null,
      discardPile:        isDef(discardPile)        ? getDiscardPile().serialize()  : null,
    };

    return result;
  }

  /**
   * 
   * @param object data  decoded json object containing the serialized state to reconstruct
   */
  function unserialize(data){
    if (isDef(data)){
      reset();

      // Load Game Config
      // @TODO

      // Load Player Manager
      let newPlayerManager = getPlayerManager();
      let playerManagerData = data.playerManager;
      newPlayerManager.unserialize(playerManagerData);

      // Load Collection Manager
      let newCollectionManager = getCollectionManager();
      newCollectionManager.unserialize(data.collectionManager);

      // Player has Collection
      // The collection data should be moved from the player manager, elsewhere
      playerManagerData.players.order.forEach(playerKey => {
        let playerCollectionData = playerManagerData.players.items[playerKey].collections;
        if (playerCollectionData.length) {
          playerCollectionData.forEach(collectionId => {
            newPlayerManager.associateCollectionToPlayer(collectionId, playerKey);
          })
        }
      })

      // Load Active Pile
      let activePile = getActivePile();
      activePile.unserialize(data.activePile);

      // Load Discard Pile
      let discardPile = getDiscardPile();
      discardPile.unserialize(data.discardPile);

      // Load Deck
      let deck = getDeck(); 
      deck.unserialize(data.deck);

      // Load Card Manager
      let cardManager = getCardManager();
      cardManager.unserialize(data.cardManager);

      // Load Current Turn
      // @TODO
      let turnManager = getTurnManager();
      turnManager.unserialize(data.turnManager);
      

      // Load Request Manager
      // @TODO

      // Dump Dev data
      //console.log(JSON.stringify(cardManager.serialize(), null, 2));
    }
  }



  function requestRent(theGoods) {
    const game = getPublic();
    const currentTurn = getCurrentTurn();
    const requestManager = getRequestManager();

    const { thisPersonId, affectedIds, affected, checkpoints } = theGoods;
    
    const {
      cardId, 
      collectionId,
      baseValue,
      targetPeopleIds,
      validAugmentCardsIds,
    } = theGoods;

    let hand = game.getPlayerHand(thisPersonId);
    let activePile = game.getActivePile();
    activePile.addCard(hand.giveCard(cardId));
    affected.activePile = true;
    currentTurn.setActionPreformed("REQUEST", game.getCard(cardId));
    let augmentUsesActionCount = game.getConfig(CONFIG.ACTION_AUGMENT_CARDS_COST_ACTION, true);
    if (augmentUsesActionCount) {
      validAugmentCardsIds.forEach((augCardId) => {
        currentTurn.setActionPreformed(
          "REQUEST",
          game.getCard(augCardId)
        );
        activePile.addCard(hand.giveCard(augCardId));
      });
    }

    function onCancelCallback(req, { affectedIds, affected }) {
      // If augmented remove an augment

      // data may be stored in differnt locations depending if it was a decline card
      let serializedData;
      let isJustSayNo = req.getType() === "justSayNo";
      if (isJustSayNo) {
        serializedData = req.getPayload("reconstruct");
      } else {
        serializedData = req.serialize();
      }

      if (isDef(serializedData)) {
        let authorKey = getNestedValue(serializedData, "authorKey");
        let targetKey = getNestedValue(serializedData, "targetKey");
        let baseValue = getNestedValue(
          serializedData,
          ["payload", "baseValue"],
          0
        );
        let actionNum = getNestedValue(serializedData, [
          "payload",
          "actionNum",
        ]);
        let originalAugmentIds = getNestedValue(
          serializedData,
          ["payload", "augmentCardIds"],
          []
        );
        let actionCardId = getNestedValue(serializedData, [
          "payload",
          "actionCardId",
        ]);
        let actionCollectionId = getNestedValue(serializedData, [
          "payload",
          "actionCollectionId",
        ]);

        if (
          isDef(authorKey) &&
          isDef(targetKey) &&
          isDef(actionCollectionId) &&
          isDef(actionNum) &&
          isDef(actionCardId) &&
          originalAugmentIds.length > 0 &&
          isDef(baseValue)
        ) {

          let shouldRemoveAugment = originalAugmentIds.length > 0;

          // if augment was presant remove (1) augment
          if (shouldRemoveAugment) {
            let newAugmentIds = originalAugmentIds.slice(1); // return all excluding first element
            let request = createRequest({
              authorKey: authorKey,
              targetKey: targetKey,
              actionNum: actionNum,
              baseValue: baseValue,
              augmentCardsIds: newAugmentIds,
            });

            affected.requests = true;
            affectedIds.requests.push(request.getId());
            affectedIds.playerRequests.push(request.getAuthorKey());
            affectedIds.playerRequests.push(request.getTargetKey());
          }
        } else {
          console.log("wont make new request", [
            isDef(actionCollectionId),
            isDef(actionNum),
            isDef(actionCardId),
            originalAugmentIds.length > 0,
            isDef(baseValue),
          ]);
        }
      }
    }

    function createRequest({
      authorKey,
      targetKey,
      actionNum,
      baseValue = 0,
      augmentCardsIds = [],
    }) {
      let chargeValue = baseValue;
      let validAugmentCardsIds = [];
      let augments = {};
      if (isArr(augmentCardsIds)) {
        augmentCardsIds.forEach((augCardId) => {
          let canApply = game.canApplyRequestAugment(
            cardId,
            augCardId,
            validAugmentCardsIds,
            augmentCardsIds
          );
          if (canApply) {
            validAugmentCardsIds.push(augCardId);
            let card = game.getCard(augCardId);
            augments[augCardId] = getNestedValue(
              card,
              ["action", "agument"],
              {}
            );
          }
        });
      }

      chargeValue = game.applyActionValueAugment(
        validAugmentCardsIds,
        chargeValue
      );
      let transaction = Transaction();
      let request = requestManager.createRequest({
        type: "collectValue",
        authorKey: authorKey,
        targetKey: targetKey,
        status: "open",
        actionNum: actionNum,
        payload: {
          actionCardId: cardId,
          actionCollectionId: collectionId,
          actionNum: actionNum,
          baseValue: baseValue,
          amountDue: chargeValue,
          amountRemaining: chargeValue,
          transaction: transaction,
          augments: augments,
          augmentCardIds: validAugmentCardsIds, // deprecated
        },
        onAcceptCallback: (req, args) => {},
        onDeclineCallback: onCancelCallback,
        description: `Charge value in rent`,
      });

      return request;
    }

    let actionNum = currentTurn.getActionCount();
    targetPeopleIds.forEach((targetPersonId) => {
      // Create a transaction to transfer to author
      let request = createRequest({
        authorKey: thisPersonId,
        targetKey: targetPersonId,
        actionNum: actionNum,
        baseValue: baseValue,
        augmentCardsIds: validAugmentCardsIds,
      });
      affectedIds.requests.push(request.getId());
      affected.requests = true;
      affected.activePile = true;
    });

    checkpoints.set("success", true);
  }


  function declineCollectValueRequest ({
    request,
    checkpoints,
    game,
    thisPersonId,
    cardId,
    affected,
    affectedIds,
  }) {

    let consumerData = {
      request,
      affected,
      affectedIds,
      thisPersonId,
    }
    
    let requestManager = getRequestManager();

    request.setStatus("decline");

    let hand = game.getPlayerHand(thisPersonId);
    checkpoints.set("isCardInHand", false);

    if (hand.hasCard(cardId)) {
      checkpoints.set("isCardInHand", true);

      //can the card decline the request
      if (
        game.doesCardHaveTag(cardId, "declineRequest")
      ) {
        game
          .getActivePile()
          .addCard(
            game
              .getPlayerHand(thisPersonId)
              .giveCard(cardId)
          );
        affected.hand = true;

        affected.activePile = true;
        let doTheDecline = function ({
          affected,
          affectedIds,
          request,
          checkpoints,
        }) {
          let requestPayload = request.getPayload();
          let transaction = requestPayload.transaction;
          let done = transaction
            .getOrCreate("done")
            .getOrCreate("done");
          done.add("done");
          done.confirm("done");
          checkpoints.set("success", true);
          request.setTargetSatisfied(true);
          request.decline(consumerData);
          request.close("decline");
          affected.requests = true;
          affectedIds.requests.push(request.getId());
        };

        if (
          game.doesCardHaveTag(cardId, "contestable")
        ) {

          let sayNoRequest = requestManager.makeJustSayNo(
            request,
            cardId
          );
          affectedIds.requests.push(
            sayNoRequest.getId()
          );
          affectedIds.playerRequests.push(
            sayNoRequest.getTargetKey()
          );

          doTheDecline({
            request,
            affected,
            affectedIds,
            checkpoints,
          });
        } else {
          doTheDecline({
            request,
            affected,
            affectedIds,
            checkpoints,
          });
        }
      }
    }
  }

  function acceptCollectValueRequest({
    player,
    request,
    affected,
    affectedIds,
    payWithBank,
    payWithProperty,
    thisPersonId,
  }){


    let game = getPublic();
    let consumerData = {
      request,
      affected,
      affectedIds,
      thisPersonId,
      player,
    }

    request.setStatus("accept");
    let affectedCollections = {};

    let requestPayload = request.getPayload();
    let transaction = requestPayload.transaction; // assumes is created with request
    let { amountRemaining } = requestPayload;


    // Pay with bank
    if (isArr(payWithBank)) {
      let playerBank = player.getBank();
      payWithBank.forEach((source) => {
        let { cardId } = source;

        if (playerBank.hasCard(cardId)) {
          if (amountRemaining > 0) {
            let transferBank = transaction
              .getOrCreate("toAuthor")
              .getOrCreate("bank");
            affected.bank = true;

            let card = playerBank.getCard(cardId);
            let cardValue = card.value;

            let affectsValue = false;
            if (
              [Infinity, "Infinity"].includes(cardValue)
            ) {
              amountRemaining = 0;
              affectsValue = true;
            } else {
              if (cardValue > 0) {
                amountRemaining -= cardValue;
                affectsValue = true;
              }
            }

            if (affectsValue) {
              playerBank.removeCard(cardId);
              transferBank.add(cardId);
            }
          }
        }
      });
    }

    // Pay with property
    if (isArr(payWithProperty)) {
      let collectionManager = game.getCollectionManager();
      payWithProperty.forEach((source) => {
        let { collectionId, cardId } = source;

        // required data defiend
        if (isDef(collectionId) && isDef(cardId)) {
          if (player.hasCollectionId(collectionId)) {
            let collection = collectionManager.getCollection(
              collectionId
            );

            if (collection.hasCard(cardId)) {
              let transferProperty = transaction
                .getOrCreate("toAuthor")
                .getOrCreate("property");
              // is valid card in collection
              let card = collection.getCard(cardId);
              let cardValue = getNestedValue(
                card,
                "value",
                0
              );

              let affectsValue = false;
              if (
                [Infinity, "Infinity"].includes(
                  cardValue
                )
              ) {
                amountRemaining = 0;
                affectsValue = true;
              } else {
                if (cardValue > 0) {
                  amountRemaining -= cardValue;
                  affectsValue = true;
                }
              }
              //card has a value
              if (affectsValue) {
                collection.removeCard(cardId);
                game.cleanUpFromCollection(thisPersonId, collection);
                transferProperty.add(card.id);
                affectedCollections[collection.getId()] = true;
              }
            }
          }
        }
      });
    }

    if (amountRemaining <= 0) {
      status = "success";
    } else {
      // Player has nothing on the table of value
      let collectionManager = game.getCollectionManager();
      let allMyCollectionIds = player.getAllCollectionIds();
      let hasPayableProperty = false;
      if (allMyCollectionIds.length > 0) {
        allMyCollectionIds.forEach((collectionId) => {
          let collection = collectionManager.getCollection(
            collectionId
          );
          let collectionCards = collection.getAllCards();
          if (collectionCards.length > 0) {
            for (
              let i = 0;
              i < collectionCards.length;
              ++i
            ) {
              let card = collectionCards[i];
              if (isDef(card.value) && card.value > 0) {
                hasPayableProperty = true;
                break;
              }
            }
          }
        });
      }

      let hasBank =
        player.getBank().getTotalValue() > 0;
      if (!hasPayableProperty && !hasBank) {
        status = "success";
      }
    }

    if (status === "success") {
      request.setTargetSatisfied(true);
      request.accept(consumerData);
    }


    // If collections were affected emit updates
    affectedIds.collections = Object.keys(affectedCollections);

    
    return status;
  }


  function respondToJustSayNo(consumerData) {
    let { cardId, requestId, responseKey } = consumerData;
    let game = getPublic();
    let {
      affected,
      affectedIds,
      checkpoints,
      thisPersonId,
    } = consumerData;

    let validResponses = {
      accept: 1,
      decline: 1,
    };

    let currentTurn = game.getCurrentTurn();
    let requestManager = currentTurn.getRequestManager();
    let request = requestManager.getRequest(requestId);

    if (
      isDef(request) &&
      !request.getTargetSatisfied() &&
      request.getTargetKey() === thisPersonId &&
      request.getType() === "justSayNo"
    ) {
      checkpoints.set("isValidResponseKey", false);
      if (isDef(responseKey) && isDef(validResponses[responseKey])) {
        checkpoints.set("isValidResponseKey", true);

        checkpoints.set("success", false);


        let doTheDecline = function ({
          request,
          affected,
          affectedIds,
        }) {
          request.decline(consumerData);
          request.setTargetSatisfied(true);
          request.close(responseKey);
          affected.requests = true;
          affected.requests = true;
          affectedIds.requests.push(request.getId());
        };


        let doTheAccept = function({
          request,
          affected,
          affectedIds,
        }){
          request.accept(consumerData);
          request.setTargetSatisfied(true);
          request.close(responseKey);
          affected.requests = true;
          affectedIds.requests.push(request.getId());
        }
        switch (responseKey) {
          case "accept":
            doTheAccept({
              request,
              affected,
              affectedIds
            })
            checkpoints.set("success", true);

            break;
          case "decline":
            if (game.doesCardHaveTag(cardId, "declineRequest")) {
              game
                .getActivePile()
                .addCard(
                  game.getPlayerHand(thisPersonId).giveCard(cardId)
                );
              affected.hand = true;
              affected.activePile = true;

              
              doTheDecline({
                request,
                affected,
                affectedIds,
                checkpoints,
              });

              checkpoints.set("success", true);
            }
            break;
          default:
        }
      }
    }
  }
  

  function getPublic() {
    return {

      // MISC
      requestRent,
      declineCollectValueRequest,
      acceptCollectValueRequest,
      respondToJustSayNo,



      //====================================
      getPlayerManager,
      getCardManager,
      getTurnManager,
      getRequestManager,
      getCollectionManager,
  
      //====================================
  
      // Config
  
      updateConfig,
      getConfig,
      setConfigShuffledDeck,
      getConfigShuffledDeck,
      getConfigAlteringSetCostAction,
      getMinPlayerCount,
      getWinningCondition,
      getMaxPlayerCount,
  
      isAcceptablePlayerCount,
      isGameStarted,
      isGameOver,
  
      //====================================
  
      //  Serialize / Unserialize
  
      serialize,
      unserialize,
  
      //====================================
  
      // Life cycle
  
      canStartGame,
      newGame,
      startGame,
  
      //====================================
  
      // Turn
  
      isMyTurn,
      getCurrentTurn,
      nextPlayerTurn,
      checkWinConditionForPlayer,
  
      //====================================
  
      // Filtering
  
      filterForTag,
      doesCardHaveTag,
      doesCardHaveClass,
      canCardBeAddedToBank,
      isRentCard,
      isCardProperty,
      isActionCard,
      isCardSetAugment,
      isCardRentAugment,
      isRequestCard,
      lookUpCardById,
      updateCardSet,
      getSetChoicesForCard,
      getCard,
      getCards,
      getAllCardsKeyed,
      getAllCardIds,
      card: {
        getActionAugment: getCardActionAugment,
      },
  
      // Deck
      getDeck,
      getDeckCardCount,
      getActivePile,
      getDiscardPile,
  
      // Properties
      getPropertySets,
      getPropertySet,
      getAllPropertySetKeys,
  
      //====================================
  
      // Collections
  
      getCollectionThatHasCard,
      canApplyAugmentToSet,
      canAddCardToCollection,
      cleanUpFromCollection,
  
      // Distinct collections
      getUselessCollectionForPlayer,
      getUselessPropertySetKey,
  
      isCollectionComplete,
      getRentValueOfCollection,
      playCardToExistingCollection,
  
      // Request Cards
      applyActionValueAugment,
      canApplyRequestAugment,
  
      //====================================
  
      // Play
  
      canPreformActionById,
      playCardById,
      playCardFromHandToNewCollection,
      drawNCards,
  
      //====================================
  
      // Player
  
      canAddPlayer,
      createPlayer,
      hasPlayer,
      getPlayer,
      getCurrentTurnPlayer,
      getPlayerHand,
      getPlayerBank,
      playerTurnStartingDraw,
      getHandMaxCardCount,
    };
  }

  return getPublic();
};

module.exports = GameInstance;
