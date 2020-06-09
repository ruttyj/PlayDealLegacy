import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import Typography from "@material-ui/core/Typography";
import Link from "@material-ui/core/Link";
import classNames from "classNames";
import { isDef } from "../utils/utils";

const useStyles = makeStyles((theme) => ({
  toolbar: {
    borderBottom: `0px solid ${theme.palette.divider}`,
  },
  toolbarTitle: {
    flex: 1,
  },
  toolbarSecondary: {
    justifyContent: "space-between",
    overflowX: "auto",
  },
  toolbarLink: {
    padding: theme.spacing(1),
    flexShrink: 0,
  },
}));

export default function Header(props) {
  const classes = useStyles();
  const { title, subHeader } = props;

  return (
    <React.Fragment>
      <Toolbar
        className={classNames("no_select", classes.toolbar)}
        style={{ padding: "10px", flexDirection: "column" }}
      >
        <img
          src="/img/logo_white.png"
          style={{ filter: "invert(1)", margin: "auto", height: "10vh" }}
          alt="logo"
        />
        {isDef(subHeader) ? (
          <h3 style={{ color: "#FFFFFF50" }}>{subHeader}</h3>
        ) : (
          ""
        )}
      </Toolbar>
    </React.Fragment>
  );
}

Header.propTypes = {
  sections: PropTypes.array,
  title: PropTypes.string,
};
