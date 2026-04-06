import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { toast } from 'react-hot-toast';
import { createExcerpt } from '../utils/textUtils';
import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import { directionService } from '../api/directionService';
import Loader from '../components/Loader';
import type { Article, Post, Direction, User } from '../types/index';
import EditProfileModal from '../components/profile/EditProfileModal';
import SkillRadar from '../components/profile/SkillRadar';
import styles from './ProfilePage.module.css';

const DEFAULT_SKILLS = [
    { subject: 'Backend', value: 80, fullMark: 100 },
    { subject: 'Frontend', value: 45, fullMark: 100 },
    { subject: 'DevOps', value: 30, fullMark: 100 },
    { subject: 'Database', value: 65, fullMark: 100 },
    { subject: 'QA', value: 20, fullMark: 100 },
    { subject: 'Soft Skills', value: 75, fullMark: 100 },
];

const ProfilePage: React.FC = () => {
    const { user: currentUser, updateUser } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [articles, setArticles] = useState<Article[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [directions, setDirections] = useState<Direction[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'publications' | 'achievements' | 'bookmarks'>('publications');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userSkills, setUserSkills] = useState(DEFAULT_SKILLS);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        avatarInputRef.current?.click();
    };

    const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && isOwnProfile) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                updateUser({ avatar: base64String });
                toast.success(t('settings.profileUpdated'));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'SkillHub Profile',
            text: `Check out ${profileUser?.name}'s profile on SkillHub!`,
            url: window.location.href
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success(t('common.linkCopied') || 'Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const targetId = id ? Number(id) : currentUser?.id;
            if (!targetId) {
                setLoading(false);
                return;
            }

            // Mock skills logic for interactive demo
            const savedSkills = localStorage.getItem(`user_skills_${targetId}`);
            if (savedSkills) {
                setUserSkills(JSON.parse(savedSkills));
            } else {
                setUserSkills(DEFAULT_SKILLS);
            }

            try {
                setLoading(true);

                // Always fetch from API to get full data (bio, stats, etc.)
                const userData = await userService.getUserById(targetId);
                setProfileUser(userData);

                if (userData) {
                    const [userArticles, userPosts, allDirections] = await Promise.all([
                        contentService.getArticlesByUser(userData.id).catch(() => []),
                        contentService.getPostsByUser(userData.id).catch(() => []),
                        directionService.getDirections().catch(() => [])
                    ]);

                    setArticles(Array.isArray(userArticles) ? userArticles : []);
                    setPosts(Array.isArray(userPosts) ? userPosts : []);
                    setDirections(Array.isArray(allDirections) ? allDirections : []);
                }
            } catch (error) {
                console.error('Failed to fetch user context:', error);
                // Fallback to currentUser if fetch fails and it's own profile
                if (!id && currentUser) {
                    setProfileUser(currentUser);
                }
                setArticles([]);
                setPosts([]);
                setDirections([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, currentUser?.id]);

    const isOwnProfile = !id || Number(id) === currentUser?.id;

    // Helper for displaying user name
    const getDisplayName = (u: User | null) => {
        if (!u) return 'User';
        if (u.firstname || u.lastname) {
            return `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim();
        }
        return u.name || 'User';
    };

    const handleDirectionChange = () => {
        navigate('/dashboard?from=profile');
    };

    if (!profileUser && !loading) return <div className={styles.profileContainer}>{t('common.noData')}</div>;
    if (loading) return <div className={styles.profileContainer}><Loader /></div>;

    // Find current direction object with loose equality and localStorage fallback
    const savedDirId = localStorage.getItem(`selected_direction_${profileUser?.id}`);
    const effectiveDirId = profileUser?.selectedDirectionId || (savedDirId ? Number(savedDirId) : null);
    const currentDir = directions.find(d => Number(d.id) === Number(effectiveDirId));

    // Mock contribution data restored for premium look
    const seed = profileUser?.id || 1;
    const contributionData = Array.from({ length: 52 }, (_, i) =>
        Array.from({ length: 7 }, (_, j) => ((seed + i + j) % 5 === 0 ? Math.floor(((seed + i * j) % 3) + 1) : 0))
    );

    // Derived stats
    const reputation = (profileUser?.stats?.points || 0);
    const articlesCount = articles.length;
    const answersCount = (profileUser?.stats?.sessionsAttended || 0);
    const awardsCount = 0; // Set to actual when implemented

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileLayout}>
                {/* Left Sidebar */}
                <aside className={styles.sidebarColumn}>
                    {/* Profile Card */}
                    <div className={styles.profileCard}>
                        <div className={styles.cardBanner}>
                            {isOwnProfile && (
                                <button className={styles.cameraBtn} onClick={handleAvatarClick} title={t('profile.changeAvatar') || 'Change Avatar'}>
                                    <Camera size={18} />
                                </button>
                            )}
                            <input
                                type="file"
                                ref={avatarInputRef}
                                onChange={handleAvatarFileChange}
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                        </div>
                        <div className={styles.cardBody}>
                            <img
                                src={profileUser?.avatar || `https://ui-avatars.com/api/?name=${getDisplayName(profileUser)}&background=4f46e5&color=fff&size=256`}
                                className={styles.profileAvatar}
                                alt="avatar"
                            />
                            <h2 className={styles.userName}>{getDisplayName(profileUser)}</h2>
                            <p className={styles.userHandle}>
                                @{(profileUser?.name || 'user').toLowerCase().replace(/\s+/g, '_')} • {profileUser?.role || (profileUser?.isMentor ? 'Senior Backend Engineer' : 'Student')}
                            </p>

                            {profileUser?.bio && (
                                <p className={styles.userBio}>{profileUser.bio}</p>
                            )}

                            <div className={styles.actionGroup}>
                                {isOwnProfile ? (
                                    <button className={styles.editBtn} onClick={() => setIsEditModalOpen(true)}>
                                        {t('profile.edit')}
                                    </button>
                                ) : (
                                    <button className={styles.editBtn}>
                                        {t('community.message')}
                                    </button>
                                )}
                                <button className={styles.shareBtn} onClick={handleShare}>
                                    <Share2 size={18} />
                                </button>
                            </div>

                            <div className={styles.infoSection}>
                                <div className={styles.infoItem}>
                                    <MapPin className={styles.infoIcon} size={16} />
                                    <span>{profileUser?.universite || '—'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <LinkIcon className={styles.infoIcon} size={16} />
                                    <a
                                        href={profileUser?.githubUrl ? (profileUser.githubUrl.startsWith('http') ? profileUser.githubUrl : `https://${profileUser.githubUrl}`) : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.infoLink}
                                    >
                                        {profileUser?.githubUrl ? profileUser.githubUrl.replace(/^https?:\/\//, '') : '—'}
                                    </a>
                                </div>
                                <div className={styles.infoItem}>
                                    <Calendar className={styles.infoIcon} size={16} />
                                    <span>{t('rooms.updated')} {new Date().getFullYear()}</span>
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
                            <button className={styles.changeDirBtn} onClick={handleDirectionChange} disabled={loading || !isOwnProfile}>
                                <Share2 size={14} style={{ transform: 'rotate(-90deg)' }} /> {t('settings.changeDirection')}
                            </button>
                        </div>
                    </div>

                    {/* AI Analysis Card */}
                    <div className={styles.aiAnalysisCard}>
                        <h3 className={styles.aiTitle}>{t('profile.aiExpertise')}</h3>
                        <div className={styles.radarWrapper}>
                            <SkillRadar data={userSkills} />
                        </div>
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

                    {/* Contribution Card placeholder */}
                    <div className={styles.contributionCard}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>{t('profile.activity')}</h3>
                            <span className={styles.sectionSubtitle}>0 {t('profile.contributionsYear')}</span>
                        </div>
                        <div className={styles.contributionGrid} style={{ opacity: 0.1 }}>
                            {/* Empty grid */}
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
                                                        <MessageSquare size={14} /> —
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

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />
        </div>
    );
};

export default ProfilePage;