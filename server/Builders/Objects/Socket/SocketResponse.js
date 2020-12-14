const { expectedAddPropertyToExistingCollectionFromHandCheck } = require("../../../../tests/checks")

module.exports = function buildSocketResponse({
  AddressedResponse,
  Affected,
})
{
  return class SocketResponse
  {
    constructor(event)
    {
      this.event = event
      this.response = new AddressedResponse()
      this.affected = new Affected()
      this.status = `failure`
    }

    getEvent()
    {
      return this.event
    }

    getStatus()
    {
      return this.status
    }

    setStatus(status)
    {
      this.status = status
    }

    getAddressedResponse()
    {
      return this.response
    }

    add(responses)
    {
      this.response.addToBucket('default', responses)
    }

    setAffected(entityKey, id=0, action=null)
    {
      this.affected.setAffected(entityKey, id, action)
    }

    getAffected()
    {
      return this.affected;
    }

    mergeAddressedResponses(addressedResponse, mergeMethod = 'default')
    {
      const socketResponse = this

      // Merge addressed response
      const socketAddressedResponses = socketResponse.getAddressedResponse()

      //addToBucket will tranfer all bucket and specificly addressed to socketAddressedResponses 
      switch (mergeMethod) 
      {
          case 'default':
          case 'everyone':
          case 'everyoneElse':
            socketAddressedResponses.addToBucket(mergeMethod, addressedResponse)
          break
          default:
            socketAddressedResponses.addToBucket('unassigned', addressedResponse)
            throw 'Merge SocketResponse to "unassigned" bucket'
      }
    }

    mergeWithSocketResponse(fromSocketResponse, mergeMethod = 'default')
    {
      const socketResponse = this

      socketResponse.mergeAddressedResponses(fromSocketResponse.getAddressedResponse(), mergeMethod)
    }

    mergeWith(mxd, mergeMethod = 'default')
    {
      
      if (mxd instanceof AddressedResponse) {
        socketResponse.mergeAddressedResponses(mxd, mergeMethod = 'default')
      } else if (mxd instanceof SocketResponse) {
        socketResponse.mergeWithSocketResponse(mxd, mergeMethod)
      } else {
        console.log('unknown objcect to merge into SocketResponse')
      }
    }
  }
}