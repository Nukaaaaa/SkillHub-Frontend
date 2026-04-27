import { getServiceClient } from './client';

const apiClient = getServiceClient('AI');

export interface RecommendationRequest {
    userInterests: string;
    availableRooms: {
        id: string;
        title: string;
        description: string;
    }[];
}

export interface RecommendationResponse {
    recommendedRoomSlugs: string[];
    explanation: string;
}

export interface ArticleModerationRequest {
    requestId: string;
    roomId: number;
    difficultyLevel: string;
    title: string;
    content: string;
}

export interface ArticleModerationResponse {
    verdict: 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';
    note: string;
    qualityScore?: number;
}

export const aiService = {
    getRecommendations: async (request: RecommendationRequest): Promise<RecommendationResponse> => {
        const response = await apiClient.post<RecommendationResponse>('/v1/recommendations', request);
        return response.data;
    },
    moderateArticle: async (request: ArticleModerationRequest): Promise<ArticleModerationResponse> => {
        const response = await apiClient.post<ArticleModerationResponse>('/v1/articles/moderate', request);
        return response.data;
    },
    generateModeratorTest: async (request: {
        requestId: string;
        applicationId: number;
        fullName: string;
        specialization: string;
        level: 'beginner' | 'intermediate' | 'advanced';
        topics?: string;
        experience?: string;
        desiredRole?: string;
    }): Promise<{ normalizedTestJson: string; error: string | null }> => {
        const response = await apiClient.post('/v1/moderator/applications/test', request);
        return response.data;
    },
    evaluateModeratorApplication: async (request: {
        requestId: string;
        applicationId: number;
        form: any;
        testSummary: any;
        activity: any;
    }): Promise<{ aiSanitized: any; success: boolean; error: string | null }> => {
        const response = await apiClient.post('/v1/moderator/applications/evaluate-llm', request);
        return response.data;
    },
    analyzeArticle: async (request: { title: string; content: string }): Promise<{ summary: string; keyTakeaways: string[]; error?: string }> => {
        const response = await apiClient.post('/v1/articles/analyze', request);
        return response.data;
    }
};
