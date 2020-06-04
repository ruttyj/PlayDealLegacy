import React from "react";
import { Redirect } from "react-router-dom";
import { getNestedValue } from "../utils/objectMethods";
import { isUndef, isDef, isTrue, isFalse } from "../utils/";

import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import LinearProgress from "@material-ui/core/LinearProgress";
import TextField from "@material-ui/core/TextField";
import Chat from "../components/Chat";
import BlurredBackground from "../components/BlurredBackground";
import PrimaryButton from "../components/PrimaryButton";
import Avatar from "@material-ui/core/Avatar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";

export default class Room extends React.Component {
  //======================================================

  //                    Constructor

  //======================================================
  constructor(props, context) {
    super(props, context);

    this.state = {
      userNameInput: "Guest",
      user: null,
      users: null,
      userStatuses: null,
      isMounted: false,
      isRegisterInProcess: false,
      room: null,
      roomChatHistory: null,
    };

    const self = this;

    this.topPlayerNum = 0;

    this.getClientSocket = () => {
      return props.clientSocket;
    };

    this.getRoomName = () => {
      return props.roomName;
    };

    this.getRoomCode = () => {
      return props.roomName;
    };

    this.getRoomImage = () => {};

    this.doMount = async () => {
      this.setState({
        isMounted: true,
      });
      /*
      this.getClientSocket().registerUpdateStatusHandler(response => {
        let status = response.getStatus();
        if (status === "success") {
          let payload = response.getPayload();

          this.setState({
            userStatuses: payload
          });
        }
      });
      */
    };

    this.getUserStatus = (user) => {
      let userKey = user.key;
      let statuses = this.getMemberStatuses();
      if (isDef(statuses[userKey])) return statuses[userKey];
      return undefined;
    };

    this.translateUserStatus = (userStatus) => {
      if (userStatus === "ready") {
        return "Ready";
      }
      return "Not Ready";
    };

    this.readyUpToggle = () => {
      /*
      let thisUserKey = this.state.user;
      let currentStatus = this.getUserStatus(thisUserKey);

      let updateTo;
      if (currentStatus === "ready") {
        updateTo = "notReady";
      } else {
        updateTo = "ready";
      }

      this.getClientSocket().updateStatus(this.getRoomCode(), updateTo);
      */
    };
    this.getMemberStatuses = () => {
      if (isDef(this.state.userStatuses)) return this.state.userStatuses;
      return {};
    };

    this.getRoomPath = (roomName) => {
      return `/Room/${roomName}`;
    };

    // Get router props from route
    // Important: setRouterPropsRef(props) must be called in every route
    this.getRouterHistory = () => {
      return props.routerHistory;
    };

    //===============================================

    //                Game Room Methods

    //===============================================
    this.register = (name) => {
      /*
      this.setState({ isRegisterInProcess: true });
      return this.getClientSocket().register(name, reponse => {
        let status = reponse.getStatus();
        let user = reponse.getPayload();
        if (status === "success") {
          self.setState({ isRegisterInProcess: false, user });
        }
      });
      */
    };

    this.isProcessingRegistration = () => {
      return this.state.isRegisterInProcess;
    };

    this.hasRoomChatHistory = () => {
      return isDef(this.state.roomChatHistory);
    };

    this.getRoomChatHistory = () => {
      return isDef(this.state.roomChatHistory)
        ? this.state.roomChatHistory
        : [];
    };

    this.setChatHistory = (chatHistory) => {
      this.setState({
        roomChatHistory: chatHistory,
      });
    };

    this.getRoom = () => {
      if (this.state.room) return this.state.room;
      return null;
    };

    this.setRoom = (room) => {
      this.setState({
        room: room,
      });
    };

    this.isRoomLoaded = () => {
      return isDef(this.getRoom());
    };

    this.loadRoomInfoByCode = (desiredRoomCode) => {
      /*
      this.getClientSocket().pingRoom(desiredRoomCode, pingResponse => {
        let payload = pingResponse.getPayload();
        let status = pingResponse.getStatus();
        if (status === "success") {
          this.setRoom(payload.room);
          this.getClientSocket().joinRoom(desiredRoomCode, joinResponse => {
            let payload = joinResponse.getPayload();
            let status = joinResponse.getStatus();
            if (status === "success") {
              let { roomCode, chatHistory } = payload;
              console.log("payload", payload);
              if (roomCode === this.getRoomCode()) {
                self.setChatHistory(chatHistory);
              }
            } else {
              console.log("joinRoom failure TODO");
            }
          });
        } else {
          console.log("pingRoom failure TODO");
        }
      });
      */
    };
    this.onLeaveRoom = (roomName, leaveCallback) => {
      /*
      return this.getClientSocket().leaveRoom(roomName, leaveCallback);
      */
    };

    // Join Room input
    this.getInputString = () => {
      return String(this.state.userNameInput);
    };

    this.getInputStringLength = () => {
      return this.getInputString().length;
    };

    this.onUsernameInput = (e) => {
      this.setState({ userNameInput: e.target.value });
    };

    this.onSubmit = (e) => {
      let str = this.getInputString();
      if (str.length > 0) {
        this.register(str);
      }
      return e;
    };

    this.onKeyDown = (e) => {
      if (e.key === "Enter") {
        this.onSubmit();
      }
      e.persist();
      return e;
    };

    this.isGettingUsers = false;
    this.hasAttemptedToGetUsers = false;
    this.loadLobbyUsers = () => {
      if (!this.isGettingUsers && !this.hasAttemptedToGetUsers) {
        this.isGettingUsers = true;
        this.hasAttemptedToGetUsers = true;
        /*
        this.getClientSocket().registerLobbyUsersHandler(
          this.getRoomCode(),
          response => {
            this.isGettingUsers = false;
            let status = response.getStatus();
            let payload = response.getPayload();
            if (status === "success") {
              this.setState({
                users: payload.users
              });
            }
            console.log(payload);
          },
          true
        );
        */
      }
    };
    this.getLobbyUsers = () => {
      if (isDef(this.state.users)) return this.state.users;
      return [];
    };
  }
  componentDidMount() {
    setTimeout(this.doMount, 1);
  }

