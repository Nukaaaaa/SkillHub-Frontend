import { getServiceClient } from './client';
const apiClient = getServiceClient('ROOM');
import type { Direction, DirectionDto } from '../types';

export const directionService = {
    getDirections: async (): Promise<Direction[]> => {
        const response = await apiClient.get<Direction[]>('/directions');
        return response.data;
    },

    createDirection: async (direction: DirectionDto): Promise<Direction> => {
        const response = await apiClient.post<Direction>('/directions', direction);
        return response.data;
    },

    updateDirection: async (id: number, direction: DirectionDto): Promise<Direction> => {
        const response = await apiClient.put<Direction>(`/directions/${id}`, direction);
        return response.data;
    },

    deleteDirection: async (id: number): Promise<void> => {
        await apiClient.delete(`/directions/${id}`);
    },
    getDirection: async (id: number): Promise<Direction> => {
        const response = await apiClient.get<Direction>(`/rooms/direction/${id}`);
        return response.data;
    },
};
