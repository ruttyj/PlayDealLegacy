import React from "react";
import _ from "lodash";
//import CssBaseline from "@material-ui/core/CssBaseline";

import styled from "styled-components";
//import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Avatar from "@material-ui/core/Avatar";
//import Divider from "@material-ui/core/Divider";
//import Toolbar from "@material-ui/core/Toolbar";onSendMessage
//import Typography from "@material-ui/core/Typography";
//import IconButton from "@material-ui/core/IconButton";

//import MenuIcon from "@material-ui/icons/Menu";
//import AddIcon from "@material-ui/icons/Add";
//import SearchIcon from "@material-ui/icons/Search";
//import MoreIcon from "@material-ui/icons/MoreVeonLeavert";
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import TypingTransition from "@material-ui/core/Fade";
import Collapse from "@material-ui/core/Collapse";
import SendIcon from "@material-ui/icons/Send";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";

import IconButton from "@material-ui/core/IconButton";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";

import TheirMessageBlock from "../components/TheirMessageBlock";
import MyMessage from "../components/MyMessage";
import MyMessageBlock from "../components/TheirMessageBlock";

import TypingEllipses from "../components/TypingEllipses";
import BlurredBackground from "../components/BlurredBackground";

import { isUndef, isDef, isTrue, isFalse } from "../utils/";

const gradientFadeHeight = "12px";
const ChatWindow = styled.div`
  position: relative;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  background-color: white;
`;
const ChatPanel = styled.div`
  position: relative;
  display: inline-flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  z-index: 1;
  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: ${gradientFadeHeight};
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.37) 0%,
      rgba(0, 0, 0, 0)
    );
  }
`;
const InputPanel = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  padding: 12px;
  align-self: center;
  border-top: 1px solid #fafafa;
`;

//padding-top: ${gradientFadeHeight}; /* same height as gradient fade*/
const Scrollable = styled.div`
  height: calc(100vh - 150px);
  overflow: auto;
  position: relative;
`;

const FlexRow = styled.div`
  display: flex;
