import React, { Component } from "react";
import { BrowserRouter, Route, Switch, Redirect, Link } from "react-router-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import { isDef } from "../utils";

import HomePage from "../pages/HomePage";
//import Room from "../pages/Room";
import Dev from "../pages/Dev";
import Dev2 from "../pages/Dev2";
import DevImmutable from "../pages/DevImmutable";
import Dev3 from "../pages/Dev3";
import Dev4 from "../pages/Dev4";

import createSocketConnection from "../utils/clientSocket";

import { Provider } from "react-redux";
import store from "./store";

class App extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      user: null,
      isMounted: false,
      isRegisterInProcess: false,
      clientSocket: createSocketConnection(
        io.connect(process.env.CONNECT, {
          secure: true,
          rejectUnauthorized: false,
        })
      ),
      rooms: null,
      room: null,
      roomsChatHistory: {},
    };

    this.getClientSocket = () => {
      return this.state.clientSocket;
    };

    this.doMount = async () => {
      this.setState({
        isMounted: true,
      });
    };

    this.getRoomPath = (roomName) => {
      return `/Room/${roomName}`;
    };

    // Get router props from route
    // Important: setRouterPropsRef(props) must be called in every route
    this.routerPropsRef = null;
    this.setRouterPropsRef = (ref) => {
      this.routerPropsRef = ref;
    };
    this.getRouterPropsRef = () => {
      return this.routerPropsRef;
    };

    this.getConnection = this.getConnection.bind(this);
  }

  getConnection() {
    return this.state.getConnection();
  }

  componentWilUnmount() {
    let connection = this.getConnection();
    connection.destroy();
  }

  render() {
    return (
      <Provider store={store}>
        <React.Fragment>
          <BrowserRouter>
            <CssBaseline />
            <Switch>
              <Route
                key="dev"
                exact
                path="/dev"
                render={(props) => {
                  return <Dev />;
                }}
              />

              <Route
                key="home"
                exact
                path="/"
                render={(props) => {
                  return <HomePage clientSocket={this.getClientSocket()} />;
                }}
              />

              <Route
                key="dev3"
                exact
                path="/dev3"
                render={(props) => {
                  return (
                    <Dev3 room="AAAA" clientSocket={this.getClientSocket()} />
                  );
                }}
              />
              <Route
                key="dev4"
                exact
                path="/dev4"
                render={(props) => {
                  return <Dev4 />;
                }}
              />

              <Route
                key="DevImmutable"
                exact
                path="/DevImmutable"
                render={(props) => {
                  return <DevImmutable />;
                }}
              />

              <Route
                key="room/"
                exact
                path="/room/*"
                render={(props) => {
                  let roomCode = String(props.match.params[0]).replace("/", "");
                  console.log("roomCode", roomCode);
                  if (!isDef(roomCode)) {
                    roomCode = "AAAA";
                  }
                  roomCode = String(roomCode).trim().toUpperCase();
                  if (roomCode.length === 0) {
                    roomCode = "AAAA";
                  }

                  return (
                    <Dev2
                      room={roomCode}
                      clientSocket={this.getClientSocket()}
                    />
                  );
                }}
              />

              <Route
                key="Dev2/"
                exact
                path="/dev2/*"
                render={(props) => {
                  let roomCode = String(props.match.params[0]).replace("/", "");
                  return (
                    <Dev2
                      room={roomCode}
                      clientSocket={this.getClientSocket()}
                    />
                  );
                }}
              />
            </Switch>
          </BrowserRouter>
        </React.Fragment>
      </Provider>
    );
  }
}

export default App;
