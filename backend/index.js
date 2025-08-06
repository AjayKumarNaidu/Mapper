// backend/index.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");

const app = express();

app.use(cors({
  origin: "https://mapper-1-by95.onrender.com", // your frontend URL
  methods: ["GET", "POST"],
}));

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

const roomUserLocations = {}; // { roomId: [ { socketId, location } ] }

io.on("connection", (socket) => {
  console.log("New connection:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    socket.roomId = roomId;
    console.log(`${socket.id} joined room: ${roomId}`);
  });

  socket.on("userLocation", ({ roomId, location }) => {
    if (!roomUserLocations[roomId]) roomUserLocations[roomId] = [];

    const index = roomUserLocations[roomId].findIndex(u => u.socketId === socket.id);
    if (index !== -1) {
      roomUserLocations[roomId][index].location = location;
    } else {
      roomUserLocations[roomId].push({ socketId: socket.id, location });
    }

    // Send updated user locations to the driver
    io.to(roomId).emit("userLocations", roomUserLocations[roomId]);
  });

  socket.on("driverLocation", ({ roomId, location }) => {
    socket.to(roomId).emit("sendToUsers", location);

    // Also send user locations to the driver
    io.to(socket.id).emit("userLocations", roomUserLocations[roomId] || []);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    if (socket.roomId && roomUserLocations[socket.roomId]) {
      roomUserLocations[socket.roomId] = roomUserLocations[socket.roomId].filter(
        u => u.socketId !== socket.id
      );

      // Notify others about updated user list
      io.to(socket.roomId).emit("userLocations", roomUserLocations[socket.roomId]);
    }
  });
});

const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
