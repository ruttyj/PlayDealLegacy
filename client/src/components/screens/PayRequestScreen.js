import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { isDef, isArr, els, getNestedValue } from "../../utils/";

import BlurredPanel from "../panels/BlurredPanel";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import AbsLayer from "../layers/AbsLayer";
import RelLayer from "../layers/RelLayer";
import Typography from "@material-ui/core/Typography";
import ScaleCard from "../cards/ScaleCard";
import "react-splitter-layout/lib/index.css";
import { Flex, FlexRow, FlexColumn, FlexCenter } from "../Flex";

import FillContainer from "../fillContainer/FillContainer";
import FillContent from "../fillContainer/FillContent";
import FillHeader from "../fillContainer/FillHeader";
import FillFooter from "../fillContainer/FillFooter";

import BlurredWrapper from "../../packages/ReactWindows/Components/Containers/BlurredWrapper";

// Cards
import RenderCard from "../RenderCard";
import RenderInteractableCard from "../RenderInteractableCard";

import CurrencyText from "../cards/elements/CurrencyText";

import PropertySetContainer from "../panels/playerPanel/PropertySetContainer";
import ActionBar from "../formUi/ActionBar";
import sounds from "../../assets/sounds";
import "./PayRequestScreen.scss";
import grey from "@material-ui/core/colors/grey";
const darkGreyButtonStyle = { backgroundColor: grey[900], color: "white" };
const darkGreyButtonStyleSelected = {
  backgroundColor: grey[800],
  color: "white",
};

