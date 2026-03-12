const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, 'public')));

let waiting = [];

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  io.emit('online', io.engine.clientsCount);

  socket.on('join', (data) => {
    console.log('Join from', socket.id, data);

    waiting.push(socket);

    if (waiting.length >= 2) {
      const u1 = waiting.shift();
      const u2 = waiting.shift();

      const roomId = `room-${Date.now()}`;

      u1.join(roomId);
      u2.join(roomId);

      u1.emit('matched', { roomId });
      u2.emit('matched', { roomId });

      console.log(`Matched in ${roomId}`);
    } else {
      socket.emit('status', 'Searching...');
    }
  });

  socket.on('message', (msg) => {
    const roomId = Array.from(socket.rooms).find(r => r.startsWith('room-'));
    if (roomId) {
      socket.to(roomId).emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    waiting = waiting.filter(s => s !== socket);
    io.emit('online', io.engine.clientsCount);
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Introdise running on http://localhost:${PORT}`);
});