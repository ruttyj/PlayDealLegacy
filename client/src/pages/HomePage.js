import React from "react";

import { withRouter } from "react-router";
import CssBaseline from "@material-ui/core/CssBaseline";
import Drawer from "@material-ui/core/Drawer";
import Box from "@material-ui/core/Box";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import Badge from "@material-ui/core/Badge";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import NotificationsIcon from "@material-ui/icons/Notifications";
import MiniDrawer from "../components/drawers/MiniDrawer";
import FancyButton from "../components/buttons/FancyButton";
import UserOptions from "./Home/UserOptions";
import { motion } from "framer-motion";
import RelLayer from "../components/layers/RelLayer";
import AbsLayer from "../components/layers/AbsLayer";

import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";

import FillContainer from "../components/fillContainer/FillContainer";
import FillHeader from "../components/fillContainer/FillHeader";
import FillContent from "../components/fillContainer/FillContent";
import FillFooter from "../components/fillContainer/FillFooter";

import BaseComponent from "../components/base/BaseComponent";

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
} from "../components/Flex";

import Header from "../components/Header";
import FeaturedPost from "../components/FeaturedPost";

import { makeStyles } from "@material-ui/core/styles";
import pluralize from "pluralize";
import {
  els,
  isFunc,
  isDef,
  isDefNested,
  isArr,
  getNestedValue,
} from "../utils/";

import sounds from "../assets/sounds";
import { deepOrange, green, grey } from "@material-ui/core/colors";

// Socket related
import { connect } from "react-redux";
import roomActions from "../App/actions/roomActions";
import StateBuffer from "../App/buffers/StateBuffer";
import "react-splitter-layout/lib/index.css";
const uiConfig = {};

import MainFeaturedPost from "../components/FeaturedPost";

const FullFlexGrow = ({ children, style = {} }) => {
  return (
    <Flex
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        flexGrow: "1",
        ...style,
      }}
    >
      {children}
    </Flex>
  );
};

const HeaderTitle = ({ children, style = {}, variant = "h4" }) => (
  <Typography
    style={{ textAlign: "center", ...style }}
    variant={variant}
    gutterBottom
  >
    {children}
  </Typography>
);

const mainFeaturedPost = {
  title: "Title of a longer featured blog post",
  description:
    "Multiple lines of text that form the lede, informing new readers quickly and efficiently about what's most interesting in this post's contents.",
  image: "https://source.unsplash.com/random",
  imgText: "main image description",
  linkText: "Continue reading…",
};

const sections = [
  { title: "Technology", url: "#" },
  { title: "Design", url: "#" },
  { title: "Culture", url: "#" },
  { title: "Business", url: "#" },
  { title: "Politics", url: "#" },
  { title: "Opinion", url: "#" },
  { title: "Science", url: "#" },
  { title: "Health", url: "#" },
  { title: "Style", url: "#" },
  { title: "Travel", url: "#" },
];

class HomePage extends BaseComponent {
  constructor(props, context) {
    super(props, context);

    // Get Socket
    this.io = props.clientSocket;

    this.history = this.props.history;

    let bindFuncs = [];
    bindFuncs.forEach((funcName) => {
      this[funcName] = this[funcName].bind(this);
    });

    this.init();
  }

  async init() {
    this.set("count", 1);
    this.set("mode", "choose");
    let response = await this.props.listAllRooms(this.io);
    if (isDef(response) && response.status === "success") {
      let payload = response.payload;
      this.set("room", payload);
    }
  }

