import { getServiceClient } from './client';
import type { Article, Post, Comment, WikiEntry, AIStatus } from '../types';

const apiClient = getServiceClient('CONTENT');

export const contentService = {
    // Articles
    getArticlesByRoom: async (roomId: number): Promise<Article[]> => {
        const response = await apiClient.get<Article[]>(`/articles/room/${roomId}`);
        return response.data;
    },
    getArticle: async (id: number): Promise<Article> => {
        const response = await apiClient.get<Article>(`/articles/${id}`);
        return response.data;
    },
    createArticle: async (article: Partial<Article>): Promise<Article> => {
        const response = await apiClient.post<Article>('/articles', article);
        return response.data;
    },
    updateArticle: async (id: number, article: Partial<Article>): Promise<Article> => {
        const response = await apiClient.put<Article>(`/articles/${id}`, article);
        return response.data;
    },
    deleteArticle: async (id: number): Promise<void> => {
        await apiClient.delete(`/articles/${id}`);
    },
    updateAIReview: async (id: number, status: AIStatus, score?: number): Promise<Article> => {
        const params = new URLSearchParams();
        params.append('status', status);
        if (score !== undefined) params.append('score', score.toString());
        const response = await apiClient.put<Article>(`/articles/${id}/ai-review?${params.toString()}`);
        return response.data;
    },

    // Posts & Discussions
    getPostsByRoom: async (roomId: number): Promise<Post[]> => {
        const response = await apiClient.get<Post[]>(`/posts/room/${roomId}`);
        return response.data;
    },
    createPost: async (post: Partial<Post>): Promise<Post> => {
        const response = await apiClient.post<Post>('/posts', post);
        return response.data;
    },
    updatePost: async (id: number, post: Partial<Post>): Promise<Post> => {
        const response = await apiClient.put<Post>(`/posts/${id}`, post);
        return response.data;
    },
    deletePost: async (id: number): Promise<void> => {
        await apiClient.delete(`/posts/${id}`);
    },

    // Comments
    getCommentsByPost: async (postId: number): Promise<Comment[]> => {
        const response = await apiClient.get<Comment[]>(`/comments/post/${postId}`);
        return response.data;
    },
    createComment: async (comment: Partial<Comment>): Promise<Comment> => {
        const response = await apiClient.post<Comment>('/comments', comment);
        return response.data;
    },
    acceptComment: async (id: number): Promise<Comment> => {
        const response = await apiClient.put<Comment>(`/comments/${id}/accept`);
        return response.data;
    },
    deleteComment: async (id: number): Promise<void> => {
        await apiClient.delete(`/comments/${id}`);
    },

    // Wiki
    getWikiByRoom: async (roomId: number): Promise<WikiEntry[]> => {
        const response = await apiClient.get<WikiEntry[]>(`/wiki/room/${roomId}`);
        return response.data;
    },
    createWikiFromArticle: async (articleId: number): Promise<WikiEntry> => {
        const response = await apiClient.post<WikiEntry>(`/wiki/from-article/${articleId}`);
        return response.data;
    }
};
