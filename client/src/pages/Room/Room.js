import React, { useState } from "react";
import { withRouter } from "react-router";
import pluralize from "pluralize";
import {
  els,
  isDef,
  isDefNested,
  isArr,
  getNestedValue,
  emptyFunc,
} from "../../utils/";

import sounds from "../../assets/sounds";

// Drag and Drop
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import DragItem from "../../components/dragNDrop/DragItem";
import DropZone from "../../components/dragNDrop/DropZone";
import VSplitterDragIndicator from "../../components/indicators/VSplitterDragIndicator";
import HSplitterDragIndicator from "../../components/indicators/HSplitterDragIndicator";

import { deepOrange, green, grey } from "@material-ui/core/colors";

// Socket related
import { connect } from "react-redux";
import roomActions from "../../App/actions/roomActions";
import peopleActions from "../../App/actions/peopleActions";
import gameActions from "../../App/actions/gameActions";
import gameGetters from "../../App/getters/gameGetters";

import TextField from "@material-ui/core/TextField";
import Divider from "@material-ui/core/Divider";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";

import { ImmutableClassBasedObject } from "../../utils/ReactStateTools";
import createSocketConnection from "../../utils/clientSocket";

// Structure
import RelLayer from "../../components/layers/RelLayer";
import AbsLayer from "../../components/layers/AbsLayer";
import CheckLayer from "../../components/layers/CheckLayer";
import FillContainer from "../../components/fillContainer/FillContainer";
import FillHeader from "../../components/fillContainer/FillHeader";
import FillContent from "../../components/fillContainer/FillContent";
import FillFooter from "../../components/fillContainer/FillFooter";

import GrowPanel from "../../components/panels/GrowPanel";
import SplitterLayout from "react-splitter-layout";
import "react-splitter-layout/lib/index.css";
import {
  FlexColumn,
  FlexColumnCenter,
  FlexCenter,
  FullFlexColumnCenter,
  FullFlexRow,
} from "../../components/Flex";
import ShakeAnimationWrapper from "../../components/effects/Shake";

import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";

import BlurredBackground from "../../components/layers/BlurredBackground";
import Avatar from "@material-ui/core/Avatar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import PulseCheckBox from "../../components/buttons/PulseCheckBox.js";

// Cards
import BaseDealCard from "../../components/cards/BaseDealCard";
import RenderCard from "../../components/RenderCard";
import RenderInteractableCard from "../../components/RenderInteractableCard";

import PlayerPanelWrapper from "../../components/panels/playerPanel/PlayerPanelWrapper";
import PlayerPanel from "../../components/panels/playerPanel/PlayerPanel";
import PlayerPanelTurnIndicator from "../../components/panels/playerPanel/PlayerPanelTurnIndicator";
import PlayerPanelContent from "../../components/panels/playerPanel/PlayerPanelContent";
import PlayerPanelNameWrapper from "../../components/panels/playerPanel/PlayerPanelNameWrapper";
import PlayerPanelName from "../../components/panels/playerPanel/PlayerPanelName";
import PlayerPanelActionText from "../../components/panels/playerPanel/PlayerPanelActionText";
import PlayerPanelActionNumber from "../../components/panels/playerPanel/PlayerPanelActionNumber";

import CollectionContainer from "../../components/panels/playerPanel/CollectionContainer";
import PropertySetContainer from "../../components/panels/playerPanel/PropertySetContainer";
import BankCardContainer from "../../components/panels/playerPanel/BankCardContainer";

import TurnNotice from "../../components/TurnNotice";
import BankWrapper from "../../components/panels/playerPanel/BankWrapper";
import MyHandContainer from "../../components/panels/playerPanel/MyHandContainer";
import Deck3D from "../../components/panels/playerPanel/Deck3D";
import CurrencyText from "../../components/cards/elements/CurrencyText";
import PileCount from "../../components/gameUi/PileCount";

// Screens
import SCREENS from "../../data/screens";
import PayRequestScreen from "../../components/screens/PayRequestScreen";
import ReceivePaymentScreen from "../../components/screens/ReceivePaymentScreen";
import RequestScreen from "../../components/screens/RequestScreen";
import GameOverScreen from "../../components/screens/GameOverScreen";

// Icons
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import StarBorder from "@material-ui/icons/StarBorder";

// Buttons
import Button from "@material-ui/core/Button";
import ActionButtonWrapper from "../../components/buttons/actionButton/ActionButtonWrapper";
import ActionButton from "../../components/buttons/actionButton/ActionButton";
import actionButtonContents from "../../components/buttons/actionButton/actionButtonContents";
import AutoPassTurnButton from "../../components/buttons/AutoPassTurnButton";
import IconButton from "@material-ui/core/IconButton";
import RequestButton from "../../components/buttons/RequestButton";

import Game from "../../utils/game";
import Room from "../../utils/room";
import RoomManager from "../../utils/roomManager";

import PersonListItem from "../../components/game/PersonListItem/";
import { isArray } from "lodash";

const uiConfig = {
  hand: {
    default: {
      scalePercent: 60,
    },
    hover: {
      scalePercent: 100,
    },
  },
  collection: {
    default: {
      scalePercent: 35,
    },
    hover: {
      scalePercent: 45,
    },
  },
  bank: {
    default: {
      scalePercent: 35,
    },
    hover: {
      scalePercent: 45,
    },
  },

  sidebar: {
    initialSize: 300,
    maxSize: 300,
    minSize: 0,
  },
  myArea: {
    initialSize: 250,
  },
};

