const { makeListenerMap, makeVar } = require("../utils");

const buildTestHost = require(`../Builders/Objects/TestUtil/TestHost`)


module.exports = buildTestHost({ makeListenerMap, makeVar })
