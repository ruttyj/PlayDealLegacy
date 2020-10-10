import { motion, AnimatePresence } from "framer-motion";

import { getIsFullScreen, toggleFullScreen } from "./Logic/fullscreen";
import { withResizeDetector } from "react-resize-detector";
import { withRouter } from "react-router";
import pluralize from "pluralize";
import StateBuffer from "../../../utils/StateBuffer";
import makeSelectable from "../../../App/buffers/makeSelectable";

import "./Room.scss";
import {
  classes,
  els,
  isDef,
  isDefNested,
  isArr,
  getNestedValue,
  emptyFunc,
  setImmutableValue,
} from "../../../utils/";

import sounds from "../../../assets/sounds";

// Drag and Drop
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import DragItem from "../../../components/dragNDrop/DragItem";
import DropZone from "../../../components/dragNDrop/DropZone";
import VSplitterDragIndicator from "../../../components/indicators/VSplitterDragIndicator";
import HSplitterDragIndicator from "../../../components/indicators/HSplitterDragIndicator";

import { deepOrange, green, grey } from "@material-ui/core/colors";

// Socket related
import { connect } from "react-redux";
import roomActions from "../../../App/actions/roomActions";
import peopleActions from "../../../App/actions/peopleActions";
import gameActions from "../../../App/actions/gameActions";

import TextField from "@material-ui/core/TextField";
import Divider from "@material-ui/core/Divider";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";

import { ImmutableClassBasedObject } from "../../../utils/ReactStateTools";
import createSocketConnection from "../../../utils/clientSocket";

// Structure
import RelLayer from "../../../components/layers/RelLayer";
import AbsLayer from "../../../components/layers/AbsLayer";
import CheckLayer from "../../../components/layers/CheckLayer";
import FillContainer from "../../../components/fillContainer/FillContainer";
import FillHeader from "../../../components/fillContainer/FillHeader";
import FillContent from "../../../components/fillContainer/FillContent";
import FillFooter from "../../../components/fillContainer/FillFooter";

import GrowPanel from "../../../components/panels/GrowPanel";
import SplitterLayout from "react-splitter-layout";
import "react-splitter-layout/lib/index.css";
import {
  FlexColumn,
  FlexColumnCenter,
  FlexCenter,
  FullFlexColumnCenter,
  FlexRow,
  FlexRowCenter,
  FullFlexRow,
  FullFlexColumn,
  FullFlexGrow,
} from "../../../components/Flex";
import ShakeAnimationWrapper from "../../../components/effects/Shake";

import Accordion from "@material-ui/core/Accordion";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import AccordionDetails from "@material-ui/core/AccordionDetails";

import Avatar from "@material-ui/core/Avatar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import PulseCheckBox from "../../../components/buttons/PulseCheckBox.js";

// Cards
import BaseDealCard from "../../../components/cards/BaseDealCard";
import RenderCard from "../../../components/RenderCard";
import RenderInteractableCard from "../../../components/RenderInteractableCard";

import PlayerPanelWrapper from "../../../components/panels/playerPanel/PlayerPanelWrapper";
import PlayerPanel from "../../../components/panels/playerPanel/PlayerPanel";
import PlayerPanelTurnIndicator from "../../../components/panels/playerPanel/PlayerPanelTurnIndicator";
import PlayerPanelContent from "../../../components/panels/playerPanel/PlayerPanelContent";
import PlayerPanelNameWrapper from "../../../components/panels/playerPanel/PlayerPanelNameWrapper";
import PlayerPanelName from "../../../components/panels/playerPanel/PlayerPanelName";
import PlayerPanelActionText from "../../../components/panels/playerPanel/PlayerPanelActionText";
import PlayerPanelActionNumber from "../../../components/panels/playerPanel/PlayerPanelActionNumber";

import CollectionContainer from "../../../components/panels/playerPanel/CollectionContainer";
import PropertySetContainer from "../../../components/panels/playerPanel/PropertySetContainer";
import BankCardContainer from "../../../components/panels/playerPanel/BankCardContainer";

import TurnNotice from "../../../components/TurnNotice";
import BankWrapper from "../../../components/panels/playerPanel/BankWrapper";
import MyHandContainer from "../../../components/panels/playerPanel/MyHandContainer";
import Deck3D from "../../../components/panels/playerPanel/Deck3D";
import CurrencyText from "../../../components/cards/elements/CurrencyText";
import PileCount from "../../../components/gameUi/PileCount";

// Screens
import SCREENS from "../../../data/screens";
import PayRequestScreen from "../../../components/screens/PayRequestScreen";
import ReceivePaymentScreen from "../../../components/screens/ReceivePaymentScreen";
import RequestScreen from "../../../components/screens/RequestScreen";
import GameOverScreen from "../../../components/screens/GameOverScreen";

// Icons
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import StarBorder from "@material-ui/icons/StarBorder";
import RecordVoiceOverIcon from "@material-ui/icons/RecordVoiceOver";
import VoiceOverOffIcon from "@material-ui/icons/VoiceOverOff";
import FullscreenIcon from "@material-ui/icons/Fullscreen";
import FullscreenExitIcon from "@material-ui/icons/FullscreenExit";

// Buttons
import { ArrowToolTip } from "../../../packages/ReactWindows/Exports/Exports";

import Button from "@material-ui/core/Button";
import ActionButtonWrapper from "../../../components/buttons/actionButton/ActionButtonWrapper";
import ActionButton from "../../../components/buttons/actionButton/ActionButton";
import actionButtonContents from "../../../components/buttons/actionButton/actionButtonContents";
import AutoPassTurnButton from "../../../components/buttons/AutoPassTurnButton";
import IconButton from "@material-ui/core/IconButton";
import RequestButton from "../../../components/buttons/RequestButton";

