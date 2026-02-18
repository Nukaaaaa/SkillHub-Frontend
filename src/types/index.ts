export interface Direction {
    id: number;
    name: string;
    description: string;
}

export interface Room {
    id: number;
    directionId: number;
    name: string;
    description: string;
    isPrivate: boolean;
}

export type RoomRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface UserRoom {
    userId: number;
    roomId: number;
    name?: string;
    role: RoomRole;
}

export interface RoomDto {
    id?: number;
    directionId: number;
    name: string;
    description: string;
    isPrivate?: boolean;
}

export interface DirectionDto {
    id?: number;
    name: string;
    description: string;
}
export interface SkillLevel {
    subject: string;
    value: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    password?: string;
    bio?: string;
    role?: string;
    skills: string[];
    skillLevels: SkillLevel[];
    avatar: string;
    isMentor: boolean;
    stats?: {
        roomsJoined: number;
        sessionsAttended: number;
        points: number;
    };
}
