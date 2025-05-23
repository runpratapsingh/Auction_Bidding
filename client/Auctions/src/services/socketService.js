import { io } from 'socket.io-client';
import { store } from '../app/store';
import { addBid, updateAuctionStatus } from '../features/auctions/auctionsSlice';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    this.socket = io(SOCKET_URL);

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('newBid', (data) => {
      store.dispatch(addBid(data.bid));
    });

    this.socket.on('auctionClosed', (data) => {
      store.dispatch(updateAuctionStatus({
        auctionId: data.auctionId,
        status: 'closed'
      }));
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinAuction(auctionId) {
    if (this.socket) {
      this.socket.emit('joinAuction', auctionId);
    }
  }

  leaveAuction(auctionId) {
    if (this.socket) {
      this.socket.emit('leaveAuction', auctionId);
    }
  }
}

export const socketService = new SocketService(); 