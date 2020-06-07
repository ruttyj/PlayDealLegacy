const { isObj, isDef, arrSum, makeMap } = require("../../../utils.js");

const Transfer = require("./Transfer.js");

// Transer of multiple categeories
function WealthTransfer() {
  let mState = {};
  let mTransferMap = makeMap(mState, "transferMap");

  function isComplete() {
    let items = mTransferMap.map((transfer) => {
      return transfer.isComplete() ? 1 : 0;
    });
    return arrSum(items) === items.length && items.length > 0;
  }

  function isEmpty() {
    //@TODO can be optimized
    let items = mTransferMap.map((transfer) => {
      return transfer.isEmpty() ? 1 : 0;
    });
    return arrSum(items) === items.length;
  }

  function has(key) {
    return mTransferMap.has(key);
  }

  function remove(key) {
    if (has(key)) {
      mTransferMap.remove(key);
    }
  }

  function get(itemKey) {
    if (has(itemKey)) return mTransferMap.get(itemKey);
    return null;
  }

  function getKeys() {
    let result = [];
    mTransferMap.forEach((value, key) => {
      result.push(key);
    });
    return result;
  }

  function create(itemKey) {
    if (!has(itemKey)) {
      mTransferMap.set(itemKey, Transfer());
    }
  }

  function set(itemKey, transfer) {
    if (!has(itemKey)) {
      mTransferMap.set(itemKey, transfer);
    }
  }

  function getOrCreate(itemKey) {
    if (!has(itemKey)) {
      create(itemKey);
    }
    return get(itemKey);
  }

  function serialize() {
    let items = mTransferMap.mapKeyed((transfer) => {
      return transfer.serialize();
    });

    const result = {
      is: "MultiTransfer",
      isComplete: isComplete(),
      items,
    };
    return result;
  }

  function clone() {
    let cloned = WealthTransfer();
    getKeys().forEach((key) => {
      let transfer = get(key);
      if (isDef(transfer)) {
        cloned.set(key, transfer.clone());
      }
    });
  }

  function load(serialized) {
    if (isDef(serialized)) {
      if (isObj(serialized.items)) {
        Object.keys(serialized.items).forEach((key) => {
          let value = serialized.items[key];
          getOrCreate(key).load(value);
        });
      }
    }
  }

  const publicScope = {
    isComplete,
    isEmpty,
    clone,
    load,

    set,
    get,
    create,
    getOrCreate,
    getKeys,
    has,
    remove,
    serialize,
  };

  function getPublic() {
    return { ...publicScope };
  }

  return getPublic();
}

module.exports = WealthTransfer;
