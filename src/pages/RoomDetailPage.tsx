import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    BookOpen,
    MessageSquare,
    Lightbulb,
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    Star,
    Award,
    Users
} from 'lucide-react';

import { contentService } from '../api/contentService';
import { roomService } from '../api/roomService';
import type { Room, Article, Post, WikiEntry, DifficultyLevel, Comment as ContentComment } from '../types';
import { useAuth } from '../context/AuthContext';

import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import Modal from '../components/Modal';
import Input from '../components/Input';
import styles from './RoomDetailPage.module.css';

type Tab = 'articles' | 'discussions' | 'wiki';

const RoomDetailPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [room, setRoom] = useState<Room | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('articles');
    const [loading, setLoading] = useState(true);

    const [articles, setArticles] = useState<Article[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);
    const [comments, setComments] = useState<Record<number, ContentComment[]>>({});
    const [activePostId, setActivePostId] = useState<number | null>(null);
    const [commentText, setCommentText] = useState('');

    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [editingArticleId, setEditingArticleId] = useState<number | null>(null);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [articleData, setArticleData] = useState<{ title: string; content: string; difficultyLevel: DifficultyLevel }>({
        title: '',
        content: '',
        difficultyLevel: 'BEGINNER'
    });
    const [postData, setPostData] = useState<{ content: string; type: Post['type'] }>({
        content: '',
        type: 'DISCUSSION'
    });

    const fetchData = async () => {
        if (!roomId) return;
        setLoading(true);
        try {
            const [roomData, articlesData, postsData, wikiData] = await Promise.all([
                roomService.getRoom(Number(roomId)),
                contentService.getArticlesByRoom(Number(roomId)),
                contentService.getPostsByRoom(Number(roomId)),
                contentService.getWikiByRoom(Number(roomId))
            ]);
            setRoom(roomData);
            setArticles(articlesData);
            setPosts(postsData);
            setWikiEntries(wikiData);
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [roomId]);

    const handleCreateArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingArticleId) {
                await contentService.updateArticle(editingArticleId, articleData);
                toast.success(t('article.updated'));
            } else {
                await contentService.createArticle({
                    ...articleData,
                    roomId: Number(roomId),
                    userId: currentUser?.id
                });
                toast.success(t('article.created'));
            }
            setIsArticleModalOpen(false);
            setEditingArticleId(null);
            setArticleData({ title: '', content: '', difficultyLevel: 'BEGINNER' });
            fetchData();
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleEditArticle = (article: Article) => {
        setEditingArticleId(article.id);
        setArticleData({
            title: article.title,
            content: article.content,
            difficultyLevel: article.difficultyLevel || 'BEGINNER'
        });
        setIsArticleModalOpen(true);
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPostId) {
                await contentService.updatePost(editingPostId, postData);
                toast.success(t('post.updated'));
            } else {
                await contentService.createPost({
                    ...postData,
                    roomId: Number(roomId),
                    authorId: currentUser?.id
                });
                toast.success(t('post.created'));
            }
            setIsPostModalOpen(false);
            setEditingPostId(null);
            setPostData({ content: '', type: 'DISCUSSION' });
            fetchData();
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleEditPost = (post: Post) => {
        setEditingPostId(post.id);
        setPostData({
            content: post.content,
            type: post.type
        });
        setIsPostModalOpen(true);
    };

    const handlePromoteToWiki = async (articleId: number) => {
        try {
            await contentService.createWikiFromArticle(articleId);
            toast.success(t('wiki.promoted'));
            fetchData();
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleDeleteArticle = async (id: number) => {
        if (!window.confirm(t('common.deleteConfirm'))) return;
        try {
            await contentService.deleteArticle(id);
            toast.success(t('common.deleteSuccess'));
            fetchData();
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const fetchComments = async (postId: number) => {
        try {
            const data = await contentService.getCommentsByPost(postId);
            setComments(prev => ({ ...prev, [postId]: data }));
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleCreateComment = async (postId: number) => {
        if (!commentText.trim()) return;
        try {
            await contentService.createComment({
                postId,
                userId: currentUser?.id,
                content: commentText
            });
            toast.success(t('comment.created'));
            setCommentText('');
            fetchComments(postId);
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleAcceptComment = async (postId: number, commentId: number) => {
        try {
            await contentService.acceptComment(commentId);
            toast.success(t('comment.accepted'));
            fetchComments(postId);
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    if (loading) return <Loader />;
    if (!room) return <div>Room not found</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Button
                        variant="secondary"
                        onClick={() => navigate(`/${room.directionId}/rooms`)}
                        icon={<ArrowLeft size={20} />}
                    />
                    <h2 className={styles.title}>{room.name}</h2>
                </div>
            </div>

            <div className={styles.layoutWrapper}>
                <div className={styles.mainContent}>
                    <div className={styles.tabsWrapper}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeTab === 'articles' ? styles.active : ''}`}
                                onClick={() => setActiveTab('articles')}
                            >
                                <BookOpen size={18} />
                                {t('room.articles')}
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'discussions' ? styles.active : ''}`}
                                onClick={() => setActiveTab('discussions')}
                            >
                                <MessageSquare size={18} />
                                {t('room.discussions')}
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'wiki' ? styles.active : ''}`}
                                onClick={() => setActiveTab('wiki')}
                            >
                                <Lightbulb size={18} />
                                {t('room.wiki')}
                            </button>
                        </div>
                    </div>

                    <div className={styles.tabContent}>
                        {activeTab === 'articles' && (
                            <div className={styles.articlesSection}>
                                <div className={styles.actionsBar}>
                                    <Button
                                        icon={<Plus size={18} />}
                                        onClick={() => setIsArticleModalOpen(true)}
                                    >
                                        {t('room.addArticle')}
                                    </Button>
                                </div>
                                <div className={styles.grid}>
                                    {articles.map(article => (
                                        <Card key={article.id} title={article.title}>
                                            <div className={styles.articleCard}>
                                                <p className={styles.articlePreview}>
                                                    {article.content.substring(0, 150)}...
                                                </p>
                                                <div className={styles.articleFooter}>
                                                    <div className={styles.meta}>
                                                        <span className={styles.badge}>{article.difficultyLevel}</span>
                                                        {article.aiScore && (
                                                            <span className={styles.aiBadge}>
                                                                <Award size={14} />
                                                                AI: {article.aiScore}/1.0
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={styles.cardActions}>
                                                        {(currentUser?.id === article.userId) && (
                                                            <>
                                                                <Button
                                                                    variant="secondary"
                                                                    icon={<Edit2 size={14} />}
                                                                    onClick={() => handleEditArticle(article)}
                                                                />
                                                                <Button
                                                                    variant="danger"
                                                                    icon={<Trash2 size={14} />}
                                                                    onClick={() => handleDeleteArticle(article.id)}
                                                                />
                                                            </>
                                                        )}
                                                        <Button
                                                            variant="secondary"
                                                            icon={<Star size={14} />}
                                                            onClick={() => handlePromoteToWiki(article.id)}
                                                            title={t('room.promoteToWiki')}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'discussions' && (
                            <div className={styles.discussionsList}>
                                <div className={styles.actionsBar}>
                                    <Button
                                        icon={<Plus size={18} />}
                                        onClick={() => setIsPostModalOpen(true)}
                                    >
                                        {t('room.newPost')}
                                    </Button>
                                </div>
                                {posts.map(post => {
                                    const postComments = comments[post.id] || [];
                                    const isActive = activePostId === post.id;

                                    return (
                                        <Card key={post.id} title={post.authorName || 'User'}>
                                            <div className={styles.postCard}>
                                                <p>{post.content}</p>
                                                <div className={styles.postFooter}>
                                                    <span className={styles.date}>
                                                        {new Date(post.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <div className={styles.cardActions}>
                                                        {(currentUser?.id === post.authorId) && (
                                                            <Button
                                                                variant="secondary"
                                                                icon={<Edit2 size={14} />}
                                                                onClick={() => handleEditPost(post)}
                                                            />
                                                        )}
                                                        <Button
                                                            variant="secondary"
                                                            onClick={() => {
                                                                if (!isActive) fetchComments(post.id);
                                                                setActivePostId(isActive ? null : post.id);
                                                            }}
                                                        >
                                                            {t('room.comments')} ({postComments.length})
                                                        </Button>
                                                    </div>
                                                </div>

                                                {isActive && (
                                                    <div className={styles.commentsSection}>
                                                        <div className={styles.commentsList}>
                                                            {postComments.map(comment => (
                                                                <div key={comment.id} className={`${styles.commentItem} ${comment.isAccepted ? styles.accepted : ''}`}>
                                                                    <div className={styles.commentHeader}>
                                                                        <span className={styles.commentAuthor}>{comment.authorName || 'User'}</span>
                                                                        {comment.isAccepted && (
                                                                            <span className={styles.acceptedMarker}>
                                                                                <Star size={12} fill="currentColor" />
                                                                                {t('comment.accepted')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className={styles.commentContent}>{comment.content}</p>
                                                                    {(currentUser?.id === post.authorId && !comment.isAccepted) && (
                                                                        <Button
                                                                            variant="secondary"
                                                                            onClick={() => handleAcceptComment(post.id, comment.id)}
                                                                        >
                                                                            {t('comment.accept')}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className={styles.commentForm}>
                                                            <textarea
                                                                className={styles.textarea}
                                                                placeholder={t('comment.placeholder')}
                                                                value={commentText}
                                                                onChange={e => setCommentText(e.target.value)}
                                                            />
                                                            <Button onClick={() => handleCreateComment(post.id)}>
                                                                {t('common.save')}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {activeTab === 'wiki' && (
                            <div className={styles.wikiSection}>
                                {wikiEntries.length === 0 ? (
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                        {t('wiki.empty')}
                                    </p>
                                ) : (
                                    <div className={styles.grid}>
                                        {wikiEntries.map(entry => (
                                            <Card key={entry.id} title={entry.title}>
                                                <p>{entry.content.substring(0, 200)}...</p>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                    {t('room.updated')}: {new Date(entry.updatedAt).toLocaleDateString()}
                                                </span>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>

                    <div className={styles.sidebar}>
                        <Card title={t('rooms.overview')}>
                            <div className={styles.roomSidebarInfo}>
                                <p className={styles.roomDescription}>
                                    {room.description || t('rooms.noDescription')}
                                </p>
                                <div className={styles.sidebarStats}>
                                    <div className={styles.sidebarStatItem}>
                                        <Users size={16} />
                                        <span>{t('rooms.members')}: {(room as any).membersCount || 0}</span>
                                    </div>
                                    <div className={styles.sidebarStatItem}>
                                        <BookOpen size={16} />
                                        <span>{t('rooms.articles')}: {articles.length}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    onClick={() => navigate(`/rooms/${room.id}/members`)}
                                >
                                    {t('members.title')}
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={isArticleModalOpen}
                onClose={() => {
                    setIsArticleModalOpen(false);
                    setEditingArticleId(null);
                    setArticleData({ title: '', content: '', difficultyLevel: 'BEGINNER' });
                }}
                title={editingArticleId ? t('article.edit') : t('room.addArticle')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => {
                            setIsArticleModalOpen(false);
                            setEditingArticleId(null);
                            setArticleData({ title: '', content: '', difficultyLevel: 'BEGINNER' });
                        }}>{t('common.cancel')}</Button>
                        <Button onClick={handleCreateArticle}>{editingArticleId ? t('common.save') : t('common.create')}</Button>
                    </>
                }
            >
                <form className={styles.form} onSubmit={handleCreateArticle}>
                    <Input
                        label={t('article.title')}
                        value={articleData.title}
                        onChange={e => setArticleData({ ...articleData, title: e.target.value })}
                        required
                    />
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('article.content')}</label>
                        <textarea
                            className={styles.textarea}
                            value={articleData.content}
                            onChange={e => setArticleData({ ...articleData, content: e.target.value })}
                            required
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>{t('article.difficulty')}</label>
                        <select
                            className={styles.select}
                            value={articleData.difficultyLevel}
                            onChange={e => setArticleData({ ...articleData, difficultyLevel: e.target.value as any })}
                        >
                            <option value="BEGINNER">{t('difficulty.beginner')}</option>
                            <option value="INTERMEDIATE">{t('difficulty.intermediate')}</option>
                            <option value="ADVANCED">{t('difficulty.advanced')}</option>
                        </select>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={isPostModalOpen}
                onClose={() => {
                    setIsPostModalOpen(false);
                    setEditingPostId(null);
                    setPostData({ content: '', type: 'DISCUSSION' });
                }}
                title={editingPostId ? t('post.edit') : t('room.newPost')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => {
                            setIsPostModalOpen(false);
                            setEditingPostId(null);
                            setPostData({ content: '', type: 'DISCUSSION' });
                        }}>{t('common.cancel')}</Button>
                        <Button onClick={handleCreatePost}>{editingPostId ? t('common.save') : t('common.create')}</Button>
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
        </div>
    );
};

export default RoomDetailPage;
