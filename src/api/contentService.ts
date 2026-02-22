import { getServiceClient } from './client';
import type { Article, Post, Comment, WikiEntry } from '../types';

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

    // Posts & Discussions
    getPostsByRoom: async (roomId: number): Promise<Post[]> => {
        const response = await apiClient.get<Post[]>(`/posts/room/${roomId}`);
        return response.data;
    },
    createPost: async (post: Partial<Post>): Promise<Post> => {
        const response = await apiClient.post<Post>('/posts', post);
        return response.data;
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

    // Wiki
    getWikiByRoom: async (roomId: number): Promise<WikiEntry[]> => {
        const response = await apiClient.get<WikiEntry[]>(`/wiki/room/${roomId}`);
        return response.data;
    }
};
