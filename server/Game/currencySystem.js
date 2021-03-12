/**===================================================
 *
 *                  CURRENCY SYSTEM
 *
 * ===================================================
 **/
const buildCurrencySystem = ({isDef, isDefNested}) => {
  return function () {
    let ref = {
      unitsOrder: [],
      unitValueMap: {},
    };

    // Utils
    let utils = {
      convertArrayToMap: function (bills) {
        return bills.reduce((result, billsKey) => {
          // Increment
          result[billsKey] = isDef(result[billsKey]) ? result[billsKey] + 1 : 1;
          return result;
        }, {});
      },
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
    };

    let mItemUnitKeyGetter = (v) => v.value;

    // Ref Getters Setters
    let setUnitValue = (unitKey, v) => (ref.unitValueMap[unitKey] = v);
    let getUnitValue = (unitKey) => ref.unitValueMap[unitKey];
    let getAllUnitsOrder = () => ref.unitsOrder;
    let setAllUnitsOrder = (v) => (ref.unitsOrder = v);

    // Add unit to map and keep track of order
    let addUnit = (unitKey, value) => {
      setUnitValue(unitKey, value);

      // Gve item order - inefficent should use a heap
      ref.unitsOrder.push(unitKey);
      utils.sort(ref.unitsOrder, "asc", getUnitValue);
    };

    let separateIntoBuckets = function (items, getKey) {
      let result = {};
      items.forEach((card) => {
        let key = getKey(card);
        if (isDef(key))
          if (!isDef(result[key])) {
            result[key] = {
              count: 0,
              bucket: [],
            };
          }
        result[key].count = result[key].count + 1;
        result[key].bucket.push(card);
      });
      return result;
    };

    let setUnitKeyGetter = function (fn) {
      mItemUnitKeyGetter = fn;
    };

    let getCurrencyUnitKey = function (card) {
      return mItemUnitKeyGetter(card);
    };

    let findGreedyChange = function (cards, ask) {
      let unitsAscendingOrder = getAllUnitsOrder();
      //let bankMap = utils.convertArrayToMap(cards);
      let bankMap = {};
      cards.forEach((card) => {
        let value = getCurrencyUnitKey(card);
        if (isDef(value))
          bankMap[value] = isDef(bankMap[value]) ? bankMap[value] + 1 : 1;
      });

      let findChange = function (
        availableUnits,
        amountDue,
        unitsAscendingOrder,
        bills = []
      ) {
        /**
         * Description:
         * Checks every number,
         * largest unit to smallest,
         * wither or not the it is in the final solution
         * ie. returns the largest bills possible with the absolute smallest remainder.
         */

        let amountRemaining = amountDue;
        if (unitsAscendingOrder.length > 0) {
          let unitKey = unitsAscendingOrder[unitsAscendingOrder.length - 1];
          let unitValue = getUnitValue(unitKey);

          let trySmallerUnit = true;
          let minRemainder = null;
          let minResult = null;

          // Unit is available
          if (availableUnits[unitKey] > 0 && amountRemaining !== 0) {
            if (amountRemaining >= unitValue) {
              // Unit could be part of solution
              let newAvailableUnits = { ...availableUnits };
              newAvailableUnits[unitKey] = availableUnits[unitKey] - 1;

              // Try with it as part of solution
              let result = findChange(
                newAvailableUnits,
                amountRemaining - unitValue,
                unitsAscendingOrder,
                [...bills, unitKey]
              );
              minRemainder = result.remainder;
              minResult = result;

              // Found solution while using it as part of solution
              if (result.remainder === 0) trySmallerUnit = false;
            }
          }

          // Did not have success with this value as part of solution or the unit was too large
          // Try it with the next smallest unit
          if (trySmallerUnit) {
            let result = findChange(
              availableUnits,
              amountRemaining,
              unitsAscendingOrder.slice(0, -1),
              bills
            );

            if (
              minRemainder === null ||
              (minRemainder !== null && result.remainder < minRemainder)
            ) {
              minResult = result;
              minRemainder = result.remainder;
            }
          }

          // Take solution with the smallest remainder
          bills = isDefNested(minResult, "bills") ? minResult.bills : [];
          amountRemaining = isDefNested(minResult, "remainder")
            ? minResult.remainder
            : 0;
        }

        // Return best solution
        return {
          bills: bills,
          remainder: amountRemaining,
        };
      };

      // Map counter methods
      let minusMaps = function (
        bankMap,
        payBills,
        ascBillKeys,
        keepValues = () => true
      ) {
        let result = {};
        ascBillKeys.forEach((billKey) => {
          let bankQty = isDef(bankMap[billKey]) ? bankMap[billKey] : 0;
          let payQty = isDef(payBills[billKey]) ? payBills[billKey] : 0;
          let resultQty = bankQty - payQty;
          if (keepValues(resultQty)) {
            result[billKey] = resultQty;
          }
        });
        return result;
      };
      let minusFromKey = function (mapping, key, qty = 1) {
        if (mapping[key] > qty) {
          mapping[key] = mapping[key] - qty; // will be > 0
        } else {
          delete mapping[key]; // delete 0
        }
      };
      let addToKey = function (mapping, key, qty = 1) {
        mapping[key] = isDef(mapping[key]) ? mapping[key] + qty : qty;
      };

      let convertToMap = function (bills) {
        return bills.reduce((result, billsKey) => {
          // Increment
          result[billsKey] = isDef(result[billsKey]) ? result[billsKey] + 1 : 1;
          return result;
        }, {});
      };

      // Calculate exact change with limited resources
      let exactChange = findChange(bankMap, ask, unitsAscendingOrder);
      let payBills = convertToMap(exactChange.bills);
      let remainder = exactChange.remainder;

      // Overpay with smallest available unit
      let leftOverAfterExactChange = minusMaps(
        bankMap,
        payBills,
        unitsAscendingOrder,
        (v) => v > 0
      );
      if (remainder !== 0) {
        for (let i = 0; i < unitsAscendingOrder.length; ++i) {
          let billKey = unitsAscendingOrder[i];
          let billValue = getUnitValue(billKey);
          if (isDef(leftOverAfterExactChange[billKey]) && billValue > remainder) {
            // Add larger card to satisfy remainder
            minusFromKey(leftOverAfterExactChange, billKey, 1);
            addToKey(payBills, billKey, 1);
            remainder -= billValue;

            break;
          }
        }
      }

      // Seperate the cards give Vs keep
      let keepCards = [];
      let giveCards = [];
      let payBillsRemaining = { ...payBills };
      cards.forEach((card) => {
        let cardCurrencyUnit = getCurrencyUnitKey(card);
        if (
          isDef(payBillsRemaining[cardCurrencyUnit]) &&
          payBillsRemaining[cardCurrencyUnit] > 0
        ) {
          giveCards.push(card);
          payBillsRemaining[cardCurrencyUnit] =
            payBillsRemaining[cardCurrencyUnit] - 1;
        } else {
          keepCards.push(card);
        }
      });

      let finalResult = {
        keep: leftOverAfterExactChange,
        give: payBills,
        giveCards,
        keepCards,
        remainder: remainder,
      };
      return finalResult;
    };

    return {
      // Units ---------------
      addUnit,
      // UnitsOrder
      getAllUnitsOrder,
      setAllUnitsOrder,
      // UnitValue
      setUnitValue,
      getUnitValue,

      // Buckets ------------
      separateIntoBuckets,

      // Change -------------
      findGreedyChange,
      setUnitKeyGetter,
    };
  }; // END CURRENCY SYSTEM =============================
}
module.exports = buildCurrencySystem;
