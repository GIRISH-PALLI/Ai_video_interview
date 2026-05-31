require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { handleSocket } = require('./wsHandler');
const sessionsRouter = require('./routes/sessions');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/sessions', sessionsRouter);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Basic API
app.get('/', (req, res) => res.send({ ok: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai_interview', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected')).catch(err => console.error('MongoDB:', err));

// Attach socket handlers
io.on('connection', socket => handleSocket(socket, io));

const PORT = Number(process.env.PORT || 4000);

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing backend process or set PORT to a free port.`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => console.log(`API running on ${PORT}`));
