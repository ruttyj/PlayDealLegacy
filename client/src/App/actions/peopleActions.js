import peopleBuffer from "../buffers/peopleBuffer";
import { isDef } from "../../utils/";
import {
  GET_PEOPLE,
  REMOVE_PEOPLE,
  GET_HOST,
  UPDATE_MY_STATUS,
  GET_MY_ID,
  UPDATE_MY_NAME,
} from "./types";

function findResponse(responses, subject, action) {
  return responses.find(
    (res) => res.subject === subject && res.action === action
  );
}

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
        dispatch({
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
  peopleBuffer.dispatch(dispatch, {
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
