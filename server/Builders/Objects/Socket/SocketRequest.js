module.exports = function buildSocketRequest({
  AddressedResponse,
})
{
  return class SocketRequest 
  {
    constructor(event, props = {}, context={})
    {
      this.response = new AddressedResponse() // #public
      this.event = event // #public
      this.props = props // #public
      this.context = context // #public
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

    getContext()
    {
        return this.context
    }

    setContext(context)
    {
        this.context = context
    }
  }
}