const PayRequestScreen = ({
  game,
  requestId,
  actionCardId = 0,
  augmentCardIds = [],
  actionCollectionId = [],
  getPerson,
  getRequest,
  cardSelection,
  amountRemaining = 0,
  bankCardIds = [],
  collectionIds = [],
  getCollectionCardIds,
  propertySetsKeyed,
  onCancel = () => {},
  onConfirm = () => {},
  getCard = () => {},
}) => {
  const [isHovered, _setIsHovered] = useState(false);
  function setIsHovered(val) {
    if (val) {
      sounds.buttonHover.play();
    }
    _setIsHovered(val);
  }
  function playClickSound(disabled) {
    if (disabled) {
      sounds.buttonDisabled.play();
    } else {
      sounds.buttonClick.play();
    }
  }

  let request = getRequest(requestId);
  let authorId = isDef(request) ? request.authorKey : null;
  let author = isDef(authorId) ? getPerson(authorId) : null;
  let authorName = isDef(author) ? author.name : "Derp";
  let actionCardScalePercent = 50;
  let actionCardScalePercentHover = 90;
  let augmentCardScalePercent = 30;
  let augmentCardScalePercentHover = 50;
  let collectionScaledPercent = 25;
  let collectionScaledPercentHover = 45;

  let bankScaledPercent = 45;
  let bankScaledPercentHover = 70;

  let getCardValue = (cardId) => getCard(cardId).value;

  function getSelectedSum() {
    return cardSelection.selected
      .get()
      .reduce((result, cardId) => result + getCardValue(cardId), 0);
  }

  function checkIsMoreNeeded() {
    return getSelectedSum() >= amountRemaining;
  }

  let sumSelected = getSelectedSum();
  let noMoreNeeded = checkIsMoreNeeded();
  let isConfirmDisabled =
    false &&
    !(
      cardSelection.selected.isAllSelected() ||
      noMoreNeeded ||
      cardSelection.selectable.count() === 0
    );

  let noItemsAvailable = (
    <div className={"no-content"}>
      <div className={"message"}>No items available</div>
    </div>
  );

  // BANK ====================================
  // cache the card data - sort by value
  let cardsKeyed = {};
  let bankCardsContents = [];
  bankCardIds.forEach((cardId) => {
    let card = getCard(cardId);
    cardsKeyed[cardId] = card;
  });
  bankCardIds.sort((cardIdA, cardIdB) => {
    let valueA = getNestedValue(cardsKeyed, [cardIdA, "value"], 0);
    let valueB = getNestedValue(cardsKeyed, [cardIdB, "value"], 0);
    return valueA - valueB;
  });
  if (bankCardIds.length > 0) {
    bankCardIds.forEach((cardId) => {
      let appendConent = `${cardsKeyed[cardId].value}M`;

      bankCardsContents.push(
        <RenderInteractableCard
          overlap="10px"
          key={cardId}
          card={cardsKeyed[cardId]}
          append={appendConent}
          propertySetMap={propertySetsKeyed}
          selectionEnabled={cardSelection.isEnabled()}
          isSelectable={cardSelection.selectable.has(cardId)}
          selectType={cardSelection.getType()}
          isSelected={cardSelection.selected.has(cardId)}
          notApplicable={noMoreNeeded && !cardSelection.selected.has(cardId)}
          onSelected={() => {
            if (!cardSelection.selected.has(cardId)) {
              sounds.quietAcceptChime.play();
            } else {
              sounds.putBack.play();
            }
            cardSelection.selected.toggle(cardId);
          }}
          scaledPercent={bankScaledPercent}
          hoverPercent={bankScaledPercentHover}
        />
      );
    });
  } else {
    bankCardsContents = noItemsAvailable;
  }

  let bankContents = (
    <FlexColumn style={{ width: "100%", flexGrow: 0 }}>
      <Flex>
        <Typography variant="h6" gutterBottom>
          Bank
        </Typography>
      </Flex>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "20px",
          alignItems: "flex-end",
          flexGrow: 1,
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        {bankCardsContents}
      </div>
    </FlexColumn>
  );

  // COLLECTIONS ====================================

  let filteredCardMap = new Map();
  collectionIds.map((collectionId) => {
    let filteredCardIds = [];
    let cardIds = getCollectionCardIds(collectionId);
    cardIds.map((cardId) => {
      let card = getCard(cardId);
      if (isDef(card.value) && card.value > 0) {
        filteredCardIds.push(cardId);
      }
    });
    if (filteredCardIds.length > 0) {
      filteredCardMap.set(collectionId, filteredCardIds);
    }
  });

  let collectionContents = "";
  let collectionInnerContents = "";
  if (filteredCardMap.size > 0) {
    collectionInnerContents = collectionIds.map((collectionId) => {
      let cardIds = getCollectionCardIds(collectionId);

      let filteredCards = [];
      cardIds.map((cardId) => {
        let card = getCard(cardId);
        if (isDef(card.value) && card.value > 0) {
          filteredCards.push(cardId);
        }
      });

      let returnContents = "";
      if (filteredCards.length > 0) {
        returnContents = (
          <PropertySetContainer
            key={collectionId}
            transparent={true}
            collectionId={collectionId}
            selectionEnabled={false}
            isSelectable={false}
            isSelected={false}
            isFull={false}
            cards={filteredCards.map((cardId) => {
              let card = getCard(cardId);
              let appendConent = `${card.value}M`;

              return (
                <RenderInteractableCard
                  key={cardId}
                  card={getCard(cardId)}
                  append={appendConent}
                  propertySetMap={propertySetsKeyed}
                  selectionEnabled={cardSelection.isEnabled()}
                  isSelectable={cardSelection.selectable.has(cardId)}
                  selectType={cardSelection.getType()}
                  isSelected={cardSelection.selected.has(cardId)}
                  notApplicable={
                    noMoreNeeded && !cardSelection.selected.has(cardId)
                  }
                  onSelected={() => {
                    if (!cardSelection.selected.has(cardId)) {
                      sounds.quietAcceptChime.play();
                    } else {
                      sounds.putBack.play();
                    }
                    cardSelection.selected.toggle(cardId);
                  }}
                  scaledPercent={collectionScaledPercent}
                  hoverPercent={collectionScaledPercentHover}
                />
              );
            })}
          />
        );
      }
      return returnContents;
    });
  } else {
    collectionInnerContents = noItemsAvailable;
  }

  collectionContents = (
    <FlexColumn style={{ width: "100%", flexGrow: 0 }}>
      <Flex>
        <Typography variant="h6" gutterBottom>
          Property
        </Typography>
      </Flex>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "20px",
          flexWrap: "wrap",
        }}
      >
        {collectionInnerContents}
      </div>
    </FlexColumn>
  );

  return (
    <AbsLayer>
      <div style={{ width: "100%", height: "100%", padding: "10px" }}>
        <BlurredWrapper>
          <div
            style={{
              backgroundColor: "#000000a1",
              width: "100%",
              height: "100%",
              overflow: "auto",
            }}
          >
            <RelLayer>
              <FillContainer>
                <FillContent>
                  <FlexRow
                    style={{
                      width: "100%",
                      height: "100%",
                      padding: "40px 25px 20px 25px",
                    }}
                  >
                    <FlexColumn
                      style={{
                        alignItems: "center",
                        width: "50%",
                        padding: "40px",
                      }}
                    >
                      <FlexColumn
                        style={{ alignItems: "center", width: "100%" }}
                      >
                        <FlexRow
                          style={{ fontSize: "25px", marginBottom: "20px" }}
                        >{`Pay ${authorName}`}</FlexRow>
                        <FlexColumn
                          style={{
                            fontSize: "25px",
                            alignItems: "center",
                            marginBottom: "20px",
                          }}
                        >
                          <div style={{ fontSize: "15px" }}>Amount</div>
                          <div>
                            <CurrencyText fontSizeEm={1}>
                              {amountRemaining}
                            </CurrencyText>
                          </div>
                        </FlexColumn>
                        <FlexColumn
                          style={{
                            fontSize: "25px",
                            alignItems: "center",
                            marginBottom: "20px",
                          }}
                        >
                          <div style={{ fontSize: "15px" }}>Value selected</div>
                          <div>
                            <CurrencyText fontSizeEm={1}>
                              {sumSelected}
                            </CurrencyText>
                          </div>
                        </FlexColumn>
                      </FlexColumn>
                    </FlexColumn>
                    <BlurredPanel style={{ width: "100%" }}>
                      {/* ----------------- MAIN WINDOW ----------------- */}
                      <FlexColumn style={{ width: "100%" }}>
                        {bankContents}
                        {collectionContents}
                      </FlexColumn>
                    </BlurredPanel>
                  </FlexRow>
                </FillContent>
                <FillFooter height={50} style={{ textAlign: "right" }}>
                  <Button
                    color="primary"
                    style={{ margin: "4px" }}
                    variant="contained"
                    onClick={(e) => {
                      playClickSound(false);
                      onCancel(e);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    disabled={isConfirmDisabled}
                    color="primary"
                    style={{ margin: "4px" }}
                    variant="contained"
                    onClick={(e) => {
                      playClickSound(isConfirmDisabled);
                      onConfirm({
                        responseKey: "accept",
                        cardIds: cardSelection.selected.get(),
                      });
                    }}
                  >
                    Confirm
                  </Button>
                </FillFooter>
              </FillContainer>
              <ActionBar />
            </RelLayer>
          </div>
        </BlurredWrapper>
      </div>
    </AbsLayer>
  );
};

export default PayRequestScreen;
