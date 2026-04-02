import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bookmark,
    Search,
    Clock,
    Trash2,
    Share2,
    ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { contentService } from '../api/contentService';
import { interactionService } from '../api/interactionService';
import styles from './SavedArticlesPage.module.css';

interface SavedArticle {
    id: number;
    roomId: number;
    targetType: string;
    title: string;
    preview: string;
    author: string;
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
                const response = await interactionService.getMyBookmarks();
                const bookmarks = response.filter((b: any) => b.target_type === 'article' || b.target_type === 'post');

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

                const formatted: SavedArticle[] = validItems.map((v: any) => {
                    const a = v.item;
                    return {
                        id: a.id,
                        roomId: a.roomId || 0,
                        targetType: v.type,
                        title: a.title || 'Без названия',
                        preview: a.content.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...',
                        author: `Пользователь #${a.userId}`,
                        savedAt: new Date(a.createdAt).toLocaleDateString(),
                        readTime: v.type === 'article' ? '5 мин' : '1 мин',
                        category: v.type === 'article' ? 'Статья' : 'Обсуждение',
                    };
                });

                setSavedArticles(formatted);
            } catch (error) {
                console.error("Ошибка загрузки сохраненных статей:", error);
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
        } catch(e) {
            console.error(e);
        }
    };

    if (loading) return <div className={styles.container}><div style={{padding: '2rem'}}>Загрузка...</div></div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>{t('nav.saved') || 'Сохраненные статьи'}</h1>
                    <p>{savedArticles.length} материалов отложено на потом</p>
                </div>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Поиск по сохраненным..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className={styles.articlesList}>
                {savedArticles.map(article => (
                    <div key={article.id} className={styles.articleCard}>
                        <div className={styles.cardMain}>
                            <div className={styles.cardHeader}>
                                <span className={styles.categoryBadge}>{article.category}</span>
                                <div className={styles.savedMeta}>
                                    <Clock size={14} />
                                    <span>Сохранено {article.savedAt}</span>
                                </div>
                            </div>
                            <h2 className={styles.articleTitle}>{article.title}</h2>
                            <p className={styles.articlePreview}>{article.preview}</p>
                            <div className={styles.cardFooter}>
                                <span className={styles.authorName}>{article.author}</span>
                                <span className={styles.separator}>•</span>
                                <span className={styles.readTime}>{article.readTime} чтения</span>
                            </div>
                        </div>
                        <div className={styles.cardActions}>
                            <button className={styles.actionBtn} title="Открыть" onClick={() => {
                                if (article.targetType === 'article') {
                                    navigate(`/rooms/${article.roomId}/articles/${article.id}`);
                                } else {
                                    navigate(`/rooms/${article.roomId}/posts/${article.id}`);
                                }
                            }}>
                                <ExternalLink size={18} />
                            </button>
                            <button className={styles.actionBtn} title="Поделиться">
                                <Share2 size={18} />
                            </button>
                            <button className={styles.actionBtn} title="Удалить" onClick={() => handleRemove(article.targetType, article.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {savedArticles.length === 0 && (
                <div className={styles.emptyState}>
                    <Bookmark size={48} className={styles.emptyIcon} />
                    <h3>У вас нет сохраненных статей</h3>
                    <p>Добавляйте статьи в закладки, чтобы прочитать их позже.</p>
                </div>
            )}
        </div>
    );
};

export default SavedArticlesPage;
