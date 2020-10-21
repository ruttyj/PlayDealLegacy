const { isDef, isDefNested, isObj, isArr, makeMap, getKeyFromProp } = require("../utils.js");
const PlayerTurn = require("./playerTurn.js");
const constants = require("../config/constants.js");

function TurnManager(){
    let mState;

    let mPlayerManager;

    function injectDeps(deps){
        mPlayerManager = deps.playerManager;
    }

    function reset(){
        mState = {};
    }

    function serialize(){
        return {

        }
    }

    function unserialize(data){

    }

    const publicScope = {
        injectDeps,
        
        reset,
        serialize,
        unserialize,
    }

    function getPublic() {
        return { ...publicScope };
    }

    reset();
    return getPublic();
}


module.exports = TurnManager;