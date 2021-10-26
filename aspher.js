const config = require("./config");

const fs = require("fs");
var path = require("path");

const express = require("express");
const app = express();

app.use(express.json());
app.use("/", express.static(path.join(__dirname, "./public")));

app.use(require("cors")());
app.use(require("compression")());

const httpServer = require("http").createServer(app);

const SocketIOServer = require("socket.io");
const { instrument } = require("@socket.io/admin-ui");

const io = SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    credentials: false,
  },
});
instrument(io, {
  auth: false,
});

app.get("/admin", (req, res) => {
  fs.readFile("./public/index.html", (err, data) => {
    res.write(data);
    res.end();
  });
});

app.get("/device", (req, res) => {
  if (req.headers.access_token != config.access_token) {
    res.writeHead(403, "UnAuthed", {});
    res.end("403 Not Authed");
    return;
  }
  res.writeHead(200, "OK", {
    "Content-Type": "application/json",
  });
  res.write(JSON.stringify(clientList));
  res.end();
});

app.get("/device/list", (req, res) => {
  if (req.headers.access_token != config.access_token) {
    res.writeHead(403, "UnAuthed", {});
    res.end("403 Not Authed");
    return;
  }
  res.writeHead(200, "OK", {
    "Content-Type": "application/json",
  });
  let tmp = [];
  for (let i in clientList) {
    tmp.push(clientList[i]);
  }
  res.write(JSON.stringify(tmp));
  res.end();
});

const clientList = {};
io.on("connection", (socket) => {
  console.log(new Date(), "client connected: ", `${io.engine.clientsCount}`);
  clientList[socket.id] = {};
  socket.join("unauthed");

  socket.on("disconnect", () => {
    console.log(new Date(), "client disconnect: ", `${io.engine.clientsCount}`);
    delete clientList[socket.id];
  });
  socket.on("register", (data) => {
    let deviceName = data.deviceName || "unknown device";
    let token = data.token || null;
    let authPass = data.authPass || null;
    let deviceType = data.deviceType || "unknown type";
    let character = data.character || null;
    let onEvents = data.onEvents || ["clip", "notify"];
    let system = data.system || "unkonwn system";
    clientList[socket.id] = {
      name: deviceName,
      token: token,
      authPass: authPass,
      deviceType: deviceType, // Mobile PC Server Ext
      character: character, // server stander sitter worker
      registerTime: Date.now(),
      transport: socket.handshake.query.transport,
      isConnected: socket.connected,
      onEvents: onEvents,
      system: system,
    };
    if (token != null && authPass != null) {
      // check if main-server
      if (
        character == "main-server" &&
        token == config.mainServerToken &&
        authPass == config.mainServerPass
      ) {
        // this is main server
        socket.on("data", (data) => {});
      }
      socket.leave("unauthed");
      socket.join(character);
      socket.emit("authed", {
        deviceName: deviceName,
        authed: true,
      });
      console.log("authed:", deviceName);
      socket.on("emit", (body) => {
        let event = body.event;
        let data = body.data;
        let namespace = body.namespace || "/";
        io.of(namespace).except("unauthed").emit(event, data);
      });
      socket.on("logger", (body) => {
        // console.log(body);
        // let logSource = body.logSource;
        // let msg = body.msg;
        // let namespace = body.namespace || "/";
        // io.of(namespace).except("unauthed").emit("logger")
      });
      io.of("/").to("main-server").emit(clientList);
    }
  });
});

httpServer.listen(config.port, (err) => {
  if (err) {
    console.log(err);
  }
  config.hosts.forEach((host) => {
    console.log(`http://${host}:${config.port}`);
  });
});
