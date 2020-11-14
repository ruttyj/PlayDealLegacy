const { identity, isObj, nDeep } = require("../../server/utils");
const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const utilsFolder = `${serverFolder}/utils`;
const fs = require('fs');
const assert = require("chai").assert;

const buildAffected = require(`${serverFolder}/Lib/Affected`);
const buildOrderedTree = require(`${serverFolder}/Lib/OrderedTree`);
//const buildStealCollectionAction = require(`${serverFolder}/Lib/Actions/StealCollection/StealCollectionAction`);





const {
  isDef,
  isArr,
  isFunc,
  isDefNested,
  setNestedValue,
  getNestedValue,
} = require(`${utilsFolder}`);
let dump = (template) => console.log("@@@@@", JSON.stringify(template, null, 2));
console.clear();





describe("Affected", async function () {

  const OrderedTree = buildOrderedTree();
  const Affected = buildAffected({OrderedTree});

  /*
  const PUBLIC_SUBJECTS = {};
  const StealCollectionAction = buildStealCollectionAction({
    isDef, isArr, isFunc,
    Affected, AddressedResponse,
    PUBLIC_SUBJECTS,
  });
 

  const mStealCollectionAction = new StealCollectionAction();

  StealCollectionAction({
    props: {
      roomCode: "AAAA",
    }
  });

  it(`should do something`, async () => {
    assert.equal(1,1);
  });
  //*/

}); // end App description
