const Auction = require('../models/auction');

async function updateAuctionStatuses() {
  const now = new Date();
  
  // Update upcoming auctions to active
  await Auction.updateMany(
    {
      status: 'upcoming',
      startTime: { $lte: now },
      endTime: { $gt: now }
    },
    { status: 'active' }
  );

  // Update active auctions to closed
  await Auction.updateMany(
    {
      status: 'active',
      endTime: { $lte: now }
    },
    { status: 'closed' }
  );
}

module.exports = { updateAuctionStatuses }; 