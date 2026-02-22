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

export interface Article {
    id: number;
    roomId: number;
    title: string;
    content: string;
    authorId: number;
    createdAt: string;
    aiScore?: number;
    aiReviewStatus?: string;
}

export interface Post {
    id: number;
    roomId: number;
    authorId: number;
    authorName: string;
    content: string;
    createdAt: string;
    type: 'ANNOUNCEMENT' | 'QUESTION' | 'DISCUSSION';
}

export interface Comment {
    id: number;
    postId: number;
    authorId: number;
    authorName: string;
    content: string;
    createdAt: string;
}

export interface WikiEntry {
    id: number;
    roomId: number;
    title: string;
    content: string;
    updatedAt: string;
}
