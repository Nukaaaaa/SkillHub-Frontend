import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    ChevronLeft,
    Heart,
    Bookmark,
    Share2,
    MessageSquare,
    Clock,
    HelpCircle,
    CheckCircle2,
    Flag
} from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';

import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import { roomService } from '../api/roomService';
import { interactionService } from '../api/interactionService';
import type { Post, User, Comment } from '../types';
import Loader from '../components/Loader';
import Button from '../components/Button';
import ReportModal from '../components/ReportModal';
import styles from './PostDetailPage.module.css';

const PostDetailPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { postId } = useParams<{ roomSlug: string; postId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [post, setPost] = useState<Post | null>(null);
    const [room, setRoom] = useState<any | null>(null);
    const [author, setAuthor] = useState<User | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentAuthors, setCommentAuthors] = useState<Record<number, User>>({});
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');

    const [likes, setLikes] = useState<number>(0);
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
    const [isReported, setIsReported] = useState<boolean>(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const fetchData = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const postData = await contentService.getPost(Number(postId));
            setPost(postData);

            // Fetch room and author details
            const [userProfile, postComments, roomData] = await Promise.all([
                userService.getUserById(postData.userId).catch(() => null),
                contentService.getCommentsByPost(Number(postId)),
                // Use roomId if roomSlug is not available
                (postData.roomSlug ? roomService.getRoom(postData.roomSlug) : roomService.getRoom(postData.roomId.toString())).catch(() => null)
            ]);

            setAuthor(userProfile);
            setComments(postComments);
            setRoom(roomData);

            // Fetch comment authors
            const commentUserIds = Array.from(new Set(postComments.map((c: Comment) => c.userId)));
            const profilePromises = commentUserIds.map((id: number) => userService.getUserById(id).catch(() => null));
            const profiles = await Promise.all(profilePromises);

            const profileMap: Record<number, User> = {};
            profiles.forEach(p => {
                if (p) profileMap[p.id] = p;
            });
            setCommentAuthors(profileMap);

        } catch (error) {
            console.error('Failed to fetch post details:', error);
            toast.error(t('common.error'));
            navigate(-1);
        } finally {
            setLoading(false);
        }

        try {
            const count = await interactionService.countLikes('post', Number(postId));
            setLikes(count);

            const bookmarks = await interactionService.getMyBookmarks();
            const saved = bookmarks.some((b: any) => b.target_type === 'post' && b.target_id === Number(postId));
            setIsBookmarked(saved);

            const localLiked = currentUser?.id ? localStorage.getItem(`liked_post_${currentUser.id}_${postId}`) === 'true' : false;
            setIsLiked(localLiked);
        } catch (e) {
            console.error('Failed to fetch interaction data', e);
        }
    };

    const handleLike = async () => {
        if (!postId || !post) return;
        try {
            if (isLiked) {
                await interactionService.removeLike('post', Number(postId));
                setLikes(prev => Math.max(0, prev - 1));
                if (currentUser?.id) localStorage.removeItem(`liked_post_${currentUser.id}_${postId}`);
                setIsLiked(false);
            } else {
                // Pass authorId and directionId for gamification
                await interactionService.addLike(
                    'post', 
                    Number(postId), 
                    post.userId, 
                    room?.directionId
                );
                setLikes(prev => prev + 1);
                if (currentUser?.id) localStorage.setItem(`liked_post_${currentUser.id}_${postId}`, 'true');
                setIsLiked(true);
            }
        } catch (e: any) {
            if (e.response?.status === 400 && !isLiked) {
                if (currentUser?.id) localStorage.setItem(`liked_post_${currentUser.id}_${postId}`, 'true');
                setIsLiked(true);
            } else if (e.response?.status === 400 && isLiked) {
                if (currentUser?.id) localStorage.removeItem(`liked_post_${currentUser.id}_${postId}`);
                setIsLiked(false);
            } else {
                toast.error(t('common.error') || 'Ошибка при лайке');
            }
        }
    };

    const handleBookmark = async () => {
        if (!postId) return;
        try {
            if (isBookmarked) {
                await interactionService.removeBookmark('post', Number(postId));
                toast.success('Удалено из закладок');
                setIsBookmarked(false);
            } else {
                await interactionService.addBookmark(
                    'post', 
                    Number(postId), 
                    post?.userId, 
                    room?.directionId
                );
                toast.success('Добавлено в закладки');
                setIsBookmarked(true);
            }
        } catch (e: any) {
            if (e.response?.status === 400 && !isBookmarked) {
                setIsBookmarked(true);
            } else {
                toast.error(t('common.error') || 'Ошибка при сохранении');
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [postId, currentUser?.id]);

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !post) return;
        try {
            await contentService.createComment({
                postId: post.id,
                content: commentText,
                userId: currentUser?.id || 0
            });
            setCommentText('');
            toast.success('Комментарий добавлен');
            // Refresh comments
            const newComments = await contentService.getCommentsByPost(post.id);
            setComments(newComments);
        } catch (error) {
            toast.error('Не удалось отправить комментарий');
        }
    };

    if (loading) return <Loader />;
    if (!post) return null;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ChevronLeft size={20} />
                        Назад
                    </button>

                    <div className={styles.headerActions}>
                        <button className={styles.actionBtn}><Share2 size={18} /></button>
                        {currentUser?.id !== post.userId && (
                            <button 
                                className={`${styles.actionBtn} ${isReported ? styles.reported : ''}`} 
                                onClick={() => {
                                    if (!isReported) setIsReportModalOpen(true);
                                }}
                                title={isReported ? "Жалоба отправлена" : "Пожаловаться"}
                                disabled={isReported}
                            >
                                <Flag size={18} fill={isReported ? "currentColor" : "none"} />
                            </button>
                        )}
                        <button className={styles.actionBtn} onClick={handleBookmark}>
                            <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.likeBtn} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
                            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                            <span>{likes}</span>
                        </button>
                    </div>
                </header>

                <main className={styles.mainContent}>
                    <div className={styles.postMeta}>
                        <span className={`${styles.typeBadge} ${post.postType === 'QUESTION' ? styles.question : styles.discussion}`}>
                            {post.postType === 'QUESTION' ? <HelpCircle size={14} /> : <MessageSquare size={14} />}
                            {post.postType === 'QUESTION' ? 'Вопрос' : 'Обсуждение'}
                        </span>
                        <div className={styles.metaInfo}>
                            <Clock size={14} />
                            {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <h1 className={styles.title}>{post.title || 'Тема обсуждения'}</h1>

                    <div className={styles.authorSection}>
                        <Link to={`/profile/${author?.id}`}>
                            <img
                                src={author?.avatar || `https://ui-avatars.com/api/?name=${author?.firstname}&background=random`}
                                alt="avatar"
                                className={styles.authorAvatar}
                            />
                        </Link>
                        <div className={styles.authorInfo}>
                            <Link to={`/profile/${author?.id}`} className={styles.authorNameLink}>
                                <span className={styles.authorName}>{author?.firstname} {author?.lastname}</span>
                            </Link>
                            <span className={styles.authorBio}>{author?.role || ''}</span>
                        </div>
                    </div>

                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </main>

                <section className={styles.commentsSection}>
                    <div className={styles.sectionHeader}>
                        <h2>{post.postType === 'QUESTION' ? 'Ответы' : 'Комментарии'} ({comments.length})</h2>
                    </div>

                    <div className={styles.commentInputBox}>
                        <textarea
                            placeholder={post.postType === 'QUESTION' ? "Ваш ответ..." : "Написать комментарий..."}
                            className={styles.commentArea}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        ></textarea>
                        <div className={styles.commentActions}>
                            <Button onClick={handleCommentSubmit} disabled={!commentText.trim()}>
                                Отправить
                            </Button>
                        </div>
                    </div>

                    <div className={styles.commentsList}>
                        {comments.length === 0 ? (
                            <p className={styles.noComments}>{post.postType === 'QUESTION' ? 'Будьте первым, кто ответит!' : 'Пока нет комментариев.'}</p>
                        ) : (
                            comments.map(comment => (
                                <div key={comment.id} className={`${styles.commentCard} ${comment.isAccepted ? styles.acceptedComment : ''}`}>
                                    <div className={styles.commentHeader}>
                                        <Link to={`/profile/${comment.userId}`} className={styles.commentAuthorLink}>
                                            <div className={styles.commentAuthor}>
                                                <span className={styles.commentAuthorName}>
                                                    {commentAuthors[comment.userId]
                                                        ? `${commentAuthors[comment.userId].firstname} ${commentAuthors[comment.userId].lastname}`
                                                        : `Пользователь #${comment.userId}`}
                                                </span>
                                                <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </Link>
                                        {comment.isAccepted && (
                                            <span className={styles.acceptedBadge}>
                                                <CheckCircle2 size={14} /> Решение
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.commentContent}>{comment.content}</div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <ReportModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="post"
                targetId={Number(postId)}
                targetAuthorId={post.userId}
                onSuccess={() => setIsReported(true)}
            />
        </div>
    );
};

export default PostDetailPage;
