import React, { useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { isDef, isArr, isFunc, getNestedValue } from "../../utils/";

import BlurredPanel from "../panels/BlurredPanel";
import Button from "@material-ui/core/Button";
import AbsLayer from "../layers/AbsLayer";
import RelLayer from "../layers/RelLayer";
import Typography from "@material-ui/core/Typography";
import "react-splitter-layout/lib/index.css";
import { Flex, FlexRow, FlexColumn } from "../Flex";

import FillContainer from "../fillContainer/FillContainer";
import FillContent from "../fillContainer/FillContent";
import FillFooter from "../fillContainer/FillFooter";

// Cards
import RenderInteractableCard from "../RenderInteractableCard";

import ActionBar from "../formUi/ActionBar";

import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import DropZone from "../dragNDrop/DropZone";

const emptyFunc = () => {};
const PayRequestScreen = ({
  myId,
  requestIds = [],
  getRequest = emptyFunc,
  game,
  getCard,
  sumCardValuesFn = emptyFunc,
  myBankCardIds = [],
  myCollectionIds = {},
  getPersonTransferBankCardIds = emptyFunc,
  getConfirmedTransferBankCardIds = emptyFunc,
  getPersonTransferPropertyCardIds = emptyFunc,
  getConfirmedPersonTransferPropertyCardIds = emptyFunc,
  getCardIdsforCollection = emptyFunc,
  onAcceptRequest = emptyFunc,
  onDeclineRequest = emptyFunc,
  canDeclineRequest = emptyFunc,
  propertySetsKeyed,
  onCardClick = emptyFunc,
  onCardDrop = emptyFunc,
  onClose = emptyFunc,
  getPerson = emptyFunc,
}) => {
  let collectionScaledPercent = 30;
  let collectionScaledPercentHover = 45;

  let isAllClosed = true;
  let requestKeyed = {};
  let varifiedRequests = [];
  requestIds.forEach((requestId) => {
    let request = getRequest(requestId);
    if (isDef(request)) {
      varifiedRequests.push(requestId);
      requestKeyed[requestId] = request;

      if (!request.isClosed) {
        isAllClosed = false;
      }
    }
  });

  let buttons = (
    <Button
      disabled={!isAllClosed}
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
      <DndProvider backend={Backend} style={{ width: "100%" }}>
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
                              Incomming Requests
                            </Typography>

                            {/* Collections */}
                            <FlexColumn style={{ width: "100%" }}>
                              {/* show newest requests first */}
                              {varifiedRequests.map((requestId) => {
                                let request = getRequest(requestId);
                                let personId = getNestedValue(
                                  request,
                                  "targetKey",
                                  0
                                );
                                let personInfo = getPerson(personId);

                                let isResolved = false;
                                let statusLabel;
                                switch (request.status) {
                                  case "accept":
                                    statusLabel = "Accepted";
                                    isResolved = true;
                                    break;
                                  case "decline":
                                    statusLabel = "Declined";
                                    isResolved = true;
                                    break;
                                  default:
                                    statusLabel = "Open";
                                }

                                if (request.isClosed) {
                                  statusLabel = "Collected";
                                }

                                let description = request.description;

                                let personName = getNestedValue(
                                  personInfo,
                                  ["name"],
                                  "Unnamed"
                                );
                                let actionCardId = getNestedValue(
                                  request,
                                  ["payload", "actionCardId"],
                                  null
                                );
                                let actionCard = isDef(actionCardId)
                                  ? game.card.get(actionCardId)
                                  : null;

                                let acceptDropType = "MY_CARD";
                                let dropProps = {
                                  is: "request",
                                  requestId,
                                };

                                // Render Accept / decline request
                                return (
                                  <DropZone
                                    key={requestId}
                                    style={{ width: "100%" }}
                                    accept={acceptDropType}
                                    onDrop={onCardDrop}
                                    dropProps={dropProps}
                                  >
                                    <FlexRow
                                      style={{
                                        margin: "4px",
                                        backgroundColor: "#00000026",
                                        padding: "20px",
                                      }}
                                    >
                                      <FlexColumn>
                                        <Flex
                                          style={{
                                            minWidth: "100px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <RenderInteractableCard
                                            card={actionCard}
                                            propertySetMap={propertySetsKeyed}
                                          />
                                        </Flex>
                                      </FlexColumn>
                                      <FlexColumn>
                                        <Flex
                                          style={{
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          {personName}
                                        </Flex>
                                        <Flex
                                          style={{
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          {description}
                                        </Flex>
                                        <FlexColumn
                                          style={{
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          {statusLabel}
                                        </FlexColumn>
                                      </FlexColumn>
                                      {!isResolved ? (
                                        <Flex
                                          style={{
                                            flexWrap: "wrap",
                                            flexGrow: 1,
                                            margin: "0px 20px",
                                            alignItems: "center",
                                            justifyContent: "center",
                                          }}
                                        >
                                          <Button
                                            color="primary"
                                            style={{
                                              margin: "4px",
                                              height: "fit-content",
                                            }}
                                            variant="contained"
                                            onClick={() => {
                                              if (isFunc(onAcceptRequest)) {
                                                onAcceptRequest({ requestId });
                                              }
                                            }}
                                          >
                                            Accept
                                          </Button>
                                          <Button
                                            color="primary"
                                            style={{
                                              margin: "4px",
                                              height: "fit-content",
                                            }}
                                            variant="contained"
                                            disabled={
                                              !canDeclineRequest(requestId)
                                            }
                                            onClick={() => {
                                              console.log(
                                                "onDeclineRequest isFunc",
                                                isFunc(onDeclineRequest)
                                              );
                                              if (
                                                isFunc(onDeclineRequest) &&
                                                !canDeclineRequest(requestId)
                                              ) {
                                                onDeclineRequest({ requestId });
                                              }
                                            }}
                                          >
                                            Decline
                                          </Button>
                                        </Flex>
                                      ) : (
                                        ""
                                      )}
                                    </FlexRow>
                                  </DropZone>
                                );
                              })}
                            </FlexColumn>
                          </FlexColumn>
                        </FillContent>
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
      </DndProvider>
    </AbsLayer>
  );
};

export default PayRequestScreen;
