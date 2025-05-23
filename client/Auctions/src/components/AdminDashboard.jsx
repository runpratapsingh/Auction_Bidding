import React, { useState } from 'react';
import { useGetUsersQuery, useAssignRoleMutation, useDeleteUserMutation, useVerifyUserMutation } from '../services/api';
import { useGetAuctionsQuery, useUpdateAuctionStatusMutation } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users, isLoading: isLoadingUsers } = useGetUsersQuery({
    search: searchTerm
  });
  const { data: auctions, isLoading: isLoadingAuctions } = useGetAuctionsQuery();

  const [assignRole] = useAssignRoleMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [verifyUser] = useVerifyUserMutation();
  const [updateAuctionStatus] = useUpdateAuctionStatusMutation();

  const handleRoleChange = async (userId, newRoles) => {
    try {
      await assignRole({ userId, roles: newRoles }).unwrap();
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId).unwrap();
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const handleVerifyUser = async (userId) => {
    try {
      await verifyUser(userId).unwrap();
    } catch (error) {
      console.error('Failed to verify user:', error);
    }
  };

  const handleAuctionStatusChange = async (auctionId, newStatus) => {
    try {
      await updateAuctionStatus({ auctionId, status: newStatus }).unwrap();
    } catch (error) {
      console.error('Failed to update auction status:', error);
    }
  };

  if (isLoadingUsers || isLoadingAuctions) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('auctions')}
              className={`${
                activeTab === 'auctions'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Auctions
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {users?.users.map((user) => (
                <li key={user._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {user.username}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Status: {user.isVerified ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <select
                        value={user.roles.join(',')}
                        onChange={(e) => handleRoleChange(user._id, e.target.value.split(','))}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="user,admin">User + Admin</option>
                      </select>
                      {!user.isVerified && (
                        <button
                          onClick={() => handleVerifyUser(user._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions?.auctions.map((auction) => (
            <div
              key={auction._id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {auction.title}
                </h2>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {auction.description}
                </p>
                <div className="space-y-2">
                  <p>
                    <span className="font-medium">Owner:</span> {auction.owner.username}
                  </p>
                  <p>
                    <span className="font-medium">Current Price:</span> ${auction.currentPrice}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Status:</span>
                    <select
                      value={auction.status}
                      onChange={(e) => handleAuctionStatusChange(auction._id, e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="ended">Ended</option>
                    </select>
                  </div>
                  <p>
                    <span className="font-medium">Bids:</span> {auction.bids.length}
                  </p>
                  <p>
                    <span className="font-medium">Start Date:</span>{' '}
                    {new Date(auction.startDate).toLocaleDateString()}
                  </p>
                  <p>
                    <span className="font-medium">End Date:</span>{' '}
                    {new Date(auction.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 