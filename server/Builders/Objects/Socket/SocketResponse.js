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

    add(responses, bucket=AddressedResponse.DEFAULT_BUCKET)
    {
      this.response.addToBucket(bucket, responses)
    }

    getAffectedContainer()
    {
      return this.affected;
    }

    addAffected(...args)
    {
        return this.affected.setAffected(...args)
    }
  }
}