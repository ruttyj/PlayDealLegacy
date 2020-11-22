module.exports = function buildConnectionManager({ getKeyFromProp, isDef })
{
  return class ConnectionManager 
  {
    constructor()
    {
      const connectionManager = this
      connectionManager.connections = new Map()
    }

    set(connectionId, connection)
    {
      const connectionManager = this
      connectionManager.connections.set(connectionId, connection)
    }

    add(connection)
    {
      const connectionManager = this
      connectionManager.connections.set(connection.id, connection)
    }

    get(connectionOrId) {
      const connectionManager = this
      let connectionId = getKeyFromProp(connectionOrId, `id`)
      return connectionManager.connections.get(connectionId)
    }

    remove(connectionOrId)
    {
      const connectionManager = this
      let connection = get(connectionOrId)
      if (isDef(connection)) {
        connectionManager.connections.remove(connection.id)
      }
    }
  }
}