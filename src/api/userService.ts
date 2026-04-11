import { getServiceClient } from './client';
import type { User } from '../types';

const apiClient = getServiceClient('USER');

export const userService = {
    getAllUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },
    getUserById: async (id: number): Promise<User> => {
        const response = await apiClient.get<User>(`/users/${id}`);
        return response.data;
    },
    updateUser: async (id: number, data: Partial<User>): Promise<User> => {
        const response = await apiClient.put<User>(`/auth/update/${id}`, data);
        return response.data;
    },
    searchUsers: async (query: string): Promise<User[]> => {
        const response = await apiClient.get<User[]>(`/users/search?query=${query}`);
        return response.data;
    },
    sendFriendRequest: async (friendId: number): Promise<void> => {
        await apiClient.post('/users/friends/request', { friend_id: friendId });
    },
    getFriends: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users/friends');
        return response.data;
    },
};
