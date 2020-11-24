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
      this.response.addToBucket("default", responses)
    }

    setAffected(entityKey, id=0, action=null)
    {
      this.affected.setAffected(entityKey, id, action)
    }

    getAffected()
    {
      return this.affected;
    }
  }
}