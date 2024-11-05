const express = require("express");
const fs = require("fs");
const https = require("https");
const { v4: uuidv4 } = require("uuid");
const socketIO = require("socket.io");
const { ExpressPeerServer } = require("peer");

const app = express();

// SSL Certificates
const options = {
  key: fs.readFileSync("./server.key"),  // replace with your actual file path
  cert: fs.readFileSync("./server.crt") // replace with your actual file path
};

// Create HTTPS server
const server = https.createServer(options, app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.set("view engine", "ejs");
app.use(express.static("public"));

// Use PeerServer path
app.use("/peerjs", peerServer);

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    socket.join(roomId);
    setTimeout(() => {
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000);

    socket.on("disconnect", () => {
      console.log("User Disconnected");
      io.to(roomId).emit("user-disconnected", userId);
    });
  });
});

const PORT = process.env.PORT || 3030;
server.listen(PORT, () => {
  console.log(`Server running on HTTPS port ${PORT}`);
});
