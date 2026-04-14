import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bookmark,
    Search,
    Clock,
    Trash2,
    Share2,
    ExternalLink,
    BookOpen,
    MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentService } from '../api/contentService';
import { interactionService } from '../api/interactionService';
import { userService } from '../api/userService';
import toast from 'react-hot-toast';
import styles from './SavedArticlesPage.module.css';

interface SavedArticle {
    id: number;
    roomId: number;
    roomSlug: string;
    targetType: string;
    title: string;
    preview: string;
    authorName: string;
    authorInitials: string;
    savedAt: string;
    readTime: string;
    category: string;
}

const SavedArticlesPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSaved = async () => {
            try {
                const bookmarksResponse = await interactionService.getMyBookmarks();
                const bookmarks = bookmarksResponse.filter((b: any) => b.target_type === 'article' || b.target_type === 'post');

                const itemsData = await Promise.all(
                    bookmarks.map(async (b: any) => {
                        try {
                            if (b.target_type === 'article') {
                                const a = await contentService.getArticle(b.target_id);
                                return { item: a, type: 'article' };
                            } else if (b.target_type === 'post') {
                                const p = await contentService.getPost(b.target_id);
                                return { item: p, type: 'post' };
                            }
                            return null;
                        } catch {
                            return null;
                        }
                    })
                );

                const validItems = itemsData.filter(i => i !== null);
                
                // Collect unique user IDs to fetch their names
                const userIds = Array.from(new Set(validItems.map((v: any) => v.item.userId)));
                const userProfiles = await Promise.all(
                    userIds.map(id => userService.getUserById(id as number).catch(() => null))
                );

                const userMap: Record<number, { name: string; initials: string }> = {};
                userProfiles.forEach(u => {
                    if (u) {
                        const name = `${u.firstname || ''} ${u.lastname || ''}`.trim() || `User #${u.id}`;
                        const initials = (u.firstname?.[0] || '') + (u.lastname?.[0] || '') || '?';
                        userMap[u.id] = { name, initials };
                    }
                });

                const formatted: SavedArticle[] = validItems.map((v: any) => {
                    const a = v.item;
                    const authorInfo = userMap[a.userId] || { name: `User #${a.userId}`, initials: '?' };
                    
                    return {
                        id: a.id,
                        roomId: a.roomId || 0,
                        roomSlug: a.roomSlug || (a.roomId ? a.roomId.toString() : ''),
                        targetType: v.type,
                        title: a.title || 'Без названия',
                        preview: a.content ? (a.content.replace(/<[^>]*>?/gm, '').slice(0, 140) + '...') : 'Нет текста для предпросмотра',
                        authorName: authorInfo.name,
                        authorInitials: authorInfo.initials,
                        savedAt: new Date(a.createdAt || Date.now()).toLocaleDateString(),
                        readTime: v.type === 'article' ? '5 мин' : '1 мин',
                        category: v.type === 'article' ? 'Статья' : 'Обсуждение',
                    };
                });

                setSavedArticles(formatted);
            } catch (error) {
                console.error("Ошибка загрузки:", error);
                toast.error("Не удалось загрузить данные");
            } finally {
                setLoading(false);
            }
        };

        fetchSaved();
    }, []);

    const handleRemove = async (targetType: string, id: number) => {
        try {
            await interactionService.removeBookmark(targetType as any, id);
            setSavedArticles(prev => prev.filter(a => !(a.id === id && a.targetType === targetType)));
            toast.success("Удалено");
        } catch(e) {
            toast.error("Ошибка удаления");
        }
    };

    const handleNavigate = (article: SavedArticle) => {
        if (article.targetType === 'article') {
            navigate(`/articles/${article.id}`);
        } else {
            navigate(`/posts/${article.id}`);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <div className={styles.spinning}></div>
                    <p>Загрузка коллекции...</p>
                </div>
            </div>
        );
    }

    const filteredArticles = savedArticles.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.authorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>{t('nav.saved') || 'Коллекция'}</h1>
                    <p>{savedArticles.length} материалов в вашей библиотеке</p>
                </div>
                <div className={styles.searchBox}>
                    <Search size={20} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Поиск по архиву..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className={styles.articlesList}>
                {filteredArticles.map(article => (
                    <div key={`${article.targetType}-${article.id}`} className={styles.articleCard}>
                        <div className={styles.cardMain} onClick={() => handleNavigate(article)}>
                            <div className={styles.cardHeader}>
                                <span className={styles.categoryBadge}>
                                    {article.targetType === 'article' ? <BookOpen size={12} style={{marginRight: 4}} /> : <MessageCircle size={12} style={{marginRight: 4}} />}
                                    {article.category}
                                </span>
                                <div className={styles.savedMeta}>
                                    <Clock size={16} />
                                    <span>{article.savedAt}</span>
                                </div>
                            </div>
                            <h2 className={styles.articleTitle}>{article.title}</h2>
                            <p className={styles.articlePreview}>{article.preview}</p>
                            <div className={styles.cardFooter}>
                                <div className={styles.authorAvatar}>
                                    {article.authorInitials}
                                </div>
                                <span className={styles.authorName}>{article.authorName}</span>
                                <span className={styles.separator}>•</span>
                                <span className={styles.readTime}>{article.readTime} чтения</span>
                            </div>
                        </div>
                        <div className={styles.cardActions}>
                            <button className={styles.actionBtn} title="Открыть" onClick={() => handleNavigate(article)}>
                                <ExternalLink size={20} />
                            </button>
                            <button className={styles.actionBtn} title="Поделиться" onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(window.location.origin + (article.targetType === 'article' ? `/articles/${article.id}` : `/posts/${article.id}`));
                                toast.success("Ссылка скопирована");
                            }}>
                                <Share2 size={20} />
                            </button>
                            <button className={styles.actionBtn} title="Удалить" onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(article.targetType, article.id);
                            }}>
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {savedArticles.length === 0 && (
                <div className={styles.emptyState}>
                    <Bookmark size={80} className={styles.emptyIcon} />
                    <h3>Библиотека пуста</h3>
                    <p>Добавляйте статьи и обсуждения в закладки, чтобы прочитать их позже.</p>
                </div>
            )}
        </div>
    );
};

export default SavedArticlesPage;
