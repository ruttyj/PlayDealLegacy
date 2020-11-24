module.exports = function buildSocketRequest({
  AddressedResponse,
})
{
  return class SocketRequest 
  {
    constructor(event, props = {})
    {
      this.response = new AddressedResponse()
      this.event = event
      this.props = props
    }

    getEvent()
    {
      return this.event
    }

    getResponse()
    {
      return this.response
    }

    getProps()
    {
      return this.props
    }

    setProps(props)
    {
      this.props = props
    }
  }
}