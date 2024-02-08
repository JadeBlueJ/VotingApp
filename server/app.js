const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const app = express();
require("dotenv").config();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use(cors());
app.use(express.static(path.join(__dirname, "../client")));
const server = require("http").Server(app);
const io = require("socket.io")(server);
const sequelize = require("./util/database");
//models
const Message = require("./models/Message");
const User = require("./models/User");

// Array to store messages
let messages = [];
let typingUsers = new Set();
let polls = [
    {
      option: "Spider-Man",
      votes: 0,
      color: "rgb(255, 99, 132)",
    },
    {
      option: "Superman",
      votes: 0,
      color: "rgb(54, 162, 235)",
    },
    {
      option: "Batman",
      votes: 0,
      color: "rgb(36, 36, 36)",
    },
    {
      option: "Son Goku",
      votes: 0,
      color: "rgb(255, 159, 64)",
    },
  ];
io.on("connection", (socket) => {
  console.log(`new user connected: ${socket.id}`);
  // Emit existing messages to the newly connected socket
  socket.emit("initialMessages", messages);
  socket.emit('polls', polls)
  // Listen for new messages from clients
  socket.on("newMessage", (message) => {
    console.log(message);
    // Add the new message to the messages array
    messages.push(message);

    // Broadcast the new message to all connected sockets
    io.emit("newMessage", message);
  });
  socket.on("startTyping", (data) => {
    typingUsers.add(data.username);
    if (typingUsers.size != 0) socket.broadcast.emit("userTyping");
  });
  socket.on("stopTyping", (data) => {
    typingUsers.delete(data.username);
    if (typingUsers.size == 0) socket.broadcast.emit("noUserTyping");
  });
  socket.on('newVote',pollData=>{
    polls=pollData
    socket.broadcast.emit("updatedPolls", polls)
  })
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/index.html"));
});
sequelize
  .sync()
  .then((res) => {
    // console.log(res)
    server.listen(process.env.PORT || 3000, () => {
      console.log("Server is running on port 3000");
    });
  })
  .catch((e) => console.log(e));
