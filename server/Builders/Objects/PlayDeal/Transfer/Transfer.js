module.exports = function buildTransfer({
  makeVar, makeMap, isDef, isArr
}) {
  const sterilize = (v) => parseInt(v, 10);
  // Transfer of a single category
  function Transfer() {
    let mState = {};

    let mItems = makeMap(mState, "items");
    let mItemCompletedCount = makeVar(mState, "completedCount", 0);
    let mIsCompleted = makeVar(mState, "completed", false);

    function _addItem(id) {
      mItems.set(id, false);
    }

    function add(mxd) {
      if (isArr(mxd)) {
        mxd.forEach((id) => {
          _addItem(id);
        });
      } else {
        _addItem(mxd);
      }
    }

    function _confirmItem(id) {
      if (mItems.has(id)) {
        mItems.set(id, true);
        mItemCompletedCount.inc();
        mIsCompleted.set(mItemCompletedCount.get() === mItems.count());
      }
    }

    function confirm(mxd) {
      if (isArr(mxd)) {
        mxd.forEach((id) => {
          _confirmItem(id);
        });
      } else {
        _confirmItem(mxd);
      }
    }

    function isConfirmed(id) {
      if (mItems.has(id)) return mItems.get(id);
      return null;
    }

    function getFullList() {
      return mItems.map((value, key) => sterilize(key));
    }

    function getTransferedList() {
      let result = [];
      mItems.forEach((value, key) => {
        if (value) {
          result.push(sterilize(key));
        }
      });
      return result;
    }

    function getConfirmedList() {
      let result = [];
      mItems.forEach((value, key) => {
        if (value) {
          result.push(sterilize(key));
        }
      });
      return result;
    }

    function getRemainingList() {
      let result = [];
      mItems.forEach((value, key) => {
        if (!value) {
          result.push(sterilize(key));
        }
      });
      return result;
    }

    function isEmpty() {
      return mItems.count() === 0;
    }

    function isComplete() {
      return mIsCompleted.get();
    }

    function clone() {
      let cloned = Transfer();
      getFullList().forEach((item) => {
        cloned.add(item);
        if (isConfirmed(item)) {
          confirm(item);
        }
      });
      return cloned;
    }

    function load(serialized) {
      if (isDef(serialized)) {
        if (isArr(serialized.items)) {
          serialized.items.forEach((item) => {
            add(item);
          });
        }

        if (isArr(serialized.transfered)) {
          serialized.transfered.forEach((item) => {
            confirm(item);
          });
        }
      }
    }

    function serialize() {
      let result = {
        is: "Transfer",
        isEmpty: isEmpty(),
        isComplete: isComplete,
        items: getFullList(),
        transfered: getTransferedList(),
      };

      return result;
    }

    const publicScope = {
      load,

      add,
      confirm,
      isConfirmed,
      clone,

      getRemainingList,
      getTransferedList,
      getConfirmedList,
      getFullList,

      isComplete,
      isEmpty,

      serialize,
    };

    function getPublic() {
      return { ...publicScope };
    }

    return getPublic();
  }
  return Transfer;
}