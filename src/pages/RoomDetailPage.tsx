import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    MessageSquare,
    Heart,
    MoreVertical,
    Image as ImageIcon,
    HelpCircle,
    Bot,
    ChevronRight,
    Search,
    Flame
} from 'lucide-react';
import { createExcerpt } from '../utils/textUtils';
import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import { useAuth } from '../context/AuthContext';
import type { Room, User, Article, Post } from '../types';
import Loader from '../components/Loader';
import CreateContentModal from '../components/CreateContentModal';
import styles from './RoomDetailPage.module.css';

const RoomDetailPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isMember, user } = useAuth();

    const [articles, setArticles] = useState<Article[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [authorProfiles, setAuthorProfiles] = useState<Record<number, User>>({});
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<'all' | 'trends'>('all');
    const [activeCategory, setActiveCategory] = useState<'all' | 'posts' | 'questions'>('all');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);

    const fetchData = async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const [artData, postData] = await Promise.all([
                contentService.getArticlesByRoom(Number(roomId)),
                contentService.getPostsByRoom(Number(roomId))
            ]);

            setArticles(artData);
            setPosts(postData);

            const authorIds = Array.from(new Set([
                ...artData.map(a => a.userId),
                ...postData.map(p => p.userId)
            ]));

            const profilePromises = authorIds.map(id => userService.getUserById(id));
            const profiles = await Promise.all(profilePromises);

            const profileMap: Record<number, User> = {};
            profiles.forEach(p => { profileMap[p.id] = p; });
            setAuthorProfiles(profileMap);

        } catch (error) {
            console.error('Failed to fetch room detail data', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [roomId]);

    const feedItems = [
        ...articles.map(a => ({ ...a, feedType: 'article' as const })),
        ...posts.map(p => ({ ...p, feedType: 'post' as const }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (loading) return <Loader />;

    return (
        <div className={styles.contentContainer}>
            <div className={styles.leftColumn}>
                <div className={styles.creationBox}>
                    <div className={styles.creationInputRow}>
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstname || 'User'}&background=random`}
                            className={styles.userAvatarMini}
                            alt="avatar"
                        />
                        <button
                            className={styles.fakeInput}
                            onClick={() => {
                                if (!isMember(Number(roomId))) {
                                    toast.error('Вступите в комнату, чтобы создавать посты');
                                    return;
                                }
                                setIsPostModalOpen(true);
                            }}
                        >
                            {t('rooms.whatsOnMind') || 'Что нового? Поделитесь своими мыслями...'}
                        </button>
                    </div>
                    <div className={styles.creationActions}>
                        <div className={styles.actionButtonGroup}>
                            <button
                                className={styles.quickActionBtn}
                                onClick={() => {
                                    if (!isMember(Number(roomId))) return;
                                    setIsPostModalOpen(true);
                                }}
                            >
                                <HelpCircle size={16} color="#f59e0b" />
                                {t('rooms.question') || 'Вопрос'}
                            </button>
                            <button className={styles.quickActionBtn}>
                                <ImageIcon size={16} color="#10b981" />
                                {t('rooms.photo') || 'Фото'}
                            </button>
                        </div>
                        <button
                            className={styles.editorLink}
                            onClick={() => {
                                if (!isMember(Number(roomId))) {
                                    toast.error('Вступите в комнату, чтобы писать статьи');
                                    return;
                                }
                                toast('Используйте вкладку "Статьи" для написания', { icon: '📝' });
                            }}
                        >
                            {t('rooms.writeArticlePrompt') || 'Статью лучше писать в редакторе →'}
                        </button>
                    </div>
                </div>

                <div className={styles.filtersRow}>
                    <div className={styles.tabs}>
                        <button
                            className={`${styles.filterTab} ${activeSubTab === 'all' ? styles.active : ''}`}
                            onClick={() => setActiveSubTab('all')}
                        >
                            Все обсуждения
                        </button>
                        <button
                            className={`${styles.filterTab} ${activeSubTab === 'trends' ? styles.active : ''}`}
                            onClick={() => setActiveSubTab('trends')}
                        >
                            Тренды
                        </button>
                    </div>
                    <div className={styles.chipGroup}>
                        <button
                            className={`${styles.filterChip} ${activeCategory === 'all' ? styles.active : ''}`}
                            onClick={() => setActiveCategory('all')}
                        >
                            Все
                        </button>
                        <button
                            className={`${styles.filterChip} ${activeCategory === 'posts' ? styles.active : ''}`}
                            onClick={() => setActiveCategory('posts')}
                        >
                            Посты
                        </button>
                        <button
                            className={`${styles.filterChip} ${activeCategory === 'questions' ? styles.active : ''}`}
                            onClick={() => setActiveCategory('questions')}
                        >
                            Вопросы
                        </button>
                    </div>
                </div>

                <div className={styles.postsList}>
                    {feedItems.map((item) => (
                        <article key={`${item.feedType}-${item.id}`} className={styles.articleCard}>
                            <div className={styles.cardTop}>
                                <img
                                    src={authorProfiles[item.userId]?.avatar || `https://ui-avatars.com/api/?name=${authorProfiles[item.userId]?.firstname || 'User'}&background=random`}
                                    className={styles.userAvatarMini}
                                    alt="avatar"
                                />
                                <div className={styles.authorInfo}>
                                    <h4>
                                        {authorProfiles[item.userId]
                                            ? `${authorProfiles[item.userId].firstname} ${authorProfiles[item.userId].lastname}`
                                            : `Пользователь #${item.userId}`}
                                    </h4>
                                    <span className={styles.authorRole}>{authorProfiles[item.userId]?.role || 'Участник'}</span>
                                </div>
                                <span className={`${styles.postTypeBadge} ${(item as any).postType === 'QUESTION' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {(item as any).postType === 'QUESTION' ? 'Вопрос' : 'Пост'}
                                </span>
                            </div>

                            <h3
                                className={styles.postTitle}
                                onClick={() => {
                                    if (item.feedType === 'article') {
                                        navigate(`/rooms/${roomId}/articles/${item.id}`);
                                    } else {
                                        navigate(`/rooms/${roomId}/posts/${item.id}`);
                                    }
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                {(item as any).title || t('post.discussion')}
                            </h3>
                            <p className={styles.postPreview}>{createExcerpt(item.content, 150)}</p>

                            <div className={styles.cardFooter}>
                                <div className={styles.statsLeft}>
                                    <div className={styles.statItem}>
                                        <MessageSquare size={14} />
                                        <span>12 ответов</span>
                                    </div>
                                    <div className={`${styles.statItem} ${styles.liked}`}>
                                        <Heart size={14} />
                                        <span>128</span>
                                    </div>
                                </div>
                                <button className={styles.replyBtn}>
                                    {t('common.reply') || 'Ответить'}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            <aside className={styles.rightSidebar}>
                <div className={styles.sidebarWidget}>
                    <h3 className={styles.widgetTitle}>
                        <Flame size={18} color="#f97316" />
                        Популярное сегодня
                    </h3>
                    <div className={styles.helpList}>
                        <div className={styles.helpItem}>
                            <p>Как настроить Docker для Node.js?</p>
                            <span className={styles.helpMeta}>12 ответов • 45 лайков</span>
                        </div>
                        <div className={styles.helpItem}>
                            <p>Лучшие практики именования в TS</p>
                            <span className={styles.helpMeta}>8 ответов • 32 лайка</span>
                        </div>
                    </div>
                </div>

                <div className={styles.sidebarWidget}>
                    <h3 className={styles.widgetTitle}>Популярные теги</h3>
                    <div className={styles.tagCloud}>
                        <span className={styles.tag}>#React</span>
                        <span className={styles.tag}>#NodeJS</span>
                        <span className={styles.tag}>#Docker</span>
                        <span className={styles.tag}>#NextJS</span>
                    </div>
                </div>
            </aside>

            <CreateContentModal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                roomId={Number(roomId)}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default RoomDetailPage;
