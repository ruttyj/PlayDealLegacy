module.exports = function buildSocketRequest({
  isDefNested, AddressedResponse,
})
{
  return class SocketRequest 
  {
    constructor(event, props = {}, context = null)
    {
      // Publicly visible
      this.response = new AddressedResponse()
      this.event = event
      this.props = props

      // Check if context in Props
      if (context === null) {
        if (isDefNested(props, ['context'])) { 
          context = props.context
        } else {
          context = {}
        }
      }
      this.context = context
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

    unpackAttrs(props)
    {
      const socketRequest = this
      Object.keys(props).forEach(key => {
        socketRequest[key] = props[key]
      })
    }

    getContext()
    {
      return this.context
    }

    setContext(context)
    {
      this.context = context;
    }
  }
}