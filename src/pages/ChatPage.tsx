import React, { useState, useEffect, useRef } from 'react';
import { 
    Send, 
    Search, 
    MoreVertical, 
    Phone, 
    Video, 
    Paperclip, 
    Smile, 
    User as UserIcon,
    CheckCheck,
    Loader2,
    WifiOff,
    LogOut,
    UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { chatService, type Message } from '../api/chatService';
import { userService } from '../api/userService';
import { useWebSocket } from '../hooks/useWebSocket';
import type { User } from '../types';
import { useChatStore, type EnrichedChat } from '../store/chatStore';
import styles from './ChatPage.module.css';

const ChatPage: React.FC = () => {
    const { user: currentUser, token } = useAuth();
    const { 
        chats, 
        selectedChat, 
        messages, 
        loading, 
        fetchChats, 
        setSelectedChat, 
        addMessage,
        addChat
    } = useChatStore();

    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { logout } = useAuth();

    // WebSocket connection
    const wsUrl = `ws://127.0.0.1:8080/api/chat/ws?token=${token}`;
    const { status, sendMessage } = useWebSocket(wsUrl, {
        shouldConnect: !!token,
        onMessage: (msg: Message) => {
            addMessage(msg);
        }
    });

    useEffect(() => {
        if (currentUser) {
            fetchChats();
        }
    }, [currentUser, fetchChats]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !selectedChat) return;

        const success = sendMessage({
            chat_id: selectedChat.chat_id,
            text: inputValue
        });

        if (success) {
            setInputValue('');
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await userService.searchUsers(query);
            // Filter out current user
            setSearchResults(results.filter(u => u.id !== currentUser?.id));
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddFriend = async (e: React.MouseEvent, friendId: number) => {
        e.stopPropagation(); // Prevent opening chat
        try {
            await userService.sendFriendRequest(friendId);
            alert('Заявка в друзья отправлена!');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Ошибка при отправке заявки');
        }
    };

    const handleSelectSearchResult = async (targetUser: User) => {
        try {
            // 1. Create or get existing chat
            const newChat = await chatService.createChat(targetUser.id);
            
            // 2. Enrich it
            const enriched: EnrichedChat = { ...newChat, user: targetUser };
            
            // 3. Add to store
            addChat(enriched);

            // 4. Select it and clear search
            setSelectedChat(enriched);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Failed to start chat:', error);
        }
    };

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat) return;

        setIsUploading(true);
        try {
            const { file_url } = await chatService.uploadFile(file);
            
            // Send message with file
            sendMessage({
                chat_id: selectedChat.chat_id,
                text: file.type.startsWith('image/') ? '' : `Файл: ${file.name}`,
                file_url: file_url
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Ошибка при загрузке файла');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };



    const getFullUrl = (url?: string) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        return `http://127.0.0.1:8080${url}`;
    };

    const getUserAvatar = (u: User): string => {
        const avatar = (u.id === currentUser?.id) ? currentUser?.avatar : (u.avatar || u.avatar_url);
        return (avatar ? getFullUrl(avatar) : null) || `https://ui-avatars.com/api/?name=${u.firstname || u.name}&background=4f46e5&color=fff&size=128`;
    };

    if (loading) {
        return (
            <div className={styles.centered}>
                <Loader2 className={styles.spin} size={48} />
                <p>Загрузка чатов...</p>
            </div>
        );
    }

    return (
        <div className={styles.chatContainer}>
            <div className={styles.chatLayout}>
                {/* Conversations Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.headerTop}>
                            <h2>Чаты</h2>
                            <div className={styles.headerActions}>
                                {status !== 'open' && (
                                    <WifiOff size={16} color="#ef4444" />
                                )}
                                <button className={styles.logoutBtn} onClick={logout} title="Выйти">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        </div>
                        <div className={styles.searchBox}>
                            <Search size={16} />
                            <input 
                                type="text" 
                                placeholder="Поиск пользователей..." 
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {isSearching && <Loader2 className={styles.searchingSpin} size={14} />}
                        </div>
                    </div>
                    
                    <div className={styles.chatList}>
                        {searchQuery.trim() ? (
                            <div className={styles.searchResults}>
                                <p className={styles.resultsLabel}>Результаты поиска</p>
                                {searchResults.length > 0 ? (
                                    searchResults.map(u => (
                                            <div 
                                                key={u.id} 
                                                className={styles.searchResultItem}
                                                onClick={() => handleSelectSearchResult(u)}
                                            >
                                                <img 
                                                    src={getUserAvatar(u)} 
                                                    alt={u.firstname} 
                                                    className={styles.avatarTiny} 
                                                />
                                                <div className={styles.searchInfo}>
                                                    <span className={styles.searchName}>{u.firstname} {u.lastname}</span>
                                                    <span className={styles.searchEmail}>{u.email}</span>
                                                </div>
                                                <button 
                                                    className={styles.addFriendBtn}
                                                    onClick={(e) => handleAddFriend(e, u.id)}
                                                    title="Добавить в друзья"
                                                >
                                                    <UserPlus size={16} />
                                                </button>
                                            </div>
                                    ))
                                ) : (
                                    <p className={styles.noResults}>Ничего не найдено</p>
                                )}
                            </div>
                        ) : chats.length > 0 ? (
                            chats.map(chat => (
                                <div 
                                    key={chat.chat_id} 
                                    className={`${styles.chatItem} ${selectedChat?.chat_id === chat.chat_id ? styles.activeChat : ''}`}
                                    onClick={() => setSelectedChat(chat)}
                                >
                                    <div className={styles.avatarWrapper}>
                                        <img 
                                            src={getUserAvatar(chat.user)} 
                                            alt={chat.user.firstname} 
                                            className={styles.avatar} 
                                        />
                                        <div className={`${styles.onlineStatus} ${styles.online}`} />
                                    </div>
                                    <div className={styles.chatInfo}>
                                        <div className={styles.chatHeader}>
                                            <span className={styles.chatName}>{chat.user.firstname} {chat.user.lastname}</span>
                                            <span className={styles.chatTime}>
                                                {chat.last_message ? new Date(chat.last_message.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                            </span>
                                        </div>
                                        <div className={styles.chatPreview}>
                                            <p>{chat.last_message?.text || 'Нет сообщений'}</p>
                                            {chat.unread_count > 0 && <span className={styles.unreadBadge}>{chat.unread_count}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={styles.emptyState}>Чатов пока нет</div>
                        )}
                    </div>
                </aside>

                {/* Main Chat Window */}
                <main className={styles.chatWindow}>
                    {selectedChat ? (
                        <>
                            <header className={styles.windowHeader}>
                                <div className={styles.headerUser}>
                                    <img 
                                        src={getUserAvatar(selectedChat.user)} 
                                        alt={selectedChat.user.firstname} 
                                        className={styles.avatarSmall} 
                                    />
                                    <div className={styles.userDetails}>
                                        <h3>{selectedChat.user.firstname} {selectedChat.user.lastname}</h3>
                                        <span>{selectedChat.user.role || 'Пользователь'}</span>
                                    </div>
                                </div>
                                <div className={styles.headerActions}>
                                    <button className={styles.iconBtn}><Phone size={20} /></button>
                                    <button className={styles.iconBtn}><Video size={20} /></button>
                                    <button className={styles.iconBtn}><MoreVertical size={20} /></button>
                                </div>
                            </header>

                            <div className={styles.messagesList}>
                                {messages.map(msg => {
                                    const fullFileUrl = getFullUrl(msg.file_url);

                                    return (
                                        <div key={msg.id} className={`${styles.messageWrapper} ${msg.sender_id === currentUser?.id ? styles.ownMessage : styles.theirMessage}`}>
                                            <div className={styles.messageBubble}>
                                                {fullFileUrl ? (
                                                    <div className={styles.messageAttachment}>
                                                        {fullFileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                            <img 
                                                                src={fullFileUrl} 
                                                                alt="Вложение" 
                                                                className={styles.attachmentPreview} 
                                                                onClick={() => window.open(fullFileUrl)} 
                                                                style={{ cursor: 'pointer', maxWidth: '100%', borderRadius: '8px' }}
                                                            />
                                                        ) : (
                                                            <a href={fullFileUrl} target="_blank" rel="noreferrer" className={styles.fileLink}>
                                                                <Paperclip size={16} /> 📎 Посмотреть файл
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : null}
                                                {msg.text && <p>{msg.text}</p>}
                                                <div className={styles.messageMeta}>
                                                    <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    {msg.sender_id === currentUser?.id && <CheckCheck size={14} color={msg.is_read ? '#3b82f6' : '#94a3b8'} />}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <footer className={styles.inputArea}>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    style={{ display: 'none' }} 
                                    onChange={handleFileChange} 
                                />
                                <button 
                                    className={styles.attachmentBtn} 
                                    onClick={handleFileClick}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className={styles.spin} size={20} /> : <Paperclip size={20} />}
                                </button>
                                <div className={styles.inputWrapper}>
                                    <input 
                                        type="text" 
                                        placeholder="Написать сообщение..." 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                        disabled={status !== 'open'}
                                    />
                                    <button className={styles.emojiBtn}><Smile size={20} /></button>
                                </div>
                                <button 
                                    className={styles.sendBtn} 
                                    onClick={handleSendMessage} 
                                    disabled={!inputValue.trim() || status !== 'open'}
                                >
                                    <Send size={20} />
                                </button>
                            </footer>
                        </>
                    ) : (
                        <div className={styles.noChatSelected}>
                            <div className={styles.noChatIllustration}>
                                <UserIcon size={64} opacity={0.1} />
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
