import { create } from 'zustand';
import { type Message, type ChatDTO, chatService } from '../api/chatService';
import { userService } from '../api/userService';
import type { User } from '../types';

export interface EnrichedChat extends ChatDTO {
    user: User;
}

interface ChatState {
    chats: EnrichedChat[];
    selectedChat: EnrichedChat | null;
    messages: Message[];
    loading: boolean;
    
    // Actions
    setLoading: (loading: boolean) => void;
    fetchChats: () => Promise<void>;
    setSelectedChat: (chat: EnrichedChat | null) => void;
    fetchHistory: (chatId: uint) => Promise<void>;
    addMessage: (message: Message) => void;
    addChat: (chat: EnrichedChat) => void;
    updateChatLastMessage: (message: Message, isSelected: boolean) => void;
    markAsRead: (chatId: uint) => void;
    clearMessages: () => void;
}

// Minimal type for chatId because it's uint in some places
type uint = number;

export const useChatStore = create<ChatState>((set, get) => ({
    chats: [],
    selectedChat: null,
    messages: [],
    loading: false,

    setLoading: (loading) => set({ loading }),

    fetchChats: async () => {
        set({ loading: true });
        try {
            const chatList = await chatService.listChats();
            const enriched = await Promise.all(chatList.map(async (c) => {
                const user = await userService.getUserById(c.recipient_id);
                return { ...c, user };
            }));
            set({ chats: enriched });
        } catch (error) {
            console.error('Failed to fetch chats:', error);
        } finally {
            set({ loading: false });
        }
    },

    setSelectedChat: (chat) => {
        set({ selectedChat: chat });
        if (chat) {
            get().fetchHistory(chat.chat_id);
            if (chat.unread_count > 0) {
                get().markAsRead(chat.chat_id);
            }
        } else {
            set({ messages: [] });
        }
    },

    fetchHistory: async (chatId) => {
        try {
            const history = await chatService.getHistory(chatId);
            set({ messages: history });
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    },

    addMessage: (message) => {
        const { selectedChat, messages } = get();
        if (selectedChat && message.chat_id === selectedChat.chat_id) {
            set({ messages: [...messages, message] });
        }
        get().updateChatLastMessage(message, selectedChat?.chat_id === message.chat_id);
    },

    addChat: (chat) => {
        set((state) => {
            const exists = state.chats.find((c) => c.chat_id === chat.chat_id);
            if (exists) return state;
            return { chats: [chat, ...state.chats] };
        });
    },

    updateChatLastMessage: (message, isSelected) => {
        set((state) => ({
            chats: state.chats.map((c) => {
                if (c.chat_id === message.chat_id) {
                    return {
                        ...c,
                        last_message: message,
                        unread_count: isSelected ? 0 : c.unread_count + 1,
                    };
                }
                return c;
            }),
        }));
    },

    markAsRead: async (chatId) => {
        try {
            await chatService.markAsRead(chatId);
            set((state) => ({
                chats: state.chats.map((c) =>
                    c.chat_id === chatId ? { ...c, unread_count: 0 } : c
                ),
            }));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    },

    clearMessages: () => set({ messages: [] }),
}));
