import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, 
    Search, 
    MoreVertical, 
    Phone, 
    Video, 
    Paperclip, 
    Smile, 
    User,
    CheckCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './ChatPage.module.css';

interface Message {
    id: number;
    senderId: number;
    text: string;
    time: string;
    isOwn: boolean;
}

interface Chat {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
    role: string;
}

const ChatPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const mockChats: Chat[] = [
        { id: 1, name: 'Александр Иванов', avatar: 'https://i.pravatar.cc/150?u=alex', lastMessage: 'Слушай, а как там с дедлайном по бэкенду?', time: '14:20', unread: 2, online: true, role: 'Senior Developer' },
        { id: 2, name: 'Мария Петрова', avatar: 'https://i.pravatar.cc/150?u=maria', lastMessage: 'Дизайн комнаты просто пушка!', time: 'Вчера', unread: 0, online: false, role: 'UX Designer' },
        { id: 3, name: 'SkillHub AI', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SkillHub', lastMessage: 'Я проанализировал вашу статью, есть 2 правки.', time: '10:05', unread: 1, online: true, role: 'AI Assistant' }
    ];

    const mockHistory: Record<number, Message[]> = {
        1: [
            { id: 1, senderId: 1, text: 'Привет! Как дела с проектом?', time: '14:00', isOwn: false },
            { id: 2, senderId: 0, text: 'Привет, Саш! Всё круто, внедряю чат сейчас.', time: '14:15', isOwn: true },
            { id: 3, senderId: 1, text: 'Слушай, а как там с дедлайном по бэкенду?', time: '14:20', isOwn: false }
        ]
    };

    useEffect(() => {
        if (selectedChat) {
            setMessages(mockHistory[selectedChat.id] || []);
        }
    }, [selectedChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !selectedChat) return;

        const newMessage: Message = {
            id: Date.now(),
            senderId: currentUser?.id || 0,
            text: inputValue,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: true
        };

        setMessages([...messages, newMessage]);
        setInputValue('');

        // Mock auto-reply for AI
        if (selectedChat.id === 3) {
            setTimeout(() => {
                const reply: Message = {
                    id: Date.now() + 1,
                    senderId: 3,
                    text: 'Принято! Я изучу ваш запрос.',
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isOwn: false
                };
                setMessages(prev => [...prev, reply]);
            }, 1000);
        }
    };

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatLayout}>
                {/* Conversations Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h2>Чаты</h2>
                        <div className={styles.searchBox}>
                            <Search size={16} />
                            <input type="text" placeholder="Поиск диалогов..." />
                        </div>
                    </div>
                    
                    <div className={styles.chatList}>
                        {mockChats.map(chat => (
                            <div 
                                key={chat.id} 
                                className={`${styles.chatItem} ${selectedChat?.id === chat.id ? styles.activeChat : ''}`}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <div className={styles.avatarWrapper}>
                                    <img src={chat.avatar} alt={chat.name} className={styles.avatar} />
                                    {chat.online && <div className={styles.onlineStatus} />}
                                </div>
                                <div className={styles.chatInfo}>
                                    <div className={styles.chatHeader}>
                                        <span className={styles.chatName}>{chat.name}</span>
                                        <span className={styles.chatTime}>{chat.time}</span>
                                    </div>
                                    <div className={styles.chatPreview}>
                                        <p>{chat.lastMessage}</p>
                                        {chat.unread > 0 && <span className={styles.unreadBadge}>{chat.unread}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Chat Window */}
                <main className={styles.chatWindow}>
                    {selectedChat ? (
                        <>
                            <header className={styles.windowHeader}>
                                <div className={styles.headerUser}>
                                    <img src={selectedChat.avatar} alt={selectedChat.name} className={styles.avatarSmall} />
                                    <div className={styles.userDetails}>
                                        <h3>{selectedChat.name}</h3>
                                        <span>{selectedChat.online ? 'В сети' : 'Был недавно'} • {selectedChat.role}</span>
                                    </div>
                                </div>
                                <div className={styles.headerActions}>
                                    <button className={styles.iconBtn}><Phone size={20} /></button>
                                    <button className={styles.iconBtn}><Video size={20} /></button>
                                    <button className={styles.iconBtn}><MoreVertical size={20} /></button>
                                </div>
                            </header>

                            <div className={styles.messagesList}>
                                {messages.map(msg => (
                                    <div key={msg.id} className={`${styles.messageWrapper} ${msg.isOwn ? styles.ownMessage : styles.theirMessage}`}>
                                        <div className={styles.messageBubble}>
                                            <p>{msg.text}</p>
                                            <div className={styles.messageMeta}>
                                                <span>{msg.time}</span>
                                                {msg.isOwn && <CheckCheck size={14} />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <footer className={styles.inputArea}>
                                <button className={styles.attachmentBtn}><Paperclip size={20} /></button>
                                <div className={styles.inputWrapper}>
                                    <input 
                                        type="text" 
                                        placeholder="Написать сообщение..." 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <button className={styles.emojiBtn}><Smile size={20} /></button>
                                </div>
                                <button className={styles.sendBtn} onClick={handleSendMessage} disabled={!inputValue.trim()}>
                                    <Send size={20} />
                                </button>
                            </footer>
                        </>
                    ) : (
                        <div className={styles.noChatSelected}>
                            <div className={styles.noChatIllustration}>
                                <User size={64} opacity={0.1} />
                            </div>
                            <h3>Выберите диалог, чтобы начать общение</h3>
                            <p>Свяжитесь с коллегами или ИИ-ассистентом для решения задач.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ChatPage;
