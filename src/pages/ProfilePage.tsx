import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Settings,
    LogOut,
    FileText,
    MessageSquare,
    Users,
    Heart,
    Bot,
    Clock,
    Trophy,
    Pencil
} from 'lucide-react';
import { createExcerpt } from '../utils/textUtils';
import { contentService } from '../api/contentService';
import { directionService } from '../api/directionService';
import { useAuth } from '../context/AuthContext';
import type { Article, Post, Direction } from '../types';
import styles from './ProfilePage.module.css';

const ProfilePage: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [activeTab, setActiveTab] = useState<'publications' | 'bookmarks'>('publications');
    const [articles, setArticles] = useState<Article[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [directions, setDirections] = useState<Direction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [userArticles, userPosts, allDirs] = await Promise.all([
                contentService.getArticlesByUser(user.id),
                contentService.getPostsByUser(user.id),
                directionService.getDirections()
            ]);
            setArticles(userArticles);
            setPosts(userPosts);
            setDirections(allDirs);
        } catch (error) {
            console.error('Failed to fetch profile data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const getUserInitials = (firstname?: string, lastname?: string) => {
        return `${firstname?.[0] || ''}${lastname?.[0] || ''}`;
    };

    const currentDir = user?.selectedDirectionId ? directions.find(d => d.id === user.selectedDirectionId) : null;

    return (
        <div className={styles.profileContainer}>
            <header className={styles.header}>
                <div className={styles.headerBg}></div>
                <div className={styles.headerContent}>
                    <div className={styles.userProfile}>
                        <div className={styles.avatarWrapper}>
                            {user?.avatar ? (
                                <img src={user.avatar} className={styles.avatar} alt="Profile" />
                            ) : (
                                <div className={styles.avatarFallback}>
                                    {getUserInitials(user?.firstname, user?.lastname)}
                                </div>
                            )}
                            <button className={styles.editAvatarBtn}>
                                <Pencil size={18} />
                            </button>
                        </div>
                        <div className={styles.userInfo}>
                            <h1 className={styles.userName}>{user?.firstname} {user?.lastname}</h1>
                            <div className={styles.userMeta}>
                                <span className={styles.userRole}>{user?.role || 'Full-stack Developer'}</span>
                                <span className={styles.userLocation}>Almaty • Kazakhstan</span>
                            </div>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button className={styles.secondaryBtn} onClick={() => navigate('/settings')}>
                            <Settings size={20} />
                            <span>Настройки</span>
                        </button>
                        <button className={styles.secondaryBtn} onClick={logout}>
                            <LogOut size={20} />
                            <span>Выйти</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className={styles.mainContent}>
                <aside className={styles.sidebar}>
                    <div className={styles.statCard}>
                        <h3 className={styles.sidebarTitle}>Общая статистика</h3>
                        <div className={styles.statGrid}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{articles.length}</span>
                                <span className={styles.statLabel}>Статьи</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{posts.length}</span>
                                <span className={styles.statLabel}>Обсуждения</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>1.25k</span>
                                <span className={styles.statLabel}>Очки</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <h3 className={styles.sidebarTitle}>Специализация</h3>
                        {currentDir ? (
                            <div className={styles.specializationBox}>
                                <div className={styles.specIcon}>
                                    <FileText color="white" size={24} />
                                </div>
                                <div className={styles.specInfo}>
                                    <span className={styles.specName}>{t(`directions.${currentDir.name.toLowerCase()}`, currentDir.name)}</span>
                                    <span className={styles.specLevel}>{user?.role || 'Developer'}</span>
                                </div>
                            </div>
                        ) : (
                            <button className={styles.addSpecBtn} onClick={() => navigate('/settings')}>
                                Выбрать направление
                            </button>
                        )}
                    </div>

                    <div className={styles.menuList}>
                        <button className={`${styles.menuItem} ${activeTab === 'publications' ? styles.active : ''}`} onClick={() => setActiveTab('publications')}>
                            <FileText size={18} />
                            Публикации
                        </button>
                        <button className={`${styles.menuItem} ${activeTab === 'bookmarks' ? styles.active : ''}`} onClick={() => setActiveTab('bookmarks')}>
                            <Clock size={18} />
                            История
                        </button>
                        <button className={styles.menuItem} onClick={() => navigate('/dashboard')}>
                            <Users size={18} />
                            Мои комнаты
                        </button>
                    </div>
                </aside>

                <main className={styles.contentArea}>
                    <div className={styles.tabsHeader}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tabLink} ${activeTab === 'publications' ? styles.active : ''}`}
                                onClick={() => setActiveTab('publications')}
                            >
                                Публикации
                            </button>
                            <button
                                className={`${styles.tabLink} ${activeTab === 'bookmarks' ? styles.active : ''}`}
                                onClick={() => setActiveTab('bookmarks')}
                            >
                                Закладки
                            </button>
                        </div>
                    </div>

                    <div className={styles.articleList}>
                        {loading ? (
                            <p className="text-center py-8 text-gray-400">Загрузка контента...</p>
                        ) : activeTab === 'publications' ? (
                            articles.length === 0 && posts.length === 0 ? (
                                <p className="text-center py-8 text-gray-400 italic">Пока нет публикаций.</p>
                            ) : (
                                <>
                                    {articles.map(article => (
                                        <article
                                            key={article.id}
                                            className={styles.articleMiniCard}
                                            onClick={() => navigate(`/rooms/${article.roomId}/articles/${article.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={styles.articleHeader}>
                                                <span className={styles.articleTag}>Статья • {currentDir ? t(`directions.${currentDir.name.toLowerCase()}`, currentDir.name) : 'SkillHub'}</span>
                                                <span className={styles.articleDate}>
                                                    {new Date(article.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <h4 className={styles.articleTitle}>{article.title}</h4>
                                            <div className={styles.articleMeta}>
                                                <div className={styles.metaLink}>
                                                    <Heart size={14} /> {article.id % 20 + 2}
                                                </div>
                                                <div className={`${styles.metaLink} ${styles.aiScore}`}>
                                                    <Bot size={14} /> AI: {article.aiScore ? article.aiScore.toFixed(1) : '9.0'}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                    {posts.map(post => (
                                        <article
                                            key={post.id}
                                            className={styles.articleMiniCard}
                                            onClick={() => navigate(`/rooms/${(post as any).roomId || 1}/posts/${post.id}`)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className={styles.articleHeader}>
                                                <span className={`${styles.articleTag} ${styles.articleTagAlt}`}>{post.postType}</span>
                                                <span className={styles.articleDate}>
                                                    {new Date(post.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <h4 className={styles.articleTitle}>{post.title || createExcerpt(post.content, 50)}</h4>
                                            <div className={styles.articleMeta}>
                                                <div className={styles.metaLink}>
                                                    <MessageSquare size={14} /> {post.id % 6}
                                                </div>
                                                <div className={`${styles.metaLink} ${styles.statusTag}`}>
                                                    <Trophy size={14} /> {post.aiStatus === 'APPROVED' ? 'Решен' : 'В обсуждении'}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </>
                            )
                        ) : (
                            <p className="text-center py-8 text-gray-400 italic">Список закладок пуст.</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;
