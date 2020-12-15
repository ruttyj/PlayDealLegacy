let topId = 0;

const toCode = {
    'PERSON.CONNECT': ++topId,
    'PERSON.DISCONNECT': ++topId,
}

// Build object to look up what the code represents
const fromCode = {}
Object.keys(toCode).forEach((key) => {
    let code = toCode[key]
    fromCode[code] = key;
})

module.exports = {
    fromEventCode   : fromCode,
    toEventCode     : toCode,
}
