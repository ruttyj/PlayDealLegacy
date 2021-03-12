const {
  isDef,
  identity,
  makeVar,
  makeList,
} = require("../utils.js");

//##################################################

//                    CHAT

//##################################################
/* public:
    addEntry,
    getAllEntries,
    getEntryCount,
    getEntriesAfter,
    serialize,
*/
function Chat() {
  let mRef = {};

  const mExternalRefs = [];
  const mPrivateVars = ["topId"];
  const { get: getTopId, inc: incTopId } = makeVar(mRef, "topId", 0);

  const {
    push: pushEntry,
    get: getEntryAtIndex,
    getCount: getEntryCount,
    shallowClone: getAllEntries,
  } = makeList(mRef, "entries", []);

  function serialize() {
    let result = {};
    // Serialize everything except the external references
    let excludeKeys = [...mPrivateVars, ...mExternalRefs];
    let keys = Object.keys(mRef).filter((key) => !excludeKeys.includes(key));

    // Serialize each if possible, leave primitives as is
    keys.forEach((key) => {
      result[key] = isDef(mRef[key].serialize)
        ? mRef[key].serialize()
        : mRef[key];
    });

    return result;
  }

  function addEntry(entry) {
    incTopId();
    entry.setId(getTopId());
    pushEntry(entry);
  }

  function getEntriesAfter(index, mapFn = identity) {
    let results = [];
    for (let i = index + 1; i < getEntryCount(); ++i) {
      results.push(mapFn(getEntryAtIndex(i)));
    }
    return results;
  }

  const publicScope = {
    addEntry,
    getAllEntries,
    getEntryCount,
    getEntriesAfter,
    serialize,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

module.exports = Chat;
