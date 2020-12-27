//##################################################

//              ADDRESSED RESPONSE

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
module.exports = function ({isDef, isArr, makeMap, stateSerialize})
{
  class AddressedResponse {

    static DEFAULT_BUCKET = 'DEFAULT'
    static EVERYONE_BUCKET = 'EVERYONE'
    static EVERYONE_ELSE_BUCKET = 'EVERYONEELSE'

    constructor()
    {
      const addressedResponse = this
      this.mState = {};
      this.mBuckets = makeMap(this.mState, "buckets");
      this.mSpecific = makeMap(this.mState, "specific", [], {
        keyMutator: v => String(v)
      });

      // Allow static variables to be visible to the instance
      Object.entries(AddressedResponse).forEach(([key, value]) => {
        addressedResponse[key] = value
      })
    }

    bucketNameTransform(name)
    {
      return String(name).toUpperCase()
    }
    get buckets()
    {
      return this.mBuckets;
    }

    get specific()
    {
      return this.mSpecific;
    }

    isSameType(obj) 
    {
      return obj instanceof AddressedResponse;
    }

    is() 
    {
      return AddressedResponse;
    }

    addArrToBucket(buckeyKey, arrItems) 
    {
        buckeyKey = this.bucketNameTransform(buckeyKey)
      if (!this.mBuckets.has(buckeyKey)) this.mBuckets.set(buckeyKey, []);
      this.mBuckets.get(buckeyKey).push(...arrItems);
    }

    addObjToBucket(buckeyKey, obj) 
    {
      buckeyKey = this.bucketNameTransform(buckeyKey)
      this.addArrToBucket(buckeyKey, [obj]);
    }

    addArrToSpecific(sKey, arrItems) 
    {
      if (!this.mSpecific.has(sKey)) this.mSpecific.set(sKey, []);
      this.mSpecific.get(sKey).push(...arrItems);
    }

    addObjToSpecific(sKey, obj) 
    {
      this.addArrToSpecific(sKey, [obj]);
    }

    addSocketReponse(objA) 
    {
      let serialA = objA.serialize();
      Object.keys(serialA.buckets).forEach(bucketKey => {
        this.addArrToBucket(bucketKey, serialA.buckets[bucketKey]);
      });

      Object.keys(serialA.specific).forEach(sKey => {
        this.addArrToSpecific(sKey, serialA.specific[sKey]);
      });
    }

    // Transfer from default to a specific bucket
    transferToBucket(newBucketKey, objA) 
    {
      const response = this;

      let serialA = objA.serialize();

      Object.keys(serialA.buckets).forEach(bucketKey => {
        let targetBucketKey = bucketKey === response.DEFAULT_BUCKET ? newBucketKey : bucketKey;
        targetBucketKey = this.bucketNameTransform(targetBucketKey)

        this.addArrToBucket(targetBucketKey, serialA.buckets[bucketKey]);
      });

      Object.keys(serialA.specific).forEach(sKey => {
        this.addArrToSpecific(sKey, serialA.specific[sKey]);
      });
    }

    addToBucket(mxdA, mxdB = null) 
    {
      const response = this
      
      if (!isDef(mxdB)) {
        if (this.isSameType(mxdA)) {
          this.addSocketReponse(mxdA);
        } else if (isArr(mxdA)) {
          this.transferToBucket(response.DEFAULT_BUCKET, mxdA);
        } else {
          this.addObjToBucket(response.DEFAULT_BUCKET, mxdA);
        }
      } else if (this.isSameType(mxdB)) {
        this.transferToBucket(mxdA, mxdB);
      } else if (isArr(mxdB)) {
        this.addArrToBucket(mxdA, mxdB);
      } else {
        this.addObjToBucket(mxdA, mxdB);
      }
    }

    addToSpecific(sKey, mxdB) 
    {
      if (isArr(mxdB)) {
        this.addArrToSpecific(sKey, mxdB);
      } else {
        this.addObjToSpecific(sKey, mxdB);
      }
    }

    serialize() 
    {
      return stateSerialize(this.mState);
    }

    // Take information from the buckets and assign to relevent clients
    // Returns a new object
    reduce(thisId, ids) 
    {
      const response = this;
      
      let newBuckets = new AddressedResponse();
      let b = this.buckets;
      let s = this.specific;

      let defaultBuckets = {};
      defaultBuckets[this.DEFAULT_BUCKET] = 1
      defaultBuckets[this.EVERYONE_ELSE_BUCKET] = 1
      defaultBuckets[this.EVERYONE_BUCKET] = 1
      // dev warning since my application wont be using any other buckets - @TODO remove 
      this.mBuckets.keys().forEach(bucket => {
        if (!isDef(defaultBuckets[bucket])) {
          console.log("HEYYY!!!, WRONG BUCKET NAME!!", bucket);
        }
      });

      // move default to thisId
      if (b.has(response.DEFAULT_BUCKET)) newBuckets.addToSpecific(thisId, b.get(response.DEFAULT_BUCKET));
      let hasEveryoneBucket = b.has(response.EVERYONE_BUCKET);
      let hasEveryoneElseBucket = b.has(response.EVERYONE_ELSE_BUCKET);
      ids.forEach(id => {
        // add Everyone else
        if (hasEveryoneElseBucket) {
          if (id !== thisId) {
            newBuckets.addToSpecific(id, b.get(response.EVERYONE_ELSE_BUCKET));
          }
        }

        // Add to everyone
        if (hasEveryoneBucket) {
          newBuckets.addToSpecific(id, b.get(response.EVERYONE_BUCKET));
        }

        // add any specific ones
        if (s.has(id)) newBuckets.addToSpecific(id, s.get(id));
      });
      return newBuckets;
    }
  }

  return AddressedResponse;
}