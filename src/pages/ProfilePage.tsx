import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { createExcerpt } from '../utils/textUtils';
import { contentService } from '../api/contentService';
import { directionService } from '../api/directionService';
import { MOCK_DIRECTIONS } from '../mockData';
import type { Article, Post, Direction } from '../types';
import styles from './ProfilePage.module.css';


const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [articles, setArticles] = useState<Article[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [directions, setDirections] = useState<Direction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'publications' | 'achievements' | 'bookmarks'>('publications');

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const [userArticles, userPosts, allDirections] = await Promise.all([
                    contentService.getArticlesByUser(user.id).catch(() => []),
                    contentService.getPostsByUser(user.id).catch(() => []),
                    directionService.getDirections().catch(() => [])
                ]);


                // Set real data from API
                setArticles(Array.isArray(userArticles) ? userArticles : []);
                setPosts(Array.isArray(userPosts) ? userPosts : []);

                // Robust direction merging
                const merged = [...MOCK_DIRECTIONS];
                (allDirections || []).forEach(serverDir => {
                    const idx = merged.findIndex(m => Number(m.id) === Number(serverDir.id));
                    if (idx > -1) merged[idx] = serverDir;
                    else merged.push(serverDir);
                });
                setDirections(merged);
            } catch (error) {
                console.error('Failed to fetch user context:', error);
                setArticles([]);
                setPosts([]);
                setDirections(MOCK_DIRECTIONS);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user?.id, user?.selectedDirectionId]);

    const handleDirectionChange = () => {
        navigate('/dashboard?from=profile');
    };

    if (!user) return <div className={styles.profileContainer}>{t('common.loading')}</div>;

    // Find current direction object with loose equality and localStorage fallback
    const savedDirId = localStorage.getItem(`selected_direction_${user?.id}`);
    const effectiveDirId = user.selectedDirectionId || (savedDirId ? Number(savedDirId) : null);
    const currentDir = directions.find(d => Number(d.id) === Number(effectiveDirId));

    // Mock contribution data restored for premium look
    const seed = user.id || 1;
    const contributionData = Array.from({ length: 52 }, (_, i) =>
        Array.from({ length: 7 }, (_, j) => ((seed + i + j) % 5 === 0 ? Math.floor(((seed + i * j) % 3) + 1) : 0))
    );

    // Derived stats
    const reputation = (user.stats?.points || 0) + 12500; // Restored offset
    const articlesCount = articles.length;
    const answersCount = user.stats?.sessionsAttended || 0;
    const awardsCount = 0; // Set to 0 as we don't have real awards data yet

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
                            <h2 className={styles.userName}>{user.name || 'User'}</h2>
                            <p className={styles.userHandle}>
                                @{(user.name || 'user').toLowerCase().replace(/\s+/g, '_')} • {user.role || (user.isMentor ? 'Senior Backend Engineer' : 'Student')}
                            </p>

                            <div className={styles.actionGroup}>
                                <button className={styles.editBtn}>{t('profile.edit')}</button>
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
                                    <span>{t('rooms.updated')} 2024</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.directionCard}>
                        <h3 className={styles.directionTitle}>{t('profile.currentDirection')}</h3>
                        <div className={styles.currentDirection}>
                            <span className={styles.directionName}>
                                {loading ? t('common.loading') : (currentDir ? t(currentDir.name) : t('settings.noDirection'))}
                            </span>
                            <button className={styles.changeDirBtn} onClick={handleDirectionChange} disabled={loading}>
                                <Share2 size={14} style={{ transform: 'rotate(-90deg)' }} /> {t('settings.changeDirection')}
                            </button>
                        </div>
                    </div>

                    {/* AI Analysis Card */}
                    <div className={styles.aiAnalysisCard}>
                        <h3 className={styles.aiTitle}>{t('profile.aiExpertise')}</h3>
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
                            <p className={styles.noDataNote}>{t('common.noData')}</p>
                        )}
                        <p className={styles.aiNote}>
                            {t('rooms.writeArticlePrompt')}
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
                            <p className={styles.statLabel}>{t('profile.reputation')}</p>
                        </div>
                        <div className={styles.statItemCard}>
                            <p className={styles.statNumber}>{articlesCount}</p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>{t('profile.articles')}</p>
                        </div>
                        <div className={styles.statItemCard}>
                            <p className={styles.statNumber}>{answersCount >= 1000 ? (answersCount / 1000).toFixed(1) + 'k' : answersCount}</p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>{t('profile.comments')}</p>
                        </div>
                        <div className={styles.statItemCard}>
                            <p className={styles.statNumber}>{awardsCount}</p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>{t('profile.awards')}</p>
                        </div>
                    </div>

                    {/* Contribution Card */}
                    <div className={styles.contributionCard}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>{t('profile.activity')}</h3>
                            <span className={styles.sectionSubtitle}>842 {t('profile.contributionsYear')}</span>
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
                                {t('profile.tabs.publications')}
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'achievements' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('achievements')}
                            >
                                {t('profile.tabs.achievements')}
                            </button>
                            <button
                                className={`${styles.tabBtn} ${activeTab === 'bookmarks' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('bookmarks')}
                            >
                                {t('profile.tabs.bookmarks')}
                            </button>
                        </div>

                        <div className={styles.articleList}>
                            {loading ? (
                                <p className="text-center py-8 text-gray-400">{t('common.loading')}</p>
                            ) : activeTab === 'publications' ? (
                                articles.length === 0 && posts.length === 0 ? (
                                    <p className="text-center py-8 text-gray-400 italic">{t('common.noData')}</p>
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
                                                    <span className={styles.articleTag}>{t('login.articles')} • {currentDir ? t(currentDir.name) : 'Backend'}</span>
                                                    <span className={styles.articleDate}>
                                                        {new Date(article.createdAt).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h4 className={styles.articleTitle}>{article.title}</h4>
                                                <div className={styles.articleMeta}>
                                                    <div className={styles.metaLink}>
                                                        <Heart size={14} /> 0
                                                    </div>
                                                    <div className={`${styles.metaLink} ${styles.aiScore}`}>
                                                        <Bot size={14} /> AI: {article.aiScore ? article.aiScore.toFixed(1) : '—'}
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
                                                        {new Date(post.createdAt).toLocaleDateString(i18n.language === 'ru' ? 'ru-RU' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <h4 className={styles.articleTitle}>{post.title || createExcerpt(post.content, 60)}</h4>
                                                <div className={styles.articleMeta}>
                                                    <div className={styles.metaLink}>
                                                        <MessageSquare size={14} /> 0
                                                    </div>
                                                    <div className={`${styles.metaLink} ${styles.statusTag}`}>
                                                        <Trophy size={14} /> {post.aiStatus === 'APPROVED' ? t('comment.accepted') : t('rooms.discussions')}
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </>
                                )
                            ) : (
                                <p className="text-center py-8 text-gray-400 italic">
                                    {activeTab === 'achievements' ? t('profile.tabs.achievements') : t('profile.tabs.bookmarks')}
                                </p>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProfilePage;