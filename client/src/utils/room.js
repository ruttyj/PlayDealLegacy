import {
  isArr,
  isDef,
  isFunc,
  isDefNested,
  els,
  getNestedValue,
  setNestedValue,
  jsonLog,
} from "../utils/";

function Room(ref) {
  function props() {
    return ref.props;
  }

  function connection() {
    return ref.getConnection();
  }

  async function leaveRoom() {
    await props().leaveRoom(connection(), props().room);
  }

  function getAllPeopleInRoom() {
    return props().getAllPeopleData();
  }

  async function resetState() {
    // people data are tied to the room
    await props().resetPeopleData();
    await props().resetRoomData();
  }

  function getCode() {
    return props().room;
  }

  function get() {
    return props().currentRoom;
  }

  const publicScope = {
    getAllPeopleInRoom,
    leaveRoom,
    resetState,
    getCode,
    get,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

export default Room;
