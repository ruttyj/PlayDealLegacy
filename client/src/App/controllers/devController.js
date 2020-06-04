import { connect } from "react-redux";
import devGetters from "../getters/devGetters";
import { AbstractImmutableObject } from "../../utils/ReactStateTools";
import {
  els,
  isDef,
  isArr,
  setImmutableValue,
  getNestedValue,
  setNestedValue,
  makeVar,
  makeList,
  makeTree,
  makeMap,
} from "../../utils/";

const exampleAction = (key) => (dispatch) => {
  dispatch({
    type: "DEV_SET",
    payload: key,
  });
};

/*


  const mInitialState = {}
  const getters = {}
  const actions = {}
  ======================
      PSEUDO MARKUP
  ======================

  let mSubjectName = "items" 
  let pathToValue = ["dev", "items"];
  methods avaialble:
  props: {
    [mSubjectName]: {
      set,
      getAll,
      items,
    }
  }


  // STATE ==========================
  function addToInitialState(path, value){
    setNestedValue(mInitialState, path, value);
  }


  // GETTERS ==========================
  createSetter(path) => {

    let setterSignature = ([key, value]) => {
      return payload = {key, value}
    }

    let setterReducerLogic = (state, payload) => {
      let { key, value } = payload;
      return setImmutableValue(state, [...path, key], value);
    }



    // ACTIONS ==========================
    createActions = (path) => {
      Object.assign(actions, {

        setItem: (...args) => dispatch => {
          dispatch({
            type: `${mSubjectName}_SET`,
            ...setterSignature(args)
            payload: {
              key, 
              value
            }
          })

      }),
    }
    // REDUCER =========================
    createMutator = (path) => (state, action) => {
      let { type: eventType, payload } = action;
      switch (eventType) {
        case `${mSubjectName}_SET`:
          return setterReducerLogic(payload);
      }
    }
  }


  // GETTERS ==========================
  // make getters
  let methodName = `getAllItems`;
  createGetter = (path) => (state) => {
    let clonedState = {...state}; 

    //expost data object
    clonedState.devItems = state[SECTION].items


    Object.assign(clonedState, {
      [mSubjectName]: {
        getAll: (fallback) => getNestValue(state, path, fallback),
      }
    })


    return clonedState;
  }



  ======================
      WHAT IS NEEDED?
  ======================

  SECTION

  //==========================================
  State:
  {
    items: 
  }

 
  //==========================================  
  Action Definition:
    const exampleAction = (key, value) => dispatch => {
      dispatch({
        type: "DEV_SET",
        payload: {
          key, 
          value
        }
      });
    };

  Reducer/Mutator: (state, action)
    let { type: eventType, payload } = action;
    switch (eventType) {
      case "DEV_SET":
        let { key, value } = payload;
        return setImmutableValue(state, [...path, key], value);

  Action Execution ~~~~~~~~~~~~~~~~~~~~~~~~
    props.exampleAction(key)



  //==========================================
  Getter Definition (state) // added to props
    {
      devItems: state[SECTION].items
    }
  // Getter Execution ~~~~~~~~~~~~~~~~~~~~~~~~
  props.devItems
    


*/

function makeStoreBasedImmutableObject() {
  let immutableObject = AbstractImmutableObject();
  immutableObject.setAllSetterFn();
  //immutableObject.setAllGetterFn();
  //immutableObject.setNormalizeFn();
  //immutableObject.setAllMutatorFn();

  return {
    actions: {},
    getters: {},
    reducers: {},
  };
}

const DevController = function () {
  let mLocal = {};
  const mInitialState = {};

  let actionMap = makeMap(mLocal, "actionMap");
  let mutatorMap = makeMap(mLocal, "mutatorMap");
  let getterList = makeList(mLocal, "getterList");

  //#######################################################

  //                    CreateStoreMap

  //#######################################################

  function CreateStoreMap(mSectionName, _pathToValue) {
    let pathToValue = isArr(_pathToValue) ? _pathToValue : [_pathToValue];

    // Initial state
    setNestedValue(mInitialState, pathToValue, {});

    // Set item method --------------------------------
    let mutatorType = String(
      `${mSectionName}_${pathToValue.join("_")}_set`
    ).toUpperCase();

    // Will place the items at mSubjectName.set once expanded
    let methodName = `${pathToValue.join("__")}__set`;

    // Action
    let actionMethodDefn = (key, value) => (dispatch) => {
      dispatch({
        type: mutatorType,
        payload: { key, value },
      });
    };
    // Mutator
    let mutatorDefn = (state, payload) => {
      let { key, value } = payload;
      return setImmutableValue(state, [...pathToValue, "items", key], value);
    };

    actionMap.set(methodName, actionMethodDefn);
    mutatorMap.set(mutatorType, mutatorDefn);
    // End Set item method --------------------------------

    // Get raw data ---------------------------------------
    if (1) {
      let getterMethod = (state) => {
        let valuePath = [mSectionName, ...pathToValue, "items"];
        let items = getNestedValue(state, valuePath);

        let resultState = {
          ...state,
          [`${pathToValue.join("__")}__items`]: items,
          //[`${pathToValue.join("__")}__get`]: () => (key) => ,
        };
        return resultState;
      };
      getterList.add(getterMethod);
    }
    // End get item values --------------------------------
  }

  let mSectionName = "dev";

  CreateStoreMap(mSectionName, ["fruit"]);

  // initialize

  function connectToComponent(component) {
    const mapStateToProps = (state) => ({
      ...devGetters(state),
    });
    const mapDispatchToProps = {
      exampleAction,
    };
    return connect(mapStateToProps, mapDispatchToProps)(component);
  }

  // SETTERS ==========================

  // ACTIONS -----------------------------
  function actions() {
    return {
      ...actionMap.getAll(),
    };
  }

  // REDUCERS -----------------------------
  function reducer(state = mInitialState, action) {
    let { type: eventType, payload } = action;

    if (mutatorMap.has(eventType)) {
      return mutatorMap.get(eventType)(state, payload);
    }

    return state;
  }

  // GETTERS ==========================
  function getters(state) {
    let resultState = { ...state };

    getterList.forEach((applyGetter) => {
      resultState = applyGetter(resultState);
    });

    return resultState;
  }

  // EXPAND PROPS FOR CONVIENCE
  // methods with __ in name will be split and nested
  function expandActionProps(props) {
    let result = {};
    let propKeys = Object.keys(props);
    propKeys.forEach((key) => {
      setNestedValue(result, key.split("__"), props[key]);
    });
    return result;
  }

  return {
    reducer,
    actions,
    getters,
    connectToComponent,
    expandActionProps,
  };
};

const devController = DevController();
export { devController };
