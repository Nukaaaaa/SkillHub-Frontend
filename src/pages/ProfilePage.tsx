import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Camera,
    MapPin,
    Link as LinkIcon,
    Calendar,
    Share2,
    Heart,
    Bot,
    MessageSquare,
    Trophy
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { contentService } from '../api/contentService';
import { directionService } from '../api/directionService';
import { MOCK_DIRECTIONS } from '../mockData';
import type { Article, Post, Direction } from '../types';
import styles from './ProfilePage.module.css';
import { toast } from 'react-hot-toast';

const FAKE_ARTICLES: Article[] = [
    {
        id: 9991,
        roomId: 0,
        userId: 0,
        title: 'Глубокое погружение в индексы PostgreSQL',
        content: '',
        difficultyLevel: 'ADVANCED',
        createdAt: '2026-02-12T10:00:00Z',
        aiScore: 9.6,
        aiReviewStatus: 'APPROVED'
    },
    {
        id: 9992,
        roomId: 0,
        userId: 0,
        title: 'Микросервисы: паттерн Saga и распределенные транзакции',
        content: '',
        difficultyLevel: 'ADVANCED',
        createdAt: '2026-01-25T14:30:00Z',
        aiScore: 9.8,
        aiReviewStatus: 'APPROVED'
    }
];

const FAKE_POSTS: Post[] = [
    {
        id: 9993,
        roomId: 0,
        userId: 0,
        title: 'Как шардировать таблицу на 10 миллиардов записей?',
        content: 'Интересует опыт шардирования в высоконагруженных системах...',
        createdAt: '2026-02-08T09:15:00Z',
        postType: 'QUESTION',
        aiStatus: 'APPROVED'
    }
];

