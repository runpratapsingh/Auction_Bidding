import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetAuctionsQuery } from '../services/api';
import { selectCurrentUser } from '../features/auth/authSlice';

const UserDashboard = () => {
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('myAuctions');

  const { data: auctions, isLoading, error } = useGetAuctionsQuery({
    owner: currentUser?._id,
    status: activeTab === 'myAuctions' ? undefined : 'active'
  });

  useEffect(() => {
    if (error) {
      console.error('Error fetching auctions:', error);
    }
  }, [error]);

  const myAuctions = auctions?.auctions?.filter(auction => 
    auction.owner._id === currentUser?._id
  ) || [];

  const activeBids = auctions?.auctions?.filter(auction => 
    auction.bids?.some(bid => bid.userId._id === currentUser?._id)
  ) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600">
        Error loading dashboard. Please try again later.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('myAuctions')}
              className={`${
                activeTab === 'myAuctions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Auctions
            </button>
            <button
              onClick={() => setActiveTab('activeBids')}
              className={`${
                activeTab === 'activeBids'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Active Bids
            </button>
          </nav>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeTab === 'myAuctions' ? (
          myAuctions.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              You haven't created any auctions yet.
              <button
                onClick={() => navigate('/create-auction')}
                className="ml-2 text-indigo-600 hover:text-indigo-500"
              >
                Create your first auction
              </button>
            </div>
          ) : (
            myAuctions.map(auction => (
              <div
                key={auction._id}
                onClick={() => navigate(`/auctions/${auction._id}`)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {auction.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {auction.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        ${auction.currentPrice}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${auction.status === 'active' ? 'bg-green-100 text-green-800' :
                        auction.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {auction.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          activeBids.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              You haven't placed any bids yet.
              <button
                onClick={() => navigate('/')}
                className="ml-2 text-indigo-600 hover:text-indigo-500"
              >
                Browse active auctions
              </button>
            </div>
          ) : (
            activeBids.map(auction => (
              <div
                key={auction._id}
                onClick={() => navigate(`/auctions/${auction._id}`)}
                className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {auction.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {auction.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Your Highest Bid</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        ${Math.max(...auction.bids
                          .filter(bid => bid.userId._id === currentUser?._id)
                          .map(bid => bid.amount)
                        )}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};

export default UserDashboard; 