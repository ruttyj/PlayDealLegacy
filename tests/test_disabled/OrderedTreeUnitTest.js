const rootFolder = `../..`;
const serverFolder = `${rootFolder}/server`;
const assert = require("chai").assert;
const buildOrderedTree = require(`${serverFolder}/Lib/OrderedTree`);

describe("OrderedTree", async function () {
  const OrderedTree = buildOrderedTree();
  it(`Set/get using a number as path`, async () => {
    let orderedTree = new OrderedTree();
   
    let path = 1;
    let expected = "One";
    orderedTree.set(path, "One");
    assert.equal(orderedTree.has(path), true, "result exists");
    assert.equal(orderedTree.get(path), expected, "expected result");
  });

  it(`Set/get using a string as path`, async () => {
    let orderedTree = new OrderedTree();
   
    let path = "1";
    let expected = "One";
    orderedTree.set(path, "One");
    assert.equal(orderedTree.has(path), true, "result exists");
    assert.equal(orderedTree.get(path), expected, "expected result");
  });


  it(`Set/get using an array as path`, async () => {
    let orderedTree = new OrderedTree();
   
    let path = ["player", 1];
    let expected = "One";
    orderedTree.set(path, "One");
    assert.equal(orderedTree.has(path), true, "result exists");
    assert.equal(orderedTree.get(path), expected, "expected result");
  });


  it(`delete using an array as path`, async () => {
    let orderedTree = new OrderedTree();
   
    let path = ["player", 1];
    let expected = "One";
    orderedTree.set(path, "One");
    orderedTree.delete(path);
    assert.equal(orderedTree.has(path), false, "result deleted");
  });


  it(`multiple nested with same parent`, async () => {
    let orderedTree = new OrderedTree();
   
    let path = ["player", 2];
    let expected = "One";
    orderedTree.set(["player", 2], "A");
    orderedTree.set(["player", 100], "B");

    assert.equal(orderedTree.get(["player", 2]),    "A", "expected result");
    assert.equal(orderedTree.get(["player", 100]),  "B", "expected result");
  });

}); // end App description
