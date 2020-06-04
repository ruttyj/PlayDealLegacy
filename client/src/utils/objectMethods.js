import _ from "lodash";
// From a reference object traverse an array of keys to get a nested value else fallback value
const getNestedValue = function(reference, path, fallback = undefined) {
  path = Array.isArray(path) ? path : [path];

  var pointer = reference;
  for (var i = 0, len = path.length; i < len; i++) {
    if (
      typeof pointer !== "string" &&
      pointer !== null &&
      typeof pointer[path[i]] !== "undefined"
    ) {
      pointer = pointer[path[i]];
    } else {
      return fallback;
    }
  }

  if (typeof pointer === "string") {
    pointer = ("" + pointer).trim();
    if (pointer.length === 0) return fallback;
  }
  return pointer;
};

// Makes up for vues missing functionality to reactivly set a value many layers deep
const setNestedValue = function(a, b, c, d) {
  var setter, startingRef, tempPath, value;
  if (typeof a === "function") {
    // Use a custom setter
    setter = a;
    startingRef = b;
    tempPath = c;
    value = d;
  } else {
    // Use Default object syntax to set value.
    setter = (obj, key, val) => {
      obj[key] = val;
    };
    startingRef = a;
    tempPath = b;
    value = c;
  }
  var ref = startingRef;
  var path = tempPath instanceof Array ? tempPath : [tempPath];
  var lastIndex = path.length - 1;
  var current = 0;
  path.forEach(key => {
    if (current === lastIndex) {
      setter(ref, key, value);
    } else {
      if (typeof ref[key] === "object" && ref[key] != null) {
        //proceed to next
      } else if (_.isArray(ref[key])) {
        //proceed to next
      } else {
        var initValue = isNaN(key) ? {} : [];
        setter(ref, key, initValue);
      }
      ref = ref[key];
    }
    ++current;
  });
};

export { setNestedValue, getNestedValue };
