require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const cron = require('node-cron');

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

// Scheduled job to check and close expired auctions
cron.schedule('* * * * *', async () => {
  try {
    const Auction = require('./models/auction');
    const now = new Date();
    
    const expiredAuctions = await Auction.find({
      status: 'active',
      endTime: { $lte: now }
    });

    for (const auction of expiredAuctions) {
      auction.status = 'closed';
      await auction.save();
      
      // Notify all connected clients about auction closure
      io.to(`auction_${auction._id}`).emit('auctionClosed', {
        auctionId: auction._id,
        message: 'Auction has ended'
      });
    }
  } catch (error) {
    console.error('Error in auction closure job:', error);
  }
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 