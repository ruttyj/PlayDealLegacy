
module.exports = function({isDefNested}) {
    return class Connection {
      constructor() {
        this.id;
        this.client;
      }
    
      setClient(client) {
        if(isDefNested(client, 'id')){
          this.id = client.id;
          this.client = client;
        }
      }
    }
  }
  