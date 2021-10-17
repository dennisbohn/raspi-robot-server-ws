const fs = require("fs");
const Server = require("./Classes/Server.js");

// Start server
const config = JSON.parse(fs.readFileSync(__dirname + "/../config.json"));
console.log(config);
const server = new Server(config);
