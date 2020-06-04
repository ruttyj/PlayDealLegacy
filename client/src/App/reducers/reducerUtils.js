import { isDef, setImmutableValue, getNestedValue } from "../../utils/";
const makeGetOrderedItemized = (field) => (state, { payload }) => {
  let itemPath = [field, "items"];
  let orderPath = [field, "order"];
  let fetchedItems = payload.items;
  let fetchedOrder = payload.order;
  let previousItems = getNestedValue(state, itemPath, {});
  let previousOrder = getNestedValue(state, orderPath, []);

  let updatedItems = { ...previousItems };
  Object.keys(fetchedItems).forEach(
    (key) => (updatedItems[key] = fetchedItems[key])
  );
  let updatedOrder = Array.from(new Set([...previousOrder, ...fetchedOrder]));

  let updatedState = state;
  updatedState = setImmutableValue(updatedState, itemPath, updatedItems);
  updatedState = setImmutableValue(updatedState, orderPath, updatedOrder);

  return updatedState;
};

const makeGetOrdered = (field) => (state, { payload }) => {
  let orderPath = [field, "order"];
  let fetchedOrder = payload.order;
  let previousOrder = getNestedValue(state, orderPath, []);

  let updatedOrder = Array.from(new Set([...previousOrder, ...fetchedOrder]));

  let updatedState = state;
  updatedState = setImmutableValue(updatedState, orderPath, updatedOrder);

  return updatedState;
};

const makeGetItemized = (field) => (state, { payload }) => {
  let fetchedItems = payload.items;
  let path = [field, "items"];

  let previousItems = getNestedValue(state, path, {});
  let updatedItems = { ...previousItems };

  Object.keys(fetchedItems).forEach(
    (key) => (updatedItems[key] = fetchedItems[key])
  );

  let updatedState = state;
  updatedState = setImmutableValue(updatedState, path, updatedItems);

  return updatedState;
};

const makeRemoveItemized = (field) => (state, { payload }) => {
  let removeItemsIds = getNestedValue(payload, "removeItemsIds", []);
  let path = [field, "items"];

  let previousItems = getNestedValue(state, path, {});
  let updatedItems = { ...previousItems };
  removeItemsIds.forEach((id) => {
    delete updatedItems[id];
  });

  let updatedState = state;
  updatedState = setImmutableValue(updatedState, path, updatedItems);

  return updatedState;
};

const makeData = (field) => (state, { payload }) => {
  let fetchedData = payload;
  let previousItems = getNestedValue(state, field, {});

  // Create updated object
  let updatedItems = { ...previousItems };
  Object.keys(fetchedData).forEach(
    (key) => (updatedItems[key] = fetchedData[key])
  );

  //  Immutably set value
  let updatedState = state;
  updatedState = setImmutableValue(updatedState, [field], updatedItems);

  return updatedState;
};

const resetData = (field) => (state, { payload }) => {
  let updatedState = state;
  updatedState = setImmutableValue(updatedState, "requests", payload);
  return updatedState;
};
export {
  makeGetItemized,
  makeGetOrdered,
  makeGetOrderedItemized,
  makeData,
  makeRemoveItemized,
  resetData,
};
