module.exports = function (socket, config) {
  // Get namespaces
  socket.on("getNamespaces", (callback) => {
    console.log("getNamespaces");
    callback({
      namespaces: Object.keys(config.namespaces),
    });
  });
};
