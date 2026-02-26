import React, { useEffect, useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    MessageSquare,
    Heart,
    HelpCircle,
    Image as ImageIcon,
    Flame,
} from 'lucide-react';

import { contentService } from '../api/contentService';
import { roomService } from '../api/roomService';
import type { Room, Article, Post } from '../types';
import { useAuth } from '../context/AuthContext';

import Loader from '../components/Loader';
import CreateContentModal from '../components/CreateContentModal';
import Modal from '../components/Modal';
import Button from '../components/Button';
import styles from './RoomDetailPage.module.css';

const RoomDetailPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();

    const { room: roomFromContext } = useOutletContext<{ room: Room }>() || {};

    const [room, setRoom] = useState<Room | null>(roomFromContext || null);
    const [loading, setLoading] = useState(!roomFromContext);

    const [articles, setArticles] = useState<Article[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);

    const [activeSubTab, setActiveSubTab] = useState<'all' | 'trends'>('all');
    const [activeCategory, setActiveCategory] = useState<'all' | 'posts' | 'questions'>('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createType, setCreateType] = useState<'POST' | 'QUESTION'>('POST');

    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [postData, setPostData] = useState<{ content: string; postType: Post['postType'] }>({
        content: '',
        postType: 'DISCUSSION'
    });

    const fetchData = async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const [roomData, articlesData, postsData] = await Promise.all([
                !room ? roomService.getRoom(Number(roomId)) : Promise.resolve(room),
                contentService.getArticlesByRoom(Number(roomId)),
                contentService.getPostsByRoom(Number(roomId))
            ]);
            if (!room) setRoom(roomData);
            setArticles(articlesData);
            setPosts(postsData);
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [roomId]);

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await contentService.createPost({
                ...postData,
                roomId: Number(roomId),
                userId: currentUser?.id
            });
            toast.success(t('post.created'));
            setIsPostModalOpen(false);
            setPostData({ content: '', postType: 'DISCUSSION' });
            fetchData();
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    if (loading && !room) return <Loader />;
    if (!room) return <div>Room not found</div>;

    const feedItems = [
        ...posts.map(p => ({ ...p, feedType: 'post' as const })),
        ...articles.map(a => ({ ...a, feedType: 'article' as const }))
    ].filter(item => {
        if (activeCategory === 'all') return true;
        if (item.feedType === 'article') return false;
        if (activeCategory === 'posts') return item.postType === 'DISCUSSION' || item.postType === 'ANNOUNCEMENT';
        if (activeCategory === 'questions') return item.postType === 'QUESTION';
        return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className={`${styles.contentContainer} ${styles.animate}`}>
            <div className={styles.leftColumn}>
                <div className={styles.creationBox}>
                    <div className={styles.creationInputRow}>
                        <img
                            src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${currentUser?.name}&background=random`}
                            className={styles.userAvatarMini}
                            alt="avatar"
                        />
                        <button
                            className={styles.fakeInput}
                            onClick={() => {
                                setCreateType('POST');
                                setIsCreateModalOpen(true);
                            }}
                        >
                            {t('rooms.writeSomething')}
                        </button>
                    </div>
                    <div className={styles.creationActions}>
                        <div className={styles.actionButtonGroup}>
                            <button
                                className={styles.quickActionBtn}
                                onClick={() => {
                                    setCreateType('QUESTION');
                                    setIsCreateModalOpen(true);
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
                                toast('Редактор статей временно недоступен', { icon: '📝' });
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
                                    src={(item as any).authorAvatar || `https://ui-avatars.com/api/?name=${(item as any).authorName || (item as any).userName || (item as any).userId || 'User'}&background=random`}
                                    className={styles.userAvatarMini}
                                    alt="avatar"
                                />
                                <div className={styles.authorInfo}>
                                    <h4>{(item as any).authorName || (item as any).userName || `User #${(item as any).userId || '?'}`}</h4>
                                    <span className={styles.authorRole}>{(item as any).authorRole || 'Member'}</span>
                                </div>
                                <span className={`${styles.postTypeBadge} ${item.feedType === 'article' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {item.feedType === 'article' ? 'Статья' : ((item as any).postType === 'QUESTION' ? 'Вопрос' : 'Пост')}
                                </span>
                            </div>

                            <h3 className={styles.postTitle}>{(item as any).title || t('post.discussion')}</h3>
                            <p className={styles.postPreview}>{item.content}</p>

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
                    <h4 className={styles.widgetTitle}>
                        <Flame size={18} color="#f97316" />
                        Нужна помощь
                    </h4>
                    <div className={styles.helpList}>
                        <a href="#" className={styles.helpItem}>
                            <p>Как настроить TLS для gRPC в Docker?</p>
                            <span className={styles.helpMeta}>20 мин назад • 0 ответов</span>
                        </a>
                        <a href="#" className={styles.helpItem}>
                            <p>Ошибка 504 при загрузке файлов через Nginx</p>
                            <span className={styles.helpMeta}>1 час назад • 0 ответов</span>
                        </a>
                    </div>
                </div>

                <div className={styles.sidebarWidget}>
                    <h4 className={styles.widgetTitle}>Популярно здесь</h4>
                    <div className={styles.tagCloud}>
                        <span className={styles.tag}>#postgresql</span>
                        <span className={styles.tag}>#microservices</span>
                        <span className={styles.tag}>#go</span>
                        <span className={styles.tag}>#highload</span>
                        <span className={styles.tag}>#kafka</span>
                    </div>
                </div>
            </aside>

            <Modal
                isOpen={isPostModalOpen}
                onClose={() => {
                    setIsPostModalOpen(false);
                    setPostData({ content: '', postType: 'DISCUSSION' });
                }}
                title={t('rooms.newPost')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => {
                            setIsPostModalOpen(false);
                            setPostData({ content: '', postType: 'DISCUSSION' });
                        }}>{t('common.cancel')}</Button>
                        <Button onClick={handleCreatePost}>{t('common.create')}</Button>
                    </>
                }
            >
                <form className={styles.form} onSubmit={handleCreatePost}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('post.content')}</label>
                        <textarea
                            className={styles.textarea}
                            value={postData.content}
                            onChange={e => setPostData({ ...postData, content: e.target.value })}
                            required
                        />
                    </div>
                </form>
            </Modal>

            <CreateContentModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                roomId={Number(roomId)}
                initialType={createType}
                onSuccess={fetchData}
            />
        </div>
    );
};

export default RoomDetailPage;
