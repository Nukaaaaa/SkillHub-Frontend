import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    MessageSquare,
    Heart,
    HelpCircle,
    Flame,
    Pencil
} from 'lucide-react';
import { createExcerpt } from '../utils/textUtils';
import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import { interactionService } from '../api/interactionService';
import { useAuth } from '../context/AuthContext';
import type { User, Post } from '../types';
import Loader from '../components/Loader';
import CreateContentModal from '../components/CreateContentModal';
import styles from './RoomDetailPage.module.css';

const RoomDetailPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { isMember, user } = useAuth();


    const [posts, setPosts] = useState<Post[]>([]);
    const [authorProfiles, setAuthorProfiles] = useState<Record<number, User>>({});
    const [likesData, setLikesData] = useState<Record<number, number>>({});
    const [answersData, setAnswersData] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState<'all' | 'trends'>('all');
    const [activeCategory, setActiveCategory] = useState<'all' | 'posts' | 'questions'>('all');
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [postModalType, setPostModalType] = useState<'POST' | 'QUESTION'>('POST');

    const fetchData = async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const [postData] = await Promise.all([
                contentService.getPostsByRoom(Number(roomId))
            ]);

            setPosts(postData);

            try {
                const likeCounts = await Promise.all(
                    postData.map(p => interactionService.countLikes('post', p.id).catch(() => 0))
                );
                const likesMap: Record<number, number> = {};
                postData.forEach((p, idx) => {
                    likesMap[p.id] = likeCounts[idx];
                });
                setLikesData(likesMap);
            } catch (e) {
                console.error("Failed to fetch likes", e);
            }

            try {
                const answersCounts = await Promise.all(
                    postData.map(p => contentService.getCommentsByPost(p.id).then(res => res.length).catch(() => 0))
                );
                const answersMap: Record<number, number> = {};
                postData.forEach((p, idx) => {
                    answersMap[p.id] = answersCounts[idx];
                });
                setAnswersData(answersMap);
            } catch (e) {
                console.error("Failed to fetch answers counts", e);
            }

            const authorIds = Array.from(new Set([
                ...postData.map(p => p.userId)
            ]));

            const profilePromises = authorIds.map(id => userService.getUserById(id).catch(() => null));
            const profiles = await Promise.all(profilePromises);

            const profileMap: Record<number, User> = {};
            profiles.forEach(p => {
                if (p) profileMap[p.id] = p;
            });
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
        ...posts.map(p => ({ ...p, feedType: 'post' as const }))
    ].filter(item => {
        if (activeCategory === 'posts') return item.postType !== 'QUESTION';
        if (activeCategory === 'questions') return item.postType === 'QUESTION';
        return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (loading) return <Loader />;

    return (
        <div className={styles.contentContainer}>
            <div className={styles.leftColumn}>
                <div className={styles.creationBox}>
                    <div className={styles.creationHeader}>
                        <img
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.firstname || 'User'}&background=random`}
                            className={styles.userAvatarMain}
                            alt="avatar"
                        />
                        <div className={styles.creationGreeting}>
                            <h3>{t('rooms.createSomething') || `Что создадим, ${user?.firstname}?`}</h3>
                            <p>{t('rooms.shareExpertise') || 'Поделитесь своим опытом или задайте вопрос сообществу'}</p>
                        </div>
                    </div>

                    <div className={styles.creationGrid}>
                        <div
                            className={styles.creationCard}
                            onClick={() => {
                                if (!isMember(Number(roomId))) {
                                    toast.error(t('rooms.joinRequiredToPost'));
                                    return;
                                }
                                setPostModalType('POST');
                                setIsPostModalOpen(true);
                            }}
                        >
                            <div className={`${styles.cardIcon} ${styles.iconPost}`}>
                                <Pencil size={24} />
                            </div>
                            <span className={styles.cardTitle}>{t('rooms.post') || 'Пост'}</span>
                            <span className={styles.cardDesc}>{t('rooms.postDesc') || 'Короткая мысль или новость'}</span>
                        </div>

                        <div
                            className={styles.creationCard}
                            onClick={() => {
                                if (!isMember(Number(roomId))) {
                                    toast.error(t('rooms.joinRequiredToPost'));
                                    return;
                                }
                                setPostModalType('QUESTION');
                                setIsPostModalOpen(true);
                            }}
                        >
                            <div className={`${styles.cardIcon} ${styles.iconQuestion}`}>
                                <HelpCircle size={24} />
                            </div>
                            <span className={styles.cardTitle}>{t('rooms.question') || 'Вопрос'}</span>
                            <span className={styles.cardDesc}>{t('rooms.questionDesc') || 'Помощь экспертов'}</span>
                        </div>
                    </div>

                    <div className={styles.creationFooter}>
                        <button
                            className={styles.editorLinkPremium}
                            onClick={() => {
                                if (!isMember(Number(roomId))) {
                                    toast.error(t('rooms.joinRequiredToArticle'));
                                    return;
                                }
                                navigate(`/rooms/${roomId}/articles/create`);
                            }}
                        >
                            <span className={styles.editorLinkText}>{t('rooms.writeArticlePrompt') || 'Статью лучше писать в редакторе →'}</span>
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
                                <Link to={`/profile/${item.userId}`}>
                                    <img
                                        src={authorProfiles[item.userId]?.avatar || `https://ui-avatars.com/api/?name=${authorProfiles[item.userId]?.firstname || 'User'}&background=random`}
                                        className={styles.userAvatarMini}
                                        alt="avatar"
                                    />
                                </Link>
                                <div className={styles.authorInfo}>
                                    <Link to={`/profile/${item.userId}`} className={styles.authorNameLink}>
                                        <h4>
                                            {authorProfiles[item.userId]
                                                ? `${authorProfiles[item.userId].firstname} ${authorProfiles[item.userId].lastname}`
                                                : `Пользователь #${item.userId}`}
                                        </h4>
                                    </Link>
                                    <span className={styles.authorRole}>{authorProfiles[item.userId]?.role || 'Участник'}</span>
                                </div>
                                <span className={`${styles.postTypeBadge} ${(item as any).postType === 'QUESTION' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {(item as any).postType === 'QUESTION' ? 'Вопрос' : 'Пост'}
                                </span>
                            </div>

                            <h3
                                className={styles.postTitle}
                                onClick={() => {
                                    navigate(`/rooms/${roomId}/posts/${item.id}`);
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
                                        <span>{answersData[item.id] || 0} ответов</span>
                                    </div>
                                    <div className={`${styles.statItem} ${user?.id && localStorage.getItem(`liked_post_${user.id}_${item.id}`) === 'true' ? styles.liked : ''}`}>
                                        <Heart 
                                            size={14} 
                                            fill={user?.id && localStorage.getItem(`liked_post_${user.id}_${item.id}`) === 'true' ? "var(--accent-primary)" : "none"} 
                                            color={user?.id && localStorage.getItem(`liked_post_${user.id}_${item.id}`) === 'true' ? "var(--accent-primary)" : "currentColor"} 
                                        />
                                        <span>{likesData[item.id] || 0}</span>
                                    </div>
                                </div>
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
                initialType={postModalType}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default RoomDetailPage;
