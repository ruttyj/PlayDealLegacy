import React from "react";

let makeChargeRentPayload = function makePayload({ hasAuthorCollected }) {
  return {
    actionNum: 2,
    amountDue: 4,
    amountRemaining: 4,
    actionCardId: 50,
    actionCollectionId: 8,
    augmentCardIds: [48],
    transaction: {
      is: "Transaction",
      isComplete: false,
      isEmpty: false,
      items: {
        toAuthor: {
          is: "MultiTransfer",
          isComplete: hasAuthorCollected,
          items: {
            bank: {
              is: "Transfer",
              isEmpty: false,
              items: [102],
              transfered: hasAuthorCollected ? [102] : []
            },
            property: {
              is: "Transfer",
              isEmpty: false,
              items: [103],
              transfered: hasAuthorCollected ? [103] : []
            }
          }
        }
      }
    }
  };
};

let makeSwapProperty = function makePayload({ hasAuthorCollected, hasTargetCollected }) {
  return {
    actionNum: 1,
    actionCardId: 30,
    transaction: {
      is: "Transaction",
      isComplete: false,
      isEmpty: false,
      items: {
        fromAuthor: {
          is: "MultiTransfer",
          isComplete: true,
          items: {
            property: {
              is: "Transfer",
              isEmpty: false,
              items: [70],
              transfered: [70]
            }
          }
        },
        fromTarget: {
          is: "MultiTransfer",
          isComplete: true,
          items: {
            property: {
              is: "Transfer",
              isEmpty: false,
              items: [67],
              transfered: [67]
            }
          }
        },
        toTarget: {
          is: "MultiTransfer",
          isComplete: hasTargetCollected,
          items: {
            property: {
              is: "Transfer",
              isEmpty: false,
              items: [70],
              transfered: hasTargetCollected ? [70] : []
            }
          }
        },
        toAuthor: {
          is: "MultiTransfer",
          isComplete: hasAuthorCollected,
          items: {
            property: {
              is: "Transfer",
              isEmpty: false,
              items: [67],
              transfered: hasAuthorCollected ? [67] : []
            }
          }
        }
      }
    }
  };
};

let makeStealProperty = function makePayload({ hasAuthorCollected, hasTargetCollected }) {
  return {
    actionNum: 1,
    actionCardId: 30,
    transaction: {
      is: "Transaction",
      isComplete: false,
      isEmpty: false,
      items: {
        fromTarget: {
          is: "MultiTransfer",
          isComplete: true,
          items: {
            property: {
              is: "Transfer",
              isEmpty: false,
              items: [67],
              transfered: [67]
            }
          }
        },
        toAuthor: {
          is: "MultiTransfer",
          isComplete: hasAuthorCollected,
          items: {
            property: {
              is: "Transfer",
              isEmpty: false,
              items: [67],
              transfered: hasAuthorCollected ? [67] : []
            }
          }
        }
      }
    }
  };
};

let makeDealBreakerPayload = function makePayload({ hasAuthorCollected, hasTargetCollected }) {
  return {
    actionNum: 1,
    actionCardId: 30,
    transaction: {
      is: "Transaction",
      isComplete: false,
      isEmpty: false,
      items: {
        fromTarget: {
          is: "MultiTransfer",
          isComplete: true,
          items: {
            collection: {
              is: "Transfer",
              isEmpty: false,
              items: [1],
              transfered: [1]
            }
          }
        },
        toAuthor: {
          is: "MultiTransfer",
          isComplete: hasAuthorCollected,
          items: {
            collection: {
              is: "Transfer",
              isEmpty: false,
              items: [1],
              transfered: hasAuthorCollected ? [1] : []
            }
          }
        }
      }
    }
  };
};

