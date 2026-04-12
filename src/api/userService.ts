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
        const response = await apiClient.put<User>(`/users/update/${id}`, data);
        return response.data;
    },
    searchUsers: async (query: string): Promise<User[]> => {
        const response = await apiClient.get<User[]>(`/users/search?query=${query}`);
        return response.data;
    },
    uploadAvatar: async (file: File): Promise<{ avatar_url: string; user: User }> => {
        const formData = new FormData();
        formData.append('avatar', file);
        
        // Use native fetch to completely bypass Axios global headers (like application/json)
        // which can interfere with the browser's automatic multipart/form-data boundary generation.
        const token = localStorage.getItem('token');
        const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8080/api';
        
        const response = await fetch(`${baseUrl}/users/avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        return await response.json();
    },
    sendFriendRequest: async (friendId: number): Promise<void> => {
        await apiClient.post('/users/friends/request', { friend_id: friendId });
    },
    getFriends: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users/friends');
        return response.data;
    },
};
