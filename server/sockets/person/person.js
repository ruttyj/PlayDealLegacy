const {
  isDef,
  makeList,
} = require("../utils.js");


const buildPerson = require(`../../Builders/Objects/Person`)

module.exports = buildPerson({ isDef, makeList }) ;
