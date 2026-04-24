import { getServiceClient } from './client';

const chatClient = getServiceClient('CHAT');

export interface Message {
    id: number;
    chat_id: number;
    sender_id: number;
    text: string;
    file_url?: string;
    is_read: boolean;
    type?: string;
    created_at: string;
}

export interface ChatDTO {
    chat_id: number;
    recipient_id: number;
    last_message: Message | null;
    unread_count: number;
    is_online: boolean;
}

export const chatService = {
    // Получить список чатов
    listChats: async (): Promise<ChatDTO[]> => {
        const response = await chatClient.get('/list');
        return response.data;
    },

    // Получить историю сообщений
    getHistory: async (chatId: number): Promise<Message[]> => {
        const response = await chatClient.get(`/history/${chatId}`);
        return response.data;
    },

    // Создать новый чат
    createChat: async (recipientId: number): Promise<any> => {
        const response = await chatClient.post('/create', { recipient_id: recipientId });
        return response.data;
    },

    // Отметить как прочитанное
    markAsRead: async (chatId: number): Promise<void> => {
        await chatClient.post(`/read/${chatId}`);
    },

    // Загрузить файл
    uploadFile: async (file: File): Promise<{ file_url: string }> => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await chatClient.post('/messages/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data; // Ожидаем { "file_url": "..." }
    }
};
