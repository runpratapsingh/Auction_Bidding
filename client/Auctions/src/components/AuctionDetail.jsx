import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetAuctionQuery, usePlaceBidMutation } from '../services/api';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { socketService } from '../services/socketService';

const AuctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [bidAmount, setBidAmount] = useState('');
  const [error, setError] = useState('');

  const { data: auction, isLoading, error: fetchError } = useGetAuctionQuery(id);
  const [placeBid, { isLoading: isPlacingBid }] = usePlaceBidMutation();

  useEffect(() => {
    if (auction) {
      socketService.joinAuction(auction._id);
    }
    return () => {
      if (auction) {
        socketService.leaveAuction(auction._id);
      }
    };
  }, [auction]);

  const handleBidSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      await placeBid({ id, amount: parseFloat(bidAmount) }).unwrap();
      setBidAmount('');
    } catch (err) {
      setError(err.data?.error || 'Failed to place bid');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center text-red-600">
        Error loading auction. Please try again later.
      </div>
    );
  }

  if (!auction) {
    return null;
  }

  const isOwner = currentUser && auction.owner._id === currentUser._id;
  const canBid = auction.status === 'active' && !isOwner;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {auction.title}
                </h1>
                <p className="text-gray-600">{auction.description}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${auction.status === 'active' ? 'bg-green-100 text-green-800' :
                  auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'}`}>
                {auction.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Auction Details
                </h2>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Starting Price:</span> ${auction.startPrice}
                  </p>
                  <p>
                    <span className="font-medium">Current Price:</span> ${auction.currentPrice}
                  </p>
                  <p>
                    <span className="font-medium">Start Time:</span>{' '}
                    {new Date(auction.startTime).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">End Time:</span>{' '}
                    {new Date(auction.endTime).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">Owner:</span> {auction.owner.username}
                  </p>
                </div>
              </div>

              {canBid && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Place a Bid
                  </h2>
                  <form onSubmit={handleBidSubmit} className="space-y-4">
                    {error && (
                      <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <div>
                      <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700">
                        Bid Amount ($)
                      </label>
                      <input
                        type="number"
                        id="bidAmount"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={auction.currentPrice + 1}
                        step="0.01"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isPlacingBid}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {isPlacingBid ? 'Placing Bid...' : 'Place Bid'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Bid History
              </h2>
              <div className="space-y-4">
                {auction.bids.length === 0 ? (
                  <p className="text-gray-500">No bids yet</p>
                ) : (
                  auction.bids.map((bid, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{bid.userId.username}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(bid.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-indigo-600">
                        ${bid.amount}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail; 