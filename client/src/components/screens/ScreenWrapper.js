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
  FullFlexRow,
} from "../Flex";

import FillContainer from "../fillContainer/FillContainer";
import FillContent from "../fillContainer/FillContent";
import FillFooter from "../fillContainer/FillFooter";

import ActionBar from "../formUi/ActionBar";

import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";

const ScreenWrapper = ({ title, children, buttons }) => {
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
                              Requests
                            </Typography>
                            <FlexColumn style={{ width: "100%", flexGrow: 1 }}>
                              {children}
                            </FlexColumn>
                          </FlexColumn>
                        </FillContent>
                      </FillContainer>
                    </BlurredPanel>
                  </FlexRow>
                </FillContent>
                {isDef(buttons) ? (
                  <FillFooter
                    height={50}
                    style={{ textAlign: "right", display: "flex" }}
                  >
                    {buttons}
                  </FillFooter>
                ) : (
                  ""
                )}
              </FillContainer>
              <ActionBar />
            </RelLayer>
          </div>
        </div>
      </DndProvider>
    </AbsLayer>
  );
};

export default ScreenWrapper;
