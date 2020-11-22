module.exports = function buildConnectionManager({ getKeyFromProp, isDef })
{
  return class ConnectionManager 
  {
    constructor()
    {
      const connectionManager = this
      connectionManager.mConnections = new Map()
    }

    set(connectionId, connection)
    {
      const connectionManager = this
      connectionManager.mConnections.set(connectionId, connection)
    }

    add(connection)
    {
      const connectionManager = this
      connectionManager.mConnections.set(connection.id, connection)
    }

    get(connectionOrId) {
      const connectionManager = this
      let connectionId = getKeyFromProp(connectionOrId, `id`)
      return connectionManager.mConnections.get(connectionId)
    }

    remove(connectionOrId)
    {
      const connectionManager = this
      let connection = connectionManager.get(connectionOrId)
      if (isDef(connection)) {
        connectionManager.mConnections.delete(connection.id)
      }
    }
  }
}