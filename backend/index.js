const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIO = require("socket.io");

const app = express();
const cors = require("cors");
app.use(cors({
  origin: "https://mapper-1-by95.onrender.com/",
  methods: ["GET", "POST"],
}));

app.get("/", (req, res) => {
  res.send("Hello from server!");
});

const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

// Listen for connections
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  // Listen for driver location updates
  socket.on("driverLocation", (location) => {
    console.log("Location received: ", location);

    // Broadcast location to all other users
    socket.broadcast.emit("sendToUsers", location);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// ✅ Use server.listen, not app.listen
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
