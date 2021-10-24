const fileConfig = require("./config.json");

let env = process.env;
const config = {
  hosts: env.hosts || ["127.0.0.1"],
  port: env.port || fileConfig.port,
  mainServerToken: env.mainServerToken || fileConfig.mainServerToken,
  mainServerPass: env.mainServerPass || fileConfig.mainServerPass,
  access_token: env.access_token || fileConfig.access_token,
};

module.exports = config;
