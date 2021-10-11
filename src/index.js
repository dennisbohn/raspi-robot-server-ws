const options = {
  server: {
    port: 3001,
  },
  namespaces: {
    uturm: {
      authKey: "thisIsMyAuthKey",
    },
  },
};

const Server = require("./Classes/Server.js");

// Start server
const server = new Server(options);
