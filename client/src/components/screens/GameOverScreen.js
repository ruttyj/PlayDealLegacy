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

import BlurredWrapper from "../../packages/ReactWindows/Components/Containers/BlurredWrapper/";
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
  FlexColumnCenter,
  FlexRowCenter,
  FlexCenter,
  FullFlexCenter,
  FullFlexColumn,
  FullFlexColumnCenter,
  FullFlexRow,
  FullFlexRowCenter,
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

import makeMockRequests from "./mock/requests";
import ScreenWrapper from "./ScreenWrapper.js";

import AutoButton from "../buttons/AutoButton";

import grey from "@material-ui/core/colors/grey";
const darkGreyButtonStyle = { backgroundColor: grey[900], color: "white" };
const darkGreyButtonStyleSelected = {
  backgroundColor: grey[800],
  color: "white",
};

const GameOverScreen = (props) => {
  let { thisPersonId, winner, winningCondition } = props;

  let winnerId = getNestedValue(winner, "id", null);

  let amIWinner = winnerId === thisPersonId;
  let winnerName = getNestedValue(winner, "name", "Someone");

  const mRenderData = {};
  let renderData = makeTree(mRenderData);

  let winnerContent = "";

  if (amIWinner) {
    winnerContent = (
      <FlexCenter>
        <Typography variant="h3" gutterBottom>
          YOU WIN!
        </Typography>
      </FlexCenter>
    );
  } else {
    winnerContent = (
      <FlexColumnCenter>
        <FlexColumnCenter>
          <Typography variant="h3" gutterBottom>
            YOU LOSE!
          </Typography>
        </FlexColumnCenter>
        <FlexColumnCenter>
          <Typography variant="h4" gutterBottom>
            {winnerName} Wins!
          </Typography>
        </FlexColumnCenter>
      </FlexColumnCenter>
    );
  }

  let mainContent = (
    <FullFlexColumnCenter>
      <Typography variant="h1" gutterBottom>
        GAME OVER
      </Typography>
      {winnerContent}
    </FullFlexColumnCenter>
  );

  let buttonContent = <></>;

  return (
    <AbsLayer>
      <DndProvider backend={Backend} style={{ width: "100%" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: "10px",
            overflow: "hidden",
          }}
        >
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
                      <BlurredPanel style={{ width: "100%" }}>
                        <FillContainer>
                          <FillContent>
                            <FlexColumn style={{ width: "100%" }}>
                              <FlexColumn
                                style={{ width: "100%", flexGrow: 1 }}
                              >
                                {mainContent}
                              </FlexColumn>
                            </FlexColumn>
                          </FillContent>
                        </FillContainer>
                      </BlurredPanel>
                    </FlexRow>
                  </FillContent>
                  {isDef(buttonContent) ? (
                    <FillFooter height={50} style={{ textAlign: "right" }}>
                      {buttonContent}
                    </FillFooter>
                  ) : (
                    ""
                  )}
                </FillContainer>
                <ActionBar />
              </RelLayer>
            </div>
          </BlurredWrapper>
        </div>
      </DndProvider>
    </AbsLayer>
  );
};

export default GameOverScreen;
/*
<pre>
          <xmp style={{ color: "white" }}>{JSON.stringify(requests, null, 2)}</xmp>
        </pre>
*/
