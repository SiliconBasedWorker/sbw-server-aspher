const dev = process.argv.splice(2)[2] == "d";
console.log("dev or pro", process.argv);
console.log("run mode:", dev ? "dev" : "pro");
const { port, access_token, server_info, sql, urls } = require(dev
  ? "./config/config.dev.json"
  : "./config/config.json");

const fs = require("fs");
var path = require("path");

const express = require("express");
const app = express();

// logger
// app.use(require("morgan")("dev"));
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(require("cookie-parser")());
app.use("/", express.static(path.join(__dirname, "./public")));

app.use(require("cors")());
app.use(require("compression")());

const httpServer = require("http").createServer(app);
const SocketIOServer = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");

const io = SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    allowedHeaders: "*",
    credentials: false,
  },
});
const { type } = require("os");
instrument(io, {
  auth: false,
});

app.get("/admin", (req, res) => {
  fs.readFile("./public/index.html", (err, data) => {
    res.write(data);
    res.end();
  });
});

// app.post("/emit", (req, res) => {
//   let body = req.body;
//   let event = body.event;
//   let data = body.data;
//   let namespace = body.namespace || "/";
//   let room = body.room || null;
//   io.of(namespace).emit(event, data);
//   res.writeHead(200, "OK", { "Content-Type": "application/json" });
//   res.end();
// });

app.get("/device", (req, res) => {
  res.writeHead(200, "OK", {
    "Content-Type": "application/json",
  });
  res.write(JSON.stringify(clientList));
  res.end();
});

const clientList = {};
const socketIdBlackList = [];
io.on("connection", (socket) => {
  console.log("connected", socket.id);
  clientList[socket.id] = {};
  socketIdBlackList.push(socket.id);
  let authed = false;
  // add unauthed client id to a black list, after auth, remove it
  // use blank list to prevent emit wrong
  // setInterval(() => {

  // },3000)
  socket.on("emit", (body) => {
    let event = body.event;
    let data = body.data;
    let namespace = body.namespace || "/";
    let room = body.room || null;
    io.of(namespace).emit(event, data);
  });
  socket.on("disconnect", () => {
    console.log("disconnect", socket.id);
    clientList[socket.id].isConnected = false;
  });
  socket.on("register", (data) => {
    let deviceName = data.deviceName || "unknown device";
    let token = data.token || null;
    let authPass = data.authPass || null;
    let deviceType = data.deviceType || "unknown type";
    let character = data.character || null;
    clientList[socket.id] = {
      name: deviceName,
      token: token,
      authPass: authPass,
      deviceType: deviceType,
      character: character,
      registerTime: Date.now(),
      transport: socket.handshake.query.transport,
      isConnected: socket.connected,
    };
  });
});

httpServer.listen(port, () => {
  urls.forEach((url) => {
    let baseUrl = `http://127.0.0.1:${port}`;
    console.log(url.replace("#", baseUrl));
  });
});
