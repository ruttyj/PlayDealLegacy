import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { isDef, isArr, isFunc, getNestedValue } from "../../utils/";

import BlurredPanel from "../panels/BlurredPanel";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import Button from "@material-ui/core/Button";
import grey from "@material-ui/core/colors/grey";
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

import DragItem from "../dragNDrop/DragItem";
import DropZone from "../dragNDrop/DropZone";

// Cards
import RenderCard from "../RenderCard";
import RenderInteractableCard from "../RenderInteractableCard";

import CurrencyText from "../cards/elements/CurrencyText";

import PropertySetContainer from "../panels/playerPanel/PropertySetContainer";
import ActionBar from "../formUi/ActionBar";

const darkGreyButtonStyle = { backgroundColor: grey[900], color: "white" };
const darkGreyButtonStyleSelected = {
  backgroundColor: grey[800],
  color: "white",
};

const emptyFunc = () => {};
const ReceivePaymentScreen = ({
  myId,
  requestIds = [],
  getRequest = emptyFunc,
  getCard,
  sumCardValuesFn = emptyFunc,
  myBankCardIds = [],
  myCollectionIds = {},
  getPersonTransferBankCardIds = emptyFunc,
  getConfirmedTransferBankCardIds = emptyFunc,
  getPersonTransferPropertyCardIds = emptyFunc,
  getConfirmedPersonTransferPropertyCardIds = emptyFunc,

  getPersonTransferCollectionIds = emptyFunc,
  getConfirmedPersonTransferCollectionIds = emptyFunc,
  getCardIdsforCollection = emptyFunc,

  onConfirmEmptyRequest = emptyFunc,
  propertySetsKeyed,
  onCardClick = emptyFunc,
  onCollectionClick = emptyFunc,
  onCardDrop = emptyFunc,
  onClose = emptyFunc,
  getPerson = emptyFunc,
}) => {
  let collectionScaledPercent = 30;
  let collectionScaledPercentHover = 45;

  let buttons = (
    <Button
      color="primary"
      style={{ margin: "4px" }}
      variant="contained"
      onClick={onClose}
    >
      Close
    </Button>
  );

  return (
    <AbsLayer>
      <div style={{ width: "100%", height: "100%", padding: "10px" }}>
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
                  <BlurredPanel style={{ width: "100%" }}>
                    <FillContainer>
                      <FillContent>
                        <FlexColumn style={{ width: "100%" }}>
                          <Typography variant="h5" gutterBottom>
                            The Loot
                          </Typography>

                          {/* Collections */}
                          <FlexColumn style={{ width: "100%" }}>
                            {/* show newest requests first */}
                            {requestIds.map((requestId) => {
                              let request = getRequest(requestId);
                              let personId = getNestedValue(
                                request,
                                "targetKey",
                                0
                              );
                              let personInfo = getPerson(personId);

                              let transferBankCardIds = getPersonTransferBankCardIds(
                                requestId
                              );
                              let confirmedTransferBankCardIds = getConfirmedTransferBankCardIds(
                                requestId
                              );
                              let transferCollectionIds = getPersonTransferCollectionIds(
                                requestId
                              );

                              let transferPropertyCardIds = getPersonTransferPropertyCardIds(
                                requestId
                              );
                              let confirmedPropertyCardIds = getConfirmedPersonTransferPropertyCardIds(
                                requestId
                              );
                              let confirmedPersonTransferCollectionIds = getConfirmedPersonTransferCollectionIds(
                                requestId
                              );

                              let personTransferCardIds = Array.from(
                                new Set([
                                  ...transferPropertyCardIds,
                                  ...transferBankCardIds,
                                ])
                              );
                              let valuePaid = sumCardValuesFn(
                                personTransferCardIds
                              );

                              let isClosed = request.isClosed;
                              let isGood = request.hasTargetSatisfied;
                              let isJustSayNo = request.type === "justSayNo";

                              let statusLabel;
                              switch (request.status) {
                                case "accept":
                                  statusLabel = "Paid";
                                  break;
                                case "decline":
                                  statusLabel = "Declined";
                                  break;
                                default:
                                  statusLabel = "Waiting";
                              }

                              if (request.isClosed) {
                                statusLabel = "Collected";
                              }

                              let personName = getNestedValue(
                                personInfo,
                                ["name"],
                                "Unnamed"
                              );

                              //collectNothingToNothing(requestId) hasNothing
                              let hasNothing =
                                transferPropertyCardIds.length === 0 &&
                                transferBankCardIds.length === 0 &&
                                transferCollectionIds.length === 0;

                              if (isJustSayNo && isClosed) return "";

                              let propertyContent = "";
                              if (transferPropertyCardIds.length > 0) {
                                propertyContent = (
                                  <Flex
                                    style={{
                                      flexWrap: "wrap",
                                      flexGrow: 1,
                                      margin: "0px 20px",
                                    }}
                                  >
                                    {transferPropertyCardIds.map((cardId) => {
                                      let card = getCard(cardId);
                                      return (
                                        <RenderInteractableCard
                                          style={
                                            confirmedPropertyCardIds.includes(
                                              cardId
                                            )
                                              ? { opacity: 0.2 }
                                              : {}
                                          }
                                          overlap="10px"
                                          key={cardId}
                                          card={card}
                                          propertySetMap={propertySetsKeyed}
                                          scaledPercent={
                                            collectionScaledPercent
                                          }
                                          hoverPercent={
                                            collectionScaledPercentHover
                                          }
                                          onClick={(...args) => {
                                            onCardClick(...args);
                                          }}
                                          clickProps={{
                                            is: "property",
                                            cardId: cardId,
                                            requestId: requestId,
                                          }}
                                          dragProps={{
                                            is: "property",
                                            cardId: cardId,
                                            requestId: requestId,
                                            type: "MY_CARD",
                                            from: "request",
                                          }}
                                        />
                                      );
                                    })}
                                  </Flex>
                                );
                              }

                              let bankContent = "";
                              if (transferBankCardIds.length > 0) {
                                bankContent = (
                                  <Flex
                                    style={{
                                      flexWrap: "wrap",
                                      flexGrow: 1,
                                      margin: "0px 20px",
                                    }}
                                  >
                                    {transferBankCardIds.map((cardId) => {
                                      let card = getCard(cardId);
                                      return (
                                        <RenderInteractableCard
                                          style={
                                            confirmedTransferBankCardIds.includes(
                                              cardId
                                            )
                                              ? { opacity: 0.5 }
                                              : {}
                                          }
                                          overlap="10px"
                                          key={cardId}
                                          card={card}
                                          propertySetMap={propertySetsKeyed}
                                          scaledPercent={
                                            collectionScaledPercent
                                          }
                                          hoverPercent={
                                            collectionScaledPercentHover
                                          }
                                          onClick={(...args) => {
                                            onCardClick(...args);
                                          }}
                                          clickProps={{
                                            is: "bank",
                                            cardId: cardId,
                                            requestId: requestId,
                                          }}
                                          dragProps={{
                                            type: "MY_CARD",
                                            is: "bank",
                                            from: "request",
                                            requestId: requestId,
                                            cardId: cardId,
                                          }}
                                        />
                                      );
                                    })}
                                  </Flex>
                                );
                              }

                              let collectionContent = "";
                              if (transferCollectionIds.length > 0) {
                                collectionContent = (
                                  <Flex
                                    style={{
                                      flexWrap: "wrap",
                                      flexGrow: 1,
                                      margin: "0px 20px",
                                    }}
                                  >
                                    {transferCollectionIds.map(
                                      (collectionId) => {
                                        let cardIds = getCardIdsforCollection(
                                          collectionId
                                        );
                                        let renderedCards = cardIds.map(
                                          (cardId) => {
                                            let card = getCard(cardId);
                                            let eventProps = {
                                              is: "collection",
                                              type: "MY_CARD",
                                              cardId: cardId,
                                              requestId: requestId,
                                            };
                                            return (
                                              <RenderInteractableCard
                                                key={cardId}
                                                style={
                                                  confirmedPersonTransferCollectionIds.includes(
                                                    cardId
                                                  )
                                                    ? { opacity: 0.2 }
                                                    : {}
                                                }
                                                card={card}
                                                propertySetMap={
                                                  propertySetsKeyed
                                                }
                                                scaledPercent={20}
                                                hoverPercent={20}
                                                clickProps={eventProps}
                                                dragProps={eventProps}
                                                onClick={(...args) => {
                                                  onCardClick(...args);
                                                }}
                                              />
                                            );
                                          }
                                        );
                                        let collectionEventProps = {
                                          is: "collection",
                                          type: "COLLECTION",
                                          collectionId: collectionId,
                                          requestId: requestId,
                                          from: "request",
                                        };

                                        return (
                                          <Flex key={collectionId}>
                                            <DragItem
                                              item={collectionEventProps}
                                            >
                                              <PropertySetContainer
                                                selectionEnabled={true}
                                                isSelectable={true}
                                                transparent={true}
                                                clickProps={
                                                  collectionEventProps
                                                }
                                                dragProps={collectionEventProps}
                                                onSelected={onCollectionClick}
                                                cards={renderedCards}
                                              />
                                            </DragItem>
                                          </Flex>
                                        );
                                      }
                                    )}
                                  </Flex>
                                );
                              }

                              return (
                                <FlexRow
                                  key={requestId}
                                  style={{
                                    margin: "4px",
                                    backgroundColor: "#00000026",
                                    padding: "20px",
                                  }}
                                >
                                  <FlexColumn style={{ flexGrow: 1 }}>
                                    <Flex>{personName}</Flex>
                                    <FlexColumn>
                                      {statusLabel}
                                      <Flex>
                                        <CurrencyText fontSizeEm={1}>
                                          {valuePaid}
                                        </CurrencyText>
                                      </Flex>
                                    </FlexColumn>
                                  </FlexColumn>
                                  {propertyContent}
                                  {bankContent}
                                  {collectionContent}
                                  {!isClosed && hasNothing && isGood ? (
                                    <Flex
                                      style={{
                                        flexWrap: "wrap",
                                        flexGrow: 1,
                                        margin: "0px 20px",
                                      }}
                                    >
                                      <Button
                                        color="primary"
                                        style={{ margin: "4px" }}
                                        variant="contained"
                                        onClick={() => {
                                          if (isFunc(onConfirmEmptyRequest)) {
                                            onConfirmEmptyRequest({
                                              requestId,
                                            });
                                          }
                                        }}
                                      >
                                        Collect Nothing
                                      </Button>
                                    </Flex>
                                  ) : (
                                    ""
                                  )}
                                </FlexRow>
                              );
                            })}
                          </FlexColumn>
                        </FlexColumn>
                      </FillContent>
                      <FillFooter height={200}>
                        <FlexRow
                          style={{
                            width: "100%",
                            backgroundColor: "#00000026",
                          }}
                        >
                          <DropZone
                            style={{ width: "100%" }}
                            accept={"COLLECTION"}
                            onDrop={(...args) => {
                              onCardDrop(...args);
                            }}
                            dropProps={{
                              is: "player",
                              playerId: myId,
                            }}
                          >
                            <FlexColumn
                              style={{ alignItems: "flex-end", flexGrow: "1" }}
                            >
                              <Flex
                                style={{
                                  flexWrap: "wrap",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <div
                                  style={{
                                    display: "inline-flex",
                                    flexWrap: "wrap",
                                    marginLeft: "auto",
                                  }}
                                >
                                  <DropZone
                                    accept={"MY_CARD"}
                                    onDrop={(...args) => {
                                      onCardDrop(...args);
                                    }}
                                    dropProps={{
                                      isEmptySet: true,
                                      isCollection: true,
                                    }}
                                  >
                                    <PropertySetContainer
                                      transparent={true}
                                      cards={[]}
                                    />
                                  </DropZone>
                                </div>
                                {myCollectionIds
                                  .slice()
                                  .reverse()
                                  .map((collectionId) => {
                                    return (
                                      <div
                                        key={collectionId}
                                        style={{
                                          display: "inline-flex",
                                          marginLeft: "auto",
                                          flexWrap: "wrap",
                                        }}
                                      >
                                        <DropZone
                                          key={`collection_${collectionId}`}
                                          accept={"MY_CARD"}
                                          onDrop={(...args) => {
                                            onCardDrop(...args);
                                          }}
                                          dropProps={{
                                            isCollection: true,
                                            collectionId: collectionId,
                                          }}
                                        >
                                          <PropertySetContainer
                                            transparent={true}
                                            cards={getCardIdsforCollection(
                                              collectionId
                                            ).map((cardId) => (
                                              <RenderInteractableCard
                                                key={cardId}
                                                card={getCard(cardId)}
                                                dragProps={{
                                                  type: "MY_CARD",
                                                  collectionId: collectionId,
                                                  cardId: cardId,
                                                  from: "collection",
                                                }}
                                                propertySetMap={
                                                  propertySetsKeyed
                                                }
                                                scaledPercent={
                                                  collectionScaledPercent
                                                }
                                                hoverPercent={
                                                  collectionScaledPercentHover
                                                }
                                              />
                                            ))}
                                          />
                                        </DropZone>
                                      </div>
                                    );
                                  })}
                              </Flex>
                            </FlexColumn>
                            <FlexColumn>
                              <Flex>
                                {/* BANK */}
                                <div
                                  style={{
                                    display: "inline-flex",
                                    flexWrap: "wrap",
                                    height: "100%",
                                  }}
                                >
                                  <DropZone
                                    accept={"MY_CARD"}
                                    onDrop={(...args) => {
                                      onCardDrop(...args);
                                    }}
                                    dropProps={{
                                      isBank: true,
                                      playerId: myId,
                                    }}
                                  >
                                    <PropertySetContainer
                                      transparent={true}
                                      rotation={90}
                                      maxOffset={40}
                                      cards={myBankCardIds.map((cardId) => (
                                        <RenderInteractableCard
                                          key={cardId}
                                          card={getCard(cardId)}
                                          propertySetMap={propertySetsKeyed}
                                          scaledPercent={
                                            collectionScaledPercent
                                          }
                                          hoverPercent={
                                            collectionScaledPercentHover
                                          }
                                        />
                                      ))}
                                    />
                                  </DropZone>
                                </div>
                              </Flex>
                            </FlexColumn>
                          </DropZone>
                        </FlexRow>
                      </FillFooter>
                    </FillContainer>
                  </BlurredPanel>
                </FlexRow>
              </FillContent>
              <FillFooter height={50} style={{ textAlign: "right" }}>
                {buttons}
              </FillFooter>
            </FillContainer>
            <ActionBar />
          </RelLayer>
        </div>
      </div>
    </AbsLayer>
  );
};

export default ReceivePaymentScreen;
