class ServerNamespace {
  constructor(namespace, io, options) {
    this.namespace = namespace;
    this.io = io;
    this.ioClient = this.io.of("/" + this.namespace);
    this.ioBroadcaster = this.io.of("/" + this.namespace + "/broadcaster");
    this.options = options;
    this.startChunks = [];

    console.log("Create namespace:", "/" + this.namespace);
    this.ioClient.on("connection", this.onClientConnection.bind(this));

    console.log("Create namespace:", "/" + this.namespace + "/broadcaster");
    this.ioBroadcaster.on(
      "connection",
      this.onBroadcasterConnection.bind(this)
    );
  }
  sendStartChunks(socket) {
    this.startChunks.forEach((chunk) => {
      socket.emit("chunk", chunk);
    });
  }
  onClientConnection(socket) {
    console.log('Client connected to namespace "' + this.namespace + '"');
    this.sendStartChunks(socket);
    socket.on("disconnect", this.onClientDisconnection.bind(this));
  }
  onClientDisconnection() {
    console.log('Client disconnected from namespace "' + this.namespace + '"');
  }
  onBroadcasterConnection(socket) {
    console.log('Broadcaster connected to namespace "' + this.namespace + '"');
    socket.on("chunk", (chunk) => {
      // Check if chunk is a start chunk
      const chunkType = chunk[0] & 0b11111;
      if (chunkType === 7) this.startChunks[0] = chunk;
      if (chunkType === 8) this.startChunks[1] = chunk;
      if (chunkType === 5) this.startChunks[2] = chunk;

      // Send chunk to all users with the latest keyframe
      this.ioClient.in("preloaded").emit("chunk", chunk);

      // Move clients after first keyframe to room "preloaded"
      if (chunkType === 5) {
        this.ioClient.fetchSockets().then((sockets) => {
          sockets.forEach((socket) => {
            if (!socket.rooms.has("preloaded")) {
              console.log('Move client to room "preloaded"');
              socket.emit("preloaded", true);
              socket.emit("chunk", chunk);
              socket.join("preloaded");
            }
          });
        });
      }
    });
  }
}

module.exports = ServerNamespace;