  render() {
    const self = this;

    function goToRoom(roomCode) {
      self.history.push(`/room/${roomCode}`);
    }

    function handleCreateRoom() {
      let roomCode = self.get(["customRoomCode", "value"], "");
      if (isDef(roomCode) && roomCode.length > 1) {
        goToRoom(roomCode);
      }
    }

    let chooseOptionContent = "";
    if (self.is("mode", "choose")) {
      chooseOptionContent = (
        <FullFlexRowCenter>
          <FancyButton
            variant="secondary"
            onClick={() => self.set("mode", "browse")}
          >
            Browse Room
          </FancyButton>
          <FancyButton onClick={() => self.set("mode", "create")}>
            Create Room
          </FancyButton>
        </FullFlexRowCenter>
      );
    }

    const transition = {
      duration: 0.15,
      ease: [0.43, 0.13, 0.23, 0.96],
    };

    const imageVariants = {
      exit: { y: "50%", opacity: 0, transition },
      enter: {
        y: "0%",
        opacity: 1,
        transition,
      },
    };

    const loaderVariants = {
      exit: { opacity: 1, transition },
      enter: {
        opacity: 1,
        transition: {
          duration: 0.05,
          ease: [0.43, 0.13, 0.23, 0.96],
        },
      },
    };

    const loaderWrapperVariants = {
      exit: { opacity: 1, transition },
      enter: {
        opacity: 0,
        transition: {
          duration: 1,
          ease: [0.43, 0.13, 0.23, 0.96],
        },
      },
    };

    const backVariants = {
      exit: { y: -100, opacity: 0, transition },
      enter: { y: 0, opacity: 1, transition: { delay: 1, ...transition } },
    };

    // Room Lists
    let browseRoomContent = "";
    if (self.is("mode", "browse")) {
      browseRoomContent = (
        <FullFlexColumnCenter style={{ width: "100%" }}>
          <FullFlexColumnCenter style={{ width: "100%" }}>
            <RelLayer style={{ width: "100%", height: "100%" }}>
              <AbsLayer>
                <motion.div
                  variants={loaderWrapperVariants}
                  style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  initial="exit"
                  animate="enter"
                  exit="exit"
                >
                  <CircularProgress />
                </motion.div>
              </AbsLayer>
              <FullFlexColumnCenter style={{ width: "100%" }}>
                <HeaderTitle>Browse Rooms</HeaderTitle>
                {self.map(["room", "order"], (code) => {
                  let room = self.get(["room", "items", code]);
                  return (
                    <motion.div
                      key={code}
                      variants={backVariants}
                      style={{ color: "white", width: "100%" }}
                      initial="exit"
                      animate="enter"
                      exit="exit"
                    >
                      <motion.div
                        style={{
                          transition: "all 150ms linear",
                          ...(self.is(["itemHover", code])
                            ? { transform: "scale(1)" }
                            : { transform: "scale(0.97)" }),
                        }}
                        onHoverStart={() => {
                          self.set(["itemHover", code], true);
                        }}
                        onHoverEnd={() => {
                          self.set(["itemHover", code], false);
                        }}
                      >
                        <FlexRow
                          style={{
                            border: "2px solid #dcdada",
                            backgroundColor: "white",
                            colo: "white",
                            color: "black",
                            borderRadius: "20px",
                            margin: "10px",
                            padding: "20px",
                          }}
                        >
                          <FlexCenter
                            style={{ fontSize: "30px", padding: "20px" }}
                          >
                            {code}
                          </FlexCenter>
                          <Flex style={{ flexGrow: 1 }}>
                            <pre>
                              <xmp>{JSON.stringify(room, null, 2)}</xmp>
                            </pre>
                          </Flex>
                          <FlexCenter>
                            <FancyButton onClick={() => goToRoom(code)}>
                              Join
                            </FancyButton>
                          </FlexCenter>
                        </FlexRow>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </FullFlexColumnCenter>
            </RelLayer>
          </FullFlexColumnCenter>

          <FullFlexRowCenter>
            <FancyButton
              variant="secondary"
              onClick={() => self.set("mode", "choose")}
            >
              Back
            </FancyButton>
          </FullFlexRowCenter>
        </FullFlexColumnCenter>
      );
    }

    // Create room
    let createRoomContent = "";
    if (self.is("mode", "create")) {
      let field = "customRoomCode";
      createRoomContent = (
        <FullFlexGrow>
          <HeaderTitle>Create Room</HeaderTitle>
          <FullFlexRowCenter>
            <TextField
              label="Code"
              variant="outlined"
              error={self.get([field, "hasError"], false)}
              helperText={self.get([field, "errorMessage"], null)}
              value={self.get([field, "value"], "")}
              onChange={(event) => {
                let value = String(event.target.value)
                  .trim()
                  .replace(/[^A-Za-z0-9_]/g, "")
                  .toUpperCase();
                let hasError = false;
                let errorMessage = "";
                if (value.length > 10) {
                  value = value.substring(0, 10);
                  hasError = true;
                  errorMessage = "Must be under 10 chars long.";
                }
                self.set([field, "hasError"], hasError);
                if (hasError) {
                  self.set([field, "errorMessage"], errorMessage);
                } else {
                  self.set([field, "errorMessage"], null);
                }
                self.set([field, "value"], value);
              }}
              onKeyPress={(event) => {
                if (event.key === "Enter") {
                  handleCreateRoom();
                }
              }}
            />
          </FullFlexRowCenter>
          <FullFlexRowCenter>
            <FancyButton
              variant="secondary"
              onClick={() => self.set("mode", "choose")}
            >
              Back
            </FancyButton>
            <FancyButton onClick={handleCreateRoom}>Create</FancyButton>
          </FullFlexRowCenter>
        </FullFlexGrow>
      );
    }

    return (
      <div>
        <CssBaseline />
        <FillContainer>
          <FillHeader>
            <Header sections={sections} />
          </FillHeader>
          <FillContent>
            <main
              className={"main_content"}
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                flexGrow: "1",
              }}
            >
              <Container
                maxWidth="lg"
                style={{
                  height: "100%",
                  width: "100%",
                  display: "flex",
                  flexGrow: "1",
                }}
              >
                <Grid
                  container
                  spacing={3}
                  style={{
                    height: "100%",
                    width: "100%",
                    display: "flex",
                    flexGrow: "1",
                  }}
                >
                  {/* Chart */}
                  <Grid
                    item
                    xs={12}
                    md={12}
                    lg={12}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <motion.div
                      style={{
                        width: "100%",
                        padding: "15px",
                      }}
                    >
                      <motion.div invertScale>
                        <FullFlexColumnCenter style={{ width: "100%" }}>
                          {chooseOptionContent}
                          {browseRoomContent}
                          {createRoomContent}
                        </FullFlexColumnCenter>
                      </motion.div>
                    </motion.div>
                  </Grid>
                </Grid>
              </Container>
            </main>
          </FillContent>
        </FillContainer>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  roomCode: state.rooms.currentRoom ? state.rooms.currentRoom.code : null,
  currentRoom: state.rooms.currentRoom,
});
const mapDispatchToProps = {
  ...roomActions,
};
export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(HomePage)
);
