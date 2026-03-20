import api from './api';

export type FriendshipStatusType =
  | 'none'
  | 'friends'
  | 'request_sent'
  | 'request_received'
  | 'blocked_by_you'
  | 'blocked'
  | 'self';

export interface FriendshipStatusResponse {
  status: FriendshipStatusType;
  friendshipId: number | null;
}

export interface FriendUser {
  friendshipId: number;
  id: number;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  itemsCount?: number;
  collectionsVisibility?: string;
  since?: string;
  sentAt?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const friendsService = {
  getFriends: async (page = 1, limit = 50): Promise<{ friends: FriendUser[]; pagination: Pagination }> => {
    const { data } = await api.get(`/api/v1/friends?page=${page}&limit=${limit}`);
    return data.data;
  },

  getReceivedRequests: async (): Promise<FriendUser[]> => {
    const { data } = await api.get('/api/v1/friends/requests/received');
    return data.data;
  },

  getSentRequests: async (): Promise<FriendUser[]> => {
    const { data } = await api.get('/api/v1/friends/requests/sent');
    return data.data;
  },

  getPendingCount: async (): Promise<number> => {
    const { data } = await api.get('/api/v1/friends/pending-count');
    return data.data.count;
  },

  getFriendshipStatus: async (userId: number): Promise<FriendshipStatusResponse> => {
    const { data } = await api.get(`/api/v1/friends/status/${userId}`);
    return data.data;
  },

  sendRequest: async (userId: number): Promise<{ status: string }> => {
    const { data } = await api.post(`/api/v1/friends/request/${userId}`);
    return data.data;
  },

  acceptRequest: async (friendshipId: number): Promise<void> => {
    await api.post(`/api/v1/friends/accept/${friendshipId}`);
  },

  declineRequest: async (friendshipId: number): Promise<void> => {
    await api.post(`/api/v1/friends/decline/${friendshipId}`);
  },

  blockUser: async (userId: number): Promise<void> => {
    await api.post(`/api/v1/friends/block/${userId}`);
  },

  removeFriendship: async (friendshipId: number): Promise<void> => {
    await api.delete(`/api/v1/friends/${friendshipId}`);
  },

  sendRequestByEmail: async (email: string): Promise<{ result: string; username?: string }> => {
    const { data } = await api.post('/api/v1/friends/request-by-email', { email });
    return data.data;
  },
};
