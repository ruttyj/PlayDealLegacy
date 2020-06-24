import React, { useState } from "react";
import { deepOrange, green, grey } from "@material-ui/core/colors";

import TextField from "@material-ui/core/TextField";
import Divider from "@material-ui/core/Divider";

import Avatar from "@material-ui/core/Avatar";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemAvatar from "@material-ui/core/ListItemAvatar";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";

// Icons
import ArrowForwardIcon from "@material-ui/icons/ArrowForward";
import StarBorder from "@material-ui/icons/StarBorder";
import IconButton from "@material-ui/core/IconButton";

import Game from "../../../utils/game";

function PersonListItem(props) {
  let {
    onToggleEditName,
    onNameChangeConfirm,
    onNameKeyPress,
    onNameChange,
    isEditingName = false,
    nameInputValue,
  } = props;
  let { name, isMe, isReady, isHost, statusLabel } = props;

  return (
    <ListItem
      style={{
        backgroundColor: isMe ? grey[50] : grey[300],
      }}
    >
      <ListItemAvatar>
        {isMe ? (
          <Avatar
            style={{
              marginRight: "6px",
              backgroundColor: isReady ? green[700] : deepOrange[500],
            }}
          >
            <small style={{ fontSize: "0.6em" }}>ME</small>
          </Avatar>
        ) : (
          <Avatar
            style={{
              marginRight: "6px",
              backgroundColor: isReady ? green[700] : deepOrange[500],
            }}
          />
        )}
      </ListItemAvatar>

      {isEditingName ? (
        <ListItemText>
          <ListItemText>
            <TextField
              autoFocus
              id="standard-basic"
              label="Username"
              onKeyPress={onNameKeyPress}
              value={nameInputValue}
              onChange={onNameChange}
            />
          </ListItemText>
          <ListItemSecondaryAction>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={onNameChangeConfirm}
            >
              <ArrowForwardIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItemText>
      ) : (
        <React.Fragment>
          <ListItemText
            onDoubleClick={onToggleEditName}
            primary={`${name}`}
            secondary={`${statusLabel}`}
          />
          {isHost ? (
            <ListItemSecondaryAction>
              <StarBorder />
            </ListItemSecondaryAction>
          ) : (
            ""
          )}
        </React.Fragment>
      )}
    </ListItem>
  );
}

export default PersonListItem;
