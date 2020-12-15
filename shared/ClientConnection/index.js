const serverFolder = `../server`
const builderFolder = `../Builders`
const { fromEventCode } = require(`../Constants/EventCodes`)
const {
    isDef,
    isArr,
    makeListnerTree,
} = require(`${serverFolder}/utils/index`);
const buildClientConnection = require(`${builderFolder}/ClientConnection`)

module.exports = buildClientConnection({
    makeListnerTree,
    isDef,
    isArr,
    fromEventCode,
})
