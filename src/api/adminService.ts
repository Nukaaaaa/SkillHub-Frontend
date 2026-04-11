import axios from 'axios';
import { type User } from '../types';

const API_URL = 'http://localhost:8080/api/admin';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const adminService = {
    getAllUsers: async (): Promise<User[]> => {
        const response = await axios.get(`${API_URL}/users`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    updateUserRole: async (userId: number, role: string): Promise<void> => {
        await axios.put(`${API_URL}/users/${userId}/role`, { role }, {
            headers: getAuthHeader()
        });
    },

    blockUser: async (userId: number, minutes: number): Promise<void> => {
        await axios.post(`${API_URL}/users/${userId}/block`, { minutes }, {
            headers: getAuthHeader()
        });
    },

    unblockUser: async (userId: number): Promise<void> => {
        await axios.post(`${API_URL}/users/${userId}/unblock`, {}, {
            headers: getAuthHeader()
        });
    }
};
