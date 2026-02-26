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
    createdAt?: string;
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
    firstname?: string;
    lastname?: string;
    email: string;
    password?: string;
    universite?: string;
    bio?: string;
    role?: string;
    status?: 'STUDENT' | 'MENTOR';
    skills: string[];
    skillLevels: SkillLevel[];
    avatar: string;
    isMentor: boolean;
    selectedDirectionId?: number;
    stats?: {
        roomsJoined: number;
        sessionsAttended: number;
        points: number;
    };
}

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type AIStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Article {
    id: number;
    roomId: number;
    userId: number; // Matches Java backend (called authorId in some places, but backend uses userId)
    title: string;
    content: string;
    difficultyLevel?: DifficultyLevel;
    authorId?: number; // Keep for legacy/compat if needed
    createdAt: string;
    updatedAt?: string;
    aiScore?: number;
    aiReviewStatus?: AIStatus;
}

export interface Post {
    id: number;
    roomId: number;
    userId: number;
    title?: string;
    content: string;
    createdAt: string;
    updatedAt?: string | null;
    postType: 'QUESTION' | 'DISCUSSION' | 'ANNOUNCEMENT';
    aiStatus?: AIStatus;
}

export interface Comment {
    id: number;
    postId: number;
    userId: number;
    authorName?: string; // Optional if joined from frontend
    content: string;
    isAccepted: boolean;
    createdAt: string;
    updatedAt?: string;
}

export interface WikiEntry {
    id: number;
    roomId: number;
    title: string;
    content: string;
    updatedAt: string;
}
