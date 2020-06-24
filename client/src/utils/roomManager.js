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

function RoomManager(ref) {
  function props() {
    return ref.props;
  }

  function connection() {
    return ref.getConnection();
  }

  async function exists(roomCode) {
    return await props().existsRoom(connection(), roomCode);
  }

  async function create(roomCode = null) {
    await props().createRoom(connection(), roomCode);
  }

  async function join(roomCode) {
    await props().joinRoom(connection(), roomCode);
  }

  const publicScope = {
    exists,
    create,
    join,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

export default RoomManager;
