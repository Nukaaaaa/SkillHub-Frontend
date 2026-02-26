import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    Bookmark,
    Heart,
    Bot,
    Code as CodeIcon,
    Database,
    Layout as LayoutIcon,
    Cpu
} from 'lucide-react';

import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import type { Article, User } from '../types';
import Loader from '../components/Loader';
import CreateArticleModal from '../components/CreateArticleModal';
import { useAuth } from '../context/AuthContext';
import styles from './RoomArticlesPage.module.css';

const RoomArticlesPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { t } = useTranslation();
    const { isMember } = useAuth();
    const [articles, setArticles] = useState<Article[]>([]);
    const [authorProfiles, setAuthorProfiles] = useState<Record<number, User>>({});
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'new' | 'popular'>('all');
    const [difficulty, setDifficulty] = useState<string>('Любая');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchArticles = async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const data = await contentService.getArticlesByRoom(Number(roomId));
            setArticles(data);

            // Fetch profiles for all authors (unique IDs only)
            const authorIds = Array.from(new Set(data.map(a => a.userId)));
            const profilePromises = authorIds.map(id => userService.getUserById(id));
            const profiles = await Promise.all(profilePromises);

            const profileMap: Record<number, User> = {};
            profiles.forEach(p => {
                profileMap[p.id] = p;
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
        switch (diff?.toLowerCase()) {
            case 'senior': return styles.badgeSenior;
            case 'middle': return styles.badgeMiddle;
            case 'junior':
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
        if (difficulty !== 'Любая' && article.difficultyLevel !== difficulty.toUpperCase()) return false;
        return true;
    }).sort((a, b) => {
        if (filter === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        // Mock popular sorting by ID or something for now
        if (filter === 'popular') return (b as any).likesCount - (a as any).likesCount;
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
                            setIsCreateModalOpen(true);
                        }}
                        style={{ opacity: isMember(Number(roomId)) ? 1 : 0.6 }}
                    >
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
                            <option>Любая</option>
                            <option>Junior</option>
                            <option>Middle</option>
                            <option>Senior</option>
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
                                    {article.difficultyLevel || 'BEGINNER'}
                                </div>
                                <div className={styles.aiScore}>
                                    <Bot size={12} className={styles.aiScoreIcon} />
                                    <span className={styles.aiScoreText}>AI Score: 9.{article.id % 10}</span>
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
                                            ? `${authorProfiles[article.userId].firstname} ${authorProfiles[article.userId].lastname}`
                                            : `User #${article.userId}`}
                                    </span>
                                    <span className={styles.separator}>•</span>
                                    <span className={styles.readTime}>12 мин чтения</span>
                                </div>
                                <h3 className={styles.articleTitle}>{article.title}</h3>
                                <p className={styles.articlePreview}>{article.content}</p>
                                <div className={styles.cardFooter}>
                                    <div className={styles.actionsGroup}>
                                        <button className={`${styles.actionBtn} ${styles.bookmarkBtn}`}>
                                            <Bookmark size={16} />
                                        </button>
                                        <button className={`${styles.actionBtn} ${styles.likeBtn}`}>
                                            <Heart size={16} />
                                            <span className={styles.statValue}>{(article as any).likesCount || 0}</span>
                                        </button>
                                    </div>
                                    <div className={styles.tagsGroup}>
                                        <span className={styles.tag}>#Highload</span>
                                        <span className={styles.tag}>#Architecture</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <CreateArticleModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    roomId={Number(roomId)}
                    onSuccess={fetchArticles}
                />
            </div>
        </div>
    );
};

export default RoomArticlesPage;
