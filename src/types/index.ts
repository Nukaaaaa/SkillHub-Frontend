export interface Direction {
    id: number;
    name: string;
    description: string;
    slug: string;
}

export interface Room {
    id: number;
    directionId: number;
    directionSlug: string;
    name: string;
    description: string;
    slug: string;
    isPrivate: boolean;
    createdAt?: string;
    participantsCount?: number;
    postsCount?: number;
    onlineCount?: number;
    tags?: string[];
}

export type RoomRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

export interface UserRoom {
    userId: number;
    roomId: number;
    name?: string;
    role: RoomRole;
}

export interface RoomDto {
    id?: number;
    directionId?: number;
    directionSlug?: string;
    name: string;
    description: string;
    slug?: string;
    isPrivate?: boolean;
}

export interface DirectionDto {
    id?: number;
    name: string;
    description: string;
    slug?: string;
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
    status?: 'STUDENT' | 'MENTOR' | 'ONLINE' | 'OFFLINE';
    skills: string[];
    skillLevels: SkillLevel[];
    avatar: string;
    avatar_url?: string;
    isMentor: boolean;
    githubUrl?: string;
    blocked_until?: string;
    selectedDirectionId?: number;
    selectedDirectionSlug?: string;
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
    roomSlug?: string;
    userId: number; // Matches Java backend (called authorId in some places, but backend uses userId)
    title: string;
    content: string;
    difficultyLevel?: DifficultyLevel;
    authorId?: number; // Keep for legacy/compat if needed
    createdAt: string;
    updatedAt?: string;
    aiScore?: number;
    aiReviewStatus?: AIStatus;
    tags?: string[];
}

export interface Post {
    id: number;
    roomId: number;
    roomSlug?: string;
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
    sectionId?: number;
    title: string;
    content: string;
    updatedAt: string;
}

// Wiki Landing Page types (from /api/wiki/landing)
export interface CategoryStat {
    name: string;
    articleCount: number;
}

export interface ArticlePreview {
    id: number;
    title: string;
    previewText: string;
    aiScore: number;
    tags: string[];
    viewCount: number;
}

export interface WikiLandingResponse {
    categories: CategoryStat[];
    popular: ArticlePreview[];
    recommended: ArticlePreview | null;
}
