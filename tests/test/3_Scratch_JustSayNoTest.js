const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const socketFolder = `${serverFolder}/sockets`;
const clientFolder = `${rootFolder}/client`;
const utilsFolder = `${serverFolder}/utils`;
const playDealFolder = `${serverFolder}/Game`;
const gameFolder = `${serverFolder}/Game`;
const GameInstance = require(`${gameFolder}/`);
const {
  CONFIG, // CONFIG Options
  IS_TEST_MODE,
  AMBIGUOUS_SET_KEY,
  NON_PROPERTY_SET_KEYS,
} = require(`${gameFolder}/config/constants.js`);


const assert = require("chai").assert;
const {
  makeVar,
  makeMap,
  makeList,

  isDef,
  isDefNested,
  isArr,
  isFunc,
  isObj,

  getNestedValue,
  jsonLog,

  recursiveBuild,
  nDeep,

  identity,
} = require(`${utilsFolder}`);
console.clear();



class Base {
  constructor(data=null) 
  {
    this.init();
    if (isDef(data)) {
      this.unserialize(data);
    }
  }

  init() 
  {
    this.mState = {}
  }

  destroy() 
  {

  }

  reset() {
    this.destroy();
    this.init();
  }

  serialize() 
  {
    let result = {};
    
    return result;
  }

  unserialize(data) 
  {

  }
}

class Request extends Base {

  constructor(data=null)
  {
    super(data);
  }

  init() 
  {
    this.mState = {}
    this.mId = makeVar(this.mState, "id", null);
    this.mType = makeVar(this.mState, "type", null);
    this.mValue = makeVar(this.mState, "value", null);
  }

  id()
  {
    return this.mId;
  }

  type()
  {
    return this.mType;
  }

  value()
  {
    return this.mValue;
  }


  serialize()
  {
    return {
      id:     this.mId.serialize(),
      type:   this.mType.serialize(),
      value:  this.mValue.serialize(),
    }
  }

  unserialize(data)
  {
    if (isDef(data.id))  this.mId.set(data.id);
    if (isDef(data.type))   this.mType.set(data.type);
    if (isDef(data.value))  this.mValue.set(data.value);
  }

}



class RequestManager extends Base {

  constructor(data=null)
  {
    super(data);
  }

  init() 
  {
    this.mState = {}
    this.mTopId = makeVar(this.mState, "topId", 0);
    this.mRequestOrder = makeList(this.mState, "requestOrder", []);
    this.mRequests = makeMap(this.mState, "requests", {});
  }

  serialize()
  {
    return {
      "is":   "requestManager",
      topId:   this.mTopId.get(),
    }
  }

  unserialize(data)
  {
    if (isDef(data.topId))  this.mTopId.set(data.topId);
  }

  _registerRequest(newId, newRequest)
  {
    this.mRequestOrder.push(newId);
    this.mRequests.set(newId, newRequest);
  }

  createRequest(data = null) 
  {
    // Create request
    let newRequest = new Request(data);

    // Assign ID
    let newId = this.mTopId.get();
    this.mTopId.inc();
    newRequest.id().set(newId);

    // Register
    this._registerRequest(newId, newRequest);

    return newRequest;
  }
}



class RequestChain extends Base {
  init() 
  {
    this.mState = {}
    this.mResponseHistory   = makeList(this.mState,  "mResponseHistory",     []);
    this.mRootAction        = makeVar(this.mState,   "mRootAction",      new Request({ type: 'NOTHING'}));
    this.mPreviousAction    = makeVar(this.mState,   "mPreviousAction",  new Request({ type: 'NOTHING'}));
    this.mCurrentAction     = makeVar(this.mState,   "mCurrentAction",   new Request({ type: 'NOTHING'}));
  }

  get history() { 
    return this.mResponseHistory;
  }

  get rootAction() {
    return this.mRootAction;
  }

  get previousAction() {
    return this.mPreviousAction;
  }

  get currentAction() {
    return this.mCurrentAction;
  }

  applyResponse (response) {
    let rootActionType    = ((this.mRootAction.get()).mType).get();
    let currentActionType = ((this.mCurrentAction.get()).mType).get();

    //Request
    // For deal breaker cards only
    if (rootActionType === 'DEALBREAKER'){
      let currentChanged = false;
      if (currentActionType === 'DEALBREAKER') {
        if (response === 'SAY_NO') {
          this.mPreviousAction.set(this.mCurrentAction.get());
          this.mCurrentAction.set(new Request({ type: 'NOTHING'}));
          currentChanged = true;
        } else if (response === 'REVERSE') {
          // @TODO
        } else if (response === 'ACCEPT') {
          // @TODO
        }
      } else if(currentActionType === 'NOTHING') {
        if (response === 'SAY_NO') {
          this.mPreviousAction.set(this.mCurrentAction.get());
          this.mCurrentAction.set(new Request({ type: rootActionType}));
          currentChanged = true;
        } else if (response === 'ACCEPT') {
          currentChanged = true;
        }
      }

      // Log in history
      if (currentChanged) {
        this.mResponseHistory.push(response);
      }
    }
    // end DEALBREAKER


  }

  serialize() 
  {
    let result = {
      rootAction:     (this.mRootAction.get()).serialize(),
      currentAction:  (this.mCurrentAction.get()).serialize(),
      previousAction: (this.mPreviousAction.get()).serialize(),
      actionHistory:  this.mResponseHistory.serialize(),
    };
    return result;
  }
}



describe("", async function () {
  it(`Do the thing`, async () => {
    let responses = ['SAY_NO'];
    let doActionTokens = ['DEALBREAKER', 'NOTHING'];

    let mRequestChain = new RequestChain();
    let rootAction = new Request({ type: 'DEALBREAKER'});
    mRequestChain.rootAction.set(rootAction);
    mRequestChain.currentAction.set(rootAction);

    console.log("Try to dealbreaker a collection",
        mRequestChain.serialize()
    )

    mRequestChain.applyResponse('SAY_NO');
    console.log("Said no to dealbreaker",
        mRequestChain.serialize()
    )

    mRequestChain.applyResponse('SAY_NO');
    console.log("Insisted on deal breaker",
        mRequestChain.serialize()
    )

    mRequestChain.applyResponse('SAY_NO');
    console.log("I Said NO!!!!",
        mRequestChain.serialize()
    )

    mRequestChain.applyResponse('ACCEPT');
    console.log("Awwww, NO SET FOR YOU",
        mRequestChain.serialize()
    )

  });
}); 
