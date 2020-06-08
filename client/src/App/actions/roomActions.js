import { isDef } from "../../utils/";
import { SET_CURRENT_ROOM } from "./types";

function findResponse(responses, subject, action) {
  return responses.find(
    (res) => res.subject === subject && res.action === action
  );
}

const attachRoomListeners = (con) => (dispatch) => {
  let listnerTree = con.listnerTree;
  let eventBranch = ["ROOM", "GET_CURRENT"];
  listnerTree.on(eventBranch, (data) => {
    let { payload } = data;
    dispatch({
      type: SET_CURRENT_ROOM,
      payload: payload,
    });
  });
};

const existsRoom = (con, roomCode) => async (dispatch) => {
  let responses = await con.emitSingleRequest("ROOM", "EXISTS", {
    props: {
      roomCode,
    },
  });
  if (isDef(responses)) {
    let response = findResponse(responses, "ROOM", "EXISTS");
    if (isDef(response)) {
      let exists = response.payload.exists;
      if (isDef(exists[roomCode]) && exists[roomCode]) {
        return true;
      }
    }
  }
  return false;
};

const listAllRooms = (con) => async (dispatch) => {
  let myPromise = new Promise((resolve, reject) => {
    con.listnerTree.on(["ROOM", "GET_ALL_KEYED_RESULT"], (responses) => {
      let resposnse = findResponse(responses, "ROOM", "GET_KEYED");
      resolve(resposnse);
    });
    con.emitSingleRequest("ROOM", "GET_All_KEYED", {
      props: {},
    });
  });

  return myPromise;
};

const createRoom = (con, roomCode = null) => async (dispatch) => {
  let responses = await con.emitSingleRequest("ROOM", "CREATE", {
    props: {
      roomCode,
    },
  });
  return findResponse(responses, "ROOM", "CREATE");
};

const leaveRoom = (con, roomCode) => async (dispatch) => {
  let responses = await con.emitSingleRequest("ROOM", "LEAVE", {
    props: {
      roomCode,
    },
  });
  return responses;
};

const joinRoom = (con, roomCode) => async (dispatch) => {
  let responses = await con.emitSingleRequest("ROOM", "JOIN", {
    props: {
      roomCode,
    },
  });
  return responses;
};

export default {
  listAllRooms,
  joinRoom,
  leaveRoom,
  createRoom,
  existsRoom,
  attachRoomListeners,
};