  render() {
    const self = this;
    let roomCode = this.getRoomCode();
    let props = this.props;

    let isRoomLoaded = false;
    let isUserRegistered = false;
    let hasChatHistory = this.hasRoomChatHistory();

    let isCompletlyLoaded = false;
    let message = "";
    let isMounted = this.state.isMounted;
    if (isMounted) {
      if (self.state.user) {
        isUserRegistered = true;
      }

      if (isUserRegistered) {
        if (self.isRoomLoaded()) {
          isRoomLoaded = true;
        } else {
          self.loadRoomInfoByCode(roomCode);
        }
      }

      if (isUserRegistered && isRoomLoaded && hasChatHistory) {
        isCompletlyLoaded = true;
      } else if (isRoomLoaded) {
        message = `Room "${roomCode}" is loaded`;
        return <div />;
      } else if (isUserRegistered) {
        let user = this.state.user;
        message = `user ${user.name} is loaded`;
      } else {
        message = `Loading...`;
      }
    } else {
      message = "Mounting Component";
    }

    if (isCompletlyLoaded) {
      let room = this.getRoom();
      let user = this.state.user;

      let routerHistory = this.getRouterHistory();

      let chatHistory = this.getRoomChatHistory();

      if (
        isUndef(this.state.users) &&
        !this.isGettingUsers &&
        !this.hasAttemptedToGetUsers
      ) {
        this.getClientSocket().updateStatus(this.getRoomCode(), "notReady");
        this.loadLobbyUsers();
      }

      return (
        <div style={{ height: "100%" }}>
          <AppBar position="static">
            <Toolbar>
              <IconButton
                onClick={() => {
                  routerHistory.push("/");
                  this.onLeaveRoom(room.name, () => {
                    routerHistory.push("/");
                  });
                }}
                edge="start"
                color="inherit"
                aria-label="menu"
              >
                <ArrowBackIcon />
              </IconButton>

              <Typography variant="title" color="inherit">
                Room <strong>{roomCode}</strong> Lobby
              </Typography>
            </Toolbar>
          </AppBar>
          <Grid container spacing={3}>
            <List>
              <ListSubheader>Users</ListSubheader>
              {this.getLobbyUsers().map((lobbyUser, i) => {
                return (
                  <ListItem key={i}>
                    <ListItemAvatar>
                      <Avatar src={user.image} style={{ marginRight: "6px" }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={lobbyUser.name}
                      secondary={this.translateUserStatus(
                        this.getUserStatus(lobbyUser)
                      )}
                    />
                  </ListItem>
                );
              })}
            </List>
            <Grid item xs={11} sm={8} md={9} lg={4}>
              <Chat
                chatroom={room}
                chatHistory={chatHistory}
                user={user}
                clientSocket={this.getClientSocket()}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              Room
              <pre>
                <xmp>{JSON.stringify(this.getMemberStatuses(), null, 2)}</xmp>
              </pre>
              <PrimaryButton onClick={() => this.readyUpToggle()}>
                {this.getUserStatus(this.state.user) !== "ready"
                  ? "Ready Up"
                  : "Unready"}
              </PrimaryButton>
            </Grid>
          </Grid>
        </div>
      );
    } else {
      let taskCompleted = 0;
      const totalTasks = 4;
      if (isMounted) taskCompleted += 1;
      if (isUserRegistered) taskCompleted += 1;
      if (isRoomLoaded) taskCompleted += 1;
      if (hasChatHistory) taskCompleted += 1;

      if (!isUserRegistered) {
        let str = this.getInputString();
        return (
          <div className={"center_column"}>
            <div>
              <TextField
                label="username"
                variant="filled"
                value={str}
                onKeyDown={this.onKeyDown}
                onChange={(e) => this.onUsernameInput(e)}
              />
              <PrimaryButton
                onClick={(e) => this.onSubmit(e)}
                disabled={this.getInputStringLength() === 0}
              >
                Submit
              </PrimaryButton>
            </div>
          </div>
        );
      } else {
        let progress = (taskCompleted / totalTasks) * 100;
        return (
          <div>
            {message}
            <br />
            <LinearProgress variant="determinate" value={progress} />
          </div>
        );
      }
    }
  }
}
//<BlurredBackground backgroundImage={this.getRoomImage()}>
