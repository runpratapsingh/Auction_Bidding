import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: 'https://auction-bidding-o9om.onrender.com/api',
  
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const api = createApi({
  baseQuery,
  tagTypes: ['Auction', 'User'],
  endpoints: (builder) => ({
    // Auth endpoints
    register: builder.mutation({
      query: (credentials) => ({
        url: '/auth/register',
        method: 'POST',
        body: credentials,
      }),
    }),
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    verifyEmail: builder.query({
      query: (token) => `/auth/verify-email/${token}`,
    }),
    getCurrentUser: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    verifyUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}/verify`,
        method: 'PUT',
      }),
      invalidatesTags: ['User'],
    }),

    // Auction endpoints
    getAuctions: builder.query({
      query: ({ page = 1, limit = 15, sortBy, order, status, search }) => ({
        url: '/auctions',
        params: { page, limit, sortBy, order, status, search },
      }),
      providesTags: ['Auction'],
    }),
    getAuction: builder.query({
      query: (id) => `/auctions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Auction', id }],
    }),
    createAuction: builder.mutation({
      query: (auction) => ({
        url: '/auctions',
        method: 'POST',
        body: auction,
      }),
      invalidatesTags: ['Auction'],
    }),
    updateAuction: builder.mutation({
      query: ({ id, ...auction }) => ({
        url: `/auctions/${id}`,
        method: 'PUT',
        body: auction,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Auction', id }],
    }),
    deleteAuction: builder.mutation({
      query: (id) => ({
        url: `/auctions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Auction'],
    }),
    placeBid: builder.mutation({
      query: ({ id, amount }) => ({
        url: `/auctions/${id}/bid`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Auction', id }],
    }),
    updateAuctionStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/auctions/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Auction', id }],
    }),

    // User endpoints
    getUsers: builder.query({
      query: ({ page = 1, limit = 15, search }) => ({
        url: '/users',
        params: { page, limit, search },
      }),
      providesTags: ['User'],
    }),
    updateProfile: builder.mutation({
      query: (profile) => ({
        url: '/users/profile',
        method: 'PUT',
        body: profile,
      }),
      invalidatesTags: ['User'],
    }),
    assignRole: builder.mutation({
      query: ({ userId, roles }) => ({
        url: `/users/${userId}/role`,
        method: 'PUT',
        body: { roles },
      }),
      invalidatesTags: ['User'],
    }),
    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useVerifyEmailQuery,
  useGetCurrentUserQuery,
  useVerifyUserMutation,
  useGetAuctionsQuery,
  useGetAuctionQuery,
  useCreateAuctionMutation,
  useUpdateAuctionMutation,
  useDeleteAuctionMutation,
  usePlaceBidMutation,
  useUpdateAuctionStatusMutation,
  useGetUsersQuery,
  useUpdateProfileMutation,
  useAssignRoleMutation,
  useDeleteUserMutation,
} = api;
