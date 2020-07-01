import peopleReducers from "../reducers/peopleReducers";
import { isDef } from "../../utils/";
import {
  GET_PEOPLE,
  REMOVE_PEOPLE,
  GET_HOST,
  UPDATE_MY_STATUS,
  GET_MY_ID,
  UPDATE_MY_NAME,
} from "./types";
import ReduxState from "../controllers/reduxState";
const reduxState = ReduxState.getInstance();

let mapEvents = {
  GET_PEOPLE: ["PEOPLE", "GET_KEYED"],
  REMOVE_PEOPLE: ["PEOPLE", "REMOVE"],
  GET_HOST: ["PEOPLE", "GET_HOST"],
  GET_MY_ID: ["PEOPLE", "ME"],
  UPDATE_MY_NAME: ["PEOPLE", "UPDATE_MY_NAME"],
};

const attachPeopleListeners = (con) => (dispatch) => {
  let listnerTree = con.listnerTree;

  Object.keys(mapEvents).forEach((eventType) => {
    let eventBranch = mapEvents[eventType];
    listnerTree.on(eventBranch, (data) => {
      let { payload } = data;
      if (isDef(payload)) {
        reduxState.directDispatch("people", dispatch, peopleReducers, {
          type: eventType,
          payload: payload,
        });
      }
    });
  });
};

const updateMyStatus = (con, roomCode, status) => async (dispatch) => {
  let responses = await con.emitSingleRequest("PEOPLE", "UPDATE_MY_STATUS", {
    props: {
      roomCode,
      status,
    },
  });

  return responses;
};

const updateMyName = (con, roomCode, username) => async (dispatch) => {
  let responses = await con.emitSingleRequest("PEOPLE", "UPDATE_MY_NAME", {
    props: {
      roomCode,
      username,
    },
  });

  return responses;
};

const resetPeopleData = (value) => (dispatch) => {
  reduxState.directDispatch("people", dispatch, peopleReducers, {
    type: `RESET`,
    payload: value,
  });
  return Promise.resolve();
};

export default {
  resetPeopleData,
  attachPeopleListeners,
  updateMyStatus,
  updateMyName,
};
