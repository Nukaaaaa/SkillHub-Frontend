import type { Direction, Room, User } from './types';

// Default initial data
const DEFAULT_DIRECTIONS: Direction[] = [
    { id: 1, name: 'data.directions.1.name', description: 'data.directions.1.description' },
    { id: 2, name: 'data.directions.2.name', description: 'data.directions.2.description' },
    { id: 3, name: 'data.directions.3.name', description: 'data.directions.3.description' },
    { id: 4, name: 'data.directions.4.name', description: 'data.directions.4.description' },
    { id: 5, name: 'data.directions.5.name', description: 'data.directions.5.description' },
    { id: 6, name: 'data.directions.6.name', description: 'data.directions.6.description' },
    { id: 7, name: 'data.directions.7.name', description: 'data.directions.7.description' },
    { id: 8, name: 'data.directions.8.name', description: 'data.directions.8.description' }
];

const DEFAULT_ROOMS: Room[] = [
    // Tech
    { id: 101, directionId: 1, name: 'data.rooms.101.name', description: 'data.rooms.101.description', isPrivate: false },
    { id: 102, directionId: 1, name: 'data.rooms.102.name', description: 'data.rooms.102.description', isPrivate: false },
    { id: 103, directionId: 1, name: 'data.rooms.103.name', description: 'data.rooms.103.description', isPrivate: true },
    // Medicine
    { id: 201, directionId: 2, name: 'data.rooms.201.name', description: 'data.rooms.201.description', isPrivate: false },
    { id: 202, directionId: 2, name: 'data.rooms.202.name', description: 'data.rooms.202.description', isPrivate: false },
    { id: 203, directionId: 2, name: 'data.rooms.203.name', description: 'data.rooms.203.description', isPrivate: false },
    // Law
    { id: 301, directionId: 3, name: 'data.rooms.301.name', description: 'data.rooms.301.description', isPrivate: true },
    { id: 302, directionId: 3, name: 'data.rooms.302.name', description: 'data.rooms.302.description', isPrivate: false },
    { id: 303, directionId: 3, name: 'data.rooms.303.name', description: 'data.rooms.303.description', isPrivate: false },
    // Business
    { id: 401, directionId: 4, name: 'data.rooms.401.name', description: 'data.rooms.401.description', isPrivate: false },
    { id: 402, directionId: 4, name: 'data.rooms.402.name', description: 'data.rooms.402.description', isPrivate: false },
    { id: 403, directionId: 4, name: 'data.rooms.403.name', description: 'data.rooms.403.description', isPrivate: false },
    // Architecture
    { id: 501, directionId: 5, name: 'data.rooms.501.name', description: 'data.rooms.501.description', isPrivate: false },
    { id: 502, directionId: 5, name: 'data.rooms.502.name', description: 'data.rooms.502.description', isPrivate: false },
    { id: 503, directionId: 5, name: 'data.rooms.503.name', description: 'data.rooms.503.description', isPrivate: false },
    // Engineering
    { id: 601, directionId: 6, name: 'data.rooms.601.name', description: 'data.rooms.601.description', isPrivate: false },
    { id: 602, directionId: 6, name: 'data.rooms.602.name', description: 'data.rooms.602.description', isPrivate: true },
    { id: 603, directionId: 6, name: 'data.rooms.603.name', description: 'data.rooms.603.description', isPrivate: false },
    // Psychology
    { id: 701, directionId: 7, name: 'data.rooms.701.name', description: 'data.rooms.701.description', isPrivate: false },
    { id: 702, directionId: 7, name: 'data.rooms.702.name', description: 'data.rooms.702.description', isPrivate: false },
    // Linguistics
    { id: 801, directionId: 8, name: 'data.rooms.801.name', description: 'data.rooms.801.description', isPrivate: false },
    { id: 802, directionId: 8, name: 'data.rooms.802.name', description: 'data.rooms.802.description', isPrivate: false }
];

const DEFAULT_MEMBERS: Record<number, any[]> = {
    101: [{ userId: 1, name: 'Пользователь', role: 'ВЛАДЕЛЕЦ' }, { userId: 2, name: 'Д-р Алиса', role: 'АДМИН' }, { userId: 4, name: 'Чарли Разработчик', role: 'УЧАСТНИК' }],
    201: [{ userId: 2, name: 'Д-р Алиса', role: 'ВЛАДЕЛЕЦ' }, { userId: 1, name: 'Пользователь', role: 'УЧАСТНИК' }, { userId: 3, name: 'Д-р Боб', role: 'АДМИН' }],
    301: [{ userId: 3, name: 'Елена Юрист', role: 'ВЛАДЕЛЕЦ' }, { userId: 1, name: 'Пользователь', role: 'УЧАСТНИК' }],
    401: [{ userId: 5, name: 'Марк Бизнес', role: 'ВЛАДЕЛЕЦ' }, { userId: 1, name: 'Пользователь', role: 'УЧАСТНИК' }],
    501: [{ userId: 6, name: 'Сара Архитектор', role: 'ВЛАДЕЛЕЦ' }, { userId: 4, name: 'Чарли Разработчик', role: 'УЧАСТНИК' }],
    602: [{ userId: 7, name: 'Инж. Том', role: 'ВЛАДЕЛЕЦ' }, { userId: 1, name: 'Пользователь', role: 'УЧАСТНИК' }],
    701: [{ userId: 8, name: 'Д-р Фрейд', role: 'ВЛАДЕЛЕЦ' }, { userId: 9, name: 'Анна Психолог', role: 'УЧАСТНИК' }]
};

// Helper functions for Persistence
const STORAGE_KEYS = {
    DIRECTIONS: 'skillhub_directions',
    ROOMS: 'skillhub_rooms',
    MEMBERS: 'skillhub_members'
};

const getStored = <T>(key: string, defaultValue: T): T => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
};

const setStored = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// Export actual data by reading from localStorage or defaults
export let MOCK_DIRECTIONS: Direction[] = getStored(STORAGE_KEYS.DIRECTIONS, DEFAULT_DIRECTIONS);
export let MOCK_ROOMS: Room[] = getStored(STORAGE_KEYS.ROOMS, DEFAULT_ROOMS);
export let MOCK_MEMBERS: Record<number, any[]> = getStored(STORAGE_KEYS.MEMBERS, DEFAULT_MEMBERS);

// Reset Function
export const resetToDefaults = () => {
    localStorage.clear();
    window.location.reload();
};

// CRUD Helpers to keep LocalStorage in sync
export const updateMockDirections = (data: Direction[]) => {
    MOCK_DIRECTIONS = data;
    setStored(STORAGE_KEYS.DIRECTIONS, data);
};

export const updateMockRooms = (data: Room[]) => {
    MOCK_ROOMS = data;
    setStored(STORAGE_KEYS.ROOMS, data);
};

export const updateMockMembers = (data: Record<number, any[]>) => {
    MOCK_MEMBERS = data;
    setStored(STORAGE_KEYS.MEMBERS, data);
};
