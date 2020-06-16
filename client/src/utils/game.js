import sounds from "../assets/sounds";
import {
  isArr,
  isDef,
  isFunc,
  isDefNested,
  els,
  getNestedValue,
  setNestedValue,
  jsonLog,
} from "../utils/";
import SCREENS from "../data/screens";

function Game(ref) {
  sounds.setVolume(0.5);

  let mIsInit = false;

  function getLobbyUsers() {
    return props().personOrder.map((id) => {
      return getPerson(id);
    });
  }

  const placeHolderFunc = () => console.log("not defined");

  let renderData = {
    actionButton: {
      disabled: true,
      onClick: placeHolderFunc,
    },
  }; // data for the render process - does not provoke rerender unlike state

  function updateRenderData(path, value) {
    setNestedValue(renderData, path, value);
  }
  function getRenderData(path, fallback = null) {
    return getNestedValue(renderData, path, fallback);
  }

  function getCustomUi(path = [], fallback = null) {
    return props().getCustomUi(path, fallback);
  }

  async function setCustomUi(path = [], value = null) {
    await props().setCustomUi(path, value);
  }

  function init() {
    let game = getPublic();

    on(["ROOM", "JOIN"], async (response) => {
      if (isDef(response)) {
        let { personId } = response.payload;
        let myId = game.myId();
        if (isDef(myId) && personId !== game.myId()) {
          sounds.joinRoom.play();
        }
      }
    });

    on(["GAME", "START"], async (data) => {
      sounds.startGame.play();
    });
    on(["PLAYERS", "PERSON_DREW_CARDS_KEYED"], async (data) => {
      if (game.isMyTurn()) {
        sounds.drawCard.play(data.payload.count);
      } else {
        sounds.theyDrewCard.play(data.payload.count);
      }
    });

    // execute after PLAYER_TURN.GET has affected redux
    let canTrigger = {
      endTurnSound: true,
    };
    on(["PLAYER_TURN", `${"GET"}__STORE_UPDATED`], async () => {
      // Play sound when my turn is done
      if (game.phase.isMyDonePhase() && canTrigger.endTurnSound) {
        canTrigger.endTurnSound = false;
        setTimeout(() => {
          sounds.endTurn.play();
          if (game.customUi.get("autoPassTurn", false)) {
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
      if (isDef(playSound) && isFunc(playSound.play)) {
        playSound.play();
      }

      let previousTurnPersonId = props().getPeviousTurnPersonId();
      let currentTurnPersonId = props().getCurrentTurnPersonId();

      if (game.isMyTurn()) {
        // If is my turn now
        if (
          !isDef(previousTurnPersonId) ||
          !props().isMyId(previousTurnPersonId)
        ) {
          sounds.yourTurn.play();
        }
        if (props().isDiscardPhase()) {
          // Flag cards to discard
          let previousTurnPhase = props().getPeviousTurnPhase();
          if (previousTurnPhase !== "discard") {
            await props().cardSelection_reset();
            await props().cardSelection_setSelected([]);
          }
          await props().cardSelection_setSelectable(props().getMyHandCardIds());
          await props().cardSelection_setEnable(true);
          await props().cardSelection_setType("remove");
          await props().cardSelection_setLimit(
            props().getTotalCountToDiscard()
          );
        } else if (props().isDonePhase()) {
          // show the user no more actions can be taken
          await props().cardSelection_reset();
          await props().cardSelection_setEnable(true);
          await props().collectionSelection_reset();
          await props().personSelection_reset();
        }
      } else {
        // if is new turn reset selections
        if (
          props().getPeviousTurnPersonId() !== currentTurnPersonId &&
          game.phase.get() === "draw"
        ) {
          await game.resetUi();
        }
      }
    });

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
          await updateDisplayData("mode", SCREENS.REQUESTS);
        }
      }

      // close request screen if all requests are completed
      if (game.requests.getAllIds().length > 0 && !game.requests.openExists()) {
        await updateDisplayData("mode", null);
      }
    });

    props().attachRoomListeners(connection());
    props().attachPeopleListeners(connection());
    props().attachGameListeners(connection());
    mIsInit = true;
  }

  //==================================================

  //                    ACTIONS

  //==================================================
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
    await updateDisplayData("mode", "respond-pay");
  }

  async function initAskForRent(cardOrId, collectionId = null) {
    let game = getPublic();
    let card = getCard(cardOrId);
    let propertySetKeysForCard = props().getPropertySetKeysForCard(card.id);
    let matchingCollectionIds = props().getCollectionIdsMatchingSets(
      myId(),
      propertySetKeysForCard
    );
    if (matchingCollectionIds.length > 0) {
      // Highlight compatible augment cards
      let augmentCardIds = props().getMyCardIdsWithTag("rentAugment");

      await game.selection.cards.reset();
      await game.selection.cards.setEnabled(true);
      await game.selection.cards.setType("add");
      await game.selection.cards.selectable.setLimit(
        props().getCurrentTurnActionsRemaining() - 1
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

      let allOpponentIds = props().getAllOpponentIds();
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
        mode: "chargeRent",
        actionCardId: card.id,
      });

      return true;
    } else {
      return false;
    }
  }

  function getAllOpponentIds() {
    return props().getAllOpponentIds();
  }
  async function initAskForValueCollection(cardOrId) {
    let game = getPublic();
    let card = getCard(cardOrId);
    let cardId = card.id;
    await game.resetUi();

    let isOptionsSimple = false;
    await props().personSelection_reset();
    let allOpponentIds = props().getAllOpponentIds();

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
      mode: "stealProperty",
      actionCardId: card.id,
    });

    return true;
  }

  async function initAskForCollection(cardOrId) {
    let game = getPublic();
    let card = game.card.get(cardOrId);
    await game.resetUi();

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

    await game.updateDisplayData([], {
      mode: "stealCollection",
      actionCardId: card.id,
    });

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
      mode: "askForPropertySwap",
      actionCardId: card.id,
    });

    return true;
  }

  function isInit() {
    return mIsInit;
  }

  function props() {
    return ref.props;
  }

  function connection() {
    return ref.getConnection();
  }

  function getRoomCode() {
    return props().getRoomCode();
  }
  async function updateMyName(name) {
    return await props().updateMyName(connection(), getRoomCode(), name);
  }

  async function updateMyStatus(status) {
    return await props().updateMyStatus(connection(), getRoomCode(), status);
  }
  function translatePersonStatus(status) {
    if (status === "ready") {
      return "Ready";
    } else if (["not_ready", "connected"].includes(status)) {
      return "Not Ready";
    }
    return status;
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

  function getPersonStatus(personId) {
    return props().getPersonStatus(personId);
  }
  function getMyStatus() {
    return props().getPersonStatus();
  }

  function isEveryoneReady() {
    return props().isAllPlayersReady();
  }
  //==================================================

  //                     EVENTS

  //==================================================
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

  async function start() {
    await props().resetGame(connection(), getRoomCode()); // for Dev reasons
    await props().startGame(connection(), getRoomCode());
  }

  function getPerson(id) {
    return props().getPerson(id);
  }
  function isPersonReady(personId) {
    return props().isPersonReady(personId);
  }

  //==================================================

  //                      ME

  //==================================================
  function amIReady() {
    return isPersonReady(myId());
  }

  function me() {
    return props().getPerson(myId());
  }

  function isMyTurn() {
    return props().isMyTurn();
  }

  function getMyHand() {
    return props().getMyHand();
  }

  function amIHost() {
    return props().amIHost();
  }
  function myId() {
    return props().getMyId();
  }
  function isMyId(personId) {
    return String(myId()) === String(personId);
  }

  function canPassTurn() {
    return (
      isMyTurn() && !["draw", "request"].includes(props().getCurrentTurnPhase())
    );
  }

  function canDrawInitialCards() {
    return isMyTurn() && props().getCurrentTurnPhase() === "draw";
  }

  function passTurn() {
    if (canPassTurn()) {
      props().passTurn(connection(), props().getRoomCode());
    }
  }

  //==================================================

  //                      PHASE

  //==================================================
  function isActionPhase() {
    return props().isActionPhase();
  }

  function isMyDonePhase() {
    return isMyTurn() && props().getCurrentTurnPhase() === "done";
  }

  function isDiscardPhase() {
    return props().isDiscardPhase();
  }

  function getDiscardCount() {
    return props().getTotalCountToDiscard();
  }

  function getRemainingDiscardCount() {
    return getDiscardCount() - props().cardSelection_getSelected().length;
  }

  function canDiscardCards() {
    return isMyTurn() && isDiscardPhase() && getRemainingDiscardCount() === 0;
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

  async function addCardToMyBankFromHand(id) {
    await props().addCardToMyBank(connection(), props().getRoomCode(), id);
  }

  async function cancelRentAction() {
    await props().cardSelection_reset();
    await props().collectionSelection_reset();
    await props().personSelection_reset();
    await props().resetDisplayData();
  }

  async function cancelPropertyAction() {
    await props().cardSelection_reset();
    await props().collectionSelection_reset();
    await props().personSelection_reset();
    await props().resetDisplayData();
  }

  function isCashCard(card) {
    return card.type === "cash";
  }

  function getCard(cardOrId) {
    return props().getCard(cardOrId);
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
    return props().doesCardHaveTag(card.id, "rent");
  }

  function doesCardHaveTag(cardOrId, tag) {
    let card = getCard(cardOrId);
    return props().doesCardHaveTag(card.id, tag);
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

  async function handleAskForValueConfirm({ cardId }) {
    let game = getPublic();
    let args = {
      cardId: cardId,
      targetIds: game.selection.people.selected.get(),
    };
    await game.valueCollection(args);
    await game.resetUi();
    await game.updateDisplayData("mode", SCREENS.REQUESTS);
  }

  function getIncompleteCollectionMatchingSet(myPersonId, propertySetKey) {
    return props().getIncompleteCollectionMatchingSet(
      myPersonId,
      propertySetKey
    );
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
      props().addCardEmptySetFromHand(
        connection(),
        props().getRoomCode(),
        cardId
      );
    }
  }

  function playPassGo(cardOrId) {
    let card = getCard(cardOrId);
    props().playPassGo(connection(), props().getRoomCode(), card.id);
  }

  async function addPropertyToNewCollectionFromHand(cardId) {
    await props().addCardEmptySetFromHand(
      connection(),
      props().getRoomCode(),
      cardId
    );
  }

  async function transferPropertyToNewCollection(cardId, fromCollectionId) {
    await props().transferPropertyToNewCollection(
      connection(),
      props().getRoomCode(),
      cardId,
      fromCollectionId
    );
  }

  async function addPropertyToExistingCollectionFromHand(
    cardId,
    toCollectionId
  ) {
    await props().addPropertyToExistingCollectionFromHand(
      connection(),
      props().getRoomCode(),
      cardId,
      toCollectionId
    );
  }

  async function transferSetAugmentToNewCollection(cardId, fromCollectionId) {
    await props().transferSetAugmentToNewCollection(
      connection(),
      props().getRoomCode(),
      cardId,
      fromCollectionId
    );
  }

  async function addAugmentToExistingCollectionFromHand(
    cardId,
    toCollectionId
  ) {
    await props().addAugmentToExistingCollectionFromHand(
      connection(),
      props().getRoomCode(),
      cardId,
      toCollectionId
    );
  }

  async function flipWildPropertyCard(
    cardId,
    propertySetKey,
    { collectionId } = {}
  ) {
    await props().changeWildPropertySetKey(
      connection(),
      props().getRoomCode(),
      cardId,
      propertySetKey,
      isDef(collectionId) ? collectionId : null
    );
  }

  function getActionCountRemaining() {
    return (
      props().getCurrentTurnActionLimit() - props().getCurrentTurnActionCount()
    );
  }

  function isHost(personId) {
    return props().isHost(personId);
  }

  function getCurrentPhaseKey() {
    return props().getCurrentTurnPhase();
  }
  function getCurrentPhase() {
    return props().getCurrentTurnPhase();
  }

  function getAllPropertySetsKeyed() {
    return props().getPropertySetMap();
  }

  function getAllPlayers() {
    return props().getAllPlayers();
  }

  function drawTurnStartingCards() {
    props().drawTurnStartingCards(connection(), props().getRoomCode());
  }

  function isRequiredCollectionsSelected() {
    return (
      props().collectionSelection_getSelected().length >=
      props().getDisplayData(["requirements", "collectionSelectionCount"], 1)
    );
  }

  function isRequiredPeopleSelected() {
    return (
      props().personSelection_getSelected().length >=
      props().getDisplayData(["requirements", "personSelectionCount"], 1)
    );
  }

  //@TODO more requriements - ie has the rent card been selected - has enough actions
  function canChargeRent() {
    let actionCardId = getActionCardId();
    if (isDef(actionCardId)) {
      console.log({
        isRequiredCollectionsSelected: isRequiredCollectionsSelected(),
        isRequiredPeopleSelected: isRequiredPeopleSelected(),
        collectionSelection_getSelected: props().collectionSelection_getSelected()
          .length,
      });
      return (
        isRequiredCollectionsSelected() &&
        isRequiredPeopleSelected() &&
        props().collectionSelection_getSelected().length > 0
      );
    }
    return false;
  }

  function chargeRent(
    actionCardId,
    { collectionId, augmentCardsIds, targetIds, targetId }
  ) {
    return props().chargeRentForCollection(
      connection(),
      props().getRoomCode(),
      {
        cardId: actionCardId,
        collectionId,
        augmentCardsIds,
        targetIds,
        targetId,
      }
    );
  }

  function valueCollection({ cardId, augmentCardsIds, targetIds }) {
    return props().valueCollection(connection(), props().getRoomCode(), {
      cardId: cardId,
      augmentCardsIds,
      targetIds,
    });
  }

  function getActionCardId() {
    return props().getDisplayData(["actionCardId"], null);
  }

  async function resetChargeRentInfo() {
    await props().resetDisplayData();
    await props().cardSelection_reset();
    await props().collectionSelection_reset();
    await props().personSelection_reset();
  }

  function getSelectedPeopleIds() {
    return props().personSelection_getSelected();
  }

  function getSelectedCardIds() {
    return props().cardSelection_getSelected();
  }

  function getSelectedCollectionIds() {
    return props().collectionSelection_getSelected();
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

  function getDrawPileThickness() {
    return (
      (Math.max(props().getDrawPileCount(), 1) /
        Math.max(props().getTotalCardCount(), 1)) *
      100
    );
  }

  function getDrawPileCount() {
    return props().getDrawPileCount();
  }

  function getTopCardOnActionPile() {
    return props().getTopCardOnActionPile();
  }

  function getTopCardOnDiscardPile() {
    return props().getTopCardOnDiscardPile();
  }

  function getDiscardPileCount() {
    return props().getDiscardPileCount();
  }

  function getActivePileCountThickness() {
    return (
      (Math.max(props().getActivePileCount(), 1) /
        Math.max(props().getTotalCardCount(), 1)) *
      100
    );
  }

  function getDiscardPileCountThickness() {
    return (
      (Math.max(props().getDiscardPileCount(), 1) /
        Math.max(props().getTotalCardCount(), 1)) *
      100
    );
  }

  async function updateActionData(path, value) {
    await props().updateActionData({ path, value });
  }
  function getActionData(path, fallback = null) {
    return props().getActionData(path, fallback);
  }

  function getDisplayData(path, fallback = null) {
    return props().getDisplayData(path, fallback);
  }

  async function updateDisplayData(path, value) {
    await props().updateDisplayData({ path, value });
  }
  async function resetDisplayData() {
    await props().resetDisplayData();
  }

  async function resetUi() {
    const game = getPublic();
    await game.resetDisplayData();
    await game.selection.cards.reset();
    await game.selection.collections.reset();
    await game.selection.people.reset();
  }

  function isCardSelectable(cardId) {
    return props().cardSelection_hasSelectableValue(cardId);
  }

  function getCardSelectionType(cardId) {
    return props().cardSelection_getType();
  }

  function getAllCardIdsForPlayer(playerId) {
    let result = [];
    let playerCollectionIds = props().getCollectionIdsForPlayer(playerId);
    playerCollectionIds.forEach((collectionId) => {
      let collectionCardIds = props().getCollectionCardIds(collectionId);
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
    let allPlayerIds = props().getAllPlayerIds();

    // Get a mapping of where every public card belongs
    let mapping = {};
    allPlayerIds.forEach((playerId) => {
      let playerCollectionIds = props().getCollectionIdsForPlayer(playerId);
      playerCollectionIds.forEach((collectionId) => {
        let collectionCardIds = props().getCollectionCardIds(collectionId);
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

  function getMyCollectionIds() {
    return props().getCollectionIdsForPlayer(myId());
  }

  function getCollectionCardIds(collectionId) {
    return props().getCollectionCardIds(collectionId);
  }

  function getMyBankCardIds() {
    return props().getPlayerBankCardIds(myId());
  }

  function getPropertySetsKeyed() {
    return props().getPropertySetMap();
  }

  function getMyRequestIds() {
    return props().getRequestIdsForPlayer(myId(), []);
  }

  function getRequest(id, fallback = null) {
    return props().getRequest(id, fallback);
  }

  function getRequestIdsTargetedAtMe() {
    let result = [];
    let myIdNum = myId();
    let requestsKeyed = props().getRequestsKeyed();
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
    let requestsKeyed = props().getRequestsKeyed();
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

  function getSumValueOfCards(cardIds) {
    let result = 0;
    cardIds.forEach((cardId) => {
      let card = props().getCard(cardId);
      if (isDef(card)) result += els(card.value, 0);
    });
    return result;
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

  function requestGiveToAuthorPropertyCardIds(requestId) {
    return props().getRequestNestedValue(
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
    return props().getRequestNestedValue(
      requestId,
      ["payload", "transaction", "items", "toAuthor", "items", "bank", "items"],
      []
    );
  }

  function requestGiveToTargetPropertyCardIds(requestId) {
    return props().getRequestNestedValue(
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
    return props().getRequestNestedValue(
      requestId,
      ["payload", "transaction", "items", "toTarget", "items", "bank", "items"],
      []
    );
  }

  function requestConfirmedToAuthorPropertyCardIds(requestId) {
    return props().getRequestNestedValue(
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
    return props().getRequestNestedValue(
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
    return props().getRequestNestedValue(
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
    return props().getRequestNestedValue(
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

  async function collectCardToCollection(requestId, cardId, collectionId) {
    return await props().collectCardToCollection(
      connection(),
      props().getRoomCode(),
      requestId,
      cardId,
      collectionId
    );
  }

  async function collectNothingToNothing(requestId) {
    return await props().collectNothingToNothing(
      connection(),
      props().getRoomCode(),
      requestId
    );
  }

  async function collectCardToBank(requestId, cardId) {
    return await props().collectCardToBank(
      connection(),
      props().getRoomCode(),
      requestId,
      cardId
    );
  }

  function canStartGame() {
    return amIHost();
  }

  function getGameStatus(path = [], fallback = null) {
    let _path = isArr(path) ? path : [path];
    return getNestedValue(props(), ["gameStatus", ..._path], fallback);
  }

  function getCurrentActionCount() {
    return props().getCurrentTurnActionCount();
  }

  async function swapProperties({
    cardId,
    myPropertyCardId,
    theirPropertyCardId,
  }) {
    return await props().swapProperties(connection(), props().getRoomCode(), {
      cardId,
      myPropertyCardId,
      theirPropertyCardId,
    });
  }

  async function respondToPropertyTransfer({ cardId, requestId, responseKey }) {
    return await props().respondToPropertyTransfer(
      connection(),
      props().getRoomCode(),
      { cardId, requestId, responseKey }
    );
  }

  async function stealProperties({ cardId, theirPropertyCardId }) {
    return await props().stealProperties(connection(), props().getRoomCode(), {
      cardId,
      theirPropertyCardId,
    });
  }

  async function stealCollection({ cardId, theirCollectionId }) {
    return await props().stealCollection(connection(), props().getRoomCode(), {
      cardId,
      theirCollectionId,
    });
  }

  async function respondToStealProperty({ cardId, requestId, responseKey }) {
    return await props().respondToStealProperty(
      connection(),
      props().getRoomCode(),
      { cardId, requestId, responseKey }
    );
  }

  async function respondToJustSayNo({ cardId, requestId, responseKey }) {
    return await props().respondToJustSayNo(
      connection(),
      props().getRoomCode(),
      { cardId, requestId, responseKey }
    );
  }

  async function respondToStealCollection({ cardId, requestId, responseKey }) {
    return await props().respondToStealCollection(
      connection(),
      props().getRoomCode(),
      { cardId, requestId, responseKey }
    );
  }

  async function collectCollection({ requestId }) {
    return await props().collectCollection(
      connection(),
      props().getRoomCode(),
      { requestId }
    );
  }

  function getAllPlayerCollectionIds(playerId) {
    return getNestedValue(
      props(),
      ["playerCollections", "items", playerId],
      []
    );
  }

  function getCollection(id) {
    return props().getCollection(id);
  }

  function getCards(cardIds) {
    let result = [];
    cardIds.forEach((id) => {
      let card = getCard(id);
      if (isDef(card)) result.push(card);
    });
    return result;
  }

  function getMyHandCardIds() {
    return props().getMyHandCardIds();
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

  function getPropertySet(id) {
    return getNestedValue(props(), ["propertySets", "items", id], null);
  }

  function doesMyHandHaveTooManyCards() {
    return getMyHandCardIds().length > 7; // @HARDCODED
  }

  function isGameStarted() {
    return getNestedValue(props(), ["gameStatus", "isGameStarted"], false);
  }

  function isGameOver() {
    return getNestedValue(props(), ["gameStatus", "isGameOver"], false);
  }

  function getWinningCondition() {
    return getNestedValue(
      props(),
      ["gameStatus", "winningCondition", "payload", "condition"],
      "For some reason..."
    );
  }

  function getWinningPersonId() {
    return getNestedValue(
      props(),
      ["gameStatus", "winningCondition", "payload", "playerId"],
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

  //respondToPropertyTransfer
  const publicScope = {
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
    updateMyName,
    updateMyStatus,
    getPersonStatus,
    getPersonStatusLabel,
    getMyStatus,
    isEveryoneReady,
    toggleReady,
    canStartGame,
    getGameStatus,
    event,
    start,
    getCurrentActionCount,

    //Turn
    canPassTurn,
    canDrawInitialCards,
    isMyTurn,
    isMyId,
    amIHost,
    getMyHand,

    turn: {
      getPhaseKey: getCurrentPhaseKey,
      getPersonId: () => props().getCurrentTurnPersonId(),
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

    drawPile: {
      getCount: getDrawPileCount,
      getThickness: getDrawPileThickness,
    },

    activePile: {
      getTopCard: getTopCardOnActionPile,
      hasTopCard() {
        return isDef(getTopCardOnActionPile());
      },
      getThickness: getActivePileCountThickness,
    },

    discardPile: {
      getTopCard: getTopCardOnDiscardPile,
      hasTopCard() {
        return isDef(getTopCardOnDiscardPile());
      },
      getCount: getDiscardPileCount,
      getThickness: getDiscardPileCountThickness,
    },
    getIncompleteCollectionMatchingSet: getIncompleteCollectionMatchingSet,

    player: {
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
    },
    myHand: {
      getCardIds: getMyHandCardIds,
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

    property: {
      get: getPropertySet,
    },
    bank: {
      getMyCardIds: getMyBankCardIds,
    },

    collection: {
      getCardIds: getCollectionCardIds,
      get: getCollection,
    },
    collections: {
      getMyIds: getMyCollectionIds,
    },
    getAllCardIdsForPlayer,

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
        return isDefNested(props(), ["previousRequests", requestId], false);
      },
      transfer: {
        fromAuthor: {
          exists(requestId) {
            let request = getRequest(requestId);

            return isDefNested(
              props().requests,
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
                props().requests,
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
                props().requests,
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
                props().requests,
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
                props().requests,
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
                props().requests,
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
                props().requests,
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
              props().requests,
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
                props().requests,
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
                props().requests,
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
                props().requests,
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
                props().requests,
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
              props().requests,
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
                props().requests,
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
                props().requests,
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
    getActionCountRemaining,
    initAskForRent,
    initAskForValueCollection,
    initAskForProperty,
    initAskForPropertySwap,
    initPayValueRequest,
    initAskForCollection,
    handleAskForValueConfirm,
    cancelRentAction,
    cancelPropertyAction,
    addCardToMyBankFromHand,
    addPropertyToNewCollectionFromHand,
    addPropertyToExistingCollectionFromHand,
    autoAddCardToMyCollection,
    transferPropertyToNewCollection,
    transferSetAugmentToNewCollection,
    addAugmentToExistingCollectionFromHand,
    playPassGo,
    flipWildPropertyCard,
    getActionCardId,
    collectCardToCollection,
    collectNothingToNothing,
    collectCardToBank,
    swapProperties,
    respondToPropertyTransfer,
    stealProperties,
    stealCollection,
    respondToStealProperty,
    respondToJustSayNo,
    respondToStealCollection,
    collectCollection,

    canChargeRent,
    resetChargeRentInfo,
    chargeRent,
    valueCollection,
    respondToValueRequest,

    //selection
    selection: {
      cards: {
        setMeta: (path, value) => props().cardSelection_setMeta(path, value),
        getMeta: (path, fallback) =>
          props().cardSelection_getMeta(path, fallback),
        isEnabled: () => props().cardSelection_getEnable(),
        setEnabled: (value = true) => props().cardSelection_setEnable(value),
        getType: () => props().cardSelection_getType(),
        setType: async (value) => await props().cardSelection_setType(value),
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
          toggle: (...args) => props().collectionSelection_(...args),
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

    //People
    me,
    myId,
    getPerson,
    isPersonReady,
    amIReady,
    getLobbyUsers,

    players: {
      getAll: getAllPlayers,
    },

    updateActionData,
    getActionData,
    updateRenderData,
    getRenderData,

    updateDisplayData,
    resetDisplayData,
    getDisplayData,
    resetUi,

    //Events
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
