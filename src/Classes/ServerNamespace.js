const Config = require("./Config");
const fs = require("fs");

class ServerNamespace {
  constructor(namespace, io, config) {
    // Props
    this.namespace = namespace;
    this.io = io;
    this.config = config;
    this.namespaceConfig = config.namespaces[namespace];

    // Namespace
    console.log("Create namespace", '"' + namespace + '"');
    this.ioClient = this.io.of("/" + namespace);
    this.ioClient.on("connection", this.onClientConnection.bind(this));

    // Broadcaster namespace
    console.log(
      "Create broadcaster namespace",
      '"' + this.namespaceConfig.broadcasterNamespace + '"',
      "for namespace",
      '"' + namespace + '"'
    );
    this.ioBroadcaster = this.io.of(
      "/" + this.namespaceConfig.broadcasterNamespace
    );
    this.ioBroadcaster.on(
      "connection",
      this.onBroadcasterConnection.bind(this)
    );

    // Start chunks
    this.startChunks = [];
  }

  sendStartChunks(socket) {
    this.startChunks.forEach((chunk) => {
      socket.emit("chunk", chunk);
    });
  }

  startVideo(socket) {
    console.log('Move client to room "preloading"');
    socket.join("preloading");
    this.sendStartChunks(socket);
  }

  onClientConnection(socket) {
    console.log('Client connected to namespace "' + this.namespace + '"');

    // Allow socket to config
    Config(socket, this.config);

    // Update config
    socket.on("updateConfiguration", (config) => {
      this.namespaceConfig = config;
    });

    // Get config
    socket.on("getConfiguration", (ackFn) => {
      ackFn(this.namespaceConfig);
    });

    // Save config
    socket.on("saveConfiguration", (namespaceConfig, ackFn) => {
      this.namespaceConfig = namespaceConfig;
      this.config.namespaces[this.namespace] = this.namespaceConfig;
      fs.writeFileSync("./config.json", JSON.stringify(this.config));
      ackFn(true);
    });

    this.startVideo(socket);

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
      this.ioClient.in("preloadingDone").emit("chunk", chunk);

      // Move warming up clients after first keyframe to room "preloaded"
      if (chunkType === 5) this.onKeyframe(chunk);
    });
  }

  // Move clients after first keyframe to room "preloaded"
  onKeyframe(chunk) {
    this.ioClient
      .in("preloading")
      .fetchSockets()
      .then((sockets) => {
        sockets.forEach((socket) => {
          console.log('Move client to room "preloadingDone"');

          socket.emit("preloading", "done");
          socket.emit("chunk", chunk);

          socket.leave("preloading");
          socket.join("preloadingDone");
        });
      });
  }
}

module.exports = ServerNamespace;
