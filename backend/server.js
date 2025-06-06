require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');
const { updateAuctionStatuses } = require('./utils/auctionStatusUpdater');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://auction-bidding.vercel.app",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect('mongodb+srv://sarunpratap049:NSga8dEWY5rOcRMW@cluster0.zwklo8m.mongodb.net/')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinAuction', (auctionId) => {
    socket.join(`auction_${auctionId}`);
  });

  socket.on('leaveAuction', (auctionId) => {
    socket.leave(`auction_${auctionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auctions', require('./routes/auctions'));
app.use('/api/users', require('./routes/users'));

// Scheduled job to update auction statuses
cron.schedule('* * * * *', async () => {
  try {
    await updateAuctionStatuses();
    
    // Notify clients about status changes
    const updatedAuctions = await Auction.find({
      $or: [
        { status: 'active' },
        { status: 'closed' }
      ]
    });
    
    for (const auction of updatedAuctions) {
      io.to(`auction_${auction._id}`).emit('auctionStatusChanged', {
        auctionId: auction._id,
        status: auction.status,
        message: `Auction is now ${auction.status}`
      });
    }
  } catch (error) {
    console.error('Error in auction status update job:', error);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 