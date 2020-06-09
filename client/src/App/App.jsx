import React, { Component } from "react";
import { BrowserRouter, Route, Switch, Redirect, Link } from "react-router-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import { isDef } from "../utils";

import HomePage from "../pages/HomePage/";
import Browse from "../pages/Browse";

import Dev from "../pages/Dev";
import Dev2 from "../pages/Dev2";
import DevImmutable from "../pages/DevImmutable";
import Dev3 from "../pages/Dev3";
import Dev4 from "../pages/Dev4";

import { Provider } from "react-redux";
import store from "./store";

class App extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      user: null,
      isMounted: false,
      isRegisterInProcess: false,

      rooms: null,
      room: null,
      roomsChatHistory: {},
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

  onRouteChanged(...props) {
    console.log("ROUTE CHANGED", [...props]);
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
                  return <HomePage />;
                }}
              />

              <Route
                key="browse"
                exact
                path="/browse"
                render={(props) => {
                  return <Browse />;
                }}
              />

              <Route
                key="dev3"
                exact
                path="/dev3"
                render={(props) => {
                  return <Dev3 room="AAAA" />;
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

                  return <Dev2 room={roomCode} />;
                }}
              />

              <Route
                key="Dev2/"
                exact
                path="/dev2/*"
                render={(props) => {
                  let roomCode = String(props.match.params[0]).replace("/", "");
                  return <Dev2 room={roomCode} />;
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
