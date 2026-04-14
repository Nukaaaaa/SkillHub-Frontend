import { getServiceClient } from './client';

const apiClient = getServiceClient('ACHIEVEMENT');

export interface DirectionStat {
    directionId: number;
    xp: number;
    level: number;
}

export interface UserStatsDto {
    userId: number;
    totalXp: number;
    level: number;
    reputation: number;
    directionStats?: DirectionStat[];
}

export interface UserActivityDto {
    date: string;   // "YYYY-MM-DD"
    count: number;
}

export interface UserProgressDto {
    achievementId: number;
    name: string;
    description: string;
    iconUrl?: string;
    currentCount: number;
    targetCount: number;
    isUnlocked: boolean;
    unlockedAt?: string;
}

export const achievementService = {
    /** Returns XP, level, reputation for the current authenticated user */
    getMyStats: async (): Promise<UserStatsDto> => {
        const response = await apiClient.get<UserStatsDto>('/stats');
        return response.data;
    },

    /** Returns stats for any user by ID */
    getUserStats: async (userId: number): Promise<UserStatsDto> => {
        const response = await apiClient.get<UserStatsDto>(`/user/${userId}/stats`);
        return response.data;
    },

    /** Returns activity grid data for the current user (last 1 year) */
    getMyActivity: async (): Promise<UserActivityDto[]> => {
        const response = await apiClient.get<UserActivityDto[]>('/activity');
        return response.data;
    },

    /** Returns activity grid data for any user */
    getUserActivity: async (userId: number): Promise<UserActivityDto[]> => {
        const response = await apiClient.get<UserActivityDto[]>(`/user/${userId}/activity`);
        return response.data;
    },

    /** Returns all achievements (with progress) for the current user */
    getMyAchievements: async (): Promise<UserProgressDto[]> => {
        const response = await apiClient.get<UserProgressDto[]>('/my');
        return response.data;
    },
};

/** 
 * Utility: given totalXp, compute current level and XP progress within the level.
 * Formula: level = floor(XP / 500) + 1, xpInLevel = XP % 500, xpPerLevel = 500
 */
export function computeLevelData(totalXp: number) {
    const xpPerLevel = 500;
    const level = Math.floor(totalXp / xpPerLevel) + 1;
    const xpInLevel = totalXp % xpPerLevel;
    const progressPercent = Math.round((xpInLevel / xpPerLevel) * 100);
    return { level, xpInLevel, xpPerLevel, progressPercent };
}

/**
 * Utility: returns a color string for an activity count value.
 */
export function getActivityColor(count: number): string {
    if (count === 0) return '#eef2f7';
    if (count <= 3) return '#c7d2fe';
    if (count <= 7) return '#818cf8';
    if (count <= 12) return '#4f46e5';
    return '#3730a3';
}
