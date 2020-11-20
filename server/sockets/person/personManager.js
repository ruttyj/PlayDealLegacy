const {
  els,
  isDef,
  makeVar,
  makeMap,
  getKeyFromProp,
} = require("../utils.js")

const Person = require("./person.js")

const buildPersonManager = require(`../../Builders/Objects/PersonManager`)

module.exports = buildPersonManager({
  Person,  els,  isDef,  makeVar,  makeMap,  getKeyFromProp, Person
})
