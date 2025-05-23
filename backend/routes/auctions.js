const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Auction = require('../models/auction');
const { auth, checkRole } = require('../middleware/authMiddleware');
const { sendAuctionNotification } = require('../utils/emailService');

// Get all auctions with pagination, sorting, and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const sortBy = req.query.sortBy || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;
    const status = req.query.status;
    const search = req.query.search;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$text = { $search: search };
    }

    const auctions = await Auction.find(query)
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner', 'username')
      .populate('winner', 'username');

    const total = await Auction.countDocuments(query);

    res.json({
      auctions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalAuctions: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single auction
router.get('/:id', async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id)
      .populate('owner', 'username')
      .populate('winner', 'username')
      .populate('bids.userId', 'username');

    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    res.json(auction);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create auction
router.post('/',
  auth,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('startPrice').isFloat({ min: 0 }),
    body('startTime').isISO8601(),
    body('endTime').isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, description, startPrice, startTime, endTime } = req.body;

      const auction = new Auction({
        title,
        description,
        startPrice,
        currentPrice: startPrice,
        startTime,
        endTime,
        owner: req.user._id
      });

      await auction.save();
      res.status(201).json(auction);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update auction
router.put('/:id',
  auth,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('startPrice').optional().isFloat({ min: 0 }),
    body('startTime').optional().isISO8601(),
    body('endTime').optional().isISO8601()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const auction = await Auction.findById(req.params.id);
      if (!auction) {
        return res.status(404).json({ error: 'Auction not found' });
      }

      // Check if user is the owner
      if (auction.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Check if auction is already active or closed
      if (auction.status !== 'upcoming') {
        return res.status(400).json({ error: 'Cannot modify active or closed auction' });
      }

      Object.assign(auction, req.body);
      await auction.save();

      res.json(auction);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Delete auction
router.delete('/:id', auth, async (req, res) => {
  try {
    const auction = await Auction.findById(req.params.id);
    if (!auction) {
      return res.status(404).json({ error: 'Auction not found' });
    }

    // Check if user is the owner or admin
    if (auction.owner.toString() !== req.user._id.toString() && !req.user.roles.includes('admin')) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Check if auction is already active or closed
    if (auction.status !== 'upcoming') {
      return res.status(400).json({ error: 'Cannot delete active or closed auction' });
    }

    await auction.remove();
    res.json({ message: 'Auction deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Place bid
router.post('/:id/bid',
  auth,
  [
    body('amount').isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const auction = await Auction.findById(req.params.id);
      if (!auction) {
        return res.status(404).json({ error: 'Auction not found' });
      }

      // Check if auction is active
      if (auction.status !== 'active') {
        return res.status(400).json({ error: 'Auction is not active' });
      }

      // Check if user is not the owner
      if (auction.owner.toString() === req.user._id.toString()) {
        return res.status(400).json({ error: 'Cannot bid on your own auction' });
      }

      const { amount } = req.body;
      const highestBid = auction.getHighestBid();
      const minBidAmount = highestBid ? highestBid.amount + 1 : auction.startPrice;

      if (amount < minBidAmount) {
        return res.status(400).json({ error: `Bid must be at least ${minBidAmount}` });
      }

      // Add bid
      auction.bids.push({
        userId: req.user._id,
        amount
      });
      auction.currentPrice = amount;

      await auction.save();

      // Notify auction owner
      const owner = await User.findById(auction.owner);
      await sendAuctionNotification(
        owner.email,
        auction.title,
        `New bid of ${amount} placed on your auction`
      );

      // Emit socket event for real-time updates
      req.app.get('io').to(`auction_${auction._id}`).emit('newBid', {
        auctionId: auction._id,
        bid: {
          userId: req.user._id,
          amount,
          timestamp: new Date()
        }
      });

      res.json(auction);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router; 