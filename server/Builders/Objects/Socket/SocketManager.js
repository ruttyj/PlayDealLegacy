module.exports = function buildSocketManager({
  isDef,
  makeVar,
  makeMap,
  makeListener,
  getKeyFromProp,
}){
  return class SocketManager {
    constructor()
    {
      const socketManager = this

      socketManager._data = {}
      let makeCounter = (name) => makeVar(socketManager._data, name, 0)

      const entityType = `clients`
      socketManager.mItemCount      = makeCounter(`${entityType}Count`)
      socketManager.mItems          = makeMap(socketManager._data, `${entityType}s`) // @TODO add pluralize
      socketManager.onConnected     = makeListener()
      socketManager.onDisconnected  = makeListener()
    }

    getSocket(id){
      const socketManager = this

      return socketManager.mItems.get(id);
    }

    addSocket(socket) {
      const socketManager = this

      // clientSockets use .id as the priamry way to get the id
      if (isDef(socket) && isDef(socket.id)) {

        // Attach a addional events to the socket
        // For server side logic to subscribe to
        // @WARNING will over write existing listeners on socket
        socket.events = {
          disconnect: makeListener(),       // this will trigger Person disconnect in a Room
        };
  
        socketManager.mItems.set(socketManager.mItemCount.getInc(), socket);
        socketManager.onConnected.emit(socketManager.makeEventPayload(socket));
        return socket;
      }
      return null;
    }
    
    removeSocket(socketOrId){
      const socketManager = this

      let socketId = getKeyFromProp(socketOrId, `id`);
      let socket = socketManager.getSocket(socketId);
  
      if (isDef(socket) && isDef(socketId)) {
        let socketId = socket.id;
  
        //let everything associated to this socket know
        socket.events.disconnect.emit(socketManager.makeEventPayload(socket));
        // deprecated
        socketManager.onDisconnected.emit(socketManager.makeEventPayload(socket));
  
        if (socketManager.mItems.has(socketId)) {
          socketManager.mItems.remove(socketId)
          socketManager.mItemCount.inc(-1)
        }
      }
    }

    makeEventPayload(socket) {
      const socketManager = this

      return {
        socketManager,
        socket,
        client: socket, // @deprecated
      };
    }

    serialize(){
      // @TODO
    }

    unSerialize(){
      // @TODO
    }

    count(){
      const socketManager = this
      return socketManager.mItemCount.get()
    }

    get events()
    {
      const socketManager = this

      return {
        connect: socketManager.onConnected,
        disconnect: socketManager.onDisconnected,
      }
    }

  }
}