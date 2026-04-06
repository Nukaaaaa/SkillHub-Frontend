import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Bookmark,
    Heart,
    Bot,
    Code as CodeIcon,
    Database,
    Layout as LayoutIcon,
    Cpu,
    Plus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { createExcerpt } from '../utils/textUtils';
import { contentService } from '../api/contentService';
import { interactionService } from '../api/interactionService';
import { userService } from '../api/userService';
import type { Article, User } from '../types';
import Loader from '../components/Loader';
import { useAuth } from '../context/AuthContext';
import styles from './RoomArticlesPage.module.css';

const RoomArticlesPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isMember, user } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [authorProfiles, setAuthorProfiles] = useState<Record<number, User>>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'popular'>('all');
    const [difficulty, setDifficulty] = useState<string>('Любая');

    const fetchArticles = async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const data = await contentService.getArticlesByRoom(Number(roomId));
            
            // Add likes count to each article
            const articlesWithLikes = await Promise.all(data.map(async (art) => {
                try {
                    const likes = await interactionService.countLikes('article', art.id);
                    return { ...art, likesCount: likes };
                } catch {
                    return { ...art, likesCount: 0 };
                }
            }));
            
            setArticles(articlesWithLikes as Article[]);

            const authorIds = Array.from(new Set(data.map(a => a.userId)));
            const profilePromises = authorIds.map(id => userService.getUserById(id).catch(() => null));
            const profiles = await Promise.all(profilePromises);

            const profileMap: Record<number, User> = {};
            profiles.forEach(p => {
                if (p) {
                    profileMap[p.id] = p;
                }
            });
            setAuthorProfiles(profileMap);
        } catch (error) {
            console.error('Failed to fetch articles or authors:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, [roomId]);

    const getDifficultyClass = (diff: string) => {
        switch (diff?.toUpperCase()) {
            case 'ADVANCED': return styles.badgeSenior;
            case 'INTERMEDIATE': return styles.badgeMiddle;
            case 'BEGINNER':
            default: return styles.badgeJunior;
        }
    };

    const getBannerIcon = (id: number) => {
        const icons = [<CodeIcon key="1" />, <Database key="2" />, <LayoutIcon key="3" />, <Cpu key="4" />];
        return icons[id % icons.length];
    };

    const getBannerGradient = (id: number) => {
        const gradients = [
            'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
            'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            'linear-gradient(135deg, #3b82f6 0%, #2dd4bf 100%)'
        ];
        return gradients[id % gradients.length];
    };

    const filteredArticles = articles.filter(article => {
        if (difficulty !== 'Любая' && article.difficultyLevel !== difficulty) return false;
        return true;
    }).sort((a, b) => {
        if (filter === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
    });

    if (loading) return <Loader />;

    return (
        <div className={styles.articlesContainer}>
            <header className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <div className={styles.titleArea}>
                        <h1>Профессиональные статьи</h1>
                        <p className={styles.pageSubtitle}>
                            Глубокие разборы и туториалы от участников комнаты
                        </p>
                    </div>
                    <button
                        className={styles.primaryBtn}
                        onClick={() => {
                            if (!isMember(Number(roomId))) {
                                toast.error('Вступите в комнату, чтобы написать статью');
                                return;
                            }
                            navigate(`/rooms/${roomId}/articles/create`);
                        }}
                    >
                        <Plus size={20} style={{ marginRight: '0.5rem' }} />
                        Написать статью
                    </button>
                </div>
            </header>

            <div style={{ padding: '0 1.5rem 1.5rem' }}>
                <div className={styles.filtersRow}>
                    <div className={styles.filterGroup}>
                        <button
                            className={`${styles.filterBtn} ${filter === 'all' ? styles.filterBtnActive : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            Все
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filter === 'new' ? styles.filterBtnActive : ''}`}
                            onClick={() => setFilter('new')}
                        >
                            Новые
                        </button>
                        <button
                            className={`${styles.filterBtn} ${filter === 'popular' ? styles.filterBtnActive : ''}`}
                            onClick={() => setFilter('popular')}
                        >
                            Популярные
                        </button>
                    </div>
                    <div className={styles.difficultyGroup}>
                        <span className={styles.difficultyLabel}>Сложность:</span>
                        <select
                            className={styles.difficultySelect}
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="Любая">Любая</option>
                            <option value="BEGINNER">{t('difficulty.beginner')}</option>
                            <option value="INTERMEDIATE">{t('difficulty.intermediate')}</option>
                            <option value="ADVANCED">{t('difficulty.advanced')}</option>
                        </select>
                    </div>
                </div>

                <div className={styles.articlesGrid}>
                    {filteredArticles.map((article) => (
                        <div key={article.id} className={styles.articleCard}>
                            <div className={styles.cardBanner}>
                                <div
                                    className={styles.bannerGradient}
                                    style={{ background: getBannerGradient(article.id) }}
                                >
                                    {getBannerIcon(article.id)}
                                </div>
                                <div className={`${styles.difficultyBadge} ${getDifficultyClass(article.difficultyLevel || 'BEGINNER')}`}>
                                    {t(`difficulty.${(article.difficultyLevel || 'BEGINNER').toLowerCase()}`)}
                                </div>
                                <div className={styles.aiScore}>
                                    <Bot size={12} className={styles.aiScoreIcon} />
                                    <span className={styles.aiScoreText}>AI Score: {article.aiScore?.toFixed(1) || '—'}</span>
                                </div>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.authorRow}>
                                    <img
                                        src={authorProfiles[article.userId]?.avatar || `https://ui-avatars.com/api/?name=${authorProfiles[article.userId]?.firstname || 'User'}&background=random`}
                                        className={styles.authorAvatar}
                                        alt="avatar"
                                    />
                                    <span className={styles.authorName}>
                                        {authorProfiles[article.userId]
                                            ? [authorProfiles[article.userId].firstname, authorProfiles[article.userId].lastname].filter(Boolean).join(' ') || authorProfiles[article.userId].name
                                            : `Пользователь #${article.userId}`}
                                    </span>
                                    <span className={styles.separator}>•</span>
                                    <span className={styles.readTime}>
                                        {(() => {
                                            const text = article.content.replace(/<[^>]*>?/gm, '');
                                            const words = text.trim().split(/\s+/).length || 1;
                                            return Math.max(1, Math.ceil(words / 225));
                                        })()} {t('common.minRead') || 'мин чтения'}
                                    </span>
                                </div>
                                <h3
                                    className={styles.articleTitle}
                                    onClick={() => navigate(`/rooms/${roomId}/articles/${article.id}`)}
                                >
                                    {article.title}
                                </h3>
                                <p className={styles.articlePreview}>{createExcerpt(article.content, 120)}</p>
                                <div className={styles.cardFooter}>
                                    <div className={styles.actionsGroup}>
                                        <button className={`${styles.actionBtn} ${styles.bookmarkBtn}`}>
                                            <Bookmark size={16} />
                                        </button>
                                        <button className={`${styles.actionBtn} ${styles.likeBtn} ${user?.id && localStorage.getItem(`liked_article_${user.id}_${article.id}`) === 'true' ? styles.liked : ''}`}>
                                            <Heart 
                                                size={16} 
                                                fill={user?.id && localStorage.getItem(`liked_article_${user.id}_${article.id}`) === 'true' ? "var(--accent-primary)" : "none"} 
                                                color={user?.id && localStorage.getItem(`liked_article_${user.id}_${article.id}`) === 'true' ? "var(--accent-primary)" : "currentColor"} 
                                            />
                                            <span className={styles.statValue}>{(article as any).likesCount || 0}</span>
                                        </button>
                                    </div>
                                    <div className={styles.tagsGroup}>
                                        {article.tags?.slice(0, 3).map(tag => (
                                            <span key={tag} className={styles.tagLabel}>#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredArticles.length === 0 && !loading && (
                    <div className={styles.empty}>
                        <p>{t('article.noArticles') || 'В этой комнате еще нет статей. Будьте первым!'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomArticlesPage;
