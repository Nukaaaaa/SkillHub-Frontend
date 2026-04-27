import { getServiceClient } from './client';
const apiClient = getServiceClient('ROOM');
import type { Room, RoomDto, UserRoom, RoomRole } from '../types';

export const roomService = {
    getAllRooms: async (): Promise<Room[]> => {
        const response = await apiClient.get<Room[]>('/rooms/all');
        return response.data;
    },
    getRoom: async (slug: string): Promise<Room> => {
        const response = await apiClient.get<Room>(`/rooms/${slug}`);
        return response.data;
    },

    getRoomsByDirection: async (directionSlug: string): Promise<Room[]> => {
        const response = await apiClient.get<Room[]>(`/rooms/direction/${directionSlug}`);
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

    joinRoom: async (roomSlug: string, userId: number, role?: RoomRole): Promise<UserRoom> => {
        const params = new URLSearchParams();
        params.append('userId', userId.toString());
        if (role) params.append('role', role);

        const response = await apiClient.post<UserRoom>(`/rooms/${roomSlug}/join?${params.toString()}`);
        return response.data;
    },

    leaveRoom: async (roomSlug: string, userId: number): Promise<void> => {
        await apiClient.post(`/rooms/${roomSlug}/leave?userId=${userId}`);
    },

    getMembers: async (roomSlug: string): Promise<UserRoom[]> => {
        const response = await apiClient.get<UserRoom[]>(`/rooms/${roomSlug}/members`);
        return response.data;
    },
    updateMemberRole: async (roomSlug: string, userId: number, role: RoomRole): Promise<UserRoom> => {
        const response = await apiClient.put<UserRoom>(`/rooms/${roomSlug}/members/${userId}/role?role=${role}`);
        return response.data;
    },
};
