import React, { Component } from "react";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CssBaseline from "@material-ui/core/CssBaseline";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core/styles";
import store from "./store";
import { Provider } from "react-redux";
import { isDef } from "../utils";
import { withResizeDetector } from "react-resize-detector";

import RoomRaw from "../pages/Room/";

const Room = withResizeDetector(RoomRaw);

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#000",
    },
  },
});

class App extends Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    return (
      <Provider store={store}>
        <React.Fragment>
          <BrowserRouter>
            <CssBaseline />
            <MuiThemeProvider theme={theme}>
              <Switch>
              
                <Route
                  key="room/"
                  exact
                  path="/room/*"
                  render={(props) => {
                    let roomCode = String(props.match.params[0]).replace(
                      /\//g,
                      ""
                    );
                    if (!isDef(roomCode)) {
                      roomCode = "AAAA";
                    }
                    roomCode = String(roomCode)
                      .trim()
                      .toUpperCase();
                    if (roomCode.length === 0) {
                      roomCode = "AAAA";
                    }

                    return <Room room={roomCode} />;
                  }}
                />
              </Switch>
            </MuiThemeProvider>
          </BrowserRouter>
        </React.Fragment>
      </Provider>
    );
  }
}

export default App;
