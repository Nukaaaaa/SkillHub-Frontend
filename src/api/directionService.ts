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

    deleteDirection: async (slug: string): Promise<void> => {
        await apiClient.delete(`/directions/${slug}`);
    },
    getDirection: async (slug: string): Promise<Direction> => {
        const response = await apiClient.get<Direction>(`/rooms/direction/${slug}`);
        return response.data;
    },
};
