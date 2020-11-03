const { identity, isObj, nDeep } = require("../../server/utils");
const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const utilsFolder = `${serverFolder}/utils`;
const fs = require('fs');
const assert = require("chai").assert;
const buildAffected = require(`${serverFolder}/Lib/Affected`);
const buildOrderedTree = require(`${serverFolder}/Lib/OrderedTree`);
const {
  isDef,
  isDefNested,
  setNestedValue,
  getNestedValue,
} = require(`${utilsFolder}`);
let dump = (template) => console.log("@@@@@", JSON.stringify(template, null, 2));

describe("Affected", async function () {

  const OrderedTree = buildOrderedTree();

  const Affected = buildAffected({isDef, isDefNested, setNestedValue, getNestedValue, OrderedTree});
  it(`Multiple Ids sould be able to be recorded in correct order`, async () => {
    let affected = new Affected();
    affected.setAffected("player", 2);
    affected.setAffected("player", 100);
    let affectedPlayerIds = affected.getIdsAffected("player");
    assert.equal(JSON.stringify(affectedPlayerIds), JSON.stringify([2, 100]), "The ids should match exactly in order")
    dump(affectedPlayerIds);
  });


  
}); // end App description
