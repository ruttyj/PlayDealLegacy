import sounds from "../assets/sounds";
import {
  isArr,
  isDef,
  isFunc,
  isObj,
  isDefNested,
  els,
  getNestedValue,
  setNestedValue,
  getKeyFromProp,
  jsonLog,
} from "../utils/";
import SCREENS from "../data/screens";
import PropertySetContainer from "../components/panels/playerPanel/PropertySetContainer";
import ReduxState from "../App/controllers/reduxState";
const reduxState = ReduxState.getInstance(); // Object to manipulate the redux state
const placeHolderFunc = () => console.log("not defined");

const voiceConfig = {
  voice: "Australian Female",
};

function Game(ref) {
  sounds.setVolume(0.5);

  let renderData = {
    actionButton: {
      disabled: true,
      onClick: placeHolderFunc,
    },
  };

  //===============================
  // INSTANCE LIFE CYCLE
  //#region
  let mIsInit = false;

  function isInit() {
    return mIsInit;
  }

  function init() {
    attachEventHandlers();
    mIsInit = true;
  }

  function attachEventHandlers() {
    let game = getPublic();

    // Upon person joining the room
    on(["ROOM", "JOIN"], async (response) => {
      if (isDef(response)) {
        let { personId } = response.payload;
        let myId = game.myId();
        if (isDef(myId) && personId !== game.myId()) {
          sounds.joinRoom.play();
        }
      }
    });

    // When the game starts
    on(["GAME", "START"], async (data) => {
      sounds.startGame.play();
    });

    // When a person draws cards
    on(["PLAYERS", "PERSON_DREW_CARDS_KEYED"], async (data) => {
      const game = getPublic();

      if (game.isMyTurn()) {
        if (game.phase.get() === "draw") {
          //responsiveVoice.speak("I draw.", "Australian Female", {
          //  volume: 1,
          //});
        }
        sounds.drawCard.play(data.payload.count);
      } else {
        sounds.theyDrewCard.play(data.payload.count);
      }
    });

    // execute after PLAYER_TURN.GET has affected redux
    let canTrigger = {
      endTurnSound: true,
      requestSound: true,
    };

    // When the player's turn updates
    on(["PLAYER_TURN", `${"GET"}__STORE_UPDATED`], async () => {
      const game = getPublic();

      // Play sound when my turn is done
      if (game.phase.isMyDonePhase() && canTrigger.endTurnSound) {
        //responsiveVoice.speak("Job's done", "Australian Female", {
        //  volume: 1,
        //});

        canTrigger.endTurnSound = false;
        let isAutoPassTurnEnabled = game.customUi.get("autoPassTurn", false);
        setTimeout(() => {
          sounds.endTurn.play();
          if (isAutoPassTurnEnabled) {
            game.passTurn();
          }
        }, 700);
      } else {
        canTrigger.endTurnSound = true;
      }

      let playSound = null;
      game.requests.getAll().forEach((request) => {
        let requestId = request.id;
        let actionCardId = game.request.getActionCardId(requestId);
        let existedPreviously = game.request.existedPreviously(requestId);
        if (!existedPreviously) {
          playSound = sounds.newRequest;

          let amITarget = game.request.amITarget(requestId);
          if (amITarget) {
            //Oh damn shits going down
            if (game.card.hasTag(actionCardId, "stealCollection")) {
              playSound = sounds.evilLaugh;
            } else if (game.request.transfer.fromAuthor.exists(requestId)) {
              playSound = sounds.hmm;
            } else if (game.card.hasTag(actionCardId, "itsMyBirthday")) {
              playSound = sounds.birthday;
            } else if (game.card.hasTag(actionCardId, "debtCollection")) {
              playSound = sounds.debtCollectors;
            } else {
              playSound = sounds.newRequest;
            }
          } else if (game.card.hasTag(actionCardId, "stealCollection")) {
            playSound = sounds.quietEvilLaugh;
          } else if (game.card.hasTag(actionCardId, "itsMyBirthday")) {
            playSound = sounds.birthday;
          } else {
            playSound = sounds.newRequest;
          }
        }
      });

      if (
        isDef(playSound) &&
        isFunc(playSound.play) &&
        canTrigger.requestSound
      ) {
        playSound.play();
        canTrigger.requestSound = false;
      } else {
        canTrigger.requestSound = true;
      }

      let previousTurnPersonId = getPeviousTurnPersonId();
      let currentTurnPersonId = getCurrentTurnPersonId();

      if (game.isMyTurn()) {
        // If is my turn now
        if (!isDef(previousTurnPersonId) || !isMyId(previousTurnPersonId)) {
          sounds.yourTurn.play();
        }

        if (isDiscardPhase()) {
          // Flag cards to discard
          let previousTurnPhase = getPeviousTurnPhase();
          if (previousTurnPhase !== "discard") {
            await props().cardSelection_reset();
            await props().cardSelection_setSelected([]);
          }

          await props().cardSelection_setSelectable(getMyHandCardIds());
          await props().cardSelection_setEnable(true);

          await props().cardSelection_setType("remove");

          await props().cardSelection_setLimit(getDiscardCount());
        } else if (isDonePhase()) {
          // show the user no more actions can be taken
          await props().cardSelection_reset();
          await props().cardSelection_setEnable(true);
          await props().collectionSelection_reset();
          await props().personSelection_reset();
        }
      } else {
        // if is new turn reset selections
        if (
          getPeviousTurnPersonId() !== currentTurnPersonId &&
          game.isMyTurn() &&
          game.phase.get() === "draw"
        ) {
          sounds.yourTurn.play(1);
          //responsiveVoice.speak("It's my turn.", "Australian Female", {
          //  volume: 1,
          //});
          await game.resetUi();
        }
      }

      // update previous ids
      let newPreviousIds = {};
      game.requests.getAllIds().forEach((id) => {
        newPreviousIds[id] = true;
      });
      props().setPreviousRequests(newPreviousIds);
    });

    // When requests updates
    on(["REQUESTS", `${"GET_KEYED"}__STORE_UPDATED`], async () => {
      const game = getPublic();
      // open request screen if any requests are active
      //let myAuthoredRequestIds = game.requests.getAuthoredIds().filter(id => game.request.isOpen(id));
      let myTargetedRequestIds = game.requests
        .getTargetedIds()
        .filter((id) => game.request.isOpen(id));

      let displayMode = getDisplayData("mode", null);

      if (game.requests.getAllIds().length && game.requests.openExists()) {
        if (!isDef(displayMode)) {
          await updateDisplayMode(SCREENS.REQUESTS);
        }
      }

      // close request screen if all requests are completed
      if (game.requests.getAllIds().length > 0 && !game.requests.openExists()) {
        await updateDisplayMode(null);
      }
    });

    // Attach the core listeners
    props().attachRoomListeners(connection());
    props().attachPeopleListeners(connection());
    props().attachGameListeners(connection());
  }

  async function resetState() {
    await props().resetGameData();
  }
  //#endregion
  //_______________________________

  //===============================
  // DEPENDENCIES FROM COMPONENT
  //#region
  function props() {
    return ref.props;
  }

  function connection() {
    return ref.getConnection();
  }
  //#endregion
  //_______________________________

  // data for the render process - does not provoke rerender unlike state

  //===============================
  //  RENDER DATA
  //#region
  function updateRenderData(path, value) {
    setNestedValue(renderData, path, value);
  }

  function getRenderData(path, fallback = null) {
    return getNestedValue(renderData, path, fallback);
  }
  //#endregion
  //_______________________________

  //===============================
  //  CUSTOM UI
  //#region
  function getCustomUi(path = [], fallback = null) {
    const _path = isArr(path) ? path : [path];
    return reduxState.get(["game", "uiCustomize", ..._path], fallback);
  }

  async function setCustomUi(path = [], value = null) {
    await props().setCustomUi(path, value);
  }
  //#endregion
  //_______________________________

  //===============================
  // ROOM
  //#region

  function getLobbyUsers() {
    return getPersonOrder().map((id) => {
      return getPerson(id);
    });
  }

  function getRoomCode(fallback = null) {
    return reduxState.get(["rooms", "currentRoom", "code"], fallback);
  }

  function getPersonStatusLabel(personId) {
    return translatePersonStatus(getPersonStatus(personId));
  }

  async function toggleReady() {
    let currentStatus = getMyStatus();
    let newStatus;
    if (currentStatus === "ready") {
      newStatus = "not_ready";
    } else {
      newStatus = "ready";
    }
    await updateMyStatus(newStatus);
  }

  function getPersonStatus(personId = null) {
    if (!isDef(personId)) personId = myId();

    let person = getPerson(personId);
    if (isDef(person)) return person.status;
    return null;
  }

  function translatePersonStatus(status) {
    if (status === "ready") {
      return "Ready";
    } else if (["not_ready", "connected"].includes(status)) {
      return "Not Ready";
    }
    return status;
  }

  //#endregion
  //_______________________________

  //===============================
  // OBSERVERS
  //#region
  function event() {
    return connection().listnerTree;
  }

  function on(...args) {
    return connection().listnerTree.on(...args);
  }

  function once(...args) {
    return connection().listnerTree.once(...args);
  }

  function off(...args) {
    return connection().listnerTree.off(...args);
  }

  function emit(...args) {
    return connection().listnerTree.emit(...args);
  }
  //#endregion
  //_______________________________

  //===============================
  // ME
  //#region
  async function updateMyName(name) {
    return await props().updateMyName(connection(), getRoomCode(), name);
  }

  async function updateMyStatus(status) {
    return await props().updateMyStatus(connection(), getRoomCode(), status);
  }

  function getMyStatus() {
    return getPersonStatus();
  }

  function amIReady() {
    return isPersonReady(myId());
  }

  function me() {
    return getPerson(myId());
  }

  function isMyTurn() {
    return getCurrentTurnPersonId() === myId();
  }

  function getPlayerHand(playerId) {
    let playerHand = reduxState.get(
      ["game", "playerHands", "items", playerId],
      {}
    );
    return _mergeCardDataIntoObject(playerHand);
  }
  function getMyHand() {
    return getPlayerHand(myId());
  }

  function getMyCardIdsWithTags(mxd) {
    let tags = isArr(mxd) ? mxd : [mxd];
    let myHand = getMyHand();
    let result = [];
    let cardIds = myHand.cardIds;
    if (isArr(cardIds)) {
      cardIds.forEach((cardId) => {
        for (let i = 0; i < tags.length; ++i) {
          if (doesCardHaveTag(cardId, tags[i])) {
            result.push(cardId);
            break;
          }
        }
      });
    }
    return result;
  }

  function getMyCardIdsWithTag(tag) {
    let myHand = getMyHand();
    let result = [];
    let cardIds = myHand.cardIds;
    if (isArr(cardIds)) {
      cardIds.forEach((cardId) => {
        if (doesCardHaveTag(cardId, tag)) {
          result.push(cardId);
        }
      });
    }
    //rentAugment
    return result;
  }

  function getHostId() {
    return reduxState.get(["people", "host"], null);
  }

  function myId() {
    return reduxState.get(["people", "myId"], null);
  }

  function isMyId(personId) {
    return String(myId()) === String(personId);
  }

  function amIHost() {
    return isMyId(getHostId());
  }

  function getAllPlayerBankData() {
    return reduxState.get(["game", "playerBanks"], {});
  }
  function getPlayerBankCardIds(playerId) {
    return getNestedValue(
      getAllPlayerBankData(),
      ["items", playerId, "cardIds"],
      []
    );
  }
  function getMyBankCardIds() {
    return getPlayerBankCardIds(myId());
  }

  function getRequestIdsForPlayer(playerId, fallback = []) {
    return reduxState.get(
      ["game", "playerRequests", "items", playerId],
      fallback
    );
  }
  function getMyRequestIds() {
    return getRequestIdsForPlayer(myId());
  }
  //#endregion
  //_______________________________

  //===============================
  // PHASE
  //#region
  function isActionPhase() {
    return reduxState.get(["game", "playerTurn", "phase"], null) === "action";
  }

  function isMyDonePhase() {
    return isMyTurn() && getCurrentPhaseKey() === "done";
  }

  function isDiscardPhase() {
    return reduxState.get(["game", "playerTurn", "phase"], null) === "discard";
  }

  function isGameStarted() {
    return getNestedValue(getGameStatusData(), ["isGameStarted"], false);
  }

  function isGameOver() {
    return getNestedValue(getGameStatusData(), ["isGameOver"], false);
  }

  function getWinningCondition() {
    return getNestedValue(
      getGameStatusData(),
      ["winningCondition", "payload", "condition"],
      "For some reason..."
    );
  }

  function getWinningPersonId() {
    return getNestedValue(
      getGameStatusData(),
      ["winningCondition", "payload", "playerId"],
      null
    );
  }

  function getWinner() {
    let winningId = getWinningPersonId();
    if (isDef(winningId)) {
      return getPerson(winningId);
    }
    return null;
  }

  function getGameStatusData() {
    return reduxState.get(["game", "gameStatus"], {});
  }

  function getWinningPlayerId() {
    return reduxState.get(["game", "winningPlayerId"], null);
  }

  function getGameStatus() {
    return getGameStatusData();
  }

  function canStartGame() {
    return amIHost();
  }

  function getGameStatus(path = [], fallback = null) {
    let _path = isArr(path) ? path : [path];
    return getNestedValue(getGameStatusData(), _path, fallback);
  }

  function getCurrentActionCount() {
    return reduxState.get(["game", "playerTurn", "actionCount"], 0);
  }
  //#endregion
  //_______________________________

  //===============================
  // CARD DETECTION
  //#region
  function isCashCard(card) {
    return card.type === "cash";
  }

  function isPropertyCard(cardOrId) {
    let card = getCard(cardOrId);
    return card.type === "property";
  }

  function isActionCard(cardOrId) {
    let card = getCard(cardOrId);
    return card.type === "action";
  }

  function isRentCard(cardOrId) {
    let card = getCard(cardOrId);
    return doesCardHaveTag(card.id, "rent");
  }

  function doesCardHaveTag(cardOrId, tag) {
    let card = getCard(cardOrId);
    return isArr(card.tags) ? card.tags.includes(tag) : false;
  }

  function isDrawCard(cardOrId) {
    let card = getCard(cardOrId);
    return card.class === "draw";
  }

  function isWildPropertyCard(cardOrId) {
    let card = getCard(cardOrId);
    return isPropertyCard(card) && card.tags.includes("wild");
  }

  function isSuperWildProperty(cardOrId) {
    let card = getCard(cardOrId);
    return isPropertyCard(card) && card.tags.includes("superWild");
  }

  function isSetAugmentCard(cardOrId) {
    let card = getCard(cardOrId);
    return card.type === "action" && card.class === "setAugment";
  }
  //#endregion
  //_______________________________

  //===============================
  // GAME GENERAL
  //#region

  function isEveryoneReady() {
    let readyCount = 0;
    let path = ["people", "order"];
    let personOrder = reduxState.get(path, []);
    let personCount = personOrder.length;
    personOrder.forEach((personId) => {
      let person = publicScope.getPerson(personId);
      if (person.status === "ready") {
        ++readyCount;
      }
    });
    return readyCount === personCount;
  }

  function getPerson(personId) {
    let path = ["people", "items", personId];
    return reduxState.get(path, null);
  }

  function isPersonReady(personId = null) {
    if (!isDef(personId)) personId = myId();
    let status = getPersonStatus(personId);
    return status === "ready";
  }

  function canPassTurn() {
    return isMyTurn() && !["draw", "request"].includes(getCurrentPhaseKey());
  }

  function canDrawInitialCards() {
    return isMyTurn() && getCurrentPhaseKey() === "draw";
  }

  function drawTurnStartingCards() {
    props().drawTurnStartingCards(connection(), getRoomCode());
    updateDisplayMode(null);
  }

  function getAllPlayers() {
    return props().getAllPlayers();
  }

  function getCurrentPhaseKey() {
    return reduxState.get(["game", "playerTurn", "phase"], null);
  }

  function isHost(personId) {
    if (!isDef(personId)) personId = myId();
    let hostId = getHostId();
    return isDef(hostId) && String(hostId) === String(personId);
  }

  function getActionCountRemaining() {
    return getCurrentTurnActionLimit() - getCurrentActionCount();
  }

  function getCurrentTurnActionLimit() {
    return reduxState.get(["game", "playerTurn", "actionLimit"], 0);
  }

  function getCurrentTurnActionsRemaining() {
    return getCurrentActionCount() - getCurrentTurnActionLimit();
  }

  function getCard(cardOrId) {
    let cardId = getKeyFromProp(cardOrId, "id");
    return reduxState.get(["game", "cards", "items", cardId], null);
  }
  //#endregion
  //_______________________________

  //===============================
  // RENT
  //#region
  function chargeRent(
    actionCardId,
    { collectionId, augmentCardsIds, targetIds, targetId }
  ) {
    return props().chargeRentForCollection(connection(), getRoomCode(), {
      cardId: actionCardId,
      collectionId,
      augmentCardsIds,
      targetIds,
      targetId,
    });
  }

  function canChargeRent() {
    let actionCardId = getActionCardId();
    if (isDef(actionCardId)) {
      return (
        isRequiredCollectionsSelected() &&
        isRequiredPeopleSelected() &&
        props().collectionSelection_getSelected().length > 0
      );
    }
    return false;
  }
  //#endregion
  //_______________________________

  //===============================
  // COLLECTION
  //#region
  function getAllCollectionAssociationData() {
    return reduxState.get(["game", "playerCollections"], []);
  }

  function valueCollection({ cardId, augmentCardsIds, targetIds }) {
    return props().valueCollection(connection(), getRoomCode(), {
      cardId: cardId,
      augmentCardsIds,
      targetIds,
    });
  }

  async function swapProperties({
    cardId,
    myPropertyCardId,
    theirPropertyCardId,
  }) {
    return await props().swapProperties(connection(), getRoomCode(), {
      cardId,
      myPropertyCardId,
      theirPropertyCardId,
    });
  }

  async function respondToPropertyTransfer({ cardId, requestId, responseKey }) {
    return await props().respondToPropertyTransfer(
      connection(),
      getRoomCode(),
      { cardId, requestId, responseKey }
    );
  }

  async function stealProperties({ cardId, theirPropertyCardId }) {
    return await props().stealProperties(connection(), getRoomCode(), {
      cardId,
      theirPropertyCardId,
    });
  }

  async function stealCollection({ cardId, theirCollectionId }) {
    return await props().stealCollection(connection(), getRoomCode(), {
      cardId,
      theirCollectionId,
    });
  }

  async function respondToStealProperty({ cardId, requestId, responseKey }) {
    return await props().respondToStealProperty(connection(), getRoomCode(), {
      cardId,
      requestId,
      responseKey,
    });
  }

  async function respondToJustSayNo({ cardId, requestId, responseKey }) {
    return await props().respondToJustSayNo(connection(), getRoomCode(), {
      cardId,
      requestId,
      responseKey,
    });
  }

  async function respondToStealCollection({ cardId, requestId, responseKey }) {
    return await props().respondToStealCollection(connection(), getRoomCode(), {
      cardId,
      requestId,
      responseKey,
    });
  }

  async function collectCollection({ requestId }) {
    return await props().collectCollection(connection(), getRoomCode(), {
      requestId,
    });
  }
  //#endregion
  //_______________________________

  //===============================
  // ACTION
  //#region
  async function start() {
    await props().resetGame(connection(), getRoomCode()); // for Dev reasons
    await props().startGame(connection(), getRoomCode());
  }

  function passTurn() {
    if (canPassTurn()) {
      props().passTurn(connection(), getRoomCode());
    }
  }

  function canAddCardToBank(cardOrId) {
    let card = getCard(cardOrId);
    return card.type === "cash" || card.type === "action";
  }

  async function transferPropertyToExistingCollection(
    cardId,
    fromCollectionId,
    toCollectionId
  ) {
    return await props().transferPropertyToExistingCollection(
      connection(),
      getRoomCode(),
      cardId,
      fromCollectionId,
      toCollectionId
    );
  }

  async function transferSetAugmentToExistingCollection(
    cardId,
    fromCollectionId,
    toCollectionId
  ) {
    return await props().transferSetAugmentToExistingCollection(
      connection(),
      getRoomCode(),
      cardId,
      fromCollectionId,
      toCollectionId
    );
  }

  function isCollectionComplete(collectionId) {
    let collection = getCollection(collectionId);
    return getNestedValue(collection, "isFullSet", false);
  }

  async function collectCardToCollection(requestId, cardId, collectionId) {
    return await props().collectCardToCollection(
      connection(),
      getRoomCode(),
      requestId,
      cardId,
      collectionId
    );
  }

  async function collectNothingToNothing(requestId) {
    return await props().collectNothingToNothing(
      connection(),
      getRoomCode(),
      requestId
    );
  }

  async function collectCardToBank(requestId, cardId) {
    return await props().collectCardToBank(
      connection(),
      getRoomCode(),
      requestId,
      cardId
    );
  }

  async function respondToValueRequest({
    requestId,
    cardId,
    responseKey = "accept",
  }) {
    let game = getPublic();
    let selectedCards = game.selection.cards.selected.get();
    let seperatedCards = game.seperateCards(selectedCards);
    let payWithBank = [];
    let payWithProperty = [];
    let myIdNum = game.myId();
    seperatedCards.forEach((details) => {
      if (details.location === "collection" && details.playerId === myIdNum) {
        payWithProperty.push(details);
      } else if (details.location === "bank" && details.playerId === myIdNum) {
        payWithBank.push(details);
      }
    });

    await props().respondToValueRequest(connection(), getRoomCode(), {
      requestId,
      responseKey,
      cardId,
      payWithBank,
      payWithProperty,
    });
  }

  async function initPayValueRequest(requestId) {
    const game = getPublic();
    const request = getRequest(requestId);
    let author = getPerson(request.authorKey);

    await game.resetDisplayData();
    await game.selection.collections.reset();
    await game.selection.people.reset();

    // Only cards with value are selectable
    let allSelectableCardsIds = [];
    let allPlayerCardIds = getAllCardIdsForPlayer(myId());
    allPlayerCardIds.forEach((cardId) => {
      let card = game.card.get(cardId);
      let value = els(card.value, 0);
      if (value > 0) {
        allSelectableCardsIds.push(cardId);
      }
    });

    await game.selection.cards.reset();
    await game.selection.cards.setEnabled(true);
    await game.selection.cards.selectable.set(allSelectableCardsIds);
    await game.selection.cards.selectable.setLimit(
      allSelectableCardsIds.length
    );
    await game.selection.cards.selected.set([]);

    await updateDisplayData("request", {
      id: requestId,
      type: "collectValue",
      actionLabel: `Pay rent to ${author.name}`,
      authorKey: request.authorKey,
      actionCardId: getNestedValue(request.payload, "actionCardId", null),
      actionCollectionId: getNestedValue(
        request.payload,
        "actionCollectionId",
        null
      ),
      augmentCardIds: getNestedValue(request.payload, "augmentCardIds", null),
      amount: request.payload.amountRemaining,
    });
    await updateDisplayMode("respond-pay");
  }

  function getCollectionIdsMatchingSets(playerId, propertySetKeys) {
    let result = [];
    let myCollectionIds = getCollectionIdsForPlayer(playerId);
    myCollectionIds.forEach((collectionId) => {
      let collection = getCollection(collectionId);
      if (propertySetKeys.includes(collection.propertySetKey)) {
        result.push(collectionId);
      }
    });
    return result;
  }

  async function initAskForRent(cardOrId, collectionId = null) {
    let game = getPublic();
    let card = getCard(cardOrId);
    let propertySetKeysForCard = getPropertySetKeysForCard(card.id);
    let matchingCollectionIds = getCollectionIdsMatchingSets(
      myId(),
      propertySetKeysForCard
    );
    if (matchingCollectionIds.length > 0) {
      // Highlight compatible augment cards
      let augmentCardIds = getMyCardIdsWithTag("rentAugment");

      await game.selection.cards.reset();
      await game.selection.cards.setEnabled(true);
      await game.selection.cards.setType("add");
      await game.selection.cards.selectable.setLimit(
        getCurrentTurnActionsRemaining() - 1
      );
      await game.selection.cards.selectable.set(augmentCardIds);
      await game.selection.cards.selected.set([]);

      await game.selection.collections.reset();
      await game.selection.collections.setEnabled(true);
      await game.selection.collections.setType("add");
      await game.selection.collections.selectable.setLimit(1);
      await game.selection.collections.selectable.set(matchingCollectionIds);
      await game.selection.collections.selected.set([]);
      if (isDef(collectionId) && matchingCollectionIds.includes(collectionId)) {
        await game.selection.collections.selected.set([collectionId]);
      }

      let allOpponentIds = getAllOpponentIds();
      if (card.target === "one") {
        await game.selection.people.reset();
        await game.selection.people.setType("add");
        await game.selection.people.selectable.setLimit(1);
        await game.selection.people.selectable.set(allOpponentIds);
        if (allOpponentIds.length === 1) {
          // only 1 person makes things simple
          await game.selection.people.setEnabled(false);
          await game.selection.people.selected.set(allOpponentIds);
        } else {
          await game.selection.people.setEnabled(true);
          await game.selection.people.selected.set([]);
        }
      } else {
        await game.selection.people.reset();
        await game.selection.people.setType("add");
        await game.selection.people.selectable.setLimit(allOpponentIds.length);
        await game.selection.people.selectable.set(allOpponentIds);
        await game.selection.people.selected.set(allOpponentIds);
        await game.selection.people.setEnabled(false);
      }

      await game.resetDisplayData();
      await game.updateDisplayData([], {
        actionCardId: card.id,
      });
      await updateDisplayMode("chargeRent");

      return true;
    } else {
      return false;
    }
  }

  function getAllOpponentIds() {
    return getAllPlayerIds().filter((id) => String(id) !== String(myId()));
  }

  async function initAskForValueCollection(cardOrId) {
    let game = getPublic();
    let card = getCard(cardOrId);
    let cardId = card.id;
    await game.resetUi();

    let isOptionsSimple = false;
    await props().personSelection_reset();
    let allOpponentIds = getAllOpponentIds();

    if (card.target === "one") {
      await game.selection.people.setType("add");
      await game.selection.people.selectable.setLimit(1);
      await game.selection.people.selectable.set(allOpponentIds);
      if (allOpponentIds.length === 1) {
        isOptionsSimple = true;
        // only 1 person makes things simple
        // @RACE ISSUE
        await game.selection.people.setEnabled(true);
        await game.selection.people.selected.set(allOpponentIds);
      } else {
        await game.selection.people.setEnabled(true);
        await game.selection.people.selected.set([]);
      }
    } else {
      isOptionsSimple = true;
      await game.selection.people.setEnabled(false);
      await game.selection.people.selectable.setLimit(allOpponentIds.length);
      await game.selection.people.selected.set(allOpponentIds);
    }

    if (isOptionsSimple) {
      await game.handleAskForValueConfirm({ cardId: card.id });
    } else {
      await game.updateDisplayData([], {
        mode: "askPropleForValue",
        actionCardId: card.id,
      });
      await updateDisplayMode("askPropleForValue");
    }

    return true;
  }

  async function initAskForProperty(cardOrId) {
    let game = getPublic();
    let card = game.card.get(cardOrId);
    await game.resetUi();
    await game.selection.cards.reset();

    let selectableCardIds = [];
    game.player.opponents.getAllIds().forEach((personId) => {
      let collectionIds = game.player.collections.getAllIds(personId);
      collectionIds.forEach((collectionId) => {
        let collection = game.collection.get(collectionId);
        if (isDef(collection) && !collection.isFullSet) {
          let cardIds = game.collection.getCardIds(collectionId);
          cardIds.forEach((cid) => {
            let cardOption = game.card.get(cid);
            if (isDef(cardOption) && game.card.hasTag(cardOption, "property")) {
              selectableCardIds.push(cid);
            }
          });
        }
      });
    });

    await game.selection.cards.setEnabled(true);
    await game.selection.cards.selectable.set(selectableCardIds);
    await game.selection.cards.selectable.setLimit(1);

    await game.updateDisplayData([], {
      actionCardId: card.id,
    });
    await updateDisplayMode("stealProperty");

    return true;
  }

  async function initAskForCollection(cardOrId) {
    let game = getPublic();
    let card = game.card.get(cardOrId);
    await game.resetUi();

    await game.updateDisplayData([], {
      actionCardId: card.id,
    });
    await updateDisplayMode("stealCollection");

    await game.selection.cards.reset();
    await game.selection.cards.setEnabled(true);
    await game.selection.cards.setType("add");

    let selectableCollectionIds = [];
    game.player.opponents.getAllIds().forEach((personId) => {
      let collectionIds = game.player.collections.getAllIds(personId);
      collectionIds.forEach((collectionId) => {
        let collection = game.collection.get(collectionId);
        if (isDef(collection) && collection.isFullSet) {
          selectableCollectionIds.push(collectionId);
        }
      });
    });

    await game.selection.collections.setEnabled(true);
    await game.selection.collections.selectable.set(selectableCollectionIds);
    await game.selection.collections.selectable.setLimit(1);

    return true;
  }

  async function initAskForPropertySwap(cardOrId) {
    let game = getPublic();
    let card = game.card.get(cardOrId);
    await game.resetUi();
    await game.selection.cards.reset();

    let selectableCardIds = [];

    // opponent cards are selectable
    game.player.opponents.getAllIds().forEach((personId) => {
      let collectionIds = game.player.collections.getAllIds(personId);
      collectionIds.forEach((collectionId) => {
        let collection = game.collection.get(collectionId);
        if (isDef(collection) && !collection.isFullSet) {
          let cardIds = game.collection.getCardIds(collectionId);
          cardIds.forEach((cid) => {
            let cardOption = game.card.get(cid);
            if (isDef(cardOption) && game.card.hasTag(cardOption, "property")) {
              selectableCardIds.push(cid);
            }
          });
        }
      });
    });

    // also one of mine
    game.collections.getMyIds().forEach((collectionId) => {
      let collection = game.collection.get(collectionId);
      if (isDef(collection)) {
        //@TODO maybe not allow fulls ets?

        game.collection.getCardIds(collectionId).forEach((cid) => {
          selectableCardIds.push(cid);
        });
      }
    });

    await game.selection.cards.setEnabled(true);
    await game.selection.cards.selectable.set(selectableCardIds);
    await game.selection.cards.selectable.setLimit(2);

    await game.updateDisplayData([], {
      actionCardId: card.id,
    });
    await updateDisplayMode("askForPropertySwap");

    return true;
  }

  async function handleAskForValueConfirm({ cardId }) {
    let game = getPublic();
    let args = {
      cardId: cardId,
      targetIds: game.selection.people.selected.get(),
    };
    await game.valueCollection(args);
    await game.resetUi();
    await updateDisplayMode(SCREENS.REQUESTS);
  }

  function getIncompleteCollectionMatchingSet(myPersonId, propertySetKey) {
    let myCollectionIds = getCollectionIdsForPlayer(myPersonId);

    for (
      let collectionIndex = 0;
      collectionIndex < myCollectionIds.length;
      ++collectionIndex
    ) {
      let collectionId = myCollectionIds[collectionIndex];
      let collection = getCollection(collectionId);
      if (
        !collection.isFullSet &&
        collection.propertySetKey === propertySetKey
      ) {
        return collectionId;
      }
    }
    return null;
  }

  function autoAddCardToMyCollection(cardOrId) {
    let card = getCard(cardOrId);
    let cardId = card.id;
    let propertySetKey = card.set;
    let myPersonId = myId();
    let existingCollectionId = getIncompleteCollectionMatchingSet(
      myPersonId,
      propertySetKey
    );
    if (isDef(existingCollectionId)) {
      addPropertyToExistingCollectionFromHand(cardId, existingCollectionId);
    } else {
      props().addCardEmptySetFromHand(connection(), getRoomCode(), cardId);
    }
  }

  function playPassGo(cardOrId) {
    let card = getCard(cardOrId);
    props().playPassGo(connection(), getRoomCode(), card.id);
  }

  async function addPropertyToNewCollectionFromHand(cardId) {
    return await props().addCardEmptySetFromHand(
      connection(),
      getRoomCode(),
      cardId
    );
  }

  async function transferPropertyToNewCollection(cardId, fromCollectionId) {
    return await props().transferPropertyToNewCollection(
      connection(),
      getRoomCode(),
      cardId,
      fromCollectionId
    );
  }

  async function addPropertyToExistingCollectionFromHand(
    cardId,
    toCollectionId
  ) {
    return await props().addPropertyToExistingCollectionFromHand(
      connection(),
      getRoomCode(),
      cardId,
      toCollectionId
    );
  }

  async function transferSetAugmentToNewCollection(cardId, fromCollectionId) {
    return await props().transferSetAugmentToNewCollection(
      connection(),
      getRoomCode(),
      cardId,
      fromCollectionId
    );
  }

  async function addAugmentToExistingCollectionFromHand(
    cardId,
    toCollectionId
  ) {
    return await props().addAugmentToExistingCollectionFromHand(
      connection(),
      getRoomCode(),
      cardId,
      toCollectionId
    );
  }

  function getActionCardId() {
    return getDisplayData(["actionCardId"], null);
  }

  async function flipWildPropertyCard(
    cardId,
    propertySetKey,
    { collectionId } = {}
  ) {
    let result = await props().changeWildPropertySetKey(
      connection(),
      getRoomCode(),
      cardId,
      propertySetKey,
      isDef(collectionId) ? collectionId : null
    );
    return result;
  }

  async function addCardToMyBankFromHand(id) {
    await props().addCardToMyBank(connection(), getRoomCode(), id);
  }

  async function cancelRentAction() {
    await props().cardSelection_reset();
    await props().collectionSelection_reset();
    await props().personSelection_reset();
    await props().resetDisplayData();
    await updateDisplayMode(null);
  }

  async function cancelPropertyAction() {
    await props().cardSelection_reset();
    await props().collectionSelection_reset();
    await props().personSelection_reset();
    await props().resetDisplayData();
    await updateDisplayMode(null);
  }
  //#endregion
  //_______________________________

  //===============================
  // CHARGE RENT
  //#region
  async function resetChargeRentInfo() {
    await props().resetDisplayData();
    await props().cardSelection_reset();
    await props().collectionSelection_reset();
    await props().personSelection_reset();
    await updateDisplayMode(null);
  }
  //#endregion
  //_______________________________

  //===============================
  // DISCARD
  //#region
  function getDiscardCount() {
    return reduxState.get(
      ["game", "playerTurn", "phaseData", "remainingCountToDiscard"],
      0
    );
  }

  function getRemainingDiscardCount() {
    return getDiscardCount() - props().cardSelection_getSelected().length;
  }

  function canDiscardCards() {
    return isMyTurn() && isDiscardPhase() && getRemainingDiscardCount() === 0;
  }

  async function discardCards(selectedCardIds) {
    await props().discardCards(connection(), getRoomCode(), selectedCardIds);
  }
  //#endregion
  //_______________________________

  //===============================
  // CARD SELECTION
  //#region
  function isCardSelectable(cardId) {
    return props().cardSelection_hasSelectableValue(cardId);
  }

  function getCardSelectionType(cardId) {
    return props().cardSelection_getType();
  }

  function getSelectedCardIds() {
    return props().cardSelection_getSelected();
  }

  async function toggleCardSelected(id) {
    if (
      isCardSelectionEnabled() &&
      props().cardSelection_hasSelectableValue(id)
    ) {
      await props().cardSelection_toggleSelected(id);
    }
  }

  function isCardSelected(id) {
    return props().cardSelection_hasSelectedValue(id);
  }

  function isCardSelectionEnabled() {
    return props().cardSelection_getEnable();
  }

  function canSelectCard(id) {
    return (
      isCardSelectionEnabled() &&
      props().cardSelection_hasSelectableValue(id) &&
      (props().cardSelection_canSelectMoreValues() || isCardSelected(id))
    );
  }

  function isCardNotApplicable(id) {
    return isCardSelectionEnabled() && !canSelectCard(id);
  }
  //#endregion
  //_______________________________

  //===============================
  // COLLECTION SELECTION
  //#region
  function getSelectedCollectionIds() {
    return props().collectionSelection_getSelected();
  }

  function isRequiredCollectionsSelected() {
    return (
      props().collectionSelection_getSelected().length >=
      getDisplayData(["requirements", "collectionSelectionCount"], 1)
    );
  }
  //#endregion
  //_______________________________

  //===============================
  // PERSON SELECTION
  //#region
  function getSelectedPeopleIds() {
    return props().personSelection_getSelected();
  }

  async function togglePersonSelected(id) {
    let game = getPublic();
    if (game.selection.people.selectable.has(id)) {
      if (game.selection.people.selected.isLimitSelected()) {
        if (game.selection.people.selectable.getLimit() === 1) {
          let selectedIds = game.selection.people.selected.get();
          if (selectedIds.length > 0) {
            await game.selection.people.selected.toggle(
              game.selection.people.selected.get()[0]
            );
          }
          await game.selection.people.selected.toggle(id);
        }
      } else {
        if (canPersonBeSelected(id)) {
          await game.selection.people.selected.toggle(id);
        }
      }
    }
  }

  function canPersonBeSelected(id) {
    return (
      props().personSelection_hasSelectableValue(id) &&
      (props().personSelection_canSelectMoreValues() ||
        props().personSelection_hasSelectedValue(id))
    );
  }

  function isPersonSelected(id) {
    return props().personSelection_hasSelectedValue(id);
  }

  function getSelectedPeopleIds() {
    return props().personSelection_getSelected();
  }

  function isRequiredPeopleSelected() {
    return (
      props().personSelection_getSelected().length >=
      getDisplayData(["requirements", "personSelectionCount"], 1)
    );
  }
  //#endregion
  //_______________________________

  //===============================
  //  DRAW PILE
  //#region
  function getDrawPile() {
    return reduxState.get(["game", "drawPile"], { count: 0 });
  }

  function getDrawPileThickness() {
    return (
      (Math.max(getDrawPileCount(), 1) / Math.max(getTotalCardCount(), 1)) * 100
    );
  }

  function getDrawPileCount() {
    return reduxState.get(["game", "drawPile", "count"], 0);
  }
  //#endregion
  //_______________________________

  //===============================
  //  ACTIVE PILE
  //#region

  function getTotalCardCount() {
    return reduxState.get(["game", "cards", "order"], []).length;
  }

  function getActivePile() {
    let activePile = reduxState.get(["game", "activePile"], {
      count: 0,
      totalValue: 0,
      cardIds: [],
    });
    return _mergeCardDataIntoObject(activePile);
  }
  function getActivePileCountThickness() {
    return (
      (Math.max(getActivePileCount(), 1) / Math.max(getTotalCardCount(), 1)) *
      100
    );
  }
  function getActivePileCount() {
    return reduxState.get(["game", "activePile", "count"], 0);
  }
  function getTopCardOnActionPile() {
    let activePile = getActivePile();
    if (isDef(activePile)) {
      let numCards = activePile.cards.length;
      if (numCards > 0) {
        return activePile.cards[numCards - 1];
      }
    }
    return null;
  }
  //#endregion
  //_______________________________

  //===============================
  //  DISCARD PILE
  //#region

  function getDiscardPile() {
    let discardPile = reduxState.get(["game", "discardPile"], {
      count: 0,
      totalValue: 0,
      cardIds: [],
    });
    return _mergeCardDataIntoObject(discardPile);
  }

  function getTopCardOnDiscardPile() {
    let discardPile = getDiscardPile();
    if (isDef(discardPile) && discardPile.count > 0)
      return discardPile.cards[discardPile.count - 1];
    return null;
  }

  function getDiscardPileCount() {
    return reduxState.get(["game", "discardPile", "count"], 0);
  }

  function getDiscardPileCountThickness() {
    return (
      (Math.max(getDiscardPileCount(), 1) / Math.max(getTotalCardCount(), 1)) *
      100
    );
  }
  //#endregion
  //_______________________________

  //===============================
  //  DISPLAY STATE
  //#region
  async function updateActionData(path, value) {
    await props().updateActionData({ path, value });
  }

  function getActionData(path, fallback = null) {
    let _path = isArr(path) ? path : [path];
    return reduxState.get(["game", "actionData", ..._path], fallback);
  }

  function getDisplayData(path = [], fallback = null) {
    let _path = isArr(path) ? path : [path];
    return reduxState.get(["game", "displayData", ..._path], fallback);
  }

  async function updateDisplayData(path, value) {
    await props().updateDisplayData({ path, value });
  }

  async function updateDisplayMode(mode) {
    await updateDisplayData(["mode"], mode);

    if (mode === null) {
      await updateDisplayData("actionProtection", true);
      setTimeout(function() {
        updateDisplayData("actionProtection", false);
      }, 1000);
    }
  }

  async function resetDisplayData() {
    await props().updateDisplayData([], {});
  }

  async function resetUi() {
    const game = getPublic();
    await game.resetDisplayData();
    await game.selection.cards.reset();
    await game.selection.collections.reset();
    await game.selection.people.reset();
  }
  //#endregion
  //_______________________________

  //===============================
  //  COLLECTIONS
  //#region
  function getAllCollectionData() {
    return reduxState.get(["game", "playerCollections"], {});
  }

  function getCollectionIdsForPlayer(playerId) {
    return reduxState.get(["game", "playerCollections", "items", playerId], []);
  }

  function getMyCollectionIds() {
    return getCollectionIdsForPlayer(myId());
  }

  function getCollectionCardIds(collectionId) {
    return reduxState.get(
      ["game", "collections", "items", collectionId, "cardIds"],
      []
    );
  }

  function getCollectionMatchingSet(playerId, propertySetKey) {
    let myCollectionIds = getCollectionIdsForPlayer(playerId);

    for (
      let collectionIndex = 0;
      collectionIndex < myCollectionIds.length;
      ++collectionIndex
    ) {
      let collectionId = myCollectionIds[collectionIndex];

      let collectionCards = getCollectionCards(collectionId);
      for (let cardIndex = 0; cardIndex < collectionCards.length; ++cardIndex) {
        let card = collectionCards[cardIndex];
        if (isDef(card.set)) {
          if (card.set === propertySetKey) {
            return collectionId;
          }
        }
      }
    }
    return null;
  }

  function getCollectionCards(collectionId) {
    let collectionCardIds = reduxState.get(
      ["game", "collections", "items", collectionId, "cardIds"],
      []
    );
    return _mapCardIdsToCardList(collectionCardIds);
  }

  function getAllPlayerCollectionIds(playerId) {
    return reduxState.get(["game", "playerCollections", "items", playerId], []);
  }

  function getCollection(id) {
    return reduxState.get(["game", "collections", "items", id], []);
  }

  function getCollectionRentValue(id) {
    let baseValue = 0;
    let incrementAmount = 0;
    let multiplyAmount = 1;

    const game = getPublic();
    const collection = game.collection.get(id);
    let isComplete = false;
    if (isDef(collection)) {
      isComplete = collection.isFullSet;
      let propertyCount = collection.propertyCount;
      let propertySetKey = collection.propertySetKey;
      let propertySet = game.property.get(propertySetKey);
      if (isDefNested(propertySet, ["rent", propertyCount])) {
        baseValue = propertySet.rent[propertyCount];
      }

      // Process set augment cards
      let collectionCards = collection.cardIds;
      if (collectionCards.length > 0) {
        collectionCards.forEach((cardId) => {
          if (game.card.isSetAugmentCard(cardId)) {
            let card = game.card.get(cardId);
            let effect = getNestedValue(card, ["setAugment", "affect"]);
            if (isDefNested(effect, "inc")) {
              incrementAmount += effect.inc;
            }
            if (isDefNested(effect, "multiply")) {
              multiplyAmount *= effect.multiply;
            }
          }
        });
      }
    }

    // process rent augment cards
    let selectedCards = game.selection.cards.selected.get();
    if (selectedCards.length > 0) {
      selectedCards.forEach((cardId) => {
        if (game.card.hasTag(cardId, "rentAugment")) {
          let card = game.card.get(cardId);
          let effect = getNestedValue(card, ["actionAugment", "affects"], {});
          if (isDef(effect.inc)) {
            incrementAmount += effect.inc;
          }
          if (isDef(effect.multiply)) {
            multiplyAmount *= effect.multiply;
          }
        }
      });
    }

    let finalValue = (baseValue + incrementAmount) * multiplyAmount;
    return finalValue;
  }
  //#endregion
  //_______________________________

  //===============================
  //  PLAYERS
  //#region

  //#endregion
  //_______________________________

  //===============================
  //  PLAYER HAND
  //#region
  function getMyHandCardIds() {
    return reduxState.get(
      ["game", "playerHands", "items", myId(), "cardIds"],
      []
    );
  }

  function getMyHandCards() {
    return getCards(getMyHandCardIds());
  }

  function getMyDeclineCardIds() {
    let game = getPublic();
    let result = [];
    getMyHandCardIds().forEach((cardId) => {
      if (game.card.hasTag(cardId, "declineRequest")) {
        result.push(cardId);
      }
    });
    return result;
  }

  function doesMyHandHaveTooManyCards() {
    return getMyHandCardIds().length > 7; // @HARDCODED
  }

  function getAllPlayerHandData() {
    return getAllPlayerHandsData();
  }
  //#endregion
  //_______________________________

  //===============================
  //  CARDS
  //#region
  function getCards(cardIds) {
    let result = [];
    cardIds.forEach((id) => {
      let card = getCard(id);
      if (isDef(card)) result.push(card);
    });
    return result;
  }

  function getSumValueOfCards(cardIds) {
    let result = 0;
    cardIds.forEach((cardId) => {
      let card = getCard(cardId);
      if (isDef(card)) result += els(card.value, 0);
    });
    return result;
  }

  function getAllCardIdsForPlayer(playerId) {
    let result = [];
    let playerCollectionIds = getCollectionIdsForPlayer(playerId);
    playerCollectionIds.forEach((collectionId) => {
      let collectionCardIds = getCollectionCardIds(collectionId);
      collectionCardIds.forEach((cardId) => {
        result.push(cardId);
      });
    });
    let playerBankCardIds = props().getPlayerBankCardIds(playerId);
    playerBankCardIds.forEach((cardId) => {
      result.push(cardId);
    });

    return result;
  }

  // seperate a list of ids into where they belong
  function seperateCards(cardIds) {
    // @TODO refixit to fix the efficency when needs are more clear

    //let collectionIds
    let allPlayerIds = getAllPlayerIds();

    // Get a mapping of where every public card belongs
    let mapping = {};
    allPlayerIds.forEach((playerId) => {
      let playerCollectionIds = getCollectionIdsForPlayer(playerId);
      playerCollectionIds.forEach((collectionId) => {
        let collectionCardIds = getCollectionCardIds(collectionId);
        collectionCardIds.forEach((cardId) => {
          mapping[cardId] = {
            location: "collection",
            playerId,
            cardId,
            collectionId,
          };
        });
      });
      let playerBankCardIds = props().getPlayerBankCardIds(playerId);
      playerBankCardIds.forEach((cardId) => {
        mapping[cardId] = {
          location: "bank",
          playerId,
          cardId,
        };
      });
    });
    let result = [];
    cardIds.forEach((cardId) => {
      if (isDef(mapping[cardId])) {
        result.push(mapping[cardId]);
      }
    });

    return result;
  }

  function describeCardLocation(cardId) {
    let game = getPublic();
    let card = game.card.get(cardId);
    let speech = "";
    if (isDef(card)) {
      let seperated = seperateCards([card.id]);

      speech = "Card location unknown.";
      if (isArr(seperated) && seperated.length === 1) {
        let info = seperated[0];
        let isMyCard = isMyId(info.playerId);
        let location = info.location;
        let player = game.person.get(info.playerId);
        let playerName = getNestedValue(player, "name", "player");
        let locationDescription = "";
        if (location === "collection") {
          let collection = game.collection.get(info.collectionId);
          if (isDef(collection)) {
            locationDescription = collection.propertySetKey;
          }
        }
        if (isMyCard) {
          speech = `That card's in my ${locationDescription} ${location}`;
        } else {
          speech = `That card's in ${playerName}'s ${locationDescription} ${location}`;
        }
      }
    }

    return speech;
  }

  function getAllCardData() {
    return reduxState.get(["game", "cards"], {});
  }

  //#endregion
  //_______________________________

  //===============================
  //  PROPERTIES
  //#region
  function getPropertySetsKeyed() {
    return reduxState.get(["game", "propertySets", "items"], {});
  }

  function getAllPropertySetsKeyed() {
    return getPropertySetsKeyed();
  }

  function getPropertySetsData() {
    return reduxState.get(["game", "propertySets"], {});
  }

  function getPropertySet(id) {
    return getNestedValue(getPropertySetsData(), ["items", id], null);
  }

  function getAllPropertySets() {
    return getPropertySetsData();
  }
  //#endregion
  //_______________________________

  //===============================
  //  BANK
  //#region
  function getPlayerBankTotal(playerId) {
    return getNestedValue(
      getAllPlayerBankData(),
      ["items", playerId, "totalValue"],
      []
    );
  }

  function getPlayerBankCards(playerId) {
    return _mapCardIdsToCardList(
      getNestedValue(getAllPlayerBankData(), ["items", playerId, "cardIds"], [])
    );
  }
  //#endregion
  //_______________________________

  //===============================
  //  REQUESTS
  //#region
  function getActionCardIdForRequest(requestId) {
    let game = getPublic();
    let request = game.request.get(requestId);
    return getNestedValue(request, ["payload", "actionCardId"], null);
  }

  function getActionCardForRequest(requestId) {
    let actionCardId = getActionCardIdForRequest(requestId);
    if (isDef(actionCardId)) {
      return getCard(actionCardId);
    }
    return null;
  }

  function getRequest(requestId, fallback = null) {
    return reduxState.get(["game", "requests", "items", requestId], fallback);
  }

  function getRequestsKeyed() {
    return reduxState.get(["game", "requests", "items"], {});
  }

  function getRequestIdsTargetedAtMe() {
    let result = [];
    let myIdNum = myId();
    let requestsKeyed = getRequestsKeyed();
    Object.keys(requestsKeyed).forEach((requestId) => {
      let request = requestsKeyed[requestId];
      if (String(request.targetKey) === String(myIdNum)) {
        result.push(requestId);
      }
    });
    return result;
  }

  function getAllRequestIds() {
    let result = [];
    let requestsKeyed = getRequestsKeyed();
    Object.keys(requestsKeyed).forEach((requestId) => {
      result.push(requestId);
    });
    return result;
  }

  function getAllRequests() {
    let result = [];
    let allIds = getAllRequestIds();
    allIds.forEach((requestId) => {
      let request = getRequest(requestId);
      if (isDef(request)) {
        result.push(request);
      }
    });
    return result;
  }

  function doesOpenRequestExist() {
    let requestIds = getAllRequestIds();
    for (let i = 0; i < requestIds.length; ++i) {
      let requestId = requestIds[i];
      if (isRequestOpen(requestId)) return true;
    }
    return false;
  }

  function isRequestOpen(id) {
    let request = getRequest(id);
    return isDef(request) && request.isClosed === false;
  }

  function getRequestIdsAuthoredByMe(personId) {
    let result = [];
    let myIdNum = myId();
    let requestsKeyed = getNestedValue(props(), ["requests", "items"], {});
    Object.keys(requestsKeyed).forEach((requestId) => {
      let request = requestsKeyed[requestId];
      if (String(request.authorKey) === String(myIdNum)) {
        result.push(requestId);
      }
    });
    return result;
  }

  function getRequestNestedValue(requestId, path = [], fallback = null) {
    return reduxState.get(
      ["game", "requests", "items", requestId, ...path],
      fallback
    );
  }

  function requestGiveToAuthorPropertyCardIds(requestId) {
    return getRequestNestedValue(
      requestId,
      [
        "payload",
        "transaction",
        "items",
        "toAuthor",
        "items",
        "property",
        "items",
      ],
      []
    );
  }

  function requestGiveToAuthorBankCardIds(requestId) {
    return getRequestNestedValue(
      requestId,
      ["payload", "transaction", "items", "toAuthor", "items", "bank", "items"],
      []
    );
  }

  function requestGiveToTargetPropertyCardIds(requestId) {
    return getRequestNestedValue(
      requestId,
      [
        "payload",
        "transaction",
        "items",
        "toTarget",
        "items",
        "property",
        "items",
      ],
      []
    );
  }

  function requestGiveToTargetBankCardIds(requestId) {
    return getRequestNestedValue(
      requestId,
      ["payload", "transaction", "items", "toTarget", "items", "bank", "items"],
      []
    );
  }

  function requestConfirmedToAuthorPropertyCardIds(requestId) {
    return getRequestNestedValue(
      requestId,
      [
        "payload",
        "transaction",
        "items",
        "toAuthor",
        "items",
        "property",
        "transfered",
      ],
      []
    );
  }

  function requestConfirmedToAuthorBankCardIds(requestId) {
    return getRequestNestedValue(
      requestId,
      [
        "payload",
        "transaction",
        "items",
        "toAuthor",
        "items",
        "bank",
        "transfered",
      ],
      []
    );
  }

  function requestConfirmedToTargetPropertyCardIds(requestId) {
    return getRequestNestedValue(
      requestId,
      [
        "payload",
        "transaction",
        "items",
        "toTarget",
        "items",
        "property",
        "transfered",
      ],
      []
    );
  }

  function requestConfirmedToTargetBankCardIds(requestId) {
    return getRequestNestedValue(
      requestId,
      [
        "payload",
        "transaction",
        "items",
        "toTarget",
        "items",
        "bank",
        "transfered",
      ],
      []
    );
  }

  function getAllPlayerRequestData() {
    return reduxState.get(["game", "playerRequests"], {});
  }

  function getAllPreviousRequestsData() {
    return reduxState.get(["game", "previousRequests"], {});
  }
  //#endregion
  //_______________________________

  // UNSORTED

  function getAllPeopleData() {
    return reduxState.get(["people"], {});
  }

  function getCurrentTurnActionLimit() {
    return reduxState.get(["game", "playerTurn", "actionLimit"], 0);
  }

  function isDrawPhase() {
    return reduxState.get(["game", "playerTurn", "phase"], null) === "draw";
  }

  function getPeviousTurnPersonId() {
    return reduxState.get(["game", "playerTurnPrevious", "playerKey"], null);
  }

  function getCurrentTurnPersonId() {
    return reduxState.get(["game", "playerTurn", "playerKey"], 0);
  }

  function getPeviousTurnPhase() {
    return reduxState.get(["game", "playerTurnPrevious", "phase"], null);
  }

  function isDonePhase() {
    return reduxState.get(["game", "playerTurn", "phase"], null) === "done";
  }

  function getPersonOrder() {
    return reduxState.get(["people", "order"], []);
  }

  function _mapCardIdsToCardList(cardIds) {
    if (isArr(cardIds)) return cardIds.map((cardId) => getCard(cardId));
    return [];
  }

  function getAllPlayerIds() {
    return reduxState.get(["game", "players", "order"], []);
  }

  function getAllPlayerHandsData() {
    return reduxState.get(["game", "playerHands"], {});
  }

  function getAllPlayers() {
    let playerOrder = getAllPlayerIds();
    return playerOrder.map((...props) => getPerson(...props));
  }

  function _mergeCardDataIntoObject(original) {
    if (isObj(original)) {
      let result = { ...original };
      result.cards = _mapCardIdsToCardList(
        getNestedValue(result, "cardIds", [])
      );
      return result;
    }
    return original;
  }

  function getPlayerTurnData() {
    return reduxState.get(["game", "playerTurn"], {});
  }

  function getAllRequestData() {
    return reduxState.get(["game", "requests"], {});
  }

  function getPropertySetKeysForCard(cardOrId) {
    let card = getCard(cardOrId);
    return getNestedValue(card, "sets", []);
  }

  //respondToPropertyTransfer
  const publicScope = {
    // REQUESTS
    getAllPreviousRequestsData,
    getAllRequestsData: getAllRequestData,
    getAllPlayerRequestData,

    // COLLECTIONS
    getAllCollectionData,
    getAllCollectionAssociationData,
    collection: {
      getCards: getCollectionCards,
      getCardIds: getCollectionCardIds,
      get: getCollection,
      getRentValue: getCollectionRentValue,
      isComplete: isCollectionComplete,
    },
    collections: {
      getMyIds: getMyCollectionIds,
    },
    getCollectionIdsForPlayer,
    getIncompleteCollectionMatchingSet: getIncompleteCollectionMatchingSet,

    // BANKS
    getAllPlayerBankData,
    bank: {
      getMyCardIds: getMyBankCardIds,
    },

    //HANDS
    getAllPlayerHandData,

    // PROPERTIES
    getAllPropertySets,
    property: {
      get: getPropertySet,
    },

    // CARDS
    getAllCardData,
    getAllCardIdsForPlayer,
    card: {
      get: getCard,
      hasTag: doesCardHaveTag,
      isCashCard,
      isPropertyCard,
      isWildPropertyCard,
      isSuperWildProperty,
      isActionCard,
      isSetAugmentCard,
      isRentCard,
      isDrawCard,
      describeLocation: describeCardLocation,
    },
    cards: {
      get: getCards,
      getMyHand: getMyHandCards,
      myHand: {
        hasTooMany: doesMyHandHaveTooManyCards,
        getCount: () => getMyHandCardIds().length,
        getTooMany: () => getMyHandCardIds().length - 7,
        getLimit: () => 7,
      },
      ids: {
        getMyHand: getMyHandCardIds,
        getMyDeclineCards: getMyDeclineCardIds,
      },
      getSumValue: getSumValueOfCards,
    },

    //PILES
    getDrawPile,

    drawPile: {
      get: getDrawPile,
      getCount: getDrawPileCount,
      getThickness: getDrawPileThickness,
    },

    activePile: {
      get: () => getActivePile(),
      getTopCard: getTopCardOnActionPile,
      hasTopCard() {
        return isDef(getTopCardOnActionPile());
      },
      getCount: getActivePileCount,
      getThickness: getActivePileCountThickness,
    },

    discardPile: {
      get: () => getDiscardPile(),
      getTopCard: getTopCardOnDiscardPile,
      hasTopCard() {
        return isDef(getTopCardOnDiscardPile());
      },
      getCount: getDiscardPileCount,
      getThickness: getDiscardPileCountThickness,
    },

    // GAME STATUS
    canStartGame,
    getGameStatus,
    getGameStatus,
    resetState,
    customUi: {
      get: getCustomUi,
      set: setCustomUi,
    },
    isStarted: isGameStarted,
    isFinished: isGameOver,
    gameOver: {
      isTrue: isGameOver,
      getWinningCondition,
      getWinnerId: getWinningPersonId,
      getWinner: getWinner,
    },
    phase: {
      get: getCurrentPhaseKey,
      isActionPhase,
      isDiscardPhase,
      isMyDonePhase,
      getDiscardCount,
      getRemainingDiscardCount,
      canDiscardCards,
    },

    // TURN
    turn: {
      isMyTurn,
      get: getPlayerTurnData,
      getPhaseKey: getCurrentPhaseKey,
      getPersonId: () => getCurrentTurnPersonId(),
      getPerson: () => getPublic().person.get(getCurrentTurnPersonId()),
    },

    // PLAYERS
    getAllPlayers,
    updateMyName,
    updateMyStatus,
    getPersonStatus,
    getPersonStatusLabel,
    getMyStatus,
    isEveryoneReady,
    toggleReady,
    player: {
      hand: {
        getCardCount(id) {
          return getNestedValue(
            getAllPlayerHandsData(),
            ["items", id, "count"],
            0
          );
        },
      },
      bank: {
        getCards: getPlayerBankCards,
        getTotal: getPlayerBankTotal,
      },
      collections: {
        getAllIds: getAllPlayerCollectionIds,
      },
      opponents: {
        getAllIds: getAllOpponentIds,
        getAll: () => getAllOpponentIds().map((id) => getPerson(id)),
      },
    },
    person: {
      isHost,
      get: getPerson,
    },
    getPerson,
    isPersonReady,
    getLobbyUsers,

    players: {
      getAll: getAllPlayers,
    },

    // ACTIONS
    canPassTurn,
    canDrawInitialCards,
    discardCards,
    canAddCardToBank,
    transferPropertyToExistingCollection,
    transferSetAugmentToExistingCollection,

    // ME
    me,
    myId,
    isMyTurn,
    amIReady,
    isMyId,
    amIHost,
    getMyHand,
    myHand: {
      getCardIds: getMyHandCardIds,
    },

    // MISC
    event,
    start,
    getCurrentActionCount,

    // REQUESTS
    request: {
      get: getRequest,
      isOpen: isRequestOpen,
      amITarget(requestId) {
        let request = getRequest(requestId);
        return String(request.targetKey) === String(myId());
      },
      getActionCard: getActionCardForRequest,
      getActionCardId: getActionCardIdForRequest,
      existedPreviously: (requestOrId) => {
        let request = getRequest(requestOrId);
        let requestId = request.id;
        return isDefNested(getAllPreviousRequestsData(), requestId, false);
      },
      transfer: {
        fromAuthor: {
          exists(requestId) {
            let request = getRequest(requestId);

            return isDefNested(
              getAllRequestData(),
              [
                "items",
                requestId,
                "payload",
                "transaction",
                "items",
                "fromAuthor",
              ],
              false
            );
          },
          bank: {
            getIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "fromAuthor",
                  "items",
                  "bank",
                  "items",
                ],
                []
              ),
            getConfirmedIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "fromAuthor",
                  "items",
                  "bank",
                  "transfered",
                ],
                []
              ),
          },
          property: {
            getIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "fromAuthor",
                  "items",
                  "property",
                  "items",
                ],
                []
              ),
            getConfirmedIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "fromAuthor",
                  "items",
                  "property",
                  "transfered",
                ],
                []
              ),
          },
          collection: {
            getIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "fromAuthor",
                  "items",
                  "collection",
                  "items",
                ],
                []
              ),
            getConfirmedIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "fromAuthor",
                  "items",
                  "collection",
                  "transfered",
                ],
                []
              ),
          },
        },
        toAuthor: {
          exists(requestId) {
            return isDefNested(
              getAllRequestData(),
              [
                "items",
                requestId,
                "payload",
                "transaction",
                "items",
                "toAuthor",
              ],
              false
            );
          },
          bank: {
            getIds: (requestId) => requestGiveToAuthorBankCardIds(requestId),
            getConfirmedIds: (requestId) =>
              requestConfirmedToAuthorBankCardIds(requestId),
          },
          property: {
            getIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "toAuthor",
                  "items",
                  "property",
                  "items",
                ],
                []
              ),
            getConfirmedIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "toAuthor",
                  "items",
                  "property",
                  "transfered",
                ],
                []
              ),
          },
          collection: {
            getIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "toAuthor",
                  "items",
                  "collection",
                  "items",
                ],
                []
              ),
            getConfirmedIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "toAuthor",
                  "items",
                  "collection",
                  "transfered",
                ],
                []
              ),
          },
        },
        toTarget: {
          exists(requestId) {
            return isDefNested(
              getAllRequestData(),
              [
                "items",
                requestId,
                "payload",
                "transaction",
                "items",
                "toTarget",
              ],
              false
            );
          },
          bank: {
            getIds: (requestId) => requestGiveToTargetBankCardIds(requestId),
            getConfirmedIds: (requestId) =>
              requestConfirmedToTargetBankCardIds(requestId),
          },
          property: {
            getIds: (requestId) =>
              requestGiveToTargetPropertyCardIds(requestId),
            getConfirmedIds: (requestId) =>
              requestConfirmedToTargetPropertyCardIds(requestId),
          },
          collection: {
            getIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "toTarget",
                  "items",
                  "collection",
                  "items",
                ],
                []
              ),
            getConfirmedIds: (requestId) =>
              getNestedValue(
                getAllRequestData(),
                [
                  "items",
                  requestId,
                  "payload",
                  "transaction",
                  "items",
                  "toTarget",
                  "items",
                  "collection",
                  "transfered",
                ],
                []
              ),
          },
        },
      },
    },
    requests: {
      openExists: doesOpenRequestExist,
      getAllIds: getAllRequestIds,
      getAll: getAllRequests,
      getTargetedIds: getRequestIdsTargetedAtMe,
      getAuthoredIds: getRequestIdsAuthoredByMe,
    },

    getMyBankCardIds,
    getMyCollectionIds,
    getCollectionCardIds,
    getPropertySetsKeyed,

    getRequest,
    getMyRequestIds,
    getRequestIdsTargetedAtMe,

    seperateCards,
    getAllPropertySetsKeyed,

    // Actions
    passTurn,
    drawTurnStartingCards,
    playPassGo,
    flipWildPropertyCard,

    getActionCountRemaining,

    initAskForRent,
    initAskForValueCollection,
    initPayValueRequest,
    cancelRentAction,
    canChargeRent,
    resetChargeRentInfo,
    chargeRent,
    valueCollection,

    initAskForProperty,
    initAskForPropertySwap,
    cancelPropertyAction,
    swapProperties,
    stealProperties,
    stealCollection,
    initAskForCollection,
    handleAskForValueConfirm,

    addCardToMyBankFromHand,

    addPropertyToNewCollectionFromHand,
    transferPropertyToNewCollection,
    transferSetAugmentToNewCollection,

    addPropertyToExistingCollectionFromHand,
    addAugmentToExistingCollectionFromHand,
    autoAddCardToMyCollection,

    respondToValueRequest,
    respondToPropertyTransfer,
    respondToStealProperty,
    respondToJustSayNo,
    respondToStealCollection,

    collectCardToCollection,
    collectNothingToNothing,
    collectCardToBank,
    collectCollection,

    getActionCardId,
    actionCard: {
      getId: getActionCardId,
      get: () => getPublic().card.get(getActionCardId()),
    },

    // SELECTION
    selection: {
      cards: {
        setMeta: (path, value) => props().cardSelection_setMeta(path, value),
        getMeta: (path, fallback) =>
          props().cardSelection_getMeta(path, fallback),
        isEnabled: () => props().cardSelection_getEnable(),
        setEnabled: (value = true) => props().cardSelection_setEnable(value),
        getType: () => props().cardSelection_getType(),
        setType: async (value) => await props().cardSelection_setType(value),
        getAll: () => props().cardSelection_getAll(),

        selectable: {
          has: (...args) => props().cardSelection_hasSelectableValue(...args),
          toggle: (...args) => props().cardSelection_toggleSelectable(...args),
          get: () => props().cardSelection_getSelectable(),
          count: () => props().cardSelection_getSelectable().length,
          set: (items) => props().cardSelection_setSelectable(items),
          add: (...args) => props().cardSelection_addSelectable(...args),
          remove: (...args) => props().cardSelection_removeSelectable(...args),
          setLimit: (value) => props().cardSelection_setLimit(value),
          getLimit: () => props().cardSelection_getLimit(),
          clear: () => props().cardSelection_setSelectable([]),
        },
        selected: {
          has: isCardSelected,
          get: () => props().cardSelection_getSelected(),
          count: () => props().cardSelection_getSelected().length,
          isNoneSelected: () =>
            props().cardSelection_getSelected().length === 0,
          isLimitSelected: () =>
            props().cardSelection_getLimit() ===
            props().cardSelection_getSelected().length,
          isAllSelected: () => {
            let selectedCount = props().cardSelection_getSelected().length;
            if (selectedCount === 0) return false;
            let selectableCount = props().cardSelection_getSelectable().length;
            return selectedCount === selectableCount;
          },
          toggle: toggleCardSelected,
          set: (items) => props().cardSelection_setSelected(items),
          add: (...args) => props().cardSelection_addSelected(...args),
          remove: (...args) => props().cardSelection_removeSelected(...args),
          selectAll: () =>
            props().cardSelection_setSelected(
              props().cardSelection_getSelectable()
            ),
          clear: () => props().cardSelection_setSelected([]),
        },
        reset: () => props().cardSelection_reset(),
      },

      people: {
        isEnabled: () => props().personSelection_getEnable(),
        setEnabled: async (value = true) =>
          await props().personSelection_setEnable(value),
        getType: () => props().personSelection_getType(),
        setType: async (value) => await props().personSelection_setType(value),
        getAll: () => props().personSelection_getAll(),
        selectable: {
          has: (...args) => canPersonBeSelected(...args),
          toggle: async (...args) =>
            await props().personSelection_toggleSelectable(...args),
          count: () => props().cardSelection_getSelectable().length,
          get: () => props().cardSelection_getSelectable(),
          set: async (items) =>
            await props().personSelection_setSelectable(items),
          add: async (...args) =>
            await props().personSelection_addSelectable(...args),
          remove: (...args) =>
            props().personSelection_removeSelectable(...args),
          setLimit: async (value) =>
            await props().personSelection_setLimit(value),
          getLimit: (value) => props().personSelection_getLimit(),
          clear: async () => await props().personSelection_setSelectable([]),
        },
        selected: {
          has: (...args) => props().personSelection_hasSelectedValue(...args),
          toggle: async (...args) =>
            await props().personSelection_toggleSelected(...args),
          count: () => props().personSelection_getSelected().length,
          get: () => props().personSelection_getSelected(),
          set: async (items) =>
            await props().personSelection_setSelected(items),
          add: async (...args) =>
            await props().personSelection_addSelected(...args),
          isNoneSelected: () =>
            props().personSelection_getSelected().length === 0,
          isLimitSelected: () =>
            props().personSelection_getLimit() ===
            props().personSelection_getSelected().length,
          isAllSelected: () => {
            let selectedCount = props().personSelection_getSelected().length;
            if (selectedCount === 0) return false;
            let selectableCount = props().personSelection_getSelectable()
              .length;
            return selectedCount === selectableCount;
          },
          remove: async (...args) =>
            await props().personSelection_removeSelected(...args),
          selectAll: () =>
            props().personSelection_setSelected(
              props().personSelection_getSelectable()
            ),
          clear: async () => await props().personSelection_setSelected([]),
        },
        reset: async () => await props().personSelection_reset(),
      },
      collections: {
        isEnabled: () => props().collectionSelection_getEnable(),
        setEnabled: (value = true) =>
          props().collectionSelection_setEnable(value),
        getType: () => props().collectionSelection_getType(),
        setType: async (value) =>
          await props().collectionSelection_setType(value),
        getAll: () => props().collectionSelection_getAll(),

        selectable: {
          has: (...args) =>
            props().collectionSelection_hasSelectableValue(...args),
          toggle: (...args) =>
            props().collectionSelection_toggleSelectable(...args),
          count: () => props().collectionSelection_getSelectable().length,
          get: () => props().collectionSelection_getSelectable(),
          set: (items) => props().collectionSelection_setSelectable(items),
          add: (...args) => props().collectionSelection_addSelectable(...args),
          setLimit: (value) => props().collectionSelection_setLimit(value),
          getLimit: () => props().collectionSelection_getLimit(),
          remove: (...args) =>
            props().collectionSelection_removeSelectable(...args),
          clear: () => props().collectionSelection_setSelectable([]),
        },
        selected: {
          has: (...args) =>
            props().collectionSelection_hasSelectedValue(...args),
          toggle: (...args) =>
            props().collectionSelection_toggleSelected(...args),
          count: () => props().collectionSelection_getSelected().length,
          get: () => props().collectionSelection_getSelected(),
          set: (items) => props().collectionSelection_setSelected(items),
          add: (...args) => props().collectionSelection_addSelected(...args),
          isNoneSelected: () =>
            props().collectionSelection_getSelected().length === 0,
          isLimitSelected: () =>
            props().collectionSelection_getLimit() ===
            props().collectionSelection_getSelected().length,
          isAllSelected: () => {
            let selectedCount = props().collectionSelection_getSelected()
              .length;
            if (selectedCount === 0) return false;
            let selectableCount = props().collectionSelection_getSelectable()
              .length;
            return selectedCount === selectableCount;
          },
          remove: (...args) =>
            props().collectionSelection_removeSelected(...args),
          selectAll: () =>
            props().collectionSelection_setSelected(
              props().collectionSelection_getSelectable()
            ),
          clear: () => props().collectionSelection_setSelected([]),
        },
        reset: () => props().collectionSelection_reset(),
      },
    },
    isCardSelected, // deprecated
    isCardSelectable, // deprecated
    toggleCardSelected, // deprecated
    getCardSelectionType, // deprecated
    isCardSelectionEnabled, // deprecated
    canSelectCard, // deprecated
    isCardNotApplicable, // deprecated
    getSelectedCardIds, // deprecated
    getSelectedPeopleIds, // deprecated
    getSelectedCollectionIds, // deprecated
    canPersonBeSelected,
    isPersonSelected,
    togglePersonSelected,
    isRequiredCollectionsSelected,
    isRequiredPeopleSelected,

    // ACTION DATA
    updateActionData,
    getActionData,

    // RENDER DATA
    updateRenderData,
    getRenderData,

    // DISPLAY DATA
    updateDisplayData,
    updateDisplayMode,
    resetDisplayData,
    getDisplayData,
    resetUi,

    // EVENTS
    init,
    isInit,
    on,
    once,
    off,
    emit,
    listnerTree: ref.getConnection().listnerTree,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

export default Game;
