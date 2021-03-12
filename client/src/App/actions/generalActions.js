const set = (path = [], value = null) => async (dispatch) => {
  dispatch({
    type: `SET`,
    payload: {
      path,
      value,
    },
  });
  return Promise.resolve();
};

const dispatchDelegate = (fn) => async (dispatch) => {
  await fn(dispatch);
};

export default {
  set,
  dispatchDelegate,
};
