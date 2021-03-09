const cookieParser = require("cookie-parser");
const { isDef, makeMap, makeVar } = require("../utils/");
function CookieTokenManager() {
  cookieParser.JSONCookie("token");

  let mState = {};
  let mTokenMap = makeMap(mState, "tokenMap");
  let mClientHasTokensMap = makeMap(mState, "clientToToken");
  let mTokenHasClientsMap = makeMap(mState, "tokenToClient");
  let mTopId = makeVar(mState, "topId", 0);

  function generateToken() {
    const rand = () => Math.random().toString(36).substr(2);
    const makeToken = () => rand() + rand();

    let token;
    do {
      token = makeToken();
    } while (mTokenMap.has(token));

    mTokenMap.set(token, {});

    return token;
  }

  function associateTokenAndClient(token, clientId) {
    if (mTokenMap.has(token)) {
      let tokens = mClientHasTokensMap.get(clientId, {});
      if (!isDef(tokens[token])) {
        tokens[token] = true;
        mClientHasTokensMap.set(clientId, tokens);
      }

      let clientIds = mTokenHasClientsMap.get(token, {});
      if (!isDef(clientIds[token])) {
        clientIds[clientId] = true;
        mTokenHasClientsMap.set(token, clientIds);
      }
    }
  }

  function dissociateTokenAndClient(token, clientId) {
    if (mTokenMap.has(token)) {
      let tokens = mClientHasTokensMap.get(clientId, {});
      if (isDef(tokens[token])) {
        delete tokens[token];
        if (Object.keys(tokens).length === 0) {
          mClientHasTokensMap.remove(clientId);
        }
      }

      let clientIds = mTokenHasClientsMap.get(token, {});
      if (isDef(clientIds[token])) {
        delete clientIds[clientId];
        if (Object.keys(clientIds).length === 0) {
          mTokenHasClientsMap.remove(token);
        }
      }
    }
  }

  function dissociateClient(clientId) {
    let tokensKeyed = mClientHasTokensMap.get(clientId, {});
    if (isDef(tokensKeyed)) {
      console.log("dissociate", clientId);
      let tokens = Object.keys(tokensKeyed);
      tokens.forEach((token) => {
        let toClients = mTokenHasClientsMap.get(token);
        if (isDef(toClients[clientId])) delete toClients[clientId];
      });
      mClientHasTokensMap.remove(clientId);
    }
  }

  function getClientIdsForToken(token) {
    return Object.keys(mTokenHasClientsMap.get(token, {}));
  }

  function getTokensForClientId(clientId) {
    return Object.keys(mClientHasTokensMap.get(clientId, {}));
  }

  function getTokenForClientId(clientId) {
    let tokens = getTokensForClientId(clientId);
    if (isDef(tokens)) {
      return tokens[0];
    }
    return null;
  }

  function remove(token) {
    mTokenMap.remove(token);
  }

  function get(token) {
    return mTokenMap.get(token);
  }

  function serialize() {
    let result = {
      clientHasTokens: {},
      tokenHasClients: {},
      tokenData: {},
    };
    mClientHasTokensMap.forEach((value, key) => {
      result.clientHasTokens[key] = value;
    });
    mTokenHasClientsMap.forEach((value, key) => {
      result.tokenHasClients[key] = value;
    });
    mTokenMap.forEach((value, key) => {
      result.tokenData[key] = value;
    });
    return result;
  }

  const publicScope = {
    generateToken,
    getClientIdsForToken,
    getTokensForClientId,
    getTokenForClientId,
    associateTokenAndClient,
    dissociateClient,
    remove,
    get,
    set: mTokenMap.set,
    has: mTokenMap.has,
    serialize,
  };

  function getPublic() {
    return publicScope;
  }

  return getPublic();
}

var SingletonWrapper = (function () {
  var instance;

  function createInstance() {
    var object = CookieTokenManager();
    return object;
  }

  return {
    getInstance: function () {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();

module.exports = SingletonWrapper;
