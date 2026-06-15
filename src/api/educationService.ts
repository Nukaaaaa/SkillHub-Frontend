import { getServiceClient } from './client';
import type { UserSkillStatus, SubmissionStatus, ReviewStatus } from '../types';

const apiClient = getServiceClient('EDUCATION');

export interface SkillDto {
    id: number;
    roomId: number;
    name: string;
    description: string;
    requiresExpertValidation: boolean;
    createdAt: string;
    userStatus: UserSkillStatus | null;
}

export interface RubricDto {
    id?: number;
    criterionName: string;
    maxPoints: number;
    description?: string;
}

export interface AssignmentDto {
    id: number;
    skillId: number;
    title: string;
    description: string;
    rubrics: RubricDto[];
    createdAt: string;
}

export interface SubmissionDto {
    id?: number;
    assignmentId: number;
    studentId?: number;
    solutionText: string;
    fileUrl?: string;
    status?: SubmissionStatus;
    createdAt?: string;
    updatedAt?: string;
}

export interface ReviewGradeDto {
    rubricId: number;
    score: number;
    comment?: string;
}

export interface ReviewDto {
    id?: number;
    submissionId?: number;
    reviewerId?: number;
    status?: ReviewStatus;
    comment: string;
    grades: ReviewGradeDto[];
    createdAt?: string;
    solutionText?: string;
    fileUrl?: string;
    assignmentTitle?: string;
    assignmentDescription?: string;
    rubrics?: RubricDto[];
}

export interface ExpertValidationRequestDto {
    id: number;
    submissionId: number;
    studentId: number;
    solutionText: string;
    fileUrl?: string;
    assignmentTitle: string;
    assignmentDescription: string;
    skillName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    comment?: string;
    createdAt: string;
}

export interface DisputeDto {
    id: number;
    submissionId: number;
    studentId: number;
    solutionText: string;
    fileUrl?: string;
    assignmentTitle: string;
    assignmentDescription: string;
    reason: string;
    resolutionComment?: string;
    status: 'PENDING' | 'RESOLVED_APPROVED' | 'RESOLVED_REJECTED';
    moderatorId?: number;
    createdAt: string;
}

export const educationService = {
    getSkillsByRoom: async (roomSlug: string): Promise<SkillDto[]> => {
        const response = await apiClient.get<SkillDto[]>(`/rooms/${roomSlug}/skills`);
        return response.data;
    },
    getAssignmentBySkill: async (skillId: number): Promise<AssignmentDto> => {
        const response = await apiClient.get<AssignmentDto>(`/skills/${skillId}/assignments`);
        return response.data;
    },
    submitSolution: async (dto: SubmissionDto): Promise<SubmissionDto> => {
        const response = await apiClient.post<SubmissionDto>('/submissions', dto);
        return response.data;
    },
    getMySubmissions: async (): Promise<SubmissionDto[]> => {
        const response = await apiClient.get<SubmissionDto[]>('/submissions/my');
        return response.data;
    },
    getAssignedReviews: async (): Promise<ReviewDto[]> => {
        const response = await apiClient.get<ReviewDto[]>('/reviews/assigned');
        return response.data;
    },
    getReviewsForSubmission: async (submissionId: number): Promise<ReviewDto[]> => {
        const response = await apiClient.get<ReviewDto[]>(`/submissions/${submissionId}/reviews`);
        return response.data;
    },
    getMyCredits: async (): Promise<number> => {
        const response = await apiClient.get<number>('/credits/my');
        return response.data;
    },
    requestReviewAssignment: async (assignmentId: number): Promise<ReviewDto> => {
        const response = await apiClient.post<ReviewDto>(`/reviews/request?assignmentId=${assignmentId}`);
        return response.data;
    },
    submitReview: async (reviewId: number, dto: ReviewDto): Promise<ReviewDto> => {
        const response = await apiClient.post<ReviewDto>(`/reviews/${reviewId}/submit`, dto);
        return response.data;
    },
    createSkill: async (roomId: number, name: string, description: string, requiresExpertValidation: boolean): Promise<SkillDto> => {
        const response = await apiClient.post<SkillDto>(`/skills?roomId=${roomId}&name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}&requiresExpertValidation=${requiresExpertValidation}`);
        return response.data;
    },
    createAssignment: async (dto: AssignmentDto): Promise<AssignmentDto> => {
        const response = await apiClient.post<AssignmentDto>('/assignments', dto);
        return response.data;
    },
    getPendingValidations: async (): Promise<ExpertValidationRequestDto[]> => {
        const response = await apiClient.get<ExpertValidationRequestDto[]>('/experts/pending-validations');
        return response.data;
    },
    resolveValidation: async (requestId: number, approved: boolean, comment?: string): Promise<void> => {
        await apiClient.post(`/experts/validations/${requestId}/resolve?approved=${approved}${comment ? `&comment=${encodeURIComponent(comment)}` : ''}`);
    },
    createDispute: async (submissionId: number, reason: string): Promise<DisputeDto> => {
        const response = await apiClient.post<DisputeDto>(`/submissions/${submissionId}/dispute`, { reason });
        return response.data;
    },
    getDisputesForSubmission: async (submissionId: number): Promise<DisputeDto[]> => {
        const response = await apiClient.get<DisputeDto[]>(`/submissions/${submissionId}/disputes`);
        return response.data;
    },
    getPendingDisputes: async (): Promise<DisputeDto[]> => {
        const response = await apiClient.get<DisputeDto[]>('/moderators/disputes');
        return response.data;
    },
    resolveDispute: async (disputeId: number, approved: boolean, comment?: string): Promise<void> => {
        await apiClient.post(`/moderators/disputes/${disputeId}/resolve?approved=${approved}${comment ? `&comment=${encodeURIComponent(comment)}` : ''}`);
    },
    getUserSkills: async (userId: number): Promise<SkillDto[]> => {
        const response = await apiClient.get<SkillDto[]>(`/skills/user/${userId}`);
        return response.data;
    }
};
