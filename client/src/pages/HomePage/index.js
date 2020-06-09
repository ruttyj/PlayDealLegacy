import React from "react";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";
import CardMedia from "@material-ui/core/CardMedia";
import "./style.css";

import { createMuiTheme } from "@material-ui/core/styles";
import { ThemeProvider } from "@material-ui/styles";
import IntroContainer from "../../components/containers/IntroContainer";
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
import MiniDrawer from "../../components/drawers/MiniDrawer";
import FancyButton from "../../components/buttons/FancyButton";
import UserOptions from "./UserOptions";
import { motion } from "framer-motion";
import RelLayer from "../../components/layers/RelLayer";
import AbsLayer from "../../components/layers/AbsLayer";

import TextField from "@material-ui/core/TextField";
import CircularProgress from "@material-ui/core/CircularProgress";

import FillContainer from "../../components/fillContainer/FillContainer";
import FillHeader from "../../components/fillContainer/FillHeader";
import FillContent from "../../components/fillContainer/FillContent";
import FillFooter from "../../components/fillContainer/FillFooter";
import Scene1 from "../../components/3D/Scenes/Scene1";

import BaseComponent from "../../components/base/BaseComponent";

import createSocketConnection from "../../utils/clientSocket";

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
} from "../../components/Flex";

import Header from "../../components/Header";
import FeaturedPost from "../../components/FeaturedPost";

import { makeStyles } from "@material-ui/core/styles";
import pluralize from "pluralize";
import {
  els,
  isFunc,
  isDef,
  isDefNested,
  isArr,
  getNestedValue,
} from "../../utils/";

import sounds from "../../assets/sounds";
import { deepOrange, green, grey } from "@material-ui/core/colors";

// Socket related
import { connect } from "react-redux";
import roomActions from "../../App/actions/roomActions";
import StateBuffer from "../../App/buffers/StateBuffer";
import "react-splitter-layout/lib/index.css";
const uiConfig = {};

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

const theme = createMuiTheme({
  palette: {
    type: "dark",
  },
});

const stateBuffer = StateBuffer();
class HomePage extends BaseComponent {
  constructor(props, context) {
    super(props, context);

    // Get Socket
    this.io = createSocketConnection(
      io.connect(process.env.CONNECT, {
        secure: true,
        rejectUnauthorized: false,
      })
    );

    this.state = {
      peopleOnlineCount: 0,
    };
    this.setState = this.setState.bind(this);
    stateBuffer.setSetter(this.setState);
    this.history = this.props.history;

    let bindFuncs = ["fetchOnlineStats"];
    bindFuncs.forEach((funcName) => {
      this[funcName] = this[funcName].bind(this);
    });

    this.init();
  }

  beforeunload(e) {
    if (true) {
      console.log("beforeunload");
      e.preventDefault();
      e.returnValue = true;
      let connection = this.io;
      connection.destroy();
    }
  }
  componentWillUnmount() {
    console.log("componentWilUnmount");
    let connection = this.io;
    connection.destroy();
  }

  async fetchOnlineStats() {
    const self = this;
    let responses = await self.props.getOnlineStats(self.io);
    if (isDef(responses)) {
      let result = responses.find(
        (r) => r.subject === "CLIENTS" && r.action === "GET_ONLINE_STATS"
      );
      if (isDef(result)) {
        stateBuffer.set(
          "peopleOnlineCount",
          getNestedValue(result, ["payload", "peopleOnlineCount"], 0)
        );
      }
    }
  }

  async init() {
    this.set("mode", "choose");
    this.fetchOnlineStats();
  }

  render() {
    const self = this;

    let peopleOnlineCount = stateBuffer.get("peopleOnlineCount", 0);

    function goToRoom(roomCode) {
      self.io.destroy();
      self.history.push(`/room/${roomCode}`);
    }

    function handleCreateRoom() {
      let roomCode = self.get(["customRoomCode", "value"], "");
      if (isDef(roomCode) && roomCode.length > 1) {
        goToRoom(roomCode);
      }
    }

    const validateRoomName = (event) => {
      let field = "customRoomCode";
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
    };

    let chooseOptionContent = "";
    if (self.is("mode", "choose")) {
      let field = "customRoomCode";

      chooseOptionContent = (
        <IntroContainer
          content={
            <>
              <HeaderTitle>Join Room</HeaderTitle>
              <FullFlexRowCenter>
                <ThemeProvider theme={theme}>
                  <TextField
                    className="code_input"
                    variant="filled"
                    error={self.get(["customRoomCode", "hasError"], false)}
                    helperText={self.get(
                      ["customRoomCode", "errorMessage"],
                      null
                    )}
                    placeholder="CODE"
                    defaultValue={self.get(["customRoomCode", "value"])}
                    onChange={validateRoomName}
                    onKeyPress={(event) => {
                      if (event.key === "Enter") {
                        let roomCode = String(
                          self.get(["customRoomCode", "value"], "")
                        );
                        if (roomCode.length > 0) {
                          goToRoom(roomCode);
                        }
                      }
                    }}
                  />
                </ThemeProvider>
              </FullFlexRowCenter>
            </>
          }
          actions={
            <div>
              <FancyButton
                variant="secondary"
                onClick={() => self.set("mode", "create")}
              >
                Create
              </FancyButton>

              <FancyButton
                onClick={() => {
                  let roomCode = String(
                    self.get(["customRoomCode", "value"], "")
                  );
                  if (roomCode.length > 0) {
                    goToRoom(roomCode);
                  }
                }}
              >
                Join
              </FancyButton>
            </div>
          }
        />
      );
    }

    // Create room
    let createRoomContent = "";
    if (self.is("mode", "create")) {
      let field = "customRoomCode";
      createRoomContent = (
        <IntroContainer
          content={
            <>
              <HeaderTitle>Create Room</HeaderTitle>

              <FullFlexRowCenter>
                <ThemeProvider theme={theme}>
                  <TextField
                    className="code_input"
                    variant="filled"
                    error={self.get(["customRoomCode", "hasError"], false)}
                    helperText={self.get(
                      ["customRoomCode", "errorMessage"],
                      null
                    )}
                    placeholder="CODE"
                    defaultValue={self.get(["customRoomCode", "value"])}
                    onChange={validateRoomName}
                    onKeyPress={(event) => {
                      if (event.key === "Enter") {
                        handleCreateRoom();
                      }
                    }}
                  />
                </ThemeProvider>
              </FullFlexRowCenter>
            </>
          }
          actions={
            <div>
              <FancyButton
                variant="secondary"
                onClick={() => self.set("mode", "choose")}
              >
                Back
              </FancyButton>
              <FancyButton onClick={handleCreateRoom}>Create</FancyButton>
            </div>
          }
        />
      );
    }

    return (
      <div>
        <CssBaseline />
        <RelLayer>
          <AbsLayer>
            <Scene1 />
          </AbsLayer>

          <AbsLayer style={{ pointerEvents: "none" }}>
            <FillContainer>
              <FillHeader>
                <Header subHeader={`${peopleOnlineCount} Online`} />
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
                            <FullFlexColumnCenter
                              style={{
                                width: "100%",
                              }}
                            >
                              {chooseOptionContent}
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
          </AbsLayer>
        </RelLayer>
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
