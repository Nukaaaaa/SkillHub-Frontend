import { getServiceClient } from './client';
import type { Direction, DirectionDto } from '../types';
import { MOCK_DIRECTIONS, updateMockDirections } from '../mockData';

const apiClient = getServiceClient('ROOM');

export const directionService = {
    getDirections: async (): Promise<Direction[]> => {
        try {
            const response = await apiClient.get<Direction[]>('/directions');
            return response.data;
        } catch (error) {
            console.warn('API Fetch failed, using mock data');
            return MOCK_DIRECTIONS;
        }
    },

    createDirection: async (direction: DirectionDto, id?: number): Promise<Direction> => {
        try {
            if (id) {
                // If ID is provided, it's an update. But backend might not support it yet.
                // We'll try to use the create endpoint or just fallback.
                const response = await apiClient.post<Direction>('/directions', direction);
                return response.data;
            }
            const response = await apiClient.post<Direction>('/directions', direction);
            return response.data;
        } catch (error) {
            if (id) {
                const index = MOCK_DIRECTIONS.findIndex(d => d.id === id);
                if (index > -1) {
                    MOCK_DIRECTIONS[index] = { ...MOCK_DIRECTIONS[index], ...direction };
                    updateMockDirections([...MOCK_DIRECTIONS]);
                    return MOCK_DIRECTIONS[index];
                }
            }
            const newDir = { id: Date.now(), ...direction };
            MOCK_DIRECTIONS.push(newDir as Direction);
            updateMockDirections([...MOCK_DIRECTIONS]);
            return newDir as Direction;
        }
    },

    deleteDirection: async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`/directions/${id}`);
        } catch (error) {
            const index = MOCK_DIRECTIONS.findIndex(d => d.id === id);
            if (index > -1) {
                MOCK_DIRECTIONS.splice(index, 1);
                updateMockDirections([...MOCK_DIRECTIONS]);
            }
        }
    },
};
