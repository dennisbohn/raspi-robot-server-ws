const io = require("socket.io");
const ServerNamespace = require("./ServerNamespace");

class Server {
  constructor(config) {
    this.config = config;
    this.startChunks = {};
    this.io = io(3001, {
      cors: {
        origin: "http://localhost:3000",
      },
    });
    this.createNamespaces();
  }

  createNamespaces() {
    Object.keys(this.config.namespaces).forEach((namespace) => {
      new ServerNamespace(namespace, this.io, this.config);
    });
  }
}

module.exports = Server;
