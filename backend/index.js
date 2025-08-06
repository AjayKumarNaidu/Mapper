const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");

const app = express();
app.use(cors({
  origin: "https://mapper-1-by95.onrender.com", // no trailing slash
  methods: ["GET", "POST"],
}));

app.get("/", (req, res) => {
  res.send("Hello from Rideshare server!");
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*", // Open CORS for Socket.IO
  },
});

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  // Driver joins a room (roomId can be driver's ID)
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room: ${roomId}`);
  });

  // Driver sends location to their room
  socket.on("driverLocation", ({ roomId, location }) => {
    console.log(`Location from ${roomId}:`, location);
    // Send only to users in the same room
    socket.to(roomId).emit("sendToUsers", location);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
