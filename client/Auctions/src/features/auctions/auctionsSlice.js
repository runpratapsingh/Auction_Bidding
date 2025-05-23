import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentAuction: null,
  filters: {
    status: '',
    search: '',
    sortBy: 'createdAt',
    order: 'desc',
  },
  pagination: {
    page: 1,
    limit: 15,
  },
};

const auctionsSlice = createSlice({
  name: 'auctions',
  initialState,
  reducers: {
    setCurrentAuction: (state, { payload }) => {
      state.currentAuction = payload;
    },
    updateFilters: (state, { payload }) => {
      state.filters = { ...state.filters, ...payload };
      state.pagination.page = 1; // Reset to first page when filters change
    },
    updatePagination: (state, { payload }) => {
      state.pagination = { ...state.pagination, ...payload };
    },
    addBid: (state, { payload }) => {
      if (state.currentAuction) {
        state.currentAuction.bids.push(payload);
        state.currentAuction.currentPrice = payload.amount;
      }
    },
    updateAuctionStatus: (state, { payload: { auctionId, status } }) => {
      if (state.currentAuction && state.currentAuction._id === auctionId) {
        state.currentAuction.status = status;
      }
    },
  },
});

export const {
  setCurrentAuction,
  updateFilters,
  updatePagination,
  addBid,
  updateAuctionStatus,
} = auctionsSlice.actions;

export default auctionsSlice.reducer;

// Selectors
export const selectCurrentAuction = (state) => state.auctions.currentAuction;
export const selectFilters = (state) => state.auctions.filters;
export const selectPagination = (state) => state.auctions.pagination; 