const { identity, isObj, nDeep } = require("../../server/utils");
const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const utilsFolder = `${serverFolder}/utils`;
const fs = require('fs');
const assert = require("chai").assert;
const buildAffected = require(`${serverFolder}/Lib/Builders/Affected`);
const buildOrderedTree = require(`${serverFolder}/Lib/Builders/OrderedTree`);
const {
  isDef,
  isDefNested,
  setNestedValue,
  getNestedValue,
} = require(`${utilsFolder}`);
let dump = (template) => console.log("@@@@@", JSON.stringify(template, null, 2));
console.clear();

describe("Affected", async function () {

  const OrderedTree = buildOrderedTree();
  const Affected = buildAffected({OrderedTree});

  it(`Multiple Ids sould be able to be recorded in correct order`, async () => {
    let affected = new Affected();
    affected.setAffected("player", 2);
    affected.setAffected("player", 100);
    let affectedPlayerIds = affected.getIdsAffected("player");
    assert.equal(JSON.stringify(affectedPlayerIds), JSON.stringify([2, 100]), "The ids should match exactly in order")
  });


  it(`Grouping ids by action`, async () => {
    let affected = new Affected();
    affected.setAffected("player", 2,   Affected.ACTION.CREATE);
    affected.setAffected("player", 100, Affected.ACTION.UPDATE);
    affected.setAffected("player", 30,  Affected.ACTION.DELETE);

    let changed = affected.getIdsAffectedByAction("player", Affected.ACTION_GROUP.CHANGE);
    let removed = affected.getIdsAffectedByAction("player", Affected.ACTION_GROUP.REMOVE);

    assert.equal(JSON.stringify(changed), JSON.stringify([2, 100]), "ids should match");
    assert.equal(JSON.stringify(removed), JSON.stringify([30]), "ids should match");
  });



}); // end App description
