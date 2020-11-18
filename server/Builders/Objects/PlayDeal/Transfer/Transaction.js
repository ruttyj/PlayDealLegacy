module.exports = function buildTransaction({
  isObj,
  isDef,
  arrSum,
  makeMap,
  WealthTransfer
}) {

  function Transaction() {
    let mState = {};
  
    let mWealthTransfers = makeMap(mState, "transfers");
  
    function has(key) {
      return mWealthTransfers.has(key);
    }
  
    function get(key) {
      if (has(key)) return mWealthTransfers.get(key);
      return null;
    }
  
    function set(key, value) {
      mWealthTransfers.set(key, value);
    }
    function create(key) {
      if (!has(key)) {
        set(key, WealthTransfer());
      }
      return get(key);
    }
  
    function getOrCreate(key) {
      if (!has(key)) return create(key);
      return get(key);
    }
  
    function isComplete() {
      let items = mWealthTransfers.map((transfer) => {
        return transfer.isComplete() ? 1 : 0;
      });
      return arrSum(items) === items.length && items.length > 0;
    }
  
    function isEmpty() {
      let items = mWealthTransfers.map((transfer) => {
        return transfer.isEmpty() ? 1 : 0;
      });
      return arrSum(items) === items.length;
    }
  
    function getKeys() {
      let result = [];
      mWealthTransfers.forEach((value, key) => {
        result.push(key);
      });
      return result;
    }
  
    function serialize() {
      let items = mWealthTransfers.mapKeyed((value, key) => {
        return value.serialize();
      });
      const result = {
        is: "Transaction",
        isComplete: isComplete(),
        isEmpty: isEmpty(),
        items,
      };
      return result;
    }
  
    function clone() {
      let cloned = Transaction();
      getKeys().forEach((key) => {
        let item = get(key);
        if (isDef(item)) {
          cloned.set(key, item.clone());
        }
      });
  
      return cloned;
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
      clone,
      has,
      set,
      load,
      get,
      create,
      getOrCreate,
      getKeys,
      isComplete,
      isEmpty,
      serialize,
    };
  
    function getPublic() {
      return { ...publicScope };
    }
  
    return getPublic();
  }

  return Transaction;
}