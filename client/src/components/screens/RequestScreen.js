import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  els,
  isDef,
  isArr,
  isFunc,
  getNestedValue,
  setNestedValue,
  makeTree,
} from "../../utils/";

import BlurredPanel from "../panels/BlurredPanel";
import Button from "@material-ui/core/Button";
import AbsLayer from "../layers/AbsLayer";
import RelLayer from "../layers/RelLayer";
import Typography from "@material-ui/core/Typography";
import "react-splitter-layout/lib/index.css";
import {
  Flex,
  FlexRow,
  FlexColumn,
  FlexCenter,
  FullFlexCenter,
  FullFlexColumn,
  FullFlexColumnCenter,
  FullFlexRow,
} from "../Flex";

import FillContainer from "../fillContainer/FillContainer";
import FillContent from "../fillContainer/FillContent";
import FillFooter from "../fillContainer/FillFooter";

// Cards
import RenderInteractableCard from "../RenderInteractableCard";

import ActionBar from "../formUi/ActionBar";

import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import DropZone from "../dragNDrop/DropZone";

import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import SwapHorizIcon from "@material-ui/icons/SwapHoriz";
import ErrorOutlineIcon from "@material-ui/icons/ErrorOutline";

import LandscapeIcon from "@material-ui/icons/Landscape";
import ApartmentIcon from "@material-ui/icons/Apartment";
import CollectionsBookmarkIcon from "@material-ui/icons/CollectionsBookmark";
import CropPortraitIcon from "@material-ui/icons/CropPortrait";
import FilterListIcon from "@material-ui/icons/FilterList";
import PropertySetContainer from "../panels/playerPanel/PropertySetContainer";
import Menu from "@material-ui/core/Menu";

import ScreenWrapper from "./ScreenWrapper.js";
import makeMockRequests from "./mock/requests";
import AutoButton from "../buttons/AutoButton";
import AutoMenuItem from "../buttons/AutoMenuItem";

import sounds from "../../assets/sounds";
import grey from "@material-ui/core/colors/grey";
import gameActions from "../../App/actions/gameActions";
const darkGreyButtonStyle = { backgroundColor: grey[900], color: "white" };
const darkGreyButtonStyleSelected = {
  backgroundColor: grey[800],
  color: "white",
};

const emptyFunc = () => {};

