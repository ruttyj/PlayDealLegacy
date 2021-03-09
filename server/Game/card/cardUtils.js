const utils = {
  sort: function (arr, order = "asc", propertyRetriever = (v) => v) {
    let c = String(order).toLowerCase() === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      var valueA = propertyRetriever(a);
      var valueB = propertyRetriever(b);

      if (valueA < valueB) {
        return -1 * c;
      } else if (valueA > valueB) {
        return 1 * c;
      } else {
        return 0;
      }
    });
  },
  randomRange: function (min, max) {
    return Math.floor(Math.random() * max - min) + min;
  },
  findIndexOfCardById: function (arr, cardId) {
    return arr.findIndex((card) => card.id === cardId);
  },
  removeCardByIndex: function (arr, index) {
    arr.splice(index, 1);
  },
  giveCardByIdFromArray: function (arr, cardId) {
    const index = utils.findIndexOfCardById(arr, cardId);
    if (index > -1) {
      let card = arr[index];
      utils.removeCardByIndex(arr, index);
      return card;
    }
    return null;
  },
};

module.exports = utils;
