const io = require("socket.io");
const ServerNamespace = require("./ServerNamespace");

class Server {
  constructor(options) {
    this.options = options;
    this.startChunks = {};
    this.io = io(3001, {
      cors: {
        origin: "http://localhost:3000",
      },
    });
    this.createNamespaces();
  }

  createNamespaces() {
    Object.keys(this.options.namespaces).forEach((namespace) => {
      new ServerNamespace(
        namespace,
        this.io,
        this.options.namespaces[namespace]
      );
    });
  }
}

module.exports = Server;
