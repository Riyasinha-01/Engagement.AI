import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import connectDB from './config/db.js';

// Route Imports
import authRoutes from './routes/auth.js';
import campaignRoutes from './routes/campaign.js';
import aiRoutes from './routes/ai.js';
import trackingRoutes from './routes/tracking.js';


// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Configure Socket.io
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for easy development, can restrict to frontend URL
    methods: ['GET', 'POST']
  }
});

// Save socket.io instance to app for access in controllers
app.set('socketio', io);

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`Socket.io client connected: ${socket.id}`);

  // Rooms to isolate campaign-specific analytics streams
  socket.on('join_campaign', (campaignId) => {
    socket.join(campaignId);
    console.log(`Client ${socket.id} joined room for campaign: ${campaignId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket.io client disconnected: ${socket.id}`);
  });
});

// Middleware Configuration
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support larger bulk uploads if needed

// API Route Registrations
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', trackingRoutes); // Handles /api/receipt and /api/track/:customerId

// Root status endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'CRM backend' });
});

// Listen on Port 5000
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`CRM Backend running on port ${PORT}`);
});
