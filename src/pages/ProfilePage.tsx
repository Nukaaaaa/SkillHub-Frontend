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
    Trophy,
    Zap
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { createExcerpt } from '../utils/textUtils';
import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import { directionService } from '../api/directionService';
import {
    achievementService,
    computeLevelData,
    getActivityColor,
    type UserStatsDto,
    type UserActivityDto,
    type UserProgressDto,
} from '../api/achievementService';
import Loader from '../components/Loader';
import type { Article, Post, Direction, User, Room } from '../types/index';
import { educationService, type SkillDto } from '../api/educationService';
import { roomService } from '../api/roomService';
import EditProfileModal from '../components/profile/EditProfileModal';
import SkillRadar from '../components/profile/SkillRadar';
import Avatar from '../components/Avatar';
import styles from './ProfilePage.module.css';

const DEFAULT_SKILLS = [
    { subject: 'Backend', value: 80, fullMark: 100 },
    { subject: 'Frontend', value: 45, fullMark: 100 },
    { subject: 'DevOps', value: 30, fullMark: 100 },
    { subject: 'Database', value: 65, fullMark: 100 },
    { subject: 'QA', value: 20, fullMark: 100 },
    { subject: 'Soft Skills', value: 75, fullMark: 100 },
];

// ─── Compact Activity Grid for Profile ───────────────────────────────────────
interface ProfileActivityGridProps {
    data: UserActivityDto[];
}

function buildActivityMap(data: UserActivityDto[]): Record<string, number> {
    const map: Record<string, number> = {};
    data.forEach((d) => (map[d.date] = d.count));
    return map;
}

function getLastYearWeeks(): Date[] {
    const weeks: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - dayOfWeek);
    for (let w = 51; w >= 0; w--) {
        const d = new Date(lastSunday);
        d.setDate(lastSunday.getDate() - w * 7);
        weeks.push(d);
    }
    return weeks;
}

function formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const ProfileActivityGrid: React.FC<ProfileActivityGridProps> = ({ data }) => {
    const map = buildActivityMap(data);
    const weeks = getLastYearWeeks();

    return (
        <div className={styles.profileActivityScroll}>
            <div className={styles.profileActivityGrid}>
                {weeks.map((weekStart, wi) => (
                    <div key={wi} className={styles.profileWeekCol}>
                        {Array.from({ length: 7 }).map((_, di) => {
                            const day = new Date(weekStart);
                            day.setDate(weekStart.getDate() + di);
                            const dateStr = formatDate(day);
                            const count = map[dateStr] ?? 0;
                            const color = getActivityColor(count);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            if (day > today) return <div key={di} className={styles.profileGridCell} style={{ background: 'transparent' }} />;
                            return (
                                <div
                                    key={di}
                                    className={styles.profileGridCell}
                                    style={{ background: color }}
                                    title={`${dateStr}: ${count}`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

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
    const [activeTab, setActiveTab] = useState<'publications' | 'skills' | 'achievements' | 'bookmarks'>('publications');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Achievement service state
    const [xpStats, setXpStats] = useState<UserStatsDto | null>(null);
    const [activityData, setActivityData] = useState<UserActivityDto[]>([]);
    const [userAchievements, setUserAchievements] = useState<UserProgressDto[]>([]);
    const [userSkillsList, setUserSkillsList] = useState<SkillDto[]>([]);
    const [userRoomsList, setUserRoomsList] = useState<Room[]>([]);
    const [selectedCertRoom, setSelectedCertRoom] = useState<Room | null>(null);

    const handleAvatarClick = () => {
        avatarInputRef.current?.click();
    };

    const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && isOwnProfile) {
            // 1. Instant preview
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                // Temporarily show base64
                updateUser({ avatar: base64String });
                
                try {
                    // 2. Real upload in background
                    await updateUser({ avatarFile: file });
                    toast.success(t('settings.profileUpdated'));
                } catch (err) {
                    toast.error(t('common.error'));
                }
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

            try {
                setLoading(true);

                // Always fetch from API to get full data (bio, stats, etc.)
                const userData = await userService.getUserById(targetId);
                
                // If it's our own profile, merge with latest context data (includes local avatar/github)
                const finalUser = (targetId === currentUser?.id) 
                    ? { ...userData, ...currentUser } 
                    : userData;
                    
                setProfileUser(finalUser);

                if (finalUser) {
                    const isOwn = targetId === currentUser?.id;
                    const [userArticles, userPosts, allDirections, stats, activity, achievements, skills, rooms] = await Promise.all([
                        contentService.getArticlesByUser(userData.id).catch(() => []),
                        contentService.getPostsByUser(userData.id).catch(() => []),
                        directionService.getDirections().catch(() => []),
                        (isOwn
                            ? achievementService.getMyStats()
                            : achievementService.getUserStats(targetId)
                        ).catch(() => null),
                        (isOwn
                            ? achievementService.getMyActivity()
                            : achievementService.getUserActivity(targetId)
                        ).catch(() => []),
                        (isOwn
                            ? achievementService.getMyAchievements()
                            : achievementService.getUserAchievements(targetId)
                        ).catch(() => []),
                        educationService.getUserSkills(targetId).catch(() => []),
                        roomService.getUserRooms(targetId).catch(() => []),
                    ]);

                    setArticles(Array.isArray(userArticles) ? userArticles : []);
                    setPosts(Array.isArray(userPosts) ? userPosts : []);
                    setDirections(Array.isArray(allDirections) ? allDirections : []);
                    setXpStats(stats);
                    setActivityData(Array.isArray(activity) ? activity : []);
                    setUserAchievements(Array.isArray(achievements) ? achievements : []);
                    setUserSkillsList(
                        Array.isArray(skills)
                            ? (isOwn ? skills : skills.filter(s => s.userStatus === 'CONFIRMED'))
                            : []
                    );
                    setUserRoomsList(Array.isArray(rooms) ? rooms : []);
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
    }, [id, currentUser?.id, currentUser?.avatar, currentUser?.name]);

    const isOwnProfile = !id || Number(id) === currentUser?.id;

    // Background polling for real-time portfolio updates (only for own profile)
    useEffect(() => {
        if (!isOwnProfile || !currentUser?.id || loading) return;

        const pollInterval = setInterval(async () => {
            try {
                const targetId = currentUser.id;
                
                // Fetch latest data from database
                const [stats, achievements, skills, rooms] = await Promise.all([
                    achievementService.getMyStats().catch(() => null),
                    achievementService.getMyAchievements().catch(() => []),
                    educationService.getUserSkills(targetId).catch(() => []),
                    roomService.getUserRooms(targetId).catch(() => []),
                ]);

                // 1. Detect Level Up
                if (stats && xpStats && stats.level > xpStats.level) {
                    toast.success(`🎉 Поздравляем! Вы достигли ${stats.level}-го уровня!`, {
                        duration: 5000,
                        icon: '🔥'
                    });
                }

                // 2. Detect Reputation Change
                if (stats && xpStats && stats.reputation > xpStats.reputation) {
                    const diff = stats.reputation - xpStats.reputation;
                    toast.success(`✨ Ваша репутация выросла на +${diff}!`, {
                        icon: '⭐️'
                    });
                }

                // 3. Detect New Achievements Unlocked
                if (achievements.length > 0 && userAchievements.length > 0) {
                    achievements.forEach(newAch => {
                        const oldAch = userAchievements.find(a => a.achievementId === newAch.achievementId);
                        if (newAch.isUnlocked && (!oldAch || !oldAch.isUnlocked)) {
                            toast.success(`🏆 Разблокировано достижение: "${newAch.name}"!\n${newAch.description}`, {
                                duration: 6000,
                                icon: '👑'
                            });
                        }
                    });
                }

                // 4. Detect Skill Confirmations
                if (skills.length > 0 && userSkillsList.length > 0) {
                    skills.forEach(newSkill => {
                        const oldSkill = userSkillsList.find(s => s.id === newSkill.id);
                        if (newSkill.userStatus === 'CONFIRMED' && (!oldSkill || oldSkill.userStatus !== 'CONFIRMED')) {
                            toast.success(`🎯 Навык "${newSkill.name}" успешно подтвержден!`, {
                                duration: 5000,
                                icon: '✓'
                            });
                        }
                    });
                }

                // Update state if anything changed
                if (stats) setXpStats(stats);
                if (achievements.length > 0) setUserAchievements(achievements);
                if (skills.length > 0) setUserSkillsList(skills);
                if (rooms.length > 0) setUserRoomsList(rooms);

            } catch (error) {
                console.error("Failed to poll real-time updates:", error);
            }
        }, 8000); // Poll every 8 seconds

        return () => clearInterval(pollInterval);
    }, [isOwnProfile, currentUser?.id, loading, xpStats, userAchievements, userSkillsList, userRoomsList]);

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


    // Derived stats — prefer achievement service data if available
    const reputation = xpStats?.reputation ?? (profileUser?.stats?.points || 0);
    const xpLevel = xpStats ? computeLevelData(xpStats.totalXp) : null;

    // Derived stats for skills, certificates, and peer reviews
    const confirmedSkillsCount = userSkillsList.filter(s => s.userStatus === 'CONFIRMED').length;
    const totalSkillsCount = userSkillsList.length;

    const certificates = userRoomsList.filter(room => {
        const roomSkills = userSkillsList.filter(s => s.roomId === room.id);
        return roomSkills.length > 0 && roomSkills.every(s => s.userStatus === 'CONFIRMED');
    });
    const certificatesCount = certificates.length;

    const peerReviewsCount = userAchievements.find(
        a => a.name.toLowerCase().includes("реценз") || a.name.toLowerCase().includes("аудит")
    )?.currentCount ?? 0;

    // Derived skills for radar from real xpStats.directionStats
    let userSkills = DEFAULT_SKILLS;
    if (xpStats?.directionStats && xpStats.directionStats.length > 0 && directions.length > 0) {
        // Find max level to scale the radar chart, at least 10 baseline
        const maxLevel = Math.max(10, ...xpStats.directionStats.map(d => d.level));
        userSkills = xpStats.directionStats.map(ds => {
            const dir = directions.find(d => Number(d.id) === Number(ds.directionId));
            const subjectLabel = dir ? dir.name : `Навык ${ds.directionId}`;
            return {
                subject: subjectLabel,
                value: ds.level,
                fullMark: maxLevel
            };
        });
        // Pad with empty properties if there are less than 3 so the polygon can draw
        if (userSkills.length === 1) {
            userSkills.push({ subject: '-', value: 0, fullMark: maxLevel });
            userSkills.push({ subject: '--', value: 0, fullMark: maxLevel });
        } else if (userSkills.length === 2) {
            userSkills.push({ subject: '-', value: 0, fullMark: maxLevel });
        }
    }

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
                            <Avatar 
                                src={profileUser?.avatar} 
                                name={getDisplayName(profileUser)} 
                                size="xl"
                                className={styles.profileAvatar}
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
                                    <button 
                                        className={styles.editBtn}
                                        onClick={() => navigate(`/chat?userId=${profileUser?.id}`)}
                                    >
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

                    {isOwnProfile && (
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
                    )}

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
                            <p className={styles.statNumber}>
                                {confirmedSkillsCount} <span className={styles.statSubText}>/ {totalSkillsCount}</span>
                            </p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>Навыки</p>
                        </div>
                        <div className={styles.statItemCard}>
                            <p className={styles.statNumber}>{certificatesCount}</p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>Сертификаты</p>
                        </div>
                        <div className={styles.statItemCard}>
                            <p className={styles.statNumber}>{peerReviewsCount}</p>
                            <p className={`${styles.statLabel} ${styles.statLabelDark}`}>Рецензии P2P</p>
                        </div>
                    </div>

                    {/* XP Level Bar */}
                    {xpLevel && (
                        <div className={styles.xpLevelCard}>
                            <div className={styles.xpLevelHeader}>
                                <span className={styles.xpLevelBadge}>
                                    <Zap size={14} /> Уровень {xpLevel.level}
                                </span>
                                <span className={styles.xpLevelTotal}>{xpStats?.totalXp.toLocaleString()} XP</span>
                            </div>
                            <div className={styles.xpLevelTrack}>
                                <div className={styles.xpLevelFill} style={{ width: `${xpLevel.progressPercent}%` }} />
                            </div>
                            <p className={styles.xpLevelSub}>{xpLevel.xpInLevel} / {xpLevel.xpPerLevel} XP до следующего уровня</p>
                        </div>
                    )}

                    {/* Activity Contribution Grid */}
                    <div className={styles.contributionCard}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>{t('profile.activity')}</h3>
                            <span className={styles.sectionSubtitle}>
                                {activityData.reduce((s, d) => s + d.count, 0)} {t('profile.contributionsYear')}
                            </span>
                        </div>
                        <ProfileActivityGrid data={activityData} />
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
                                className={`${styles.tabBtn} ${activeTab === 'skills' ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab('skills')}
                            >
                                {t('profile.tabs.skills') || 'Портфолио навыков'}
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
                                                onClick={() => navigate(`/articles/${article.id}`, { state: { from: 'profile' } })}
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
                                                    <div className={`${styles.metaLink} ${styles.likeStat}`}>
                                                        <Heart size={14} fill="currentColor" /> 0
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
                                                onClick={() => navigate(`/posts/${post.id}`)}
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
                            ) : activeTab === 'skills' ? (
                                userRoomsList.filter(room => userSkillsList.some(s => s.roomId === room.id)).length === 0 ? (
                                    <p className={styles.emptyTabMsg}>{t('profile.tabs.noSkills') || 'Нет подтвержденных или изучаемых навыков'}</p>
                                ) : (
                                    <div className={styles.specializationsContainer}>
                                        {userRoomsList.map((room) => {
                                            const roomSkills = userSkillsList.filter(s => s.roomId === room.id);
                                            if (roomSkills.length === 0) return null;
                                            
                                            const confirmedInRoom = roomSkills.filter(s => s.userStatus === 'CONFIRMED').length;
                                            const roomProgress = Math.round((confirmedInRoom / roomSkills.length) * 100);
                                            const isCompleted = roomProgress === 100;
                                            
                                            return (
                                                <div key={room.id} className={styles.roomSpecializationCard}>
                                                    <div className={styles.roomSpecHeader}>
                                                        <div>
                                                            <h4 className={styles.roomSpecTitle}>{room.name}</h4>
                                                            <p className={styles.roomSpecDesc}>{room.description || 'Специализация обучения'}</p>
                                                        </div>
                                                        {isCompleted && (
                                                            <button 
                                                                className={styles.certBadgeBtn}
                                                                onClick={() => setSelectedCertRoom(room)}
                                                            >
                                                                🏆 Сертификат выдан
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className={styles.specProgressContainer}>
                                                        <div className={styles.specProgressText}>
                                                            <span>Прогресс подтверждения</span>
                                                            <span>{confirmedInRoom} из {roomSkills.length} ({roomProgress}%)</span>
                                                        </div>
                                                        <div className={styles.specProgressTrack}>
                                                            <div className={styles.specProgressFill} style={{ width: `${roomProgress}%` }} />
                                                        </div>
                                                    </div>

                                                    <div className={styles.specSkillsGrid}>
                                                        {roomSkills.map((skill) => {
                                                            let badgeClass = styles.badgeLearning;
                                                            let statusLabel = 'Изучается';
                                                            if (skill.userStatus === 'CONFIRMED') {
                                                                badgeClass = styles.badgeConfirmed;
                                                                statusLabel = 'Подтвержден';
                                                            } else if (skill.userStatus === 'COMPLETED') {
                                                                badgeClass = styles.badgeCompleted;
                                                                statusLabel = 'На валидации';
                                                            }
                                                            return (
                                                                <div key={skill.id} className={styles.skillCard}>
                                                                    <div>
                                                                        <div className={styles.skillCardHeader}>
                                                                            <h5 className={styles.skillNameText}>{skill.name}</h5>
                                                                            <span className={`${styles.skillBadge} ${badgeClass}`}>
                                                                                {statusLabel}
                                                                            </span>
                                                                        </div>
                                                                        <p className={styles.skillDesc}>{skill.description || 'Описание отсутствует'}</p>
                                                                    </div>
                                                                    <div className={styles.skillFooter}>
                                                                        <span>Добавлен: {new Date(skill.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : activeTab === 'achievements' ? (
                                userAchievements.length === 0 ? (
                                    <p className={styles.emptyTabMsg}>{t('common.noData')}</p>
                                ) : (
                                    <div className={styles.achievementsMiniGrid}>
                                        {userAchievements.map((ach) => (
                                            <div
                                                key={ach.achievementId}
                                                className={`${styles.achievementMiniCard} ${ach.isUnlocked ? styles.achievementUnlocked : ''}`}
                                                title={ach.description}
                                            >
                                                <div className={styles.achMiniProgress}>
                                                    <div
                                                        className={styles.achMiniProgressFill}
                                                        style={{
                                                            width: `${Math.min(Math.round((ach.currentCount / ach.targetCount) * 100), 100)}%`,
                                                            background: ach.isUnlocked
                                                                ? 'linear-gradient(90deg, #6366f1, #4f46e5)'
                                                                : '#c7d2fe',
                                                        }}
                                                    />
                                                </div>
                                                <span className={styles.achMiniName}>{ach.name}</span>
                                                <span className={styles.achMiniCount}>{ach.currentCount}/{ach.targetCount}</span>
                                            </div>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <p className={styles.emptyTabMsg}>{t('common.noData')}</p>
                            )}
                        </div>
                    </div>
                </main>
            </div>

            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />

            {selectedCertRoom && (
                <div className={styles.certModalOverlay} onClick={() => setSelectedCertRoom(null)}>
                    <div className={styles.certModalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.certModalClose} onClick={() => setSelectedCertRoom(null)}>×</button>
                        <button className={styles.certDownloadBtn} onClick={() => window.print()}>
                            🖨️ PDF / Печать
                        </button>
                        <div className={styles.diplomaCard}>
                            <div className={styles.diplomaBorder}>
                                <div className={styles.diplomaHeader}>
                                    <Trophy className={styles.diplomaTrophy} size={48} />
                                    <h2 className={styles.diplomaTitle}>СЕРТИФИКАТ ОБ ОКОНЧАНИИ</h2>
                                    <p className={styles.diplomaSubtitle}>SKILLHUB DIGITAL PORTFOLIO</p>
                                </div>
                                
                                <div className={styles.diplomaBody}>
                                    <p className={styles.diplomaConfirms}>Настоящий документ подтверждает, что студент</p>
                                    <h3 className={styles.diplomaStudentName}>{getDisplayName(profileUser)}</h3>
                                    <p className={styles.diplomaText}>
                                        успешно освоил теоретическую программу и подтвердил все квалификационные навыки в рамках учебной специализации
                                    </p>
                                    <h4 className={styles.diplomaRoomName}>«{selectedCertRoom.name}»</h4>
                                    
                                    <div className={styles.diplomaSkillsList}>
                                        <p className={styles.diplomaSkillsTitle}>Подтверждённые навыки:</p>
                                        <ul>
                                            {userSkillsList
                                                .filter(s => s.roomId === selectedCertRoom.id)
                                                .map(s => <li key={s.id}>✓ {s.name}</li>)
                                            }
                                        </ul>
                                    </div>
                                </div>
                                
                                <div className={styles.diplomaFooter}>
                                    <div className={styles.diplomaSign}>
                                        <div className={styles.diplomaLine} />
                                        <span>Экспертный совет SkillHub</span>
                                    </div>
                                    <div className={styles.diplomaStamp}>
                                        <div className={styles.stampInner}>
                                            <span>VERIFIED</span>
                                            <span>PORTFOLIO</span>
                                        </div>
                                    </div>
                                    <div className={styles.diplomaDate}>
                                        <div className={styles.diplomaLine} />
                                        <span>Дата выдачи: {new Date().toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;