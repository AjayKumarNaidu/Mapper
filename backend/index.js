const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(cors({
  origin: "https://mapper-1-by95.onrender.com/", // Replace with your frontend domain if needed
  methods: ["GET", "POST"],
}));

const io = new Server(server, {
  cors: {
    origin: "*", // Replace with your frontend origin like "https://your-frontend-url.com"
    methods: ["GET", "POST"]
  }
});

// Socket.IO handling
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    console.log(`${socket.id} joined room: ${roomId}`);
  });

  socket.on("driverLocation", ({ roomId, location }) => {
    // Send to all users in the same room (except driver)
    socket.to(roomId).emit("sendToUsers", location);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Server start
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
