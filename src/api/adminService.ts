import { getServiceClient } from './client';
import type { User } from '../types';

const apiClient = getServiceClient('ADMIN');

export const adminService = {
    getAllUsers: async (): Promise<User[]> => {
        const response = await apiClient.get('/users');
        return response.data;
    },

    updateUserRole: async (userId: number, role: string): Promise<void> => {
        await apiClient.put(`/users/${userId}/role`, { role });
    },

    blockUser: async (userId: number, minutes: number): Promise<void> => {
        await apiClient.post(`/users/${userId}/block`, { minutes });
    },

    unblockUser: async (userId: number): Promise<void> => {
        await apiClient.post(`/users/${userId}/unblock`, {});
    }
};
