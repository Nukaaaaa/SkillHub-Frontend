import { apiClient } from './client';
import type { Room, RoomDto, UserRoom, RoomRole } from '../types';
import { MOCK_ROOMS, MOCK_MEMBERS, updateMockRooms, updateMockMembers } from '../mockData';

export const roomService = {
    getRoom: async (id: number): Promise<Room> => {
        try {
            const response = await apiClient.get<Room>(`/rooms/${id}`);
            return response.data;
        } catch (error) {
            return MOCK_ROOMS.find(r => r.id === id) || MOCK_ROOMS[0];
        }
    },

    getRoomsByDirection: async (directionId: number): Promise<Room[]> => {
        try {
            const response = await apiClient.get<Room[]>(`/rooms/direction/${directionId}`);
            return response.data;
        } catch (error) {
            return MOCK_ROOMS.filter(r => r.directionId === directionId);
        }
    },

    getUserRooms: async (userId: number): Promise<Room[]> => {
        try {
            const response = await apiClient.get<Room[]>(`/rooms/users/${userId}`);
            return response.data;
        } catch (error) {
            // Check MOCK_MEMBERS to find rooms where user is present
            const roomIds = Object.keys(MOCK_MEMBERS)
                .filter(roomId => MOCK_MEMBERS[Number(roomId)].some(m => m.userId === userId))
                .map(Number);
            return MOCK_ROOMS.filter(r => roomIds.includes(r.id));
        }
    },

    createRoom: async (room: RoomDto, id?: number): Promise<Room> => {
        try {
            const response = await apiClient.post<Room>('/rooms', room);
            return response.data;
        } catch (error) {
            if (id) {
                const index = MOCK_ROOMS.findIndex(r => r.id === id);
                if (index > -1) {
                    MOCK_ROOMS[index] = { ...MOCK_ROOMS[index], ...room };
                    updateMockRooms([...MOCK_ROOMS]);
                    return MOCK_ROOMS[index];
                }
            }
            const newRoom = { id: Date.now(), ...room };
            MOCK_ROOMS.push(newRoom as Room);
            updateMockRooms([...MOCK_ROOMS]);
            return newRoom as Room;
        }
    },

    deleteRoom: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`/rooms/${id}`);
        } catch (error) {
            const index = MOCK_ROOMS.findIndex(r => r.id === id);
            if (index > -1) {
                MOCK_ROOMS.splice(index, 1);
                updateMockRooms([...MOCK_ROOMS]);
                // Clean up members
                delete MOCK_MEMBERS[id];
                updateMockMembers({ ...MOCK_MEMBERS });
            }
        }
    },

    joinRoom: async (roomId: number, userId: number, role: RoomRole = 'MEMBER'): Promise<UserRoom> => {
        try {
            const params = new URLSearchParams();
            params.append('userId', userId.toString());
            if (role) params.append('role', role);

            const response = await apiClient.post<UserRoom>(`/rooms/${roomId}/join?${params.toString()}`);
            return response.data;
        } catch (error) {
            const newUserRoom = { userId, roomId, role };
            if (!MOCK_MEMBERS[roomId]) MOCK_MEMBERS[roomId] = [];

            // Avoid duplicates
            if (!MOCK_MEMBERS[roomId].some(m => m.userId === userId)) {
                MOCK_MEMBERS[roomId].push(newUserRoom);
                updateMockMembers({ ...MOCK_MEMBERS });
            }
            return newUserRoom;
        }
    },

    leaveRoom: async (roomId: number, userId: number): Promise<void> => {
        try {
            await apiClient.post(`/rooms/${roomId}/leave?userId=${userId}`);
        } catch (error) {
            if (MOCK_MEMBERS[roomId]) {
                MOCK_MEMBERS[roomId] = MOCK_MEMBERS[roomId].filter((m: any) => m.userId !== userId);
                updateMockMembers({ ...MOCK_MEMBERS });
            }
        }
    },

    getMembers: async (roomId: number): Promise<UserRoom[]> => {
        try {
            const response = await apiClient.get<UserRoom[]>(`/rooms/${roomId}/members`);
            return response.data;
        } catch (error) {
            return MOCK_MEMBERS[roomId] || [];
        }
    },
};