const ProfilePage: React.FC = () => {
    const { user, selectDirection } = useAuth();
    const { t } = useTranslation();
    const [articles, setArticles] = useState<Article[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [directions, setDirections] = useState<Direction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'publications' | 'achievements' | 'bookmarks'>('publications');

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) return;
            try {
                setLoading(true);
                const [userArticles, userPosts, allDirections] = await Promise.all([
                    contentService.getArticlesByUser(user.id),
                    contentService.getPostsByUser(user.id),
                    directionService.getDirections()
                ]);

                // Merge real data with fake data for "full" look
                setArticles([...userArticles, ...FAKE_ARTICLES]);
                setPosts([...userPosts, ...FAKE_POSTS]);
                setDirections(allDirections);
            } catch (error) {
                console.error('Failed to fetch user context:', error);
                // Fallback to fake data only on error
                setArticles(FAKE_ARTICLES);
                setPosts(FAKE_POSTS);
                setDirections(MOCK_DIRECTIONS);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);

    const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const dirId = Number(e.target.value);
        if (dirId) {
            selectDirection(dirId);
            toast.success('Направление успешно изменено!');
        }
    };

    if (!user) return <div className={styles.profileContainer}>Загрузка...</div>;

    // Mock contribution data (still random but based on ID for consistency)
    const seed = user.id || 1;
    const contributionData = Array.from({ length: 52 }, (_, i) =>
        Array.from({ length: 7 }, (_, j) => ((seed + i + j) % 5 === 0 ? Math.floor(((seed + i * j) % 3) + 1) : 0))
    );

    // Derived stats
    const reputation = (user.stats?.points || 0) + 12500; // Adding offset for premium look as requested
    const articlesCount = articles.length;
    const answersCount = (user.stats?.sessionsAttended || 0) + 1200;
    const awardsCount = 18; // Hardcoded for premium look

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileLayout}>
                {/* Left Sidebar */}
                <aside className={styles.sidebarColumn}>
                    {/* Profile Card */}
                    <div className={styles.profileCard}>
                        <div className={styles.cardBanner}>
                            <button className={styles.cameraBtn}>
                                <Camera size={18} />
                            </button>
                        </div>
                        <div className={styles.cardBody}>
                            <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name || 'User'}&background=4f46e5&color=fff&size=256`}
                                className={styles.profileAvatar}
                                alt="avatar"
                            />
                            <h2 className={styles.userName}>{user.name || 'Александр Захаров'}</h2>
                            <p className={styles.userHandle}>
                                @{(user.name || 'user').toLowerCase().replace(/\s+/g, '_')} • {user.role || (user.isMentor ? 'Senior Backend Engineer' : 'Student')}
                            </p>

                            <div className={styles.actionGroup}>
                                <button className={styles.editBtn}>Редактировать</button>
                                <button className={styles.shareBtn}>
                                    <Share2 size={18} />
                                </button>
                            </div>

                            <div className={styles.infoSection}>
                                <div className={styles.infoItem}>
                                    <MapPin className={styles.infoIcon} size={16} />
                                    <span>Almaty, Kazakhstan</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <LinkIcon className={styles.infoIcon} size={16} />
                                    <a href="#" className={styles.infoLink}>github.com/{(user.name || 'user').toLowerCase().split(' ')[0]}</a>
                                </div>
                                <div className={styles.infoItem}>
                                    <Calendar className={styles.infoIcon} size={16} />
                                    <span>В системе с февраля 2024</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Direction Selection Card */}
                    <div className={styles.directionCard}>
                        <h3 className={styles.directionTitle}>Текущее направление</h3>
                        <div className="relative">
                            <select
                                className={styles.directionSelect}
                                value={user.selectedDirectionId || ''}
                                onChange={handleDirectionChange}
                            >
                                <option value="" disabled>Выберите направление</option>
                                {directions.map(dir => (
                                    <option key={dir.id} value={dir.id}>{t(dir.name)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* AI Analysis Card */}
                    <div className={styles.aiAnalysisCard}>
                        <h3 className={styles.aiTitle}>AI Эксперт-анализ</h3>
                        {user.skillLevels && user.skillLevels.length > 0 ? (
                            user.skillLevels.slice(0, 3).map((skill, idx) => (
                                <div key={idx} className={styles.skillItem}>
                                    <div className={styles.skillHeader}>
                                        <span className={styles.skillLabel}>{t(skill.subject)}</span>
                                        <span className={styles.skillValue}>{skill.value}/100</span>
                                    </div>
                                    <div className={styles.progressBarTrack}>
                                        <div
                                            className={idx % 2 === 0 ? styles.progressBarFillIndigo : styles.progressBarFillEmerald}
                                            style={{ width: `${skill.value}%` }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <>
                                <div className={styles.skillItem}>
                                    <div className={styles.skillHeader}>
                                        <span className={styles.skillLabel}>Архитектура</span>
                                        <span className={styles.skillValue}>98/100</span>
                                    </div>
                                    <div className={styles.progressBarTrack}>
                                        <div className={styles.progressBarFillIndigo} style={{ width: '98%' }} />
                                    </div>
                                </div>
                                <div className={styles.skillItem}>
                                    <div className={styles.skillHeader}>
                                        <span className={styles.skillLabel}>Безопасность</span>
                                        <span className={styles.skillValue}>74/100</span>
                                    </div>
                                    <div className={styles.progressBarTrack}>
                                        <div className={styles.progressBarFillEmerald} style={{ width: '74%' }} />
                                    </div>
                                </div>
                            </>
                        )}
                        <p className={styles.aiNote}>
                            Данные сформированы на основе профессионализма опубликованных статей.
                        </p>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.mainColumn}>
                    {/* Stats Row */}
                    <div className={styles.statsGrid}>
                        <div className={`${styles.statItemCard} ${styles.statItemPremium}`}>
                            <p className={styles.statNumber}>
                                {reputation >= 1000 ? (reputation / 1000).toFixed(1) + 'k' : reputation}
                            </p>
                            <p className={styles.statLabel}>Репутация</p>
                        </div>
                        <div className={styles.statItemCard}>
                            <p className={styles.statNumber}>{articlesCount}</p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>Статьи</p>
                        </div>
                        <div className={styles.statItemCard}>
                            <p className={styles.statNumber}>{answersCount >= 1000 ? (answersCount / 1000).toFixed(1) + 'k' : answersCount}</p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>Ответы</p>
                        </div>
                        <div className={styles.statItemCard}>
                            <p className={styles.statNumber}>{awardsCount}</p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>Награды</p>
                        </div>
                    </div>

                    {/* Contribution Card */}
                    <div className={styles.contributionCard}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>Активность вкладов</h3>
                            <span className={styles.sectionSubtitle}>842 вклада за год</span>
                        </div>
                        <div className={styles.contributionGrid}>
                            {contributionData.map((week, wIndex) => (
                                <div key={wIndex} className={styles.gridCol}>
                                    {week.map((level, dIndex) => (
                                        <div
                                            key={dIndex}
                                            className={`${styles.gridCell} ${level === 1 ? styles.cellL1 :
                                                level === 2 ? styles.cellL2 :
                                                    level === 3 ? styles.cellL3 : ''
                                                }`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tabs & Content */}
                    <div className={styles.tabsContainer}>
                        <div className={styles.tabsHeader}>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'publications' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('publications')}
                            >
                                Публикации
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'achievements' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('achievements')}
                            >
                                Достижения
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'bookmarks' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('bookmarks')}
                            >
                                Закладки
                            </button>
                        </div>

                        <div className={styles.articleList}>
                            {loading ? (
                                <p className="text-center py-8 text-gray-400">Загрузка контента...</p>
                            ) : (
                                <>
                                    {articles.map(article => (
                                        <article key={article.id} className={styles.articleMiniCard}>
                                            <div className={styles.articleHeader}>
                                                <span className={styles.articleTag}>Статья • Backend Разработка</span>
                                                <span className={styles.articleDate}>{new Date(article.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <h4 className={styles.articleTitle}>{article.title}</h4>
                                            <div className={styles.articleMeta}>
                                                <div className={styles.metaLink}>
                                                    <Heart size={14} /> 245
                                                </div>
                                                <div className={`${styles.metaLink} ${styles.aiScore}`}>
                                                    <Bot size={14} /> AI: {article.aiScore ? article.aiScore.toFixed(1) : '9.6'}
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                    {posts.map(post => (
                                        <article key={post.id} className={styles.articleMiniCard}>
                                            <div className={styles.articleHeader}>
                                                <span className={`${styles.articleTag} ${styles.articleTagAlt}`}>{post.postType} • Highload</span>
                                                <span className={styles.articleDate}>{new Date(post.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <h4 className={styles.articleTitle}>{post.title || post.content.substring(0, 50) + '...'}</h4>
                                            <div className={styles.articleMeta}>
                                                <div className={styles.metaLink}>
                                                    <MessageSquare size={14} /> 12 ответов
                                                </div>
                                                <div className={`${styles.metaLink} ${styles.statusTag}`}>
                                                    <Trophy size={14} /> Решен
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;
