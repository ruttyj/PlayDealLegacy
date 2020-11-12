module.exports = function({clientManager, socket}){
    return function() {
        clientManager.addClient(socket);
    }
}