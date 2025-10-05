const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Serve React build
app.use(express.static('build'));
app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Map socketId -> username
const userSocketMap = {};

// Map roomId -> latest code
const roomCodeMap = {};

// Get all clients in a room
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => ({
            socketId,
            username: userSocketMap[socketId],
        })
    );
}

io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Join room
    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);

        console.log(`${username} joined room ${roomId}`);

        const clients = getAllConnectedClients(roomId);

        // Notify all clients about the new join
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });

        // Send latest code to the newly joined client
        if (roomCodeMap[roomId]) {
            socket.emit(ACTIONS.CODE_CHANGE, { code: roomCodeMap[roomId] });
        }
    });

    // Handle code changes
    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        // console.log(`CODE_CHANGE from ${socket.id} in room ${roomId}`);
        roomCodeMap[roomId] = code; // Save latest code
        socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { code }); // Broadcast to others
    });

    // Optional: sync code manually if needed
    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    // Handle disconnect
    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