let game;
let room;
let roomManager;
class GameUI extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.initialized = false;

    this.connection = createSocketConnection(
      io.connect(process.env.CONNECT, {
        secure: true,
        rejectUnauthorized: false,
      })
    );

    // Store a list of valeus if the value changes the card will shake
    this.shakeCardList = ImmutableClassBasedObject(this, "shakeValues");
    this.shakeCard = (id) =>
      this.shakeCardList.get(id, false) === false
        ? this.shakeCardList.set(id, true)
        : this.shakeCardList.set(id, false);
    this.getShakeCardValue = (id) => this.shakeCardList.get(id, false);

    // Create game instance
    game = Game(this);
    room = Room(this);
    roomManager = RoomManager(this);

    let initialState = {
      nameInput: "",
      isChangingMyName: false,

      executedCreateRoom: false,
      executedJoinRoom: false,
      isRoomCreated: false,
      isRoomJoined: false,
      progress: [
        "executedCreateRoom",
        "executedJoinRoom",
        "isRoomCreated",
        "isRoomJoined",
      ],
      roomCode: null,
      room: null,
      people: {
        items: {},
        order: [],
      },
    };

    let bindFuncs = [
      "getConnection",
      "onReady",
      "resetData",

      "handleCloseReqeustScreenIfNoRequests",
      "handleOnHandCardClick",
      "handleOnCardDrop",
      "handleOnCardDropOnPlayerPanel",
      "handleCollectionSelect",
      "handleOnCardDropBank",
      "renderDefaultMainPanel",
      "handleOnDiscardCards",
      "handleOnChargeRentClick",
      "handleStealPropertyClick",
      "handleStealCollectionClick",

      "stealProperty",
      "stealCollection",

      "renderReadyButton",
      "updateRender",
      "makeCardCheck",

      "renderCardsInMyHand",
      "renderPlayerPanel",
      "renderDiscardCardsNotice",
      "renderMyArea",
      "renderDebugData",
      "renderBackground",
      "renderListOfUsers",
    ];
    this.state = initialState;
    bindFuncs.forEach((funcName) => {
      this[funcName] = this[funcName].bind(this);
    });
  }

  async resetData() {
    await game.resetState();
    await room.resetState();
    await room.leaveRoom();
    let connection = this.getConnection();
    connection.socket.destroy();
  }

  componentDidMount() {
    this.onReady();
  }

  componentWillUnmount() {
    this.resetData();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.onReady();
  }

  onReady() {
    if (!this.initialized && isDef(room.getCode())) {
      this.initialized = true;
      (async () => {
        game.init();
        let roomCode = room.getCode();
        let roomExists = await roomManager.exists(roomCode);

        if (!roomExists) {
          await roomManager.create(roomCode);
        }

        await roomManager.join(roomCode);
      })();
    }
  }

  getConnection() {
    return this.connection;
  }

  //########################################

  //               HANDLE

  //########################################
  // When clicking a card in hand
  async handleOnHandCardClick({ cardId, from }) {
    from = els(from, "hand");
    let card = game.card.get(cardId);
    let actionCardId = game.getDisplayData(["actionCardId"], 0);
    if (cardId === actionCardId) {
      await game.resetUi();
    } else {
      if (!game.isCardSelectionEnabled()) {
        if (game.isMyTurn()) {
          if (game.phase.isActionPhase()) {
            if (game.card.isCashCard(card)) {
              if (from === "hand") {
                sounds.chaChing.play();
              }
              game.addCardToMyBankFromHand(card.id);
              return true;
            } else if (game.card.isPropertyCard(card)) {
              if (game.card.isWildPropertyCard(card)) {
                if (!game.card.isSuperWildProperty(card)) {
                  // let the user switch the color
                  return true;
                } else {
                  // shake super wild for now - should implement auto placement
                }
              } else {
                if (from === "hand") {
                  sounds.playcard.play();
                }
                game.autoAddCardToMyCollection(card);
                return true;
              }
            } else if (game.card.isActionCard(card)) {
              if (game.card.isDrawCard(card)) {
                game.playPassGo(card);
                return true;
              } else if (game.card.isRentCard(card)) {
                let isSuccess = await game.initAskForRent(card);
                if (isSuccess) {
                  return true;
                }
              } else if (game.card.hasTag(card, "collectValue")) {
                let isSuccess = game.initAskForValueCollection(card);
                if (isSuccess) {
                  return true;
                }
              } else if (game.card.hasTag(card, "stealProperty")) {
                let isSuccess = game.initAskForProperty(card);
                if (isSuccess) {
                  return true;
                }
              } else if (game.card.hasTag(card, "swapProperty")) {
                let isSuccess = game.initAskForPropertySwap(card);
                if (isSuccess) {
                  return true;
                }
              } else if (game.card.hasTag(card, "stealCollection")) {
                let isSuccess = game.initAskForCollection(card);
                if (isSuccess) {
                  return true;
                }
              }
            }
          }
        }

        // if action not preformed above, shake card
        this.shakeCard(cardId);
      }
    }
  }

  async handleCloseReqeustScreenIfNoRequests() {
    await game.resetUi();
    if (game.requests.openExists()) {
      await game.updateDisplayData("mode", SCREENS.REQUESTS);
    }
  }

  handleOnCardDrop({ dragProps, dropProps }) {
    let dropZone = dropProps;
    let item = dragProps;
    let roomCode = room.getCode();
    let connection = this.getConnection();

    let personId = getNestedValue(dropProps, "personId", 0);
    let cardId = item.cardId;
    let card = game.card.get(cardId);
    let myId = game.myId();

    if (personId !== 0 && personId !== myId) {
      if (dropProps.is === "collection") {
        let collectionId = dropProps.collectionId;
        if (isDef(collectionId)) {
          if (game.card.hasTag(card, "stealCollection")) {
            this.stealCollection(cardId, collectionId);
          }
        }
      }
      //
    } else {
      if (dropZone.isCollection) {
        if (isDef(cardId)) {
          // New Set
          if (dropZone.isEmptySet) {
            if (item.from === "hand") {
              sounds.playcard.play();
              game.addPropertyToNewCollectionFromHand(cardId);
            } else if (item.from === "collection") {
              let fromCollectionId = item.collectionId;
              if (isDef(fromCollectionId)) {
                if (card.type === "property") {
                  sounds.playcard.play();
                  game.transferPropertyToNewCollection(
                    cardId,
                    fromCollectionId
                  );
                } else if (
                  card.type === "action" &&
                  card.class === "setAugment"
                ) {
                  sounds.build.play();
                  game.transferSetAugmentToNewCollection(
                    cardId,
                    fromCollectionId
                  );
                }
              } else {
                console.error("handleOnCardDrop missing fromCollectionId");
              }
            } else {
              console.error(
                "handleOnCardDrop to new set, not from hand or collection"
              );
            }
          } else {
            let toCollectionId = dropZone.collectionId;
            // Existing Collection
            if (item.from === "hand") {
              if (game.card.isPropertyCard(card)) {
                sounds.playcard.play();
                game.addPropertyToExistingCollectionFromHand(
                  cardId,
                  toCollectionId
                );
              } else if (game.card.isSetAugmentCard(card)) {
                sounds.build.play();
                game.addAugmentToExistingCollectionFromHand(
                  cardId,
                  toCollectionId
                );
              } else if (
                card.type === "action" &&
                game.card.hasTag(card, "rent")
              ) {
                game.initAskForRent(cardId, toCollectionId);
              } else {
                console.error("Card is not a property or set augment");
              }
            } else if (item.from === "collection") {
              let fromCollectionId = item.collectionId;
              if (isDef(fromCollectionId)) {
                // Transfer property to existing collection
                if (card.type === "property") {
                  sounds.playcard.play();
                  game.transferPropertyToExistingCollection(
                    cardId,
                    fromCollectionId,
                    toCollectionId
                  );
                }
                // Transfer set augment to existing collection
                else if (
                  card.type === "action" &&
                  card.class === "setAugment"
                ) {
                  sounds.build.play();
                  game.transferSetAugmentToExistingCollection(
                    cardId,
                    fromCollectionId,
                    toCollectionId
                  );
                }
              } else {
                console.error("handleOnCardDrop missing fromCollectionId");
              }
            } else {
              console.error(
                "handleOnCardDrop to existing set, not from hand or collection"
              );
            }
          }
        }
      }
    }
  }

  handleOnCardDropOnPlayerPanel({ dragProps, dropProps }) {
    let cardId = dragProps.cardId;
    if (isDef(cardId)) {
      if (dragProps.from === "hand") {
        if (game.card.hasTag(cardId, "property")) {
          sounds.playcard.play();
          game.addPropertyToNewCollectionFromHand(cardId);
        } else {
          sounds.chaChing.play();
          game.addCardToMyBankFromHand(cardId);
        }
      } else {
        if (dragProps.from === "collection") {
          let fromCollectionId = dragProps.collectionId;
          if (isDef(fromCollectionId)) {
            if (game.card.hasTag(cardId, "property")) {
              sounds.playcard.play();
              game.transferPropertyToNewCollection(cardId, fromCollectionId);
            }
          }
        }
      }
    }
  }

  handleOnCardDropBank({ dragProps, dropProps }) {
    let dropZone = dropProps;
    let item = dragProps;
    let cardId = item.cardId;
    let card = game.card.get(cardId);

    if (isDef(dropZone.isBank) && isDef(dropZone.playerId) && isDef(card)) {
      if (game.canAddCardToBank(card)) {
        sounds.chaChing.play();
        game.addCardToMyBankFromHand(card.id);
      } else {
        console.log("this card cant be added to the bank.");
      }
    }
  }

  handleCollectionSelect({ collectionId }) {
    if (game.selection.collections.selectable.has(collectionId)) {
      game.selection.collections.selected.toggle(collectionId);
    }
  }

  renderDefaultMainPanel() {
    //========================================
    //            RENDER MY HAND
    //========================================
    let mainContent = (
      <AbsLayer>
        <FillContainer>
          <FillContent>
            <FlexColumn style={{ width: "100%", height: "100%" }}>
              {game.player.opponents.getAll().map(this.renderPlayerPanel)}
            </FlexColumn>
          </FillContent>
          {game.me() ? (
            <FillFooter>{this.renderPlayerPanel(game.me())}</FillFooter>
          ) : (
            ""
          )}
        </FillContainer>
      </AbsLayer>
    );
    return mainContent;
  }

  async handleOnDiscardCards() {
    if (game.phase.isDiscardPhase()) {
      let selectedCardIds = game.selection.cards.selected.get();
      if (game.selection.cards.selected.isLimitSelected()) {
        sounds.playcard.play(selectedCardIds.length);
        await game.discardCards(selectedCardIds);
        await game.selection.cards.reset();
      }
    }
  }

  async handleOnChargeRentClick() {
    if (game.canChargeRent()) {
      let selectedCollectionIds = game.selection.collections.selected.get();
      await game.chargeRent(game.getActionCardId(), {
        collectionId: selectedCollectionIds[0],
        augmentCardsIds: game.getSelectedCardIds(),
        targetIds: game.getSelectedPeopleIds(),
      });
      await game.resetUi();
      await game.updateDisplayData("mode", SCREENS.REQUESTS);
    }
  }

  async handleStealPropertyClick() {
    let selectedIds = game.selection.cards.selected.get();
    await this.stealProperty(game.getActionCardId(), selectedIds[0]);
  }

  async handleStealCollectionClick() {
    let ids = game.selection.collections.selected.get();
    await this.stealCollection(game.getActionCardId(), ids[0]);
  }

  async handleSwapPropertyClick() {
    sounds.playcard.play();
    let selectedIds = game.selection.cards.selected.get();
    let seperatedCards = game.seperateCards(selectedIds);
    let mine = [];
    let theirs = [];
    seperatedCards.forEach((info) => {
      if (info.playerId === game.myId()) {
        mine.push(info.cardId);
      } else {
        theirs.push(info.cardId);
      }
    });

    if (mine.length > 0 && theirs.length > 0) {
      await game.swapProperties({
        cardId: game.getActionCardId(),
        myPropertyCardId: mine[0],
        theirPropertyCardId: theirs[0],
      });
      await game.resetUi();
      await game.updateDisplayData("mode", SCREENS.REQUESTS);
    }
  }

  async handleRequestValueClick() {
    sounds.playcard.play();
    game.handleAskForValueConfirm({ cardId: game.getActionCardId() });
  }

  makeCardCheck({
    personId,
    isMyHand = false,
    isCollection = false,
    collectionId = 0,
    isBank = false,
    canSelectCardFromUser = true,
  }) {
    let displayMode = game.getDisplayData("mode");
    let actionCardId = game.getDisplayData(["actionCardId"], 0);

    let isDonePhase = game.phase.isMyDonePhase();

    let collection = null;
    let isCollectionSelectable = false;
    if (isCollection) {
      collection = game.collection.get(collectionId);
      if (isDef(collection)) {
        isCollectionSelectable = game.selection.collections.selectable.has(
          collectionId
        );
      }
    }

    function isCardSelected(cardId) {
      if (isMyHand) {
        //if (isDonePhase) {
        //  return true;
        //}
        if (actionCardId === cardId) {
          return true;
        }
      }
      if (isCollection) {
        if (isCollectionSelectable) {
          return false;
        }
      }
      return game.isCardSelected(cardId);
    }

    function isSelectionEnabled(cardId) {
      let actionCardId = game.getDisplayData(["actionCardId"], 0);
      if (cardId === actionCardId) {
        return true;
      }
      if (isCollection) {
        if (isCollectionSelectable) {
          return false;
        }
      }
      return game.isCardSelectionEnabled();
    }

    function canSelectCard(cardId) {
      if (isMyHand) {
        //if (isDonePhase) {
        //  return true;
        //}
        if (actionCardId === cardId) {
          return true;
        }
      }
      if (isCollection) {
        if (isCollectionSelectable) {
          return false;
        }
      }
      if (isCardSelected(cardId)) return true;

      if (canSelectCardFromUser) return game.canSelectCard(cardId);
      return false;
    }

    function isCardNotApplicable(cardId) {
      if (isMyHand) {
        //if (isDonePhase) {
        //  return true;
        //}
        if (actionCardId === cardId) {
          return false;
        }
      }
      if (isCollection) {
        if (isCollectionSelectable) {
          return false;
        }
      }
      return game.isCardNotApplicable(cardId);
    }

    function getSelectionType(cardId) {
      if (isMyHand) {
        if (actionCardId === cardId) {
          return "remove";
        }
      }
      return game.selection.cards.getType();
    }

    function makeOnSelectCard(cardId) {
      return async () => {
        console.log("makeOnSelectCard");
        let actionCardId = game.getDisplayData(["actionCardId"], 0);
        console.log("actionCardId", actionCardId, cardId);
        if (actionCardId === cardId) {
          console.log("action card clicked");
          await game.resetUi();
        } else if (isCollection) {
          if (!isCollectionSelectable) {
            game.toggleCardSelected(cardId);
          }
        } else {
          console.log("default action");
          game.toggleCardSelected(cardId);
        }
      };
    }
    return {
      isCardSelected,
      isSelectionEnabled,
      canSelectCard,
      isCardNotApplicable,
      getSelectionType,
      makeOnSelectCard,
    };
  }

  async stealCollection(cardId, collectionId) {
    sounds.playcard.play();
    let props = {
      cardId: cardId,
      theirCollectionId: collectionId,
    };

    await game.stealCollection(props);
    await game.resetUi();
    await game.updateDisplayData("mode", SCREENS.REQUESTS);
  }

  async stealProperty(cardId, theirPropertyCardId) {
    sounds.swipe.play();
    await game.stealProperties({
      cardId,
      theirPropertyCardId,
    });
    await game.resetUi();
    await game.updateDisplayData("mode", SCREENS.REQUESTS);
  }
  //########################################

  //               RENDER

  //########################################
  updateRender(customFn, mode) {
    const self = this;
    function setDrawInitialCardsButton() {
      game.updateRenderData(["actionButton", "disabled"], false);
      game.updateRenderData(["actionButton", "onClick"], async () => {
        if (game.canDrawInitialCards()) {
          await game.resetUi();
          await game.drawTurnStartingCards();
        }
      });
      game.updateRenderData(["actionButton", "className"], "pulse_white");
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.drawCards
      );
    }

    function setDiscardButton() {
      game.updateRenderData(
        ["actionButton", "disabled"],
        !game.phase.canDiscardCards()
      );
      game.updateRenderData(
        ["actionButton", "onClick"],
        self.handleOnDiscardCards
      );
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.discard
      );
    }

    function setChargeRentButton() {
      let rentButtonEnabled = game.canChargeRent();
      game.updateRenderData(["actionButton", "disabled"], !rentButtonEnabled);
      game.updateRenderData(["actionButton", "onClick"], () => {
        if (rentButtonEnabled) self.handleOnChargeRentClick();
      });
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.confirm
      );
    }

    function setStealPropertyButton() {
      let buttonEnabled = game.selection.cards.selected.isLimitSelected();
      game.updateRenderData(["actionButton", "disabled"], !buttonEnabled);
      game.updateRenderData(["actionButton", "title"], "Confirm Request");
      game.updateRenderData(["actionButton", "onClick"], () => {
        if (buttonEnabled) self.handleStealPropertyClick();
      });
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.confirm
      );
    }

    function setStealCollectionButton() {
      let buttonEnabled = game.selection.collections.selected.isLimitSelected();
      game.updateRenderData(["actionButton", "disabled"], !buttonEnabled);
      game.updateRenderData(["actionButton", "title"], "Confirm Request");
      game.updateRenderData(["actionButton", "onClick"], () => {
        if (buttonEnabled) self.handleStealCollectionClick();
      });
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.confirm
      );
    }

    function setAskForPropertySwapButton() {
      let buttonEnabled = game.selection.cards.selected.isLimitSelected();
      game.updateRenderData(["actionButton", "disabled"], !buttonEnabled);
      game.updateRenderData(["actionButton", "title"], "Confirm Request");
      game.updateRenderData(["actionButton", "onClick"], () => {
        if (buttonEnabled) self.handleSwapPropertyClick();
      });
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.confirm
      );
    }

    function setAskForValueButton() {
      let isButtonDisabled = !game.selection.people.selected.isLimitSelected();
      game.updateRenderData(["actionButton", "disabled"], isButtonDisabled);
      game.updateRenderData(["actionButton", "title"], "Confirm Request");
      game.updateRenderData(["actionButton", "onClick"], () => {
        if (!isButtonDisabled) {
          game.handleAskForValueConfirm({ cardId: actionCardId });
        }
      });
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.confirm
      );
    }

    function setNextPhaseButton() {
      let isButtonDisabled = !game.canPassTurn();
      game.updateRenderData(["actionButton", "disabled"], isButtonDisabled);
      game.updateRenderData(["actionButton", "title"], "Next Phase");
      game.updateRenderData(["actionButton", "onClick"], () => {
        game.passTurn();
      });
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.nextPhase
      );
    }

    function setEndTurnButton() {
      let isButtonDisabled = !game.canPassTurn();
      game.updateRenderData(["actionButton", "disabled"], isButtonDisabled);
      game.updateRenderData(["actionButton", "className"], "pulse_white");
      game.updateRenderData(["actionButton", "title"], "Next Turn");
      game.updateRenderData(["actionButton", "onClick"], () => {
        game.passTurn();
      });
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.nextPhase
      );
    }

    function setStartGameButton() {
      let isButtonDisabled = !game.canStartGame();
      game.updateRenderData(["actionButton", "disabled"], isButtonDisabled);
      game.updateRenderData(["actionButton", "title"], "Start Game");
      game.updateRenderData(["actionButton", "onClick"], () => {
        if (game.amIHost()) {
          game.start();
        }
      });
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.startGame
      );
    }

    function setDefaultButton() {
      game.updateRenderData(["actionButton", "disabled"], true);
      game.updateRenderData(["actionButton", "onClick"], () => {});
      game.updateRenderData(["actionButton", "title"], "Waiting");
      game.updateRenderData(
        ["actionButton", "contents"],
        actionButtonContents.waiting
      );
    }

    // -----------------------------------------
    //              ACTION BUTTON
    // -----------------------------------------
    setDefaultButton();

    if (game.isMyTurn() && game.turn.getPhaseKey() === "draw") {
      //console.clear();
    }
    // On discard saftey measure that all cards are selected
    if (game.isMyTurn() && game.turn.getPhaseKey() === "discard") {
      //It had does not match selectable size
      if (
        game.myHand.getCardIds().length !==
        game.selection.cards.selectable.get().length
      ) {
        let doItMaybe = async () =>
          await game.selection.cards.selectable.set(game.myHand.getCardIds());
        doItMaybe();
      }
    }
    let displayMode = game.getDisplayData("mode");
    let actionCardId = game.getActionCardId();
    if (game.getGameStatus("isGameStarted")) {
      game.updateRenderData(["actionButton", "className"], "");
      if (game.isMyTurn()) {
        if (game.canDrawInitialCards()) {
          setDrawInitialCardsButton();
        } else if (game.phase.isDiscardPhase()) {
          setDiscardButton();
        } else if (displayMode === "chargeRent") {
          setChargeRentButton();
        } else if (displayMode === "stealProperty") {
          setStealPropertyButton();
        } else if (displayMode === "stealCollection") {
          setStealCollectionButton();
        } else if (displayMode === "askForPropertySwap") {
          setAskForPropertySwapButton();
        } else if (displayMode === "askPropleForValue") {
          setAskForValueButton();
        } else if (game.phase.isMyDonePhase()) {
          setEndTurnButton();
        } else {
          setNextPhaseButton();
        }
      }
    } else {
      if (game.canStartGame()) {
        setStartGameButton();
      }
    }
    let isGameStarted = game.isStarted();
    let isRequestScreenOpen = displayMode === SCREENS.REQUESTS;
    let isGameOver = game.gameOver.isTrue();

    game.updateRenderData(["requestButton"], {
      label: isRequestScreenOpen ? "Close" : "Requests",
      disabled: !isGameStarted,
      onClick: () => {
        if (isGameStarted) {
          if (displayMode === SCREENS.REQUESTS) {
            game.updateDisplayData("mode", null);
          } else {
            game.updateDisplayData("mode", SCREENS.REQUESTS);
          }
        }
      },
    });

    game.updateRenderData(["deck", "onClick"], () => {
      if (game.canDrawInitialCards()) {
        game.drawTurnStartingCards();
      }
    });

    let makeGenericResponse = (responseKey) => async ({
      requestId,
      cardId,
    }) => {
      let request = game.request.get(requestId);
      if (isDef(request)) {
        switch (request.type) {
          case "collectValue":
            if (responseKey === "accept") {
              return game.initPayValueRequest(requestId);
            } else {
              console.log("respondToValueRequest", {
                requestId,
                cardId,
                responseKey,
              });
              await game.respondToValueRequest({
                requestId,
                cardId,
                responseKey,
              });
              await this.handleCloseReqeustScreenIfNoRequests();
              return true;
            }
          case "stealCollection":
            await game.respondToStealCollection({
              requestId,
              cardId,
              responseKey,
            });
            await this.handleCloseReqeustScreenIfNoRequests();
            return true;
          case "justSayNo":
            await game.respondToJustSayNo({ requestId, cardId, responseKey });
            await this.handleCloseReqeustScreenIfNoRequests();
            return true;

          case "stealProperty":
            await game.respondToStealProperty({
              requestId,
              cardId,
              responseKey,
            });
            await this.handleCloseReqeustScreenIfNoRequests();
            return true;

          case "swapProperty":
            await game.respondToPropertyTransfer({
              requestId,
              cardId,
              responseKey,
            });
            await this.handleCloseReqeustScreenIfNoRequests();
            return true;
          default:
        }
      }
    };

    // -----------------------------------------
    //              MAIN CONTENT
    // -----------------------------------------
    // reset main content
    game.updateRenderData("mainContent", null);
    if (isGameOver) {
      if (game.amIHost()) {
        setStartGameButton();
      } else {
        setDefaultButton();
      }

      game.updateRenderData(
        "mainContent",
        <GameOverScreen
          thisPersonId={game.myId()}
          winner={game.gameOver.getWinner()}
          winningCondition={game.gameOver.getWinningCondition()}
        />
      );
    } else {
      if (isRequestScreenOpen) {
        let getCard = (id) => game.card.get(id);
        let getProperty = (id) => game.property.get(id);
        let getPerson = (id) => game.person.get(id);
        let thisPersonId = game.myId();

        let declinableCardIds = game.cards.ids.getMyDeclineCards();

        let onDeclineRequest = makeGenericResponse("decline");
        let onAcceptRequest = makeGenericResponse("accept");
        let canDeclineRequest = () => {
          return declinableCardIds.length > 0;
        };
        let getCollectionCardIds = game.collection.getCardIds;
        let getRequestDeclineCard = (requestId) => {
          if (declinableCardIds.length > 0) return declinableCardIds[0];
          return null;
        };

        let onClickCollect = async ({ requestId, iCanCollect }) => {
          if (iCanCollect) {
            await game.updateDisplayData("mode", SCREENS.COLLECT);
          } else {
            await game.collectNothingToNothing(requestId);
            await this.handleCloseReqeustScreenIfNoRequests();
          }
        };

        let onClickAutoCollect = async ({ requestId, receive }) => {
          Object.keys(receive).forEach((key) => {
            let ids = receive[key];
            switch (key) {
              case "bank":
                if (ids.length > 0) {
                  sounds.chaChing.play(ids.length);
                  ids.forEach((id) => {
                    game.collectCardToBank(requestId, id);
                  });
                }
                break;
              case "property":
                if (ids.length > 0) {
                  sounds.playcard.play(ids.length);
                  ids.forEach((id) => {
                    let card = game.card.get(id);
                    let collectionId = game.getIncompleteCollectionMatchingSet(
                      game.myId(),
                      card.set
                    );
                    game.collectCardToCollection(requestId, id, collectionId);
                  });
                }
                break;
              case "collection":
                if (ids.length > 0) {
                  sounds.playcard.play(ids.length);
                  game.collectCollection({ requestId });
                }
                break;
              default:
            }
          });
        };
        let onPropertyClick = async (...props) => {
          console.log("clicked", ...props);
        };
        let onBankClick = async (...props) => {
          console.log("clicked", ...props);
        };
        let onCollectionClick = async (...props) => {
          console.log("clicked", ...props);
        };
        let onCardDrop = ({ dragProps, dropProps }) => {
          if (dropProps.is === "request") {
            let requestId = dropProps.requestId;
            let cardId = dragProps.cardId;
            if (isDef(requestId) && isDef(cardId)) {
              onDeclineRequest({ requestId, cardId, responseKey: "decline" });
            }
          }
        };

        let getRequests = () => {
          // show newest requests first
          let allRequests = game.requests.getAll();
          if (isDef(allRequests) && isArr(allRequests)) {
            return allRequests.slice().reverse();
          }
          return [];
        };

        game.updateRenderData(
          "mainContent",
          <RequestScreen
            getRequests={getRequests}
            getProperty={getProperty}
            getCard={getCard}
            getPerson={getPerson}
            game={game}
            getCollectionCardIds={getCollectionCardIds}
            canDeclineRequest={canDeclineRequest}
            getRequestDeclineCard={getRequestDeclineCard}
            onDeclineRequest={onDeclineRequest}
            onAcceptRequest={onAcceptRequest}
            thisPersonId={thisPersonId}
            propertySetsKeyed={game.getPropertySetsKeyed()}
            onCardDrop={onCardDrop}
            onCollectionClick={onCollectionClick}
            onBankClick={onBankClick}
            onPropertyClick={onPropertyClick}
            onClickCollect={onClickCollect}
            onClickAutoCollect={onClickAutoCollect}
          />
        );
      } else {
        if (displayMode === SCREENS.COLLECT) {
          let handleOnCardClick = ({ requestId, cardId, collectionId, is }) => {
            switch (is) {
              case "bank":
                sounds.chaChing.play();
                return game.collectCardToBank(requestId, cardId);
              case "property":
                return game.collectCardToCollection(
                  requestId,
                  cardId,
                  collectionId
                );
              case "collection":
                return game.collectCollection({ requestId });
              default:
                return null;
            }
          };
          let handleOnCardDrop = ({ dragProps, dropProps }) => {
            if (isDefNested(dragProps, "is") && dragProps.is === "collection") {
              if (isDefNested(dragProps, "requestId")) {
                let requestId = dragProps.requestId;
                return game.collectCollection({ requestId });
              }
            } else {
              let { requestId, cardId } = dragProps;
              if (isDef(requestId)) {
                if (isDef(cardId)) {
                  if (dragProps.is === "bank") {
                    sounds.chaChing.play();
                    return game.collectCardToBank(requestId, cardId);
                  }
                  if (dragProps.is === "property") {
                    sounds.playcard.play();
                    let collectionId = dropProps.collectionId;
                    return game.collectCardToCollection(
                      requestId,
                      cardId,
                      collectionId
                    );
                  }
                  if (dragProps.is === "collection") {
                    //let collectionId = dropProps.collectionId;
                    sounds.playcard.play();
                    let requestId = dropProps.requestId;
                    return game.collectCollection({ requestId });
                  }
                } else {
                  console.error("cardId is not defiend");
                }
              } else {
                console.error("requestId is not defiend");
              }
            }
          };

          let handleOnCollectionClick = async ({ collectionId, requestId }) => {
            return game.collectCollection({ requestId });
          };

          let currentActionAcount = game.getCurrentActionCount();
          let requestIds = game.requests.getAllIds().filter((requestId) => {
            // filter only requests for this action
            let request = game.request.get(requestId);
            let preformedOnActionNum = getNestedValue(
              request,
              ["payload", "actionNum"],
              0
            );
            return String(preformedOnActionNum) === String(currentActionAcount);
          });

          let isAllClosed = true;
          let requestKeyed = {};
          let varifiedRequests = [];
          requestIds.forEach((requestId) => {
            let request = game.request.get(requestId);
            if (isDef(request)) {
              varifiedRequests.push(requestId);
              requestKeyed[requestId] = request;

              if (!request.isClosed) {
                isAllClosed = false;
              }
            }
          });

          let sumCardValuesFn = game.cards.getSumValue;
          let banksCardIds = game.bank.getMyCardIds();
          let handOnClose = async () => {
            await game.resetDisplayData();
            await game.resetUi();
            if (game.requests.openExists()) {
              await game.updateDisplayData("mode", SCREENS.REQUESTS);
            }
          };

          game.updateRenderData("actionButton", {
            disabled: !isAllClosed,
            onClick: handOnClose,
            contents: actionButtonContents.close,
          });

          let handleCollectEmptyRequest = ({ requestId }) => {
            game.collectNothingToNothing(requestId);
          };

          let thisPersonId = game.myId();

          let makeGetterPersonTransferIds = (field, funcName) => (
            requestId
          ) => {
            let results = [];
            let request = game.request.get(requestId);
            if (isDef(request)) {
              let direction;
              let amITarget =
                String(thisPersonId) === String(request.targetKey);
              let amIAuthor =
                String(thisPersonId) === String(request.authorKey);
              if (amIAuthor) {
                direction = "toAuthor";
                if (
                  isDefNested(game, [
                    "request",
                    "transfer",
                    direction,
                    field,
                    funcName,
                  ])
                ) {
                  let ids = game.request.transfer[direction][field][funcName](
                    requestId
                  );
                  ids.forEach((id) => {
                    results.push(id);
                  });
                }
              }
              if (amITarget) {
                direction = "toTarget";
                if (
                  isDefNested(game.request, [
                    "transfer",
                    direction,
                    field,
                    funcName,
                  ])
                ) {
                  let ids = game.request.transfer[direction][field][funcName](
                    requestId
                  );
                  ids.forEach((id) => {
                    results.push(id);
                  });
                }
              }
            }
            return results;
          };

          //getAuthored
          game.updateRenderData(
            "mainContent",
            <ReceivePaymentScreen
              requestIds={requestIds}
              myId={game.myId()}
              getRequest={game.request.get}
              getCard={game.card.get}
              getPerson={game.person.get}
              myBankCardIds={banksCardIds}
              myCollectionIds={game.collections.getMyIds()}
              propertySetsKeyed={game.getPropertySetsKeyed()}
              getPersonTransferBankCardIds={makeGetterPersonTransferIds(
                "bank",
                "getIds"
              )}
              getConfirmedTransferBankCardIds={makeGetterPersonTransferIds(
                "bank",
                "getConfirmedIds"
              )}
              getPersonTransferPropertyCardIds={makeGetterPersonTransferIds(
                "property",
                "getIds"
              )}
              getConfirmedPersonTransferPropertyCardIds={makeGetterPersonTransferIds(
                "property",
                "getConfirmedIds"
              )}
              getPersonTransferCollectionIds={makeGetterPersonTransferIds(
                "collection",
                "getIds"
              )}
              getConfirmedPersonTransferCollectionIds={makeGetterPersonTransferIds(
                "collection",
                "getConfirmedIds"
              )}
              getCardIdsforCollection={game.collection.getCardIds}
              onConfirmEmptyRequest={handleCollectEmptyRequest}
              onCollectionClick={handleOnCollectionClick}
              onCardClick={handleOnCardClick}
              onCardDrop={handleOnCardDrop}
              onClose={handOnClose}
              sumCardValuesFn={sumCardValuesFn}
            />
          );
        }

        if (displayMode === SCREENS.PAY) {
          let request = game.getDisplayData("request");
          let requestId = getNestedValue(request, "id", 0);
          let actionLabel = getNestedValue(request, "actionLabel", "");
          let actionCardId = getNestedValue(request, "actionCardId", null);
          let augmentCardIds = getNestedValue(request, "augmentCardIds", []);
          let amountRemaining = getNestedValue(request, "amount", 0);
          let actionCollectionId = getNestedValue(
            request,
            "actionCollectionId",
            0
          );

          let handleOnConfirm = async () => {
            await game.respondToValueRequest({
              requestId,
              responseKey: "accept",
            });
            await game.resetUi();
            await game.updateDisplayData("mode", SCREENS.REQUESTS);
          };
          let onCancel = async ({ requestId, cardId }) => {
            await game.resetUi();
            game.updateDisplayData("mode", SCREENS.REQUESTS);
          };

          let getPerson = (id) => game.person.get(id);

          game.updateRenderData(
            "mainContent",
            <PayRequestScreen
              game={game}
              requestId={requestId}
              actionCardId={actionCardId}
              actionCollectionId={actionCollectionId}
              augmentCardIds={augmentCardIds}
              amountRemaining={amountRemaining}
              actionLabel={actionLabel}
              cardSelection={game.selection.cards}
              propertySetsKeyed={game.getPropertySetsKeyed()}
              bankCardIds={game.getMyBankCardIds()}
              collectionIds={game.getMyCollectionIds()}
              getCollectionCardIds={game.getCollectionCardIds}
              getPerson={getPerson}
              getRequest={game.request.get}
              getCard={game.card.get}
              onCancel={onCancel}
              onConfirm={handleOnConfirm}
            />
          );
        }
      }
    }

    if (!isDef(game.getRenderData("mainContent", null))) {
      game.updateRenderData("mainContent", this.renderDefaultMainPanel());
    }

    game.updateRenderData(
      "gameboard",
      <RelLayer>{game.getRenderData("mainContent")}</RelLayer>
    );
    game.updateRenderData("turnNotice", this.renderDiscardCardsNotice());
  }

  //########################################

  //               RENDER

  //########################################

  renderReadyButton() {
    let result;
    if (game.amIHost() && game.isEveryoneReady()) {
      result = (
        <React.Fragment>
          <Button
            style={{
              width: "calc(100%-12px)",
              backgroundColor: green[700],
              margin: "6px",
              color: "white",
              fontWeight: "Bold",
            }}
            onClick={() => game.start()}
          >
            Start Game
          </Button>
        </React.Fragment>
      );
    } else {
      result = (
        <React.Fragment>
          <Button
            style={{
              width: "calc(100% - 12px)",
              margin: "6px",
              backgroundColor: game.amIReady() ? green[700] : deepOrange[500],
              color: "white",
              fontWeight: "Bold",
            }}
            onClick={() => game.toggleReady()}
          >
            {game.amIReady() ? "I'm Ready!" : "Ready Up"}
          </Button>
        </React.Fragment>
      );
    }

    return result;
  }

  renderCardsInMyHand() {
    let renderMyHand = [];

    if (game.isInit()) {
      let myHand = game.getMyHand();
      let propertySetsKeyed = game.getAllPropertySetsKeyed();

      if (isDefNested(myHand, "cards") && isArr(myHand.cards)) {
        let cardCheck = this.makeCardCheck({
          personId: game.myId(),
          isMyHand: true,
        });

        renderMyHand = myHand.cards.map((card) => {
          return (
            <ShakeAnimationWrapper
              key={card.id}
              triggerValue={this.getShakeCardValue(card.id)}
            >
              <RenderInteractableCard
                scaledPercent={uiConfig.hand.default.scalePercent}
                card={card}
                clickProps={{
                  from: "hand",
                  cardId: card.id,
                }}
                dragProps={{
                  type: "MY_CARD",
                  cardId: card.id,
                  card: card,
                  from: "hand",
                }}
                onActiveSetChange={({ cardId, propertySetKey }) =>
                  game.flipWildPropertyCard(cardId, propertySetKey)
                }
                onClick={this.handleOnHandCardClick}
                propertySetMap={propertySetsKeyed}
                highlightIsSelectable={true}
                selectionEnabled={cardCheck.isSelectionEnabled(card.id)}
                isSelectable={cardCheck.canSelectCard(card.id)}
                selectType={cardCheck.getSelectionType(card.id)}
                isSelected={cardCheck.isCardSelected(card.id)}
                onSelected={cardCheck.makeOnSelectCard(card.id)}
                notApplicable={cardCheck.isCardNotApplicable(card.id)}
              />
            </ShakeAnimationWrapper>
          );
        });
      }
    }

    return renderMyHand;
  }

  renderDiscardCardsNotice() {
    let turnNotice = "";
    if (game.isMyTurn()) {
      if (game.cards.myHand.hasTooMany()) {
        let howMany = game.cards.myHand.getTooMany();
        turnNotice = (
          <TurnNotice>
            {howMany} {pluralize("card", howMany)} too many in your hand.
          </TurnNotice>
        );
      }

      if (game.phase.isDiscardPhase()) {
        turnNotice = (
          <TurnNotice>
            Discard {game.phase.getDiscardCount()}{" "}
            {pluralize("card", game.phase.getDiscardCount())}
          </TurnNotice>
        );
      }
    }
    return turnNotice;
  }

  renderPlayerPanel(person) {
    let propertySetsKeyed = game.getAllPropertySetsKeyed();
    if (isDef(person)) {
      let isThisPlayersTurn = person.id === game.turn.getPersonId();
      const isMe = game.myId() === person.id;
      const myStyle = {
        position: "absolute",
        width: "100%",
        bottom: "0px",
      };

      let playerSelection = "";
      if (game.selection.people.isEnabled() && person.id !== game.myId()) {
        let isChecked = game.selection.people.selected.has(person.id);
        playerSelection = (
          <FullFlexColumnCenter>
            <PulseCheckBox
              color="primary"
              indeterminate={!game.canPersonBeSelected(person.id)}
              value={isChecked}
              onClick={() => {
                game.selection.people.selected.toggle(person.id);
              }}
            />
          </FullFlexColumnCenter>
        );
      }

      let canSelectCardFromUser = true;
      if (game.getDisplayData(["mode"]) === "askForPropertySwap") {
        let seperateCards = game.seperateCards(
          game.selection.cards.selected.get()
        );
        let playersCardsKeyed = {};
        seperateCards.forEach((info) => {
          if (!isDef(playersCardsKeyed[info.playerId])) {
            playersCardsKeyed[info.playerId] = [];
          }
          playersCardsKeyed[info.playerId].push(info.cardId);
        });

        //Only let 1 peoperty from some one else be selected
        let myid = game.myId();
        if (person.id !== myid) {
          let playerIdsWithCardsSelectedThatIsNotMe = Object.keys(
            playersCardsKeyed
          ).filter((id) => String(id) !== String(myid));
          if (playerIdsWithCardsSelectedThatIsNotMe.length > 0) {
            canSelectCardFromUser = false;
          }
        } else {
          // can only select one my my cards
          if (isDef(playersCardsKeyed[myid])) canSelectCardFromUser = false;
        }
      }

      // Display the collections in reverse order since we are aligning it to the right
      let collectionsForPerson;
      let temp = game.getCollectionIdsForPlayer(person.id);
      if (isDef(temp) && isArr(temp)) {
        collectionsForPerson = temp.slice().reverse();
      } else {
        collectionsForPerson = [];
      }

      return (
        <PlayerPanelWrapper
          key={`player_${person.id}`}
          style={{ width: "100%", ...(isMe ? myStyle : {}) }}
        >
          <PlayerPanel>
            {isThisPlayersTurn ? <PlayerPanelTurnIndicator /> : ""}
            <PlayerPanelContent>
              {/* ----------- Name wrapper ------------*/}
              <PlayerPanelNameWrapper>
                {isMe ? "" : <PlayerPanelName>{person.name}</PlayerPanelName>}

                {/* ----------- Current turn details -------------*/}
                {isThisPlayersTurn ? (
                  <FlexColumn>
                    {game.phase.get() === "action" ? (
                      <>
                        <PlayerPanelActionText>
                          Actions Remaining
                        </PlayerPanelActionText>
                        <PlayerPanelActionNumber>
                          {game.getActionCountRemaining()}
                        </PlayerPanelActionNumber>
                      </>
                    ) : (
                      <FlexCenter style={{ fontSize: "14px" }}>
                        {String(game.phase.get()).toUpperCase()}
                      </FlexCenter>
                    )}
                  </FlexColumn>
                ) : (
                  ""
                )}

                {playerSelection}
              </PlayerPanelNameWrapper>
              <CollectionContainer>
                {/* empty set */}
                <DropZone
                  accept={"MY_CARD"}
                  onDrop={this.handleOnCardDrop}
                  dropProps={{
                    is: "collection",
                    isEmptySet: true,
                    isCollection: true,
                    personId: person.id,
                  }}
                >
                  <PropertySetContainer transparent={true} />
                </DropZone>
                {collectionsForPerson
                  .map((collectionId) => {
                    let collection = game.collection.get(collectionId);
                    let collectionCards = game.collection.getCards(
                      collectionId
                    );

                    //game.selection.collections.selectable.has()

                    let collectionSelection = {
                      enabled: game.selection.collections.isEnabled(),
                      selectType: game.selection.collections.getType(),
                      isSelectable: game.selection.collections.selectable.has(
                        collectionId
                      ),
                      isSelected: game.selection.collections.selected.has(
                        collectionId
                      ),
                      isFull: game.collection.isComplete(collectionId),
                    };
                    let cardCheck = this.makeCardCheck({
                      personId: person.id,
                      isCollection: true,
                      collectionId: collectionId,
                      canSelectCardFromUser: canSelectCardFromUser,
                    });

                    let collectionContent = null;
                    if (collectionCards.length > 0) {
                      collectionContent = (
                        <DropZone
                          key={`collection_${collectionId}`}
                          accept={"MY_CARD"}
                          onDrop={this.handleOnCardDrop}
                          dropProps={{
                            is: "collection",
                            personId: person.id,
                            isEmptySet: false,
                            isCollection: true,
                            collectionId: collectionId,
                          }}
                        >
                          <PropertySetContainer
                            collectionId={collectionId}
                            transparent={true}
                            selectionEnabled={collectionSelection.enabled}
                            selectType={collectionSelection.selectType}
                            isSelectable={collectionSelection.isSelectable}
                            isSelected={collectionSelection.isSelected}
                            onSelected={this.handleCollectionSelect}
                            isFull={collectionSelection.isFull}
                            cards={collectionCards.map((card) => {
                              return (
                                <ShakeAnimationWrapper
                                  key={card.id}
                                  triggerValue={this.getShakeCardValue(card.id)}
                                >
                                  <RenderInteractableCard
                                    card={card}
                                    propertySetMap={propertySetsKeyed}
                                    onActiveSetChange={({
                                      cardId,
                                      propertySetKey,
                                    }) =>
                                      game.flipWildPropertyCard(
                                        cardId,
                                        propertySetKey,
                                        { collectionId }
                                      )
                                    }
                                    scaledPercent={
                                      uiConfig.collection.default.scalePercent
                                    }
                                    hoverPercent={
                                      uiConfig.collection.hover.scalePercent
                                    }
                                    clickProps={{
                                      from: "collection",
                                      collectionId: collectionId,
                                      cardId: card.id,
                                    }}
                                    dragProps={{
                                      type: "MY_CARD",
                                      from: "collection",
                                      collectionId: collectionId,
                                      cardId: card.id,
                                    }}
                                    onClick={this.handleOnHandCardClick}
                                    highlightIsSelectable={true}
                                    selectionEnabled={cardCheck.isSelectionEnabled(
                                      card.id
                                    )}
                                    isSelectable={cardCheck.canSelectCard(
                                      card.id
                                    )}
                                    selectType={cardCheck.getSelectionType(
                                      card.id
                                    )}
                                    isSelected={cardCheck.isCardSelected(
                                      card.id
                                    )}
                                    onSelected={cardCheck.makeOnSelectCard(
                                      card.id
                                    )}
                                    notApplicable={cardCheck.isCardNotApplicable(
                                      card.id
                                    )}
                                  />
                                </ShakeAnimationWrapper>
                              );
                            })}
                          />
                        </DropZone>
                      );
                    }
                    return collectionContent;
                  })
                  .filter((exists) => exists)}
              </CollectionContainer>

              <BankWrapper
                renderTotal={() => (
                  <CurrencyText>
                    {game.player.bank.getTotal(person.id)}
                  </CurrencyText>
                )}
              >
                <DropZone
                  accept={isMe ? "MY_CARD" : "THEIR_CARD"}
                  onDrop={this.handleOnCardDropBank}
                  dropProps={{
                    is: "bank",
                    isBank: true,
                    playerId: person.id,
                  }}
                >
                  <PropertySetContainer
                    transparent={true}
                    cards={game.player.bank.getCards(person.id).map((card) => {
                      let cardCheck = this.makeCardCheck({
                        personId: person.id,
                        from: "bank",
                        isBank: true,
                      });

                      return (
                        <RenderInteractableCard
                          key={card.id}
                          card={card}
                          scaledPercent={uiConfig.bank.default.scalePercent}
                          hoverPercent={uiConfig.bank.default.scalePercent}
                          clickProps={{
                            from: "bank",
                            personId: person.id,
                            cardId: card.id,
                          }}
                          dragProps={{
                            type: isMe ? "MY_CARD" : "THEIR_CARD",
                            from: "bank",
                            cardId: card.id,
                          }}
                          onClick={this.handleOnHandCardClick}
                          selectionEnabled={cardCheck.isSelectionEnabled(
                            card.id
                          )}
                          highlightIsSelectable={true}
                          isSelectable={cardCheck.canSelectCard(card.id)}
                          selectType={cardCheck.getSelectionType(card.id)}
                          isSelected={cardCheck.isCardSelected(card.id)}
                          onSelected={cardCheck.makeOnSelectCard(card.id)}
                          notApplicable={cardCheck.isCardNotApplicable(card.id)}
                          propertySetMap={propertySetsKeyed}
                        />
                      );
                    })}
                  />
                </DropZone>
              </BankWrapper>
            </PlayerPanelContent>
          </PlayerPanel>
        </PlayerPanelWrapper>
      );
    } else {
      return "";
    }
  }

  renderMyArea() {
    let propertySetsKeyed = game.getAllPropertySetsKeyed();

    let isPlayableCardInHand = false;
    if (game.isMyTurn() && ["action", "request"].includes(game.phase.get())) {
      isPlayableCardInHand = true;
    }

    if (game.requests.getTargetedIds().length > 0) {
      let hasDeclineRequestCard = false;
      if (game.cards.ids.getMyDeclineCards().length > 0) {
        hasDeclineRequestCard = true;
      }

      if (hasDeclineRequestCard) isPlayableCardInHand = true;
    }

    let handStyle = isPlayableCardInHand ? {} : { opacity: 0.5 };

    let mySection = (
      <RelLayer>
        {/* background for my section*/}
        <AbsLayer>
          <div
            style={{
              height: "100%",
              width: "100%",
              border: "2px solid white",
              mixBlendMode: "overlay",
            }}
          />
        </AbsLayer>
        {/* my section content */}
        <AbsLayer style={{ backdropFilter: "blur(15px)" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              paddingTop: "10px",
              height: "calc(100% - 20px)",
            }}
          >
            <FlexColumnCenter>
              <div style={{ textAlign: "center" }}>Deck</div>
              <div onClick={game.getRenderData(["deck", "onClick"])}>
                <Deck3D
                  thickness={game.drawPile.getThickness()}
                  rotateX={40}
                  percent={45}
                >
                  <CheckLayer
                    disabled={true}
                    notApplicable={false}
                    value={false}
                    success={true}
                    onClick={() => {
                      console.log("clicked");
                      //handleChange("value", !state.value);
                    }}
                  >
                    <DragItem item={{ type: "DECK_CARD" }}>
                      <RelLayer>
                        <BaseDealCard />
                        <AbsLayer>
                          <PileCount>{game.drawPile.getCount()} </PileCount>
                        </AbsLayer>
                      </RelLayer>
                    </DragItem>
                  </CheckLayer>
                </Deck3D>
              </div>
            </FlexColumnCenter>
            <FlexColumnCenter>
              <div style={{ textAlign: "center" }}>Active</div>
              <Deck3D
                thickness={game.activePile.getThickness()}
                rotateX={40}
                percent={45}
              >
                <CheckLayer
                  disabled={true}
                  notApplicable={false}
                  value={false}
                  success={true}
                  onClick={() => {
                    console.log("clicked");
                    //handleChange("value", !state.value);
                  }}
                >
                  <DragItem item={{ type: "ACTIVE_CARD" }}>
                    <RelLayer>
                      {game.activePile.hasTopCard() ? (
                        <RenderCard
                          card={game.activePile.getTopCard()}
                          propertySetMap={propertySetsKeyed}
                        />
                      ) : (
                        <BaseDealCard />
                      )}
                    </RelLayer>
                  </DragItem>
                </CheckLayer>
              </Deck3D>
            </FlexColumnCenter>
            <FlexColumnCenter>
              <div style={{ textAlign: "center" }}>Discard</div>
              <Deck3D
                thickness={game.discardPile.getThickness()}
                rotateX={40}
                percent={45}
              >
                <CheckLayer
                  disabled={true}
                  notApplicable={false}
                  value={false}
                  success={true}
                  onClick={() => {
                    console.log("clicked");
                    //handleChange("value", !state.value);
                  }}
                >
                  <DragItem item={{ type: "DISCARD_CARD" }}>
                    <RelLayer>
                      <RelLayer>
                        {game.discardPile.hasTopCard() ? (
                          <RenderCard
                            card={game.discardPile.getTopCard()}
                            propertySetMap={propertySetsKeyed}
                          />
                        ) : (
                          <BaseDealCard />
                        )}
                      </RelLayer>
                      <AbsLayer>
                        <PileCount>{game.discardPile.getCount()}</PileCount>
                      </AbsLayer>
                    </RelLayer>
                  </DragItem>
                </CheckLayer>
              </Deck3D>
            </FlexColumnCenter>
            <MyHandContainer
              hasTooManyCards={game.cards.myHand.hasTooMany()}
              style={handStyle}
            >
              {this.renderCardsInMyHand()}
            </MyHandContainer>
            <ActionButtonWrapper>
              <RequestButton
                style={{ height: "fit-content" }}
                disabled={game.getRenderData(["requestButton", "disabled"])}
                onClick={game.getRenderData(["requestButton", "onClick"])}
              >
                {game.getRenderData(["requestButton", "label"])}
              </RequestButton>

              <ActionButton
                className={game.getRenderData(
                  ["actionButton", "className"],
                  ""
                )}
                title={game.getRenderData(["actionButton", "title"], "")}
                disabled={game.getRenderData(["actionButton", "disabled"])}
                onClick={game.getRenderData(["actionButton", "onClick"])}
              >
                {game.getRenderData(["actionButton", "contents"], "")}
              </ActionButton>
              <RelLayer style={{ height: "auto" }}>
                <AutoPassTurnButton
                  disabled={!game.isStarted()}
                  value={game.customUi.get("autoPassTurn", false)}
                  onClick={() => {
                    if (game.isStarted()) {
                      game.customUi.set(
                        "autoPassTurn",
                        !game.customUi.get("autoPassTurn", false)
                      );
                    }
                  }}
                />
              </RelLayer>
            </ActionButtonWrapper>
          </div>
        </AbsLayer>
      </RelLayer>
    );

    return mySection;
  }

  renderDebugData() {
    let dumpData = {
      state: this.state,
      //
      personSelection: game.selection.people.getAll(),
      cardSelection: game.selection.cards.getAll(),
      collectionSelection: game.selection.collections.getAll(),

      cards: game.getAllCardData(),
      people: room.getAllPeopleInRoom(),
      players: game.getAllPlayers(),
      gameStatus: game.getGameStatus(),
      currentRoom: room.get(),
      drawPile: game.drawPile.get(),
      activePile: game.activePile.get(),
      discardPile: game.discardPile.get(),
      playerTurn: game.turn.get(),
      propertySets: game.getAllPropertySets(),
      //cards: this.props.cards,
      playerHands: game.getAllPlayerHandData(),
      playerBanks: game.getAllPlayerBankData(),
      playerCollections: game.getAllCollectionAssociationData(),
      collections: game.getAllCollectionData(),

      playerRequests: game.getAllPlayerRequestData(),
      requests: game.getAllRequestsData(),
      previousRequests: game.getAllPreviousRequestsData(),
    };

    return (
      <div style={{ overflow: "hidden" }}>
        {Object.keys(dumpData).map((key) => {
          let item = dumpData[key];

          return (
            <ExpansionPanel key={key}>
              <ExpansionPanelSummary>{key}</ExpansionPanelSummary>
              <ExpansionPanelDetails>
                <pre>
                  <xmp>{JSON.stringify(item, null, 2)}</xmp>
                </pre>
              </ExpansionPanelDetails>
            </ExpansionPanel>
          );
        })}
      </div>
    );
  }

  renderBackground() {
    return (
      <BlurredBackground
        blur={0}
        backgroundImage="https://images.unsplash.com/photo-1586021755075-3da0c78d4881?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=2100&q=80"
      />
    );
  }

  renderListOfUsers() {
    return (
      <List
        style={{
          display: "inline-flex",
          width: `${uiConfig.sidebar.initialSize}px`,
          maxWidth: `${uiConfig.sidebar.maxSize}px`,
          flexDirection: "column",
        }}
      >
        <ListSubheader>Users</ListSubheader>
        {game.getLobbyUsers().map((person, i) => {
          let isMe = game.isMyId(person.id);
          let personNameInput = this.state.nameInput;
          let isChangingMyName = this.state.isChangingMyName;

          let toggleEditName = () => {
            let person = game.me();
            let name = personNameInput;
            if (isDef(person)) {
              name = person.name;
            }
            this.setState({
              nameInput: name,
              isChangingMyName: !isChangingMyName,
            });
          };

          let onNameChangeConfirm = async () => {
            await game.updateMyName(personNameInput);
            toggleEditName();
          };

          let onKeyPressNameInput = (event) => {
            if (event.key === "Enter") {
              onNameChangeConfirm();
            }
          };
          let onNameChange = (event) =>
            this.setState({
              nameInput: event.target.value,
            });

          let toggleEditMyName = () => {
            if (isMe) {
              toggleEditName();
            }
          };

          return (
            <PersonListItem
              key={person.name}
              name={person.name}
              isMe={isMe}
              isHost={game.person.isHost(person.id)}
              isReady={game.isPersonReady(person.id)}
              statusLabel={game.getPersonStatusLabel(person.id)}
              isEditingName={isMe && isChangingMyName}
              nameInputValue={personNameInput}
              onToggleEditName={toggleEditMyName}
              onNameChangeConfirm={onNameChangeConfirm}
              onNameKeyPress={onKeyPressNameInput}
              onNameChange={onNameChange}
            />
          );
        })}
        <Divider />
        {this.renderReadyButton()}
      </List>
    );
  }

  render() {
    //========================================
    //              GAME BOARD
    //========================================
    this.updateRender();

    return (
      <DndProvider backend={Backend}>
        <FillContainer>
          <FillHeader>
            <AppBar position="static">
              <Toolbar>
                <h5
                  style={{ padding: "12px" }}
                  onClick={() => room.leaveRoom()}
                >
                  Room <strong>{room.getCode()}</strong>
                </h5>
              </Toolbar>
            </AppBar>
          </FillHeader>

          <FillContent>
            <RelLayer>
              <AbsLayer>{this.renderBackground()}</AbsLayer>
              <SplitterLayout
                customClassName="people_list"
                primaryIndex={1}
                primaryMinSize={0}
                secondaryInitialSize={uiConfig.sidebar.initialSize}
                secondaryMinSize={uiConfig.sidebar.minSize}
                secondaryMaxSize={uiConfig.sidebar.maxSize}
              >
                {/*-------------- RENDER LIST OF USERS -------------------*/}
                <div
                  style={{
                    backdropFilter: "blur(15px)",
                    backgroundColor: "#ffffff85",
                    height: "100%",
                  }}
                >
                  {this.renderListOfUsers()}
                </div>
                <RelLayer>
                  <GrowPanel>
                    <SplitterLayout
                      percentage
                      primaryIndex={1}
                      primaryMinSize={0}
                      secondaryInitialSize={0}
                      secondaryMinSize={0}
                    >
                      {this.renderDebugData()}
                      {/*################################################*/}
                      {/*                   GAME BOARD                   */}
                      {/*################################################*/}
                      <RelLayer>
                        <VSplitterDragIndicator />
                        {/*----------------------------------------------*/}
                        {/*                 Game content                 */}
                        {/*----------------------------------------------*/}
                        <AbsLayer style={{ color: "white" }}>
                          <RelLayer>
                            <SplitterLayout
                              customClassName="game_area"
                              vertical
                              secondaryInitialSize={uiConfig.myArea.initialSize}
                            >
                              {/* Players collections */}
                              <RelLayer>
                                {game.getRenderData("gameboard")}
                                <HSplitterDragIndicator />
                                {game.getRenderData("turnNotice")}
                              </RelLayer>

                              {/* My Area */}
                              <RelLayer>
                                <AbsLayer>{this.renderMyArea()}</AbsLayer>
                              </RelLayer>
                            </SplitterLayout>
                          </RelLayer>
                        </AbsLayer>
                      </RelLayer>
                      {/* End Game board ________________________________*/}
                    </SplitterLayout>
                  </GrowPanel>
                </RelLayer>
              </SplitterLayout>
            </RelLayer>
          </FillContent>
        </FillContainer>
      </DndProvider>
    );
  }
}

const mapStateToProps = (state) => ({
  roomCode: state.rooms.currentRoom ? state.rooms.currentRoom.code : null,
  currentRoom: state.rooms.currentRoom,
  myId: state.people.myId,
  host: state.people.host,
  people: state.people.items,
  personOrder: state.people.order,
  getAllPeople: () => {
    return state.people.order.map((personId) => state.people.items[personId]);
  },
  ...gameGetters(state),
});
const mapDispatchToProps = {
  ...roomActions,
  ...peopleActions,
  ...gameActions,
};
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GameUI));