const MyButton = ({
  disabled = false,
  children,
  style = {},
  onClick = emptyFunc,
}) => {
  const [isHovered, _setIsHovered] = useState(false);
  function setIsHovered(val) {
    if (val) {
      sounds.buttonHover.play();
    }
    _setIsHovered(val);
  }
  function handleOnClick(e) {
    e.persist();
    if (disabled) {
      sounds.buttonDisabled.play();
    } else {
      sounds.buttonClick.play();
    }
    onClick(e);
  }

  return (
    <Button
      disabled={disabled}
      color="primary"
      style={{ margin: "4px", height: "fit-content", ...style }}
      variant="contained"
      onClick={handleOnClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Button>
  );
};

const MyFullButton = ({
  disabled = false,
  children,
  style = {},
  onClick = emptyFunc,
}) => {
  const [isHovered, _setIsHovered] = useState(false);
  function setIsHovered(val) {
    if (val) {
      sounds.buttonHover.play();
    }
    _setIsHovered(val);
  }
  function handleOnClick(e) {
    e.persist();
    if (disabled) {
      sounds.buttonDisabled.play();
    } else {
      sounds.buttonClick.play();
    }
    onClick(e);
  }
  return (
    <Button
      disabled={disabled}
      color="primary"
      style={{ height: "100%", margin: "4px", ...style }}
      variant="contained"
      onClick={handleOnClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </Button>
  );
};

const DisplayRequest = ({
  children,
  accept = "MY_CARD",
  onDrop = emptyFunc,
  dropProps = {},
}) => {
  return (
    <DropZone
      style={{ width: "100%" }}
      accept={accept}
      onDrop={onDrop}
      dropProps={dropProps}
    >
      <FlexRow
        style={{
          flexGrow: 1,
          margin: "4px",
          backgroundColor: "#00000026",
          padding: "20px",
          width: "100%",
          overflow: "auto",
        }}
      >
        {children}
      </FlexRow>
    </DropZone>
  );
};

const AcceptOrDecline = ({
  requestId,
  onAcceptRequest,
  canDeclineRequest,
  onDeclineRequest,
  declineCardId = 0,
}) => {
  return (
    <Flex
      style={{
        flexWrap: "wrap",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <MyButton
        onClick={() => {
          if (isFunc(onAcceptRequest)) {
            onAcceptRequest({ requestId, responseKey: "accept" });
          }
        }}
      >
        Accept
      </MyButton>
      {canDeclineRequest(requestId) && (
        <MyButton
          disabled={!canDeclineRequest(requestId)}
          onClick={() => {
            if (isFunc(onDeclineRequest) && canDeclineRequest(requestId)) {
              onDeclineRequest({
                requestId,
                cardId: declineCardId,
                responseKey: "decline",
              });
            }
          }}
        >
          Decline
        </MyButton>
      )}
    </Flex>
  );
};

function RenderRequestCards({
  requestId,
  getCard,
  defaultScale = 30,
  hoverScale = 60,
  propertySetsKeyed,
  cardIds,
  collectedCardIds,
  is,
  onCardClick,
}) {
  let overlap = "5px";

  return (
    <FullFlexCenter style={{ flexWrap: "wrap", flexGrow: 1, margin: "0px" }}>
      {cardIds.map((cardId) => {
        let card = getCard(cardId);
        return (
          <RenderInteractableCard
            style={collectedCardIds.includes(cardId) ? { opacity: 0.2 } : {}}
            overlap={overlap}
            key={cardId}
            card={card}
            propertySetMap={propertySetsKeyed}
            scaledPercent={defaultScale}
            hoverPercent={hoverScale}
            onClick={(...args) => {
              onCardClick(...args);
            }}
            clickProps={{
              is: is,
              cardId: cardId,
              requestId: requestId,
            }}
            dragProps={{
              is: is,
              cardId: cardId,
              requestId: requestId,
              type: "MY_CARD",
              from: "request",
            }}
          />
        );
      })}
    </FullFlexCenter>
  );
}

let TypeHeader = ({ children }) => {
  return (
    <FlexCenter style={{ padding: "2px", width: "100%" }}>
      <FlexCenter
        style={{ width: "100%", backgroundColor: "#00000030", padding: "10px" }}
      >
        {children}
      </FlexCenter>
    </FlexCenter>
  );
};

const RequestScreen = (props) => {
  // Filter menu related
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  //---------------------------------------------

  let mRenderData = {};
  let renderData = makeTree(mRenderData);

  // ==============================================

  //                    PROPS

  // ==============================================
  let { thisPersonId, game } = props;
  let { propertySetsKeyed } = props;
  let { canDeclineRequest } = props;
  let { onDeclineRequest, onAcceptRequest } = props;
  let {
    getRequests,
    getCard,
    getCollectionCardIds,
    getPerson,
    getRequestDeclineCard,
  } = props;
  let {
    onClickCollect = emptyFunc,
    onClickAutoCollect = emptyFunc,
    onPropertyClick = emptyFunc,
    onBankClick = emptyFunc,
    onCollectionClick = emptyFunc,
    onCardDrop = emptyFunc,
  } = props;
  let {
    isFilteringMineDefault = false,
    isFilteringMeTargetDefault = false,
    isFilteringMeReceiveDefault = false,
    isFilteringMeGivenDefault = false,
    isFilteringOpenDefault = false,
  } = props;

  let requests = getRequests();
  requests = isArr(requests) ? requests : [];
  // ==============================================

  //                    STATE

  // ==============================================

  let [isFilteringMine, setIsFilteringMine] = useState(isFilteringMineDefault);
  let [isFilteringMeTarget, setIsFilteringMeTarget] = useState(
    isFilteringMeTargetDefault
  );
  let [isFilteringMeReceive, setIsFilteringMeReceive] = useState(
    isFilteringMeReceiveDefault
  );
  let [isFilteringMeGiven, setIsFilteringMeGiven] = useState(
    isFilteringMeGivenDefault
  );
  let [isFilteringOpen, setIsFilteringOpen] = useState(isFilteringOpenDefault);

  // ==============================================

  //                  BUTTONS

  // ==============================================

  renderData.set(["buttons", "toggleIsFilteringMine"], {
    label: (
      <>
        <FilterListIcon />
        {` Mine`}
      </>
    ),
    style: isFilteringMine ? darkGreyButtonStyleSelected : darkGreyButtonStyle,
    onClick() {
      setIsFilteringMine(!isFilteringMine);
    },
  });

  renderData.set(["buttons", "toggleIsFilteringMeTarget"], {
    label: (
      <>
        <FilterListIcon />
        {` Incomming`}
      </>
    ),
    style: isFilteringMeTarget
      ? darkGreyButtonStyleSelected
      : darkGreyButtonStyle,
    onClick() {
      setIsFilteringMeTarget(!isFilteringMeTarget);
    },
  });

  renderData.set(["buttons", "toggleIsFilteringMeReceive"], {
    label: (
      <>
        <FilterListIcon />
        {` Receiving`}
      </>
    ),
    style: isFilteringMeReceive
      ? darkGreyButtonStyleSelected
      : darkGreyButtonStyle,
    onClick() {
      setIsFilteringMeReceive(!isFilteringMeReceive);
    },
  });

  renderData.set(["buttons", "toggleIsFilteringMeGiven"], {
    label: (
      <>
        <FilterListIcon />
        {` Giving`}
      </>
    ),
    style: isFilteringMeGiven
      ? darkGreyButtonStyleSelected
      : darkGreyButtonStyle,
    onClick() {
      setIsFilteringMeGiven(!isFilteringMeGiven);
    },
  });

  renderData.set(["buttons", "toggleIsFilteringOpen"], {
    label: (
      <>
        <FilterListIcon />
        {` Open`}
      </>
    ),
    style: isFilteringOpen ? darkGreyButtonStyleSelected : darkGreyButtonStyle,
    onClick() {
      setIsFilteringOpen(!isFilteringOpen);
    },
  });

  // ==============================================

  //               RENDER REQUESTS

  // ==============================================
  let renderedRequests = requests
    .map((request) => {
      let result = "";
      let acceptDropType = "MY_CARD";

      let requestId = request.id;
      let requestType = request.type;
      let requestStatus = request.status;
      let requestPayload = request.payload;

      let authorId = request.authorKey;
      let targetId = request.targetKey;

      let amIAuthor = thisPersonId === authorId;
      let amITarget = thisPersonId === targetId;

      let isRelatedToMe = amIAuthor || amITarget;

      let author = getPerson(authorId);
      let target = getPerson(targetId);

      let actionCardId = game.request.getActionCardId(requestId);
      let actionCard = getCard(actionCardId);

      let isClosed = request.isClosed;
      let isGood = request.hasTargetSatisfied;
      let requestDeclineCardId = getRequestDeclineCard(requestId);

      let fromAuthorName = amIAuthor ? "I" : getNestedValue(author, "name");
      let fromTargetName = amITarget ? "I" : getNestedValue(target, "name");
      let targetName = amITarget ? "ME" : getNestedValue(target, "name");
      let fromAuthorPossesive = amIAuthor
        ? "my"
        : `${getNestedValue(author, "name")}'s`;

      let authorGiveItems = getNestedValue(
        requestPayload,
        ["transaction", "items", "fromAuthor", "items"],
        {}
      );
      let authorGivePropertyIds = getNestedValue(
        authorGiveItems,
        ["property", "items"],
        []
      );
      let authorGiveBankIds = getNestedValue(
        authorGiveItems,
        ["bank", "items"],
        []
      );
      let authorGiveCollectionIds = getNestedValue(
        authorGiveItems,
        ["collection", "items"],
        []
      );
      authorGiveItems = null;
      let isAuthorGiving =
        authorGivePropertyIds.length > 0 ||
        authorGiveBankIds.length > 0 ||
        authorGiveCollectionIds.length > 0;

      let targetGiveItems = getNestedValue(
        requestPayload,
        ["transaction", "items", "fromTarget", "items"],
        {}
      );
      let targetGivePropertyIds = getNestedValue(
        targetGiveItems,
        ["property", "items"],
        []
      );
      let targetGiveBankIds = getNestedValue(
        targetGiveItems,
        ["bank", "items"],
        []
      );
      let targetGiveCollectionIds = getNestedValue(
        targetGiveItems,
        ["collection", "items"],
        []
      );
      targetGiveItems = null;
      let isTargetGiving =
        targetGivePropertyIds.length > 0 ||
        targetGiveBankIds.length > 0 ||
        targetGiveCollectionIds.length > 0;

      // Author =============
      // collect
      let toAuthorItems = getNestedValue(
        requestPayload,
        ["transaction", "items", "toAuthor", "items"],
        {}
      );
      let authorCollectPropertyIds = getNestedValue(
        toAuthorItems,
        ["property", "items"],
        []
      );
      let authorCollectBankIds = getNestedValue(
        toAuthorItems,
        ["bank", "items"],
        []
      );
      let authorCollectCollectionIds = getNestedValue(
        toAuthorItems,
        ["collection", "items"],
        []
      );
      // collected
      let authorCollectedPropertyIds = getNestedValue(
        toAuthorItems,
        ["property", "transfered"],
        []
      );
      let authorCollectedBankIds = getNestedValue(
        toAuthorItems,
        ["bank", "transfered"],
        []
      );
      let authorCollectedCollectionIds = getNestedValue(
        toAuthorItems,
        ["collection", "transfered"],
        []
      );
      toAuthorItems = null;

      // Target =============
      // collect
      let toTargetItems = getNestedValue(
        requestPayload,
        ["transaction", "items", "toTarget", "items"],
        {}
      );
      let targetCollectPropertyIds = getNestedValue(
        toTargetItems,
        ["property", "items"],
        []
      );
      let targetCollectBankIds = getNestedValue(
        toTargetItems,
        ["bank", "items"],
        []
      );
      let targetCollectCollectionIds = getNestedValue(
        toTargetItems,
        ["collection", "items"],
        []
      );
      // collected
      let targetCollectedPropertyIds = getNestedValue(
        toTargetItems,
        ["property", "transfered"],
        []
      );
      let targetCollectedBankIds = getNestedValue(
        toTargetItems,
        ["bank", "transfered"],
        []
      );
      let targetCollectedCollectionIds = getNestedValue(
        toTargetItems,
        ["collection", "transfered"],
        []
      );
      toTargetItems = null;

      let givenPropertyIds = amIAuthor
        ? authorGivePropertyIds
        : amITarget
        ? targetGivePropertyIds
        : [];
      let givenBankIds = amIAuthor
        ? authorGiveBankIds
        : amITarget
        ? targetGiveBankIds
        : [];
      let givenCollectionIds = amIAuthor
        ? authorGiveCollectionIds
        : amITarget
        ? targetGiveCollectionIds
        : [];
      let iHaveGiven =
        givenPropertyIds.length > 0 ||
        givenBankIds.length > 0 ||
        givenCollectionIds.length > 0;

      //Property
      let iCanCollectPropertyIds = amIAuthor
        ? authorCollectPropertyIds
        : amITarget
        ? targetCollectPropertyIds
        : [];
      let iCollectedPropertyIds = amIAuthor
        ? authorCollectedPropertyIds
        : amITarget
        ? targetCollectedPropertyIds
        : [];

      //Bank
      let iCanCollectBankIds = amIAuthor
        ? authorCollectBankIds
        : amITarget
        ? targetCollectBankIds
        : [];
      let iCollectedBankIds = amIAuthor
        ? authorCollectedBankIds
        : amITarget
        ? targetCollectedBankIds
        : [];

      //Collection
      let iCanCollectCollectionIds = amIAuthor
        ? authorCollectCollectionIds
        : amITarget
        ? targetCollectCollectionIds
        : [];
      let iCollectedCollectionIds = amIAuthor
        ? authorCollectedCollectionIds
        : amITarget
        ? targetCollectedCollectionIds
        : [];

      let iCanCollect =
        iCanCollectPropertyIds.length !== iCollectedPropertyIds.length ||
        iCanCollectBankIds.length !== iCollectedBankIds.length ||
        iCanCollectCollectionIds.length !== iCollectedCollectionIds.length;

      let iHaveReceived =
        iCanCollectPropertyIds.length > 0 ||
        iCanCollectBankIds.length > 0 ||
        iCanCollectCollectionIds.length > 0;
      let iCanAcknowledgeNothing =
        !iHaveReceived && amIAuthor && isGood && !isClosed;
      let iCanAcceptOrDecline = !isClosed && !isGood && amITarget;

      let isMineFilter = !isFilteringMine || (isFilteringMine && isRelatedToMe);
      let isMeTargetFilter =
        !isFilteringMeTarget || (isFilteringMeTarget && amITarget);
      let isMeReceiveFilter =
        !isFilteringMeReceive || (isFilteringMeReceive && iHaveReceived);
      let isMeGivenFilter =
        !isFilteringMeGiven || (isFilteringMeGiven && iHaveGiven);
      let isOpenFilter = !isFilteringOpen || (isFilteringOpen && !isClosed);

      let passesFilters =
        isMineFilter &&
        isMeTargetFilter &&
        isMeReceiveFilter &&
        isMeGivenFilter &&
        isOpenFilter;

      if (passesFilters) {
        //let haveICollected = false;
        //let canTheyCollect = true;
        //let haveTheyToCollected = false;

        let isTense = amITarget ? "am" : "is";
        let hasTense = amITarget ? "have" : "has";
        let desireTense = amITarget ? "wants" : "want";
        let translateStatus = (status) => {
          switch (status) {
            case "accept":
              return (
                <>
                  {hasTense}
                  <span style={{ margin: "0px 0px 0px 5px", color: "lime" }}>
                    {" Accepted"}
                  </span>
                </>
              );
            case "decline":
              return (
                <>
                  {hasTense}
                  <span style={{ margin: "0px 0px 0px 5px", color: "red" }}>
                    {" Declined"}
                  </span>
                </>
              );
            default:
              return `${hasTense} Responded`;
          }
        };

        let requestStatusContent = "";

        if (!isGood) {
          let nudgeContents = null;
          if (!amITarget) {
            let callback = () => {
              game.sounds.annoying_excuse_me.play(); 
              game.sendPrivateSound(targetId, "annoying_excuse_me");
            }
            nudgeContents = <div><br/><div style={{cursor: "pointer"}} onClick={callback}>Nudge 🗣</div></div>;
          }

          requestStatusContent = (
            <FullFlexColumnCenter
              style={{ minWidth: "200px" }}
            >
              {`${fromTargetName} ${isTense} responding...`}
              {nudgeContents}
            </FullFlexColumnCenter>
          );
        } else {
          requestStatusContent = (
            <FullFlexCenter style={{ flexGrow: 1, minWidth: "200px" }}>
              {`${fromTargetName} `}
              {translateStatus(requestStatus)}
            </FullFlexCenter>
          );
        }

        let targetGivePropertyContent = "";
        let targetGiveBankContent = "";
        let targetGiveCollectionContent = "";

        if (isTargetGiving) {
          if (targetGivePropertyIds.length > 0) {
            targetGivePropertyContent = (
              <FullFlexColumn>
                <RenderRequestCards
                  is="property"
                  requestId={requestId}
                  getCard={getCard}
                  propertySetsKeyed={propertySetsKeyed}
                  onCardClick={onPropertyClick}
                  cardIds={targetGivePropertyIds}
                  collectedCardIds={authorCollectedPropertyIds}
                />
              </FullFlexColumn>
            );
          }

          if (targetGiveBankIds.length > 0) {
            targetGiveBankContent = (
              <FullFlexColumn>
                <RenderRequestCards
                  is="property"
                  requestId={requestId}
                  getCard={getCard}
                  propertySetsKeyed={propertySetsKeyed}
                  onCardClick={onPropertyClick}
                  cardIds={targetGiveBankIds}
                  collectedCardIds={authorCollectedBankIds}
                />
              </FullFlexColumn>
            );
          }

          if (targetGiveCollectionIds.length > 0) {
            targetGiveCollectionContent = (
              <FullFlexColumn>
                {targetGiveCollectionIds.map((collectionId) => {
                  return (
                    <RenderRequestCards
                      key={collectionId}
                      is="collection"
                      requestId={requestId}
                      getCard={getCard}
                      propertySetsKeyed={propertySetsKeyed}
                      onCardClick={onPropertyClick}
                      cardIds={getCollectionCardIds(collectionId)}
                      collectedCardIds={authorCollectedBankIds}
                    />
                  );
                })}
              </FullFlexColumn>
            );
          }
        }

        let authorGivePropertyContent = "";
        let authorGiveBankContent = "";
        let authorGiveCollectionContent = "";

        if (isTargetGiving) {
          if (authorGivePropertyIds.length > 0) {
            authorGivePropertyContent = (
              <FullFlexColumn>
                <RenderRequestCards
                  is="property"
                  requestId={requestId}
                  getCard={getCard}
                  propertySetsKeyed={propertySetsKeyed}
                  onCardClick={onPropertyClick}
                  cardIds={authorGivePropertyIds}
                  collectedCardIds={authorCollectedPropertyIds}
                />
              </FullFlexColumn>
            );
          }

          if (authorGiveBankIds.length > 0) {
            authorGiveBankContent = (
              <FullFlexColumn>
                <RenderRequestCards
                  is="property"
                  requestId={requestId}
                  getCard={getCard}
                  propertySetsKeyed={propertySetsKeyed}
                  onCardClick={onPropertyClick}
                  cardIds={authorGiveBankIds}
                  collectedCardIds={[]}
                />
              </FullFlexColumn>
            );
          }

          if (authorGiveCollectionIds.length > 0) {
            authorGiveCollectionContent = (
              <FullFlexColumn>
                {authorGiveCollectionIds.map((collectionId) => {
                  return (
                    <RenderRequestCards
                      key={collectionId}
                      is="collection"
                      requestId={requestId}
                      getCard={getCard}
                      propertySetsKeyed={propertySetsKeyed}
                      onCardClick={onPropertyClick}
                      cardIds={getCollectionCardIds(collectionId)}
                      collectedCardIds={[]}
                    />
                  );
                })}
              </FullFlexColumn>
            );
          }
        }

        let acceptOrDeclineContent = "";
        if (iCanAcceptOrDecline) {
          acceptOrDeclineContent = (
            <AcceptOrDecline
              requestId={requestId}
              onAcceptRequest={onAcceptRequest}
              canDeclineRequest={canDeclineRequest}
              onDeclineRequest={onDeclineRequest}
              declineCardId={requestDeclineCardId}
            />
          );
        }

        let collectPropertyContent = "";
        let collectBankContent = "";
        let collectCollectionContent = "";

        if (iCanCollectPropertyIds.length > 0) {
          collectPropertyContent = (
            <FullFlexColumn>
              <TypeHeader>Property</TypeHeader>
              <RenderRequestCards
                is="property"
                requestId={requestId}
                getCard={getCard}
                propertySetsKeyed={propertySetsKeyed}
                onCardClick={onPropertyClick}
                cardIds={iCanCollectPropertyIds}
                collectedCardIds={iCollectedPropertyIds}
              />
            </FullFlexColumn>
          );
        }

        if (iCanCollectBankIds.length > 0) {
          collectBankContent = (
            <FullFlexColumn>
              <TypeHeader>Bank</TypeHeader>
              <RenderRequestCards
                is="bank"
                requestId={requestId}
                getCard={getCard}
                propertySetsKeyed={propertySetsKeyed}
                onCardClick={onBankClick}
                cardIds={iCanCollectBankIds}
                collectedCardIds={iCollectedBankIds}
              />
            </FullFlexColumn>
          );
        }

        if (iCanCollectCollectionIds.length > 0) {
          collectCollectionContent = (
            <FullFlexColumn>
              <TypeHeader>Collection</TypeHeader>

              <FullFlexColumn>
                {iCanCollectCollectionIds.map((collectionId) => {
                  return (
                    <RenderRequestCards
                      key={collectionId}
                      is="collection"
                      requestId={requestId}
                      getCard={getCard}
                      propertySetsKeyed={propertySetsKeyed}
                      onCardClick={onPropertyClick}
                      cardIds={getCollectionCardIds(collectionId)}
                      collectedCardIds={[]}
                    />
                  );
                })}
              </FullFlexColumn>
            </FullFlexColumn>
          );
        }

        let givePropertyContent = "";
        let giveBankContent = "";
        let giveCollectionContent = "";

        if (givenPropertyIds.length > 0) {
          givePropertyContent = (
            <FullFlexColumn>
              <TypeHeader>Property</TypeHeader>
              <RenderRequestCards
                is="property"
                requestId={requestId}
                getCard={getCard}
                propertySetsKeyed={propertySetsKeyed}
                onCardClick={onPropertyClick}
                cardIds={givenPropertyIds}
                collectedCardIds={givenPropertyIds}
              />
            </FullFlexColumn>
          );
        }

        if (givenBankIds.length > 0) {
          giveBankContent = (
            <FullFlexColumn>
              <TypeHeader>Bank</TypeHeader>
              <RenderRequestCards
                is="bank"
                requestId={requestId}
                getCard={getCard}
                propertySetsKeyed={propertySetsKeyed}
                onCardClick={onPropertyClick}
                cardIds={givenBankIds}
                collectedCardIds={givenBankIds}
              />
            </FullFlexColumn>
          );
        }

        if (givenCollectionIds.length > 0) {
          giveCollectionContent = (
            <FullFlexColumn>
              <TypeHeader>Collection</TypeHeader>
              <FullFlexCenter
                style={{ flexWrap: "wrap", flexGrow: 1, margin: "0px 20px" }}
              >
                <PropertySetContainer
                  selectionEnabled={false}
                  isSelectable={false}
                  transparent={true}
                  cards={givenCollectionIds.map((collectionId) => {
                    let cardIds = getCollectionCardIds(collectionId);
                    let renderedCards = cardIds.map((cardId) => {
                      let card = getCard(cardId);
                      let eventProps = {
                        type: "MY_CARD",
                        is: "collection",
                        collectionId: collectionId,
                        cardId: cardId,
                        requestId: requestId,
                        from: "request",
                      };
                      return (
                        <RenderInteractableCard
                          style={
                            givenCollectionIds.includes(cardId)
                              ? { opacity: 0.2 }
                              : {}
                          }
                          key={cardId}
                          card={card}
                          propertySetMap={propertySetsKeyed}
                          scaledPercent={20}
                          hoverPercent={20}
                          onClick={(...args) => {
                            onCollectionClick(...args);
                          }}
                          clickProps={eventProps}
                          dragProps={eventProps}
                        />
                      );
                    });
                    return <Flex key={collectionId}>{renderedCards}</Flex>;
                  })}
                />
              </FullFlexCenter>
            </FullFlexColumn>
          );
        }

        let iHaveReceivedContents = "";
        if (iHaveReceived || iCanAcknowledgeNothing) {
          iHaveReceivedContents = (
            <FullFlexColumn>
              <FullFlexColumn>
                <TypeHeader>Received</TypeHeader>
              </FullFlexColumn>
              <FullFlexRow style={{ flexGrow: 1 }}>
                {iCanAcknowledgeNothing ? (
                  <FullFlexCenter>{"Had nothing to give..."}</FullFlexCenter>
                ) : (
                  <>
                    {collectPropertyContent} {collectBankContent}{" "}
                    {collectCollectionContent}
                  </>
                )}
              </FullFlexRow>
            </FullFlexColumn>
          );
        }

        let iHaveGivenContents = "";
        if (iHaveGiven) {
          iHaveGivenContents = (
            <FullFlexColumn>
              <FullFlexColumn>
                <TypeHeader>Given</TypeHeader>
              </FullFlexColumn>
              <FullFlexRow style={{ flexGrow: 1 }}>
                {givePropertyContent}
                {giveBankContent}
                {giveCollectionContent}
              </FullFlexRow>
            </FullFlexColumn>
          );
        }

        let iCanCollectContents = "";
        if (iCanCollect || iCanAcknowledgeNothing) {
          //onClickAutoCollect
          let collectContents = (
            <MyFullButton
              onClick={() => {
                onClickCollect({ requestId, iCanCollect });
              }}
            >
              {iCanAcknowledgeNothing ? "Acknowledge" : "Manually-Collect"}
            </MyFullButton>
          );

          let autoCollectContents = "";
          if (!iCanAcknowledgeNothing) {
            autoCollectContents = (
              <MyFullButton
                onClick={() => {
                  onClickAutoCollect({
                    requestId,
                    receive: {
                      property: iCanCollectPropertyIds,
                      bank: iCanCollectBankIds,
                      collection: iCanCollectCollectionIds,
                    },
                  });
                }}
              >
                {"Collect"}
              </MyFullButton>
            );
          }

          iCanCollectContents = (
            <FullFlexColumn>
              {collectContents}
              {autoCollectContents}
            </FullFlexColumn>
          );
        }

        let resultContent = "";
        if (isClosed) {
          resultContent = (
            <FullFlexColumn>
              {requestStatusContent}
              <FlexCenter style={{ flexGrow: 1 }}>{"Is Complete"}</FlexCenter>
            </FullFlexColumn>
          );
        } else {
          if (isGood) {
            let acceptContent = "";
            if (requestStatus === "accept") {
              acceptContent = (
                <FullFlexRow>
                  {iHaveGivenContents}
                  {iHaveReceivedContents}
                  {iCanCollectContents}
                </FullFlexRow>
              );
            }

            resultContent = (
              <FullFlexColumn
                style={{
                  flexGrow: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TypeHeader>{requestStatusContent}</TypeHeader>
                {acceptContent}
              </FullFlexColumn>
            );
          } else {
            resultContent = (
              <FullFlexColumn
                style={{
                  flexGrow: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {requestStatusContent}
              </FullFlexColumn>
            );
          }
        }

        let action = "steal";
        let subject = "property";

        let iconFontSize = "large";
        let descriptor = "";

        let icons = {
          to: <ArrowBackIcon fontSize={iconFontSize} />,
          from: <ArrowForwardIcon fontSize={iconFontSize} />,
          swap: <SwapHorizIcon fontSize={iconFontSize} />,
          stop: <ErrorOutlineIcon fontSize={iconFontSize} />,
        };

        let direction = <ArrowBackIcon fontSize={iconFontSize} />;
        let augmentCardIds = [];
        switch (requestType) {
          case "collectValue":
            if (game.card.hasTag(actionCardId, "itsMyBirthday")) {
              subject = ` ${getNestedValue(requestPayload, "amountDue", 0)}M`;
              action = "collect";
              direction = amIAuthor ? icons.from : icons.to;
              descriptor = (
                <>
                  {`It's ${fromAuthorPossesive} birthday!`}
                  <br />
                  {`${
                    amITarget ? "You" : targetName
                  } give them ${subject} as a gift!`}
                </>
              );
            } else if (game.card.hasTag(actionCardId, "rent")) {
              subject = ` ${getNestedValue(requestPayload, "amountDue", 0)}M`;
              action = "collect";
              direction = amIAuthor ? icons.from : icons.to;
              descriptor = (
                <>
                  {`${fromAuthorName} charges you rent!`}
                  <br />
                  {`${
                    amITarget ? "You" : targetName
                  } ${hasTense} to pay them ${subject}.`}
                </>
              );
            } else {
              subject = ` ${getNestedValue(
                requestPayload,
                "amountDue",
                0
              )}M in funds`;
              action = "collect";
              direction = amIAuthor ? icons.from : icons.to;
              descriptor = `${fromAuthorName} ${desireTense} to ${action} ${subject} from ${
                amITarget ? "you" : targetName
              } `;
            }

            augmentCardIds = getNestedValue(
              requestPayload,
              "augmentCardIds",
              []
            );
            break;
          case "stealCollection":
            subject = "collection";
            action = "steal";
            direction = amIAuthor ? icons.from : icons.to;
            descriptor = `${fromAuthorName} ${desireTense} to ${action} ${
              amITarget ? "your" : targetName + "'s"
            } ${subject}`;
            break;
          case "stealProperty":
            subject = "property";
            action = "steal";
            direction = amIAuthor ? icons.from : icons.to;
            descriptor = `${fromAuthorName} ${desireTense} to ${action} ${
              amITarget ? "your" : targetName + "'s"
            } ${subject}`;
            break;
          case "swapProperty":
            subject = "properties";
            action = "swap";
            direction = icons.swap;
            descriptor = `${fromAuthorName} ${desireTense} to ${action} ${subject} with ${
              amITarget ? "you" : targetName
            }`;
            break;
          case "justSayNo":
            subject = "no";
            action = "said";
            direction = icons.stop;
            descriptor = `${fromAuthorName} ${action} ${subject} to ${
              amITarget ? "you" : targetName
            }`;
            break;
          default:
        }

        let augmentCardContent = "";
        if (augmentCardIds.length > 0) {
          augmentCardContent = (
            <FlexColumn style={{ width: "100px" }}>
              <RenderRequestCards
                is="augment"
                defaultScale={20}
                hoverScale={90}
                requestId={requestId}
                getCard={getCard}
                propertySetsKeyed={propertySetsKeyed}
                onCardClick={onPropertyClick}
                cardIds={augmentCardIds}
                collectedCardIds={[]}
              />
            </FlexColumn>
          );
        }

        let defaultStyle = {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        };
        let actionDescriptionContent = (
          <>
            <FlexColumn style={{ ...defaultStyle, minWidth: "200px" }}>
              {descriptor}
            </FlexColumn>
          </>
        );

        let transferedContent = (
          <FlexColumn
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FlexColumn
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {actionDescriptionContent}
            </FlexColumn>
            <FullFlexRow
              style={{
                display: "flex",
                paddingTop: "20px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FullFlexRow
                style={{
                  display: "flex",
                  flexGrow: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {authorGivePropertyContent}
                {authorGiveBankContent}
                {authorGiveCollectionContent}
              </FullFlexRow>
              <FullFlexRow
                style={{
                  display: "flex",
                  flexGrow: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {direction}
              </FullFlexRow>
              <FullFlexRow
                style={{
                  display: "flex",
                  flexGrow: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {targetGivePropertyContent}
                {targetGiveBankContent}
                {targetGiveCollectionContent}
              </FullFlexRow>
            </FullFlexRow>
          </FlexColumn>
        );

        let dropProps = {
          is: "request",
          requestId: requestId,
        };
        result = (
          <DisplayRequest
            key={requestId}
            accept={acceptDropType}
            onDrop={onCardDrop}
            dropProps={dropProps}
          >
            <FlexCenter
              style={{ minWidth: `${100 + 50 * augmentCardIds.length}px` }}
            >
              <RenderInteractableCard
                card={actionCard}
                propertySetMap={propertySetsKeyed}
                style={{ margin: 0 }}
              />
              {augmentCardContent}
            </FlexCenter>
            {transferedContent}
            {resultContent}
            {acceptOrDeclineContent}
          </DisplayRequest>
        );
      }
      return result;
    })
    .filter((exists) => exists);

  let requestContent;
  if (renderedRequests.length > 0) {
    requestContent = renderedRequests;
  } else {
    requestContent = (
      <FullFlexCenter style={{ flexGrow: 1 }}>
        No requests to display.
      </FullFlexCenter>
    );
  }

  return (
    <ScreenWrapper
      title={
        <Typography variant="h5" gutterBottom>
          Requests
        </Typography>
      }
    >
      <FullFlexColumn style={{ flexGrow: 1 }}>{requestContent}</FullFlexColumn>
    </ScreenWrapper>
  );
};

export default RequestScreen;
