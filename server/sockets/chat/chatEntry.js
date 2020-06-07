const { isDef, emptyFunction, makeVar } = require("../utils.js");

//##################################################

//                   CHAT ENTRY

//##################################################
/*
  Public:
    getId,
    setId,
    setPersonKey,
    getPersonKey,
    hasPersonKey,
    getType,
    setType,
    hasType,
    getValue,
    setValue,
    hasValue,
    serialize,
*/
function ChatEntry({ id, personKey, type, value }) {
  let mRef = {};

  const mExternalRefs = [];
  const { get: getId, set: setId } = makeVar(mRef, "id", 0);
  const { get: getPersonKey, set: setPersonKey, has: hasPersonKey } = makeVar(
    mRef,
    "personKey",
    0
  );

  const { get: getType, set: setType, has: hasType } = makeVar(
    mRef,
    "type",
    "message"
  );

  const { get: getValue, set: setValue, has: hasValue } = makeVar(
    mRef,
    "value",
    null
  );

  function serialize() {
    let result = {};
    // Serialize everything except the external references
    let keys = Object.keys(mRef).filter((key) => !mExternalRefs.includes(key));

    // Serialize each if possible, leave primitives as is
    keys.forEach((key) => {
      result[key] = isDef(mRef[key].serialize)
        ? mRef[key].serialize()
        : mRef[key];
    });

    return result;
  }

  if (isDef(id)) setId(id);
  if (isDef(personKey)) setPersonKey(personKey);
  if (isDef(type)) setType(type);
  if (isDef(value)) setValue(value);

  const publicScope = {
    getId,
    setId,
    setPersonKey,
    getPersonKey,
    hasPersonKey,
    getType,
    setType,
    hasType,
    getValue,
    setValue,
    hasValue,
    serialize,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

module.exports = ChatEntry;
