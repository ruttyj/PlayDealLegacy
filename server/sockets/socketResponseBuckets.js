const { isDef, isArr, isFunc, makeMap, stateSerialize } = require("./utils.js");

//##################################################

//              SOCKET RESPONSE BUCKETS

//##################################################
/**
 * Description:
 *
 * Arrays of response data placed into 3 buckets:
 *    default       - returned to the current client unless otherwise transferd to another bucket
 *    everyoneElse  - emitted to everyone else besides the current client
 *    everyone      - emitted to everyone
 *
 * Additional information can be places into specific buckets indexed by the client id.
 * All buckets will eventually be reduced to their correponding client id.
 */
function SocketResponseBuckets() {
  let mState = {};

  let buckets = makeMap(mState, "buckets");
  let specific = makeMap(mState, "specific", [], {
    keyMutator: v => String(v)
  });

  function isSameType(obj) {
    return isDef(obj) && isFunc(obj.is) && obj.is() === is();
  }

  function is() {
    return SocketResponseBuckets;
  }

  function addArrToBucket(buckeyKey, arrItems) {
    if (!buckets.has(buckeyKey)) buckets.set(buckeyKey, []);
    buckets.get(buckeyKey).push(...arrItems);
  }

  function addObjToBucket(buckeyKey, obj) {
    addArrToBucket(buckeyKey, [obj]);
  }

  function addArrToSpecific(sKey, arrItems) {
    if (!specific.has(sKey)) specific.set(sKey, []);
    specific.get(sKey).push(...arrItems);
  }
  function addObjToSpecific(sKey, obj) {
    addArrToSpecific(sKey, [obj]);
  }

  function addSocketReponse(objA) {
    let serialA = objA.serialize();
    Object.keys(serialA.buckets).forEach(bucketKey => {
      addArrToBucket(bucketKey, serialA.buckets[bucketKey]);
    });

    Object.keys(serialA.specific).forEach(sKey => {
      addArrToSpecific(sKey, serialA.specific[sKey]);
    });
  }

  // Transfer from default to a specific bucket
  function transferToBucket(newBucketKey, objA) {
    let serialA = objA.serialize();

    Object.keys(serialA.buckets).forEach(bucketKey => {
      let targetBucketKey = bucketKey === "default" ? newBucketKey : bucketKey;
      addArrToBucket(targetBucketKey, serialA.buckets[bucketKey]);
    });

    Object.keys(serialA.specific).forEach(sKey => {
      addArrToSpecific(sKey, serialA.specific[sKey]);
    });
  }

  function addToBucket(mxdA, mxdB = null) {
    if (!isDef(mxdB)) {
      if (isSameType(mxdA)) {
        addSocketReponse(mxdA);
      } else if (isArr(mxdA)) {
        transferToBucket("default", mxdA);
      } else {
        addObjToBucket("default", mxdA);
      }
    } else if (isSameType(mxdB)) {
      transferToBucket(mxdA, mxdB);
    } else if (isArr(mxdB)) {
      addArrToBucket(mxdA, mxdB);
    } else {
      addObjToBucket(mxdA, mxdB);
    }
  }

  function addToSpecific(sKey, mxdB) {
    if (isArr(mxdB)) {
      addArrToSpecific(sKey, mxdB);
    } else {
      addObjToSpecific(sKey, mxdB);
    }
  }

  function serialize() {
    return stateSerialize(mState);
  }

  // Take information from the buckets and assign to relevent clients
  // Returns a new object
  function reduce(thisId, ids) {
    let newBuckets = SocketResponseBuckets();
    let b = buckets;
    let s = specific;

    let defaultBuckets = {
      default: 1,
      everyoneElse: 1,
      everyone: 1
    };
    buckets.keys().forEach(bucket => {
      if (!isDef(defaultBuckets[bucket])) {
        console.log("HEYYY!!!, WRONG BUCKET NAME!!");
      }
    });

    // move default to thisId
    if (b.has("default")) newBuckets.addToSpecific(thisId, b.get("default"));

    let hasEveryoneBucket = b.has("everyone");
    let hasEveryoneElseBucket = b.has("everyoneElse");
    ids.forEach(id => {
      // add Everyone else
      if (hasEveryoneElseBucket) {
        if (id !== thisId) {
          newBuckets.addToSpecific(id, b.get("everyoneElse"));
        }
      }

      // Add to everyone
      if (hasEveryoneBucket) {
        newBuckets.addToSpecific(id, b.get("everyone"));
      }

      // add any specific ones
      if (s.has(id)) newBuckets.addToSpecific(id, s.get(id));
    });
    return newBuckets;
  }

  return {
    is,
    addToBucket,
    addToSpecific,

    addArrToBucket,
    addObjToBucket,
    addSocketReponse,
    transferToBucket,

    addArrToSpecific,
    addObjToSpecific,

    reduce,

    serialize,
    specific,
    buckets
  };
}

module.exports = SocketResponseBuckets;
