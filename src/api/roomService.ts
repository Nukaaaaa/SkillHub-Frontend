import { getServiceClient } from './client';
const apiClient = getServiceClient('ROOM');
import type { Room, RoomDto, UserRoom, RoomRole } from '../types';

export const roomService = {
    getRoom: async (id: number): Promise<Room> => {
        const response = await apiClient.get<Room>(`/rooms/${id}`);
        return response.data;
    },

    getRoomsByDirection: async (directionId: number): Promise<Room[]> => {
        const response = await apiClient.get<Room[]>(`/rooms/direction/${directionId}`);
        return response.data;
    },

    getUserRooms: async (userId: number): Promise<Room[]> => {
        const response = await apiClient.get<Room[]>(`/rooms/users/${userId}`);
        return response.data;
    },

    createRoom: async (room: RoomDto): Promise<Room> => {
        const response = await apiClient.post<Room>('/rooms', room);
        return response.data;
    },

    updateRoom: async (id: number, room: RoomDto): Promise<Room> => {
        const response = await apiClient.put<Room>(`/rooms/${id}`, room);
        return response.data;
    },

    deleteRoom: async (id: number): Promise<void> => {
        await apiClient.delete(`/rooms/${id}`);
    },

    joinRoom: async (roomId: number, userId: number, role?: RoomRole): Promise<UserRoom> => {
        const params = new URLSearchParams();
        params.append('userId', userId.toString());
        if (role) params.append('role', role);

        const response = await apiClient.post<UserRoom>(`/rooms/${roomId}/join?${params.toString()}`);
        return response.data;
    },

    leaveRoom: async (roomId: number, userId: number): Promise<void> => {
        await apiClient.post(`/rooms/${roomId}/leave?userId=${userId}`);
    },

    getMembers: async (roomId: number): Promise<UserRoom[]> => {
        const response = await apiClient.get<UserRoom[]>(`/rooms/${roomId}/members`);
        return response.data;
    },
};
