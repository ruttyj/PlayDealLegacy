const rootFolder = `../../..`;
const serverFolder = `${rootFolder}/server`;
const serverSocketFolder = `${serverFolder}/sockets`;
const clientFolder = `${rootFolder}/client`;
const utilsFolder = `${serverFolder}/utils`;
const { isDef, isArr, getNestedValue, makeListenerMap, makeVar } = require(`${utilsFolder}/utils.js`);

const dumpHand = async thisPerson => jsonLog(await thisPerson.emitSingleRequest("PLAYER_HANDS", "GET_KEYED", defaultProps(roomCode)));
const dumpCollections = async (thisPerson, mxdCollectionIds) =>
  jsonLog(
    await thisPerson.emitSingleRequest(
      "COLLECTIONS",
      "GET_KEYED",
      defaultProps(roomCode, {
        collectionIds: isArr(mxdCollectionIds) ? mxdCollectionIds : [mxdCollectionIds]
      })
    )
  );

export { dumpHand, dumpCollections };