`;
const OtherTypingWrapper = styled.div``;
const OtherTypingInner = styled.div``;

export default class Chatroom extends React.Component {
  //======================================================

  //                    Constructor

  //======================================================
  constructor(props, context) {
    super(props, context);

    // Get Intial Chat history
    var { chatHistory } = props;
    if (isUndef(chatHistory)) {
      chatHistory = [];
    }

    //===============================================

    //                Register State

    //===============================================
    this.state = {
      isMounted: false,
      chatHistory: chatHistory,
      input: "",
      usersTyping: {},
      showIstyping: false,
    };
    const self = this;

    //===============================================

    //            Define component methods

    //===============================================

    this.getClientSocket = () => {
      return this.props.clientSocket;
    };

    this.getCurrentUser = () => {
      return this.props.user;
    };
    this.getUserName = (user) => {
      return user.name;
    };

    this.getUserKey = (user) => {
      return this.getUserName(user);
    };

    // Sending Message

    this.onInput = (e) => {
      let str = e.target.value;
      if (str === "\n") {
        str = "";
      }
      this.setState({
        input: str,
      });
    };

    this.onInputKeyPress = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        this.onSendMessage();
      } else {
        if (String(e.target.value).length > 0) {
          this.onTyping();
        }
      }
    };

    this.onSendMessage = () => {
      let inputString = String(this.state.input).trim();
      if (inputString.length !== 0) {
        /*
        this.getClientSocket().sendMessage(
          this.getRoomName(),
          this.state.input
        );
        */
        this.clearIsTyping();
      }
      this.setState({ input: "" });
      if (isDef(this.input)) this.input.focus();
    };

    // Receiving Message

    this.onMessageReceived = (entry) => {
      console.log("onMessageReceived:", entry);
      this.updateChatHistory(entry);
    };

    this.updateChatHistory = (entry) => {
      let preformScroll = this.isWithinScrollThreshold();

      this.setState({ chatHistory: this.state.chatHistory.concat(entry) });

      if (isDef(entry.user)) {
        this.clearReceiveSomeoneTyping(this.getUserKey(entry.user));
      }

      if (preformScroll) this.scrollChatToBottom(true);
    };

    // Typing Related Logic

    this.isActivlyTyping = false; // prevent extra executions after message sent
    this.typingTimeout = 3000; // 3s
    this.onTypingLimited = undefined; // cached finction to limit calls
    this.onTyping = () => {
      this.isActivlyTyping = true;
      if (isUndef(this.onTypingLimited)) {
        let tempFunc = () => {
          /*
          if (this.isActivlyTyping && isDef(this.getClientSocket())) {
            this.getClientSocket().typing(this.getRoomName(), true);
          }
          */
        };

        tempFunc();
        this.onTypingLimited = _.throttle(
          () => {
            tempFunc();
            self.onTypingLimited = undefined;
          },
          (self.typingTimeout / 4) * 3,
          {
            leading: false,
            trailing: true,
          }
        );
      }

      this.onTypingLimited();
    };
    this.clearIsTyping = () => {
      if (isDef(this.onTypingLimited)) {
        this.isActivlyTyping = false;
      }
    };

    this.debounceReceiveTyping = {};

    this.clearReceiveSomeoneTyping = (userKey) => {
      let usersTyping = this.state.usersTyping;
      let newState = {
        usersTyping: {
          ...usersTyping,
        },
      };

      if (isDef(newState.usersTyping[userKey])) {
        delete newState.usersTyping[userKey];
      }
      this.setState(newState);

      //@TODO clean up when user leaves
      //delete this.debounceReceiveTyping[userKey];
    };

    this.onReceiveSomeoneTyping = (response) => {
      let payload = response.getPayload();
      let { user, isTyping } = payload;
      let userKey = self.getUserKey(user);

      let preformScroll = self.isWithinScrollThreshold();

      // Define function to remove typing indicator after time limit
      if (isUndef(self.debounceReceiveTyping[userKey])) {
        self.debounceReceiveTyping[userKey] = _.debounce(
          () => {
            self.clearReceiveSomeoneTyping(userKey);
          },
          self.typingTimeout,
          {
            leading: false,
            trailing: true,
          }
        );
      }

      if (isTyping) {
        // Add user to typing list
        let usersTyping = self.state.usersTyping;
        let newState = {
          usersTyping: {
            ...usersTyping,
          },
        };
        newState.usersTyping[userKey] = user;
        self.setState(newState);
        self.debounceReceiveTyping[userKey]();

        //Scroll to bottom after render
        setTimeout(() => {
          self.scrollChatToBottom(preformScroll);
        }, 1);
      } else {
        self.clearReceiveSomeoneTyping(userKey);
      }
    };

    // Chat Scroll logic

    // If within 1/2 view height from bottom scroll to bottom
    this.isWithinScrollThreshold = () => {
      let threshold = this.panel.offsetHeight / 2;
      return (
        this.panel.scrollHeight -
          (this.panel.scrollTop + this.panel.offsetHeight) <
        threshold
      );
    };

    this.scrollChatToBottom = (force = false) => {
      if (isDef(this.panel)) {
        if (force) {
          this.panel.scrollTo({
            top: this.panel.scrollHeight,
            behavior: "smooth",
          });
        }
      }
    };

    // Room methods

    this.getRoomName = () => {
      if (isDef(this.props.chatroom)) return this.props.chatroom.name;
      return "Untitled";
    };

    this.getRoomImage = () => {
      if (isDef(this.props.chatroom)) return this.props.chatroom.image;
      return "#"; //@TODO
    };

    this.sectionChatHistory = (chatHistoryItems) => {
      let sectionedMessageList = [];
      if (chatHistoryItems.length > 0) {
        let prevUserKey = null;
        let prevItemType = null;
        let prevItem = null;
        let currentHistory = [];
        let runningSectionItemCount = 0;
        chatHistoryItems.forEach((chatItem, i) => {
          //Handle current user
          let user = chatItem.user;
          let userKey = this.getUserKey(user);
          let itemType = isDef(chatItem.event) ? "event" : "message";

          if (prevUserKey !== userKey || itemType !== prevItemType) {
            if (prevItem !== null) prevItem.last = true;

            //Create new chat item list
            runningSectionItemCount = 0;
            currentHistory = [];

            sectionedMessageList.push({
              userKey: userKey,
              user: user,
              type: itemType,
              chatItems: currentHistory,
            });
          }

          //Add to current list
          let currentItem = {
            ...chatItem,
            type: itemType,
            first: false,
            last: false,
          };
          if (isDef(currentItem.user)) delete currentItem.user;
          if (isDef(currentItem.chat)) delete currentItem.chat;
          if (runningSectionItemCount === 0) currentItem.first = true;

          currentHistory.push(currentItem);

          //Update who was the previous user
          prevUserKey = userKey;
          prevItemType = itemType;
          prevItem = currentItem;
        });
        if (prevItem !== null) prevItem.last = true;
      }
      return sectionedMessageList;
    };

    this.renderChatSections = (sectionedMessageList) => {
      //let thisUser = this.getCurrentUser();
      let messageListContent = sectionedMessageList
        .map((section, sectionNum) => {
          let sectionKey = `section-${sectionNum}`;

          let sectionType = section.type;
          let userName = section.user.name;
          let userImage = section.user.image;

          let chatItemContent = "";
          if (sectionType === "message") {
            chatItemContent = section.chatItems.map((chatItem, chatItemNum) => {
              let chatItemKey = `${sectionKey}-${chatItemNum}`;
              return (
                <TheirMessageBlock
                  first={chatItem.first}
                  last={chatItem.last}
                  key={chatItemKey}
                >
                  {chatItem.message.split("\n").map((text, i) => (
                    <div key={i}>
                      {text}
                      <br />
                    </div>
                  ))}
                </TheirMessageBlock>
              );
            });

            return (
              <div
                key={sectionKey}
                style={{ paddingLeft: "60px", position: "relative" }}
              >
                <div
                  style={{ position: "absolute", left: "0px", bottom: "0px" }}
                >
                  <Avatar
                    src={userImage}
                    style={{ marginLeft: "12px", marginRight: "12px" }}
                  />
                </div>
                <span
                  style={{ color: "white", opacity: "0.5", marginLeft: "12px" }}
                >
                  {userName}
                </span>
                <br />
                {chatItemContent}
              </div>
            );
          } else if (sectionType === "event") {
            chatItemContent = section.chatItems.map((chatItem, chatItemNum) => {
              let chatItemKey = `${sectionKey}-${chatItemNum}`;

              return (
                <div
                  key={chatItemKey}
                  style={{
                    width: "100%",
                    textAlign: "center",
                    color: "white",
                    opacity: "0.5",
                  }}
                >
                  {userName} {chatItem.event}
                </div>
              );
            });
            return (
              <div key={sectionKey} style={{ width: "100%" }}>
                {chatItemContent}
              </div>
            );
          }
          return "";
        })
        .filter((item) => item);

      return <div style={{ width: "100%" }}>{messageListContent}</div>;
    };
  } // End constructor ___________________________________

  //======================================================

  //                Life cycle methods

  //======================================================
  componentDidMount() {
    this.setState({
      isMounted: true,
    });
    /*
    this.getClientSocket().registerMessageHandler(this.onMessageReceived);
    this.getClientSocket().registerTypingHandler(this.onReceiveSomeoneTyping);
    */
    this.scrollChatToBottom(true);
  }

  componentWillUnmount() {
    /*
    this.getClientSocket().unregisterMessageHandler();
    this.getClientSocket().unregisterTypingHandler();
  */
  }
  // End Life cycle methods ______________________________

  //======================================================

  //                      Render

  //======================================================

  render() {
    //const classes = useStyles();
    //###########################################################

    // Chat history sectioned by user
    let sectionedMessageList = this.sectionChatHistory(this.state.chatHistory);
    let renderedChatHistory = this.renderChatSections(sectionedMessageList);
    //###########################################################

    let displayUsersTyping = "";
    let avatarsTyping = [];
    let showIstyping = false;
    let userNamesTyping = Object.keys(this.state.usersTyping);
    if (this.state.isMounted && userNamesTyping.length > 0) {
      showIstyping = true;

      avatarsTyping = userNamesTyping.map((userName) => {
        let user = this.state.usersTyping[userName];
        return (
          <Avatar
            key={`typing-${userName}`}
            src={user.image}
            style={{ marginRight: "6px" }}
          />
        );
      });

      displayUsersTyping = (
        <FlexRow style={{ marginBottom: "12px", height: "48px" }}>
          {avatarsTyping}{" "}
          <TheirMessageBlock>
            <TypingEllipses />
          </TheirMessageBlock>
        </FlexRow>
      );
    }
    displayUsersTyping = (
      <OtherTypingWrapper
        style={{
          bottom: "0px",
          left: "0px",
          width: "100%",
        }}
      >
        <OtherTypingInner>
          <Collapse in={showIstyping}>
            <TypingTransition in={showIstyping}>
              <div style={{ marginLeft: "18px" }}>{displayUsersTyping}</div>
            </TypingTransition>
          </Collapse>
        </OtherTypingInner>
      </OtherTypingWrapper>
    );

    return (
      <div style={{ height: "100%" }}>
        <ChatWindow>
          <ChatPanel>
            <BlurredBackground backgroundImage={this.getRoomImage()}>
              <Scrollable
                innerRef={(panel) => {
                  this.panel = panel;
                }}
              >
                <Grid
                  spacing={3}
                  style={{
                    width: "calc(100%)",
                    margin: "0px",
                    position: "relative",
                    paddingBottom: "20px",
                    paddingTop: "20px",
                  }}
                  container
                >
                  <Grid
                    container
                    alignItems="center"
                    direction="row"
                    justify="flex-end"
                  >
                    {renderedChatHistory}
                  </Grid>
                </Grid>
                {displayUsersTyping}
              </Scrollable>
            </BlurredBackground>
            <InputPanel>
              <TextField
                inputRef={(input) => (this.input = input)}
                style={{ display: "flex", width: "100%" }}
                placeholder="Enter a message."
                multiline
                rows={1}
                rowsMax={4}
                onChange={this.onInput}
                value={this.state.input}
                onKeyDown={this.onInputKeyPress}
              />
              <SendIcon
                onClick={this.onSendMessage}
                style={{ marginLeft: 20 }}
              />
            </InputPanel>
          </ChatPanel>
        </ChatWindow>
      </div>
    );
  }
}
