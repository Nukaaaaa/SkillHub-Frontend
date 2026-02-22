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

    deleteDirection: async (id: number): Promise<void> => {
        await apiClient.delete(`/directions/${id}`);
    },
};