function makeMockRequests({ thisPersonId, isGood, isClosed, requestState, haveICollectedState, haveTheyCollectedState }) {
  let runningRequestId = 0;
  return [
    {
      id: ++runningRequestId,
      type: "collectValue",
      status: requestState,
      description: "charge rent",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 1,
      authorKey: 2,
      actionCardId: 50,
      payload: makeChargeRentPayload({
        hasAuthorCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 1 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "stealCollection",
      status: requestState,
      description: "Steal collection",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 1,
      authorKey: 2,
      actionCardId: 22,
      payload: makeDealBreakerPayload({
        hasAuthorCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 1 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "justSayNo",
      status: requestState,
      description: "Said No!",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 1,
      authorKey: 2,
      actionCardId: 23,
      payload: {}
    },
    {
      id: ++runningRequestId,
      type: "stealProperty",
      status: requestState,
      description: "Steal properties",
      hasTargetSatisfied: isGood,
      isClosed: isClosed,
      targetKey: 1,
      authorKey: 2,
      actionCardId: 26,
      payload: makeStealProperty({
        hasAuthorCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 1 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "swapProperty",
      status: requestState,
      description: "Swap properties",
      hasTargetSatisfied: isGood,
      isClosed: isClosed,
      targetKey: 1,
      authorKey: 2,
      actionCardId: 30,
      payload: makeSwapProperty({
        hasAuthorCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 1 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "collectValue",
      status: requestState,
      description: "charge rent",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 2,
      authorKey: 1,
      actionCardId: 50,
      payload: makeChargeRentPayload({
        hasAuthorCollected: 1 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "stealCollection",
      status: requestState,
      description: "Steal collection",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 2,
      authorKey: 1,
      actionCardId: 22,
      payload: makeDealBreakerPayload({
        hasAuthorCollected: 1 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "justSayNo",
      status: requestState,
      description: "Said No!",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 2,
      authorKey: 1,
      actionCardId: 23,
      payload: {}
    },
    {
      id: ++runningRequestId,
      type: "stealProperty",
      status: requestState,
      description: "Steal properties",
      hasTargetSatisfied: isGood,
      isClosed: isClosed,
      targetKey: 2,
      authorKey: 1,
      actionCardId: 26,
      payload: makeStealProperty({
        hasAuthorCollected: 1 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "swapProperty",
      status: requestState,
      description: "Swap properties",
      hasTargetSatisfied: isGood,
      isClosed: isClosed,
      targetKey: 2,
      authorKey: 1,
      actionCardId: 30,
      payload: makeSwapProperty({
        hasAuthorCollected: 1 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "collectValue",
      status: requestState,
      description: "charge rent",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 2,
      authorKey: 3,
      actionCardId: 50,
      payload: makeChargeRentPayload({
        hasAuthorCollected: 3 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "stealCollection",
      status: requestState,
      description: "Steal collection",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 2,
      authorKey: 3,
      actionCardId: 22,
      payload: makeDealBreakerPayload({
        hasAuthorCollected: 3 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "justSayNo",
      status: requestState,
      description: "Said No!",
      isClosed: isClosed,
      hasTargetSatisfied: isGood,
      targetKey: 2,
      authorKey: 3,
      actionCardId: 23,
      payload: {}
    },
    {
      id: ++runningRequestId,
      type: "stealProperty",
      status: requestState,
      description: "Steal properties",
      hasTargetSatisfied: isGood,
      isClosed: isClosed,
      targetKey: 2,
      authorKey: 3,
      actionCardId: 26,
      payload: makeStealProperty({
        hasAuthorCollected: 3 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    },
    {
      id: ++runningRequestId,
      type: "swapProperty",
      status: requestState,
      description: "Swap properties",
      hasTargetSatisfied: isGood,
      isClosed: isClosed,
      targetKey: 2,
      authorKey: 3,
      actionCardId: 30,
      payload: makeSwapProperty({
        hasAuthorCollected: 3 === thisPersonId ? haveICollectedState : haveTheyCollectedState,
        hasTargetCollected: 2 === thisPersonId ? haveICollectedState : haveTheyCollectedState
      })
    }
  ];
}

export default makeMockRequests;
