const { isDef } = require("../utils.js");
const PlayerTurn = require("./playerTurn.js");

function TurnManager(){
    let mState;

    let mPlayerManager;
    let mGameRef;


    let mCurrentTurn;
    let mCurrentTurnPlayerIndex = 0;
    let mCanProceedNextTurn = true;


    function injectDeps(deps){
        mPlayerManager = deps.playerManager;
        mGameRef = deps.gameRef
    }

    function validateDeps(){
        return isDef(mPlayerManager) && mGameRef;
    }

    function newTurn(){
        if (isDef(mCurrentTurn)) {
            mCurrentTurn.destroy();
        }
        let playerKeys = mPlayerManager.getAllPlayerKeys();
        if (playerKeys.length > 0) {
            mCurrentTurn = PlayerTurn(mGameRef, playerKeys[mCurrentTurnPlayerIndex]);
        }
        return mCurrentTurn;
    }

    /**
     * Will destroy the current and create a new turn for the next player
     * @return string player key for the next turn
     */
    function nextPlayerTurn(){
        if (getCanProceedToNextTurn()) {
            let numPlayers = mPlayerManager.getPlayerCount();
            mCurrentTurnPlayerIndex = (mCurrentTurnPlayerIndex + 1) % numPlayers;
            newTurn();

            let playerKeys = mPlayerManager.getAllPlayerKeys();
            return playerKeys[mCurrentTurnPlayerIndex];
          }
          return undefined;
    }

    function getCurrentTurnPlayerKey() {
        let playerKeys = mPlayerManager.getAllPlayerKeys();
        return playerKeys[mCurrentTurnPlayerIndex];
    }

    function getCurrentTurnPlayer() {
        let playerKey = getCurrentTurnPlayerKey();
        if (isDef(playerKey)) {
            return mPlayerManager.getPlayer(playerKey);
        }
        return null;
    }

    function getCanProceedToNextTurn() {
        return mCanProceedNextTurn;
    }

    function setCanProceedToNextTurn(val) {
        mCanProceedNextTurn = val;
    }

    function getCurrentTurn() {
        return mCurrentTurn;
    }



    function destroyCurrentTurn() {
        if (isDef(mCurrentTurn)) {
            mCurrentTurn.destroy();
          }
    }

    function reset(){
        mState = {};
        mCurrentTurnPlayerIndex = 0;
        mCanProceedNextTurn = true;
    }

    function serialize(){
        let currentTurn = getCurrentTurn();
        let turnState = null;
        if(isDef(currentTurn)){
            turnState = currentTurn.serialize()
        }

        return {
            currentTurnPlayerIndex: mCurrentTurnPlayerIndex,
            current: turnState
        }
    }

    function unserialize(data){
        mCurrentTurnPlayerIndex = data.currentTurnPlayerIndex;
        newTurn();
        getCurrentTurn().unserialize(data.current);
    }

    const publicScope = {
        newTurn,
        getCanProceedToNextTurn,
        setCanProceedToNextTurn,
        nextPlayerTurn,
        getCurrentTurnPlayerKey,
        getCurrentTurnPlayer,
        getCurrentTurn,
        destroyCurrentTurn,
        
        //-------------
        injectDeps,
        validateDeps,
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