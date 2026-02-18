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
    MEMBERS: 'skillhub_members',
    USERS: 'skillhub_users',
    CURRENT_USER: 'skillhub_current_user'
};

const getStored = <T>(key: string, defaultValue: T): T => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
};

const setStored = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const DEFAULT_USERS_LIST: User[] = [
    {
        id: 1,
        name: 'data.users.1.name',
        email: 'user@example.com',
        password: 'password123',
        bio: 'data.users.1.bio',
        role: 'data.users.1.role',
        skills: ['React', 'Хирургия', 'Python'],
        skillLevels: [
            { subject: 'Технологии', value: 90 },
            { subject: 'Медицина', value: 75 },
            { subject: 'Инженерия', value: 40 },
            { subject: 'Архитектура', value: 30 },
            { subject: 'Право', value: 20 },
            { subject: 'Экономика', value: 50 },
            { subject: 'Искусство', value: 60 }
        ],
        avatar: '',
        isMentor: false,
        stats: { roomsJoined: 12, sessionsAttended: 45, points: 1250 }
    },
    {
        id: 2,
        name: 'data.users.2.name',
        email: 'alice@med.com',
        password: 'password123',
        bio: 'data.users.2.bio',
        role: 'data.users.2.role',
        skills: ['Анатомия', 'Биология', 'Генетика'],
        skillLevels: [
            { subject: 'Технологии', value: 60 },
            { subject: 'Медицина', value: 95 },
            { subject: 'Инженерия', value: 30 },
            { subject: 'Архитектура', value: 10 },
            { subject: 'Право', value: 40 },
            { subject: 'Экономика', value: 20 },
            { subject: 'Искусство', value: 50 }
        ],
        avatar: '',
        isMentor: true,
        stats: { roomsJoined: 5, sessionsAttended: 120, points: 5000 }
    },
    {
        id: 3,
        name: 'data.users.3.name',
        email: 'elena@legal.ru',
        password: 'password123',
        bio: 'data.users.3.bio',
        role: 'data.users.3.role',
        skills: ['Право', 'Этика', 'Дебаты'],
        skillLevels: [
            { subject: 'Технологии', value: 40 },
            { subject: 'Медицина', value: 20 },
            { subject: 'Инженерия', value: 10 },
            { subject: 'Архитектура', value: 30 },
            { subject: 'Право', value: 95 },
            { subject: 'Экономика', value: 60 },
            { subject: 'Искусство', value: 20 }
        ],
        avatar: '',
        isMentor: true,
        stats: { roomsJoined: 3, sessionsAttended: 200, points: 8000 }
    },
    {
        id: 4,
        name: 'data.users.4.name',
        email: 'charlie@code.com',
        password: 'password123',
        bio: 'data.users.4.bio',
        role: 'data.users.4.role',
        skills: ['React', 'Архитектура', 'TypeScript'],
        skillLevels: [
            { subject: 'Технологии', value: 85 },
            { subject: 'Медицина', value: 10 },
            { subject: 'Инженерия', value: 50 },
            { subject: 'Архитектура', value: 75 },
            { subject: 'Право', value: 15 },
            { subject: 'Экономика', value: 40 },
            { subject: 'Искусство', value: 55 }
        ],
        avatar: '',
        isMentor: false,
        stats: { roomsJoined: 15, sessionsAttended: 30, points: 900 }
    },
    {
        id: 5,
        name: 'data.users.5.name',
        email: 'mark@vc.com',
        password: 'password123',
        bio: 'data.users.5.bio',
        role: 'data.users.5.role',
        skills: ['Экономика', 'Бизнес', 'Крипто'],
        skillLevels: [
            { subject: 'Технологии', value: 70 },
            { subject: 'Медицина', value: 15 },
            { subject: 'Инженерия', value: 30 },
            { subject: 'Архитектура', value: 25 },
            { subject: 'Право', value: 50 },
            { subject: 'Экономика', value: 95 },
            { subject: 'Искусство', value: 15 }
        ],
        avatar: '',
        isMentor: true,
        stats: { roomsJoined: 8, sessionsAttended: 150, points: 6500 }
    },
    {
        id: 6,
        name: 'data.users.6.name',
        email: 'sarah@plan.com',
        password: 'password123',
        bio: 'data.users.6.bio',
        role: 'data.users.6.role',
        skills: ['Архитектура', 'Урбанизм', '3D Моделирование'],
        skillLevels: [
            { subject: 'Технологии', value: 50 },
            { subject: 'Медицина', value: 5 },
            { subject: 'Инженерия', value: 65 },
            { subject: 'Архитектура', value: 98 },
            { subject: 'Право', value: 30 },
            { subject: 'Экономика', value: 45 },
            { subject: 'Искусство', value: 80 }
        ],
        avatar: '',
        isMentor: true,
        stats: { roomsJoined: 4, sessionsAttended: 88, points: 4200 }
    },
    {
        id: 7,
        name: 'data.users.7.name',
        email: 'tom@robotics.de',
        password: 'password123',
        bio: 'data.users.7.bio',
        role: 'data.users.7.role',
        skills: ['Инженерия', 'Python', 'Робототехника'],
        skillLevels: [
            { subject: 'Технологии', value: 80 },
            { subject: 'Медицина', value: 40 },
            { subject: 'Инженерия', value: 95 },
            { subject: 'Архитектура', value: 55 },
            { subject: 'Право', value: 10 },
            { subject: 'Экономика', value: 30 },
            { subject: 'Искусство', value: 20 }
        ],
        avatar: '',
        isMentor: true,
        stats: { roomsJoined: 6, sessionsAttended: 110, points: 4800 }
    },
    {
        id: 8,
        name: 'data.users.8.name',
        email: 'siggy@psych.at',
        password: 'password123',
        bio: 'data.users.8.bio',
        role: 'data.users.8.role',
        skills: ['Психология', 'ИИ', 'Анализ'],
        skillLevels: [
            { subject: 'Технологии', value: 60 },
            { subject: 'Медицина', value: 80 },
            { subject: 'Инженерия', value: 10 },
            { subject: 'Архитектура', value: 5 },
            { subject: 'Право', value: 25 },
            { subject: 'Экономика', value: 20 },
            { subject: 'Искусство', value: 30 }
        ],
        avatar: '',
        isMentor: true,
        stats: { roomsJoined: 2, sessionsAttended: 190, points: 7200 }
    }
];

// Export actual data by reading from localStorage or defaults
export let MOCK_DIRECTIONS: Direction[] = getStored(STORAGE_KEYS.DIRECTIONS, DEFAULT_DIRECTIONS);
export let MOCK_ROOMS: Room[] = getStored(STORAGE_KEYS.ROOMS, DEFAULT_ROOMS);
export let MOCK_MEMBERS: Record<number, any[]> = getStored(STORAGE_KEYS.MEMBERS, DEFAULT_MEMBERS);
export let MOCK_USERS: User[] = getStored(STORAGE_KEYS.USERS, DEFAULT_USERS_LIST);

export const updateMockUsers = (data: User[]) => {
    MOCK_USERS = data;
    setStored(STORAGE_KEYS.USERS, data);
};

// Persistence for the current user (Profile)
export const getStoredUser = () => getStored(STORAGE_KEYS.CURRENT_USER, MOCK_USERS[0]);
export const setStoredUser = (user: User) => setStored(STORAGE_KEYS.CURRENT_USER, user);

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
