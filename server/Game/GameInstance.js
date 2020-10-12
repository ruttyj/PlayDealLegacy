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


let GameManager = () => {
  let mConfig = {
    shuffleDeck: false,
    canWinBySetsOfSameColor: false,
    alterSetCostAction: false,
    testMode: false,
  };

  const mMaxPlayerCount = 5;
  const mMinPlayerCount = 2;
  const mInitialCardCount = 5;
  const mMaxCardCount = 7;
  let mIsGameStarted;
  let mPlayerManager;
  let mCardManager;
  let mIsGameOver = false;
  let mWinningCondition = null;
  let mActivePile;
  let mDiscardPile;
  let mDeck;
  const mCurrency = {
    TEN: 10,
    FIVE: 5,
    FOUR: 4,
    THREE: 3,
    TWO: 2,
    ONE: 1,
  };

  //--------------------------------

  //          Composition

  //--------------------------------
  function getPlayerManager() {
    return mPlayerManager;
  }

  function getRequestManager() {
    return getPlayerManager().getCurrentTurn().getRequestManager();
  }

  //--------------------------------

  //          Life cycle

  //--------------------------------
  function resetGame() {
    mIsGameStarted = false;
    mIsGameOver = false;
    initActivePile();
    initDiscardPile();
    mCardManager = CardManager(getPublic());
    mPlayerManager = PlayerManager(getPublic());
    mCardManager.generateCards();

    mDeck = CardContainer(getPublic());
    mDeck.replaceAllCards(mCardManager.getAllCards());
  }

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
    resetGame();
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

  function getCurrentTurn() {
    let playerManager = getPlayerManager();
    if (isDef(playerManager)) return playerManager.getCurrentTurn();
    return null;
  }

  function nextPlayerTurn() {
    let playerManager = getPlayerManager();
    if (isDef(playerManager)) {
      return playerManager.nextPlayerTurn();
    }
    return null;
  }

  function dealInitialCards() {
    let players = getAllPlayers();

    let playerHand;
    let player;
    let playerIndex = 0;
    let giveCards;
    player = players[playerIndex];
    playerHand = player.getHand();

    // @CHEAT
    /*
    giveCards = [
      "PROPERTY_BROWN_1",
      "PROPERTY_BROWN_2",
      "PROPERTY_BLUE_1",
      "PROPERTY_BLUE_2",
      "PROPERTY_PINK_1",
      "PROPERTY_PINK_2",
    ];
    giveCards.forEach((cardKey) => {
      playerHand.addCard(
        mDeck.giveCard(mDeck.findCard((card) => card.key === cardKey))
      );
    });

    player = players[1];
    playerHand = player.getHand();
    giveCards = [
      "DEBT_COLLECTOR",
      "DEAL_BREAKER",
      "DOUBLE_THE_RENT",
      "DOUBLE_THE_RENT",
      "ITS_MY_BIRTHDAY",
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

  function getCurrentTurn() {
    let playerManager = getPlayerManager();
    return isDef(playerManager) ? playerManager.getCurrentTurn() : null;
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
    let playerManager = getPlayerManager();
    let currentTurn = playerManager.getCurrentTurn();
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
    //let cardManager = getCardManager();
    let playerManager = getPlayerManager();
    let requestManager = getRequestManager();
    let collectionManager = getCollectionManager();

    let result = {
      playerManager: playerManager.serialize(),
      requestManager: requestManager.serialize(),
      collectionManager: collectionManager.serialize(),
    };

    return result;
  }

  function unserialize(){

  }

  const publicScope = {
    //====================================
    getPlayerManager,
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
    getPlayerHand,
    getPlayerBank,
    playerTurnStartingDraw,
    getHandMaxCardCount,
  };

  function getPublic() {
    return { ...publicScope };
  }

  return getPublic();
};

module.exports = GameManager;
