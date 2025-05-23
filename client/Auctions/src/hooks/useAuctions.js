import {
  useGetAuctionsQuery,
  useGetAuctionQuery,
  useCreateAuctionMutation,
  useUpdateAuctionMutation,
  useDeleteAuctionMutation,
  usePlaceBidMutation,
  useUpdateAuctionStatusMutation,
} from '../services/api';

export const useAuctions = (auctionId = null) => {
  const [createAuction, { isLoading: isCreating }] = useCreateAuctionMutation();
  const [updateAuction, { isLoading: isUpdating }] = useUpdateAuctionMutation();
  const [deleteAuction, { isLoading: isDeleting }] = useDeleteAuctionMutation();
  const [placeBid, { isLoading: isPlacingBid }] = usePlaceBidMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateAuctionStatusMutation();

  const { data: auctions, isLoading: isLoadingAuctions } = useGetAuctionsQuery();
  const { data: auction, isLoading: isLoadingAuction } = useGetAuctionQuery(auctionId, {
    skip: !auctionId,
  });

  return {
    auctions,
    auction,
    createAuction,
    updateAuction,
    deleteAuction,
    placeBid,
    updateStatus,
    isLoading: isCreating || isUpdating || isDeleting || isPlacingBid || 
              isUpdatingStatus || isLoadingAuctions || isLoadingAuction,
  };
}; 