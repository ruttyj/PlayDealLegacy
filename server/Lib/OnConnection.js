module.exports = function({clientManager, connection}){
    return function() {
        clientManager.addClient(connection);
    }
}