import { getServiceClient } from './client';
import type { User } from '../types';

const apiClient = getServiceClient('USER');

export const userService = {
    getAllUsers: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>('/users');
        return response.data;
    },
    getUserById: async (id: number): Promise<User> => {
        const response = await apiClient.get<User>(`/auth/users/${id}`);
        return response.data;
    },
    updateUser: async (id: number, data: Partial<User>): Promise<User> => {
        const response = await apiClient.put<User>(`/auth/users/${id}`, data);
        return response.data;
    },
};