import Game from "../../../utils/game";
import Room from "../../../utils/room";
import RoomManager from "../../../utils/roomManager";

import PersonListItem from "../../../components/game/PersonListItem/";
import { isArray } from "lodash";

import ReduxState from "../../../App/controllers/reduxState";
import CircularProgress from "@material-ui/core/CircularProgress";
import wallpapers from "../../../packages/ReactWindows/Data/Wallpapers";

////////////////////////////////////////////////////
/// Sidebar
import AppSidebar from "../../../packages/ReactWindows/Components/SideBar/";
import BlurredWrapper from "../../../packages/ReactWindows/Components/Containers/BlurredWrapper/";
import { useEffect } from "../../../packages/ReactWindows/Exports/";
import PhotoSizeSelectActualIcon from "@material-ui/icons/PhotoSizeSelectActual";
import BugReportIcon from "@material-ui/icons/BugReport";
import EmojiPeopleIcon from "@material-ui/icons/EmojiPeople";
import AddIcon from "@material-ui/icons/Add";
import PublicIcon from "@material-ui/icons/Public";
import ChatIcon from "@material-ui/icons/Chat";
import PeopleIcon from "@material-ui/icons/People";
import HomeIcon from "@material-ui/icons/Home";
import PersonIcon from "@material-ui/icons/Person";
import PeopleAltIcon from "@material-ui/icons/PeopleAlt";
////////////////////////////////////////////////////
/// WindowManager
import WindowManager from "../../../packages/ReactWindows/Utils/WindowManager";
import WindowContainer from "../../../packages/ReactWindows/Components/Containers/Windows/WindowContainer/";
import DragWindow from "../../../packages/ReactWindows/Components/Containers/Windows/DragWindow/";
import makeMyCustomComp from "../Components/Windows/MyCustomComp/Window";
import makeBackgroundPicker from "../Components/Windows/BackgroundPicker/Window";
import makeUsernamePicker from "../Components/Windows/UsernamePicker";
import makeWelcomeScreen from "../Components/Windows/InitialWindow";
import makeLobbyWindow from "../Components/Windows/LobbyWindow";

import makePlayerListWindow from "../Components/Windows/PlayerListWindow";
import makeTrooperDancingWindow from "../Components/Windows/DancingTrooper";
import createDebugWindow from "../Components/Windows/DebugWindow";

export default {
  motion,
  AnimatePresence,

  getIsFullScreen,
  toggleFullScreen,
  withResizeDetector,
  withRouter,
  pluralize,
  StateBuffer,
  makeSelectable,
  sounds,
  // Drag and Drop
  DndProvider,
  Backend,
  DragItem,
  DropZone,
  VSplitterDragIndicator,
  HSplitterDragIndicator,
  deepOrange,
  green,
  grey,
  // Socket related
  connect,
  roomActions,
  peopleActions,
  gameActions,
  TextField,
  Divider,
  AppBar,
  Toolbar,
  ImmutableClassBasedObject,
  createSocketConnection,
  // Structure
  RelLayer,
  AbsLayer,
  CheckLayer,
  FillContainer,
  FillHeader,
  FillContent,
  FillFooter,
  GrowPanel,
  SplitterLayout,
  FlexColumn,
  FlexColumnCenter,
  FlexCenter,
  FullFlexColumnCenter,
  FlexRow,
  FlexRowCenter,
  FullFlexRow,
  FullFlexColumn,
  FullFlexGrow,
  ShakeAnimationWrapper,
  Accordion,
  AccordionSummary,
  AccordionDetails,

  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  ListItemSecondaryAction,
  PulseCheckBox,

  // Cards
  BaseDealCard,
  RenderCard,
  RenderInteractableCard,

  PlayerPanelWrapper,
  PlayerPanel,
  PlayerPanelTurnIndicator,
  PlayerPanelContent,
  PlayerPanelNameWrapper,
  PlayerPanelName,
  PlayerPanelActionText,
  PlayerPanelActionNumber,

  CollectionContainer,
  PropertySetContainer,
  BankCardContainer,

  TurnNotice,
  BankWrapper,
  MyHandContainer,
  Deck3D,
  CurrencyText,
  PileCount,

  // Screens
  SCREENS,
  PayRequestScreen,
  ReceivePaymentScreen,
  RequestScreen,
  GameOverScreen,

  // Icons
  ArrowForwardIcon,
  StarBorder,
  RecordVoiceOverIcon,
  VoiceOverOffIcon,
  FullscreenIcon,
  FullscreenExitIcon,

  // Buttons
  ArrowToolTip,

  Button,
  ActionButtonWrapper,
  ActionButton,
  actionButtonContents,
  AutoPassTurnButton,
  IconButton,
  RequestButton,

  Game,
  Room,
  RoomManager,

  PersonListItem,
  isArray,

  ReduxState,
  CircularProgress,
  wallpapers,

  ////////////////////////////////////////////////////
  /// Sidebar
  AppSidebar,
  BlurredWrapper,
  useEffect,
  PhotoSizeSelectActualIcon,
  BugReportIcon,
  EmojiPeopleIcon,
  AddIcon,
  PublicIcon,
  ChatIcon,
  PeopleIcon,
  HomeIcon,
  PersonIcon,
  PeopleAltIcon,
  ////////////////////////////////////////////////////
  /// WindowManager
  WindowManager,
  WindowContainer,
  DragWindow,
  makeMyCustomComp,
  makeBackgroundPicker,
  makeUsernamePicker,
  makeWelcomeScreen,
  makeLobbyWindow,

  makePlayerListWindow,
  makeTrooperDancingWindow,
  createDebugWindow,
};
