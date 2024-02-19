// Import required modules and set up the Express application
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const port = process.env.PORT || 3001;

// Enable CORS (Cross-Origin Resource Sharing) for the Express app
app.use(cors());

// Create an HTTP server using the Express app
const server = http.createServer(app);

// Create a new instance of the Socket.IO server and attach it to the HTTP server
const io = new Server(server, {
  // Configure CORS for the Socket.IO server
  cors: {
    origin: "https://studentmentorapp-client.netlify.app", // Specify the allowed origin (client's address)
    methods: ["GET", "POST"], // Specify allowed HTTP methods
  },
});

// Object to keep track of rooms and their mentors
const rooms = {};

// Event handler for a new connection to the Socket.IO server
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Event handler for when a user joins a room
  socket.on("join_room", (data) => {
    socket.join(data); // Join the specified room

    // Check if the room has no mentor (first user in the room is the mentor)
    if (!rooms[data]) {
      // The first user in the room is the mentor
      rooms[data] = socket.id;
      socket.emit("mentor_status", { isMentor: true }); // Emit mentor status to the user
    } else {
      // Others are students
      socket.emit("mentor_status", { isMentor: false }); // Emit student status to the user
    }

    console.log(`${socket.id} joined room ${data}`);
  });

  // Event handler for when a user sends code to a room
  socket.on("send_code", (data) => {
    console.log(`Received code from ${socket.id} in room ${data.room}`);

    // Check if the sender is the mentor
    if (socket.id === rooms[data.room]) {
      // If the sender is the mentor, emit an error message
      socket.emit("mentor_error", { message: "Mentor can not send code." });
      return;
    }

    // Emit the received code to all users in the room except the sender
    io.to(data.room).emit("receive_code", {
      code: data.code,
      isMentor: false,
    });
  });
});

// Start the server and listen on port
server.listen(port, () => {
  console.log("SERVER IS RUNNING");
});
