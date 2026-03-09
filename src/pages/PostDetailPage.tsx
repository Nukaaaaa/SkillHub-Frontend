import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    CheckCircle2
} from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';

import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import type { Post, User, Comment } from '../types';
import Loader from '../components/Loader';
import Button from '../components/Button';
import styles from './PostDetailPage.module.css';

const PostDetailPage: React.FC = () => {
    const { postId } = useParams<{ roomId: string; postId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [post, setPost] = useState<Post | null>(null);
    const [author, setAuthor] = useState<User | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');

    const fetchData = async () => {
        if (!postId) return;
        setLoading(true);
        try {
            const postData = await contentService.getPost(Number(postId));
            setPost(postData);

            const [userProfile, postComments] = await Promise.all([
                userService.getUserById(postData.userId),
                contentService.getCommentsByPost(Number(postId))
            ]);

            setAuthor(userProfile);
            setComments(postComments);
        } catch (error) {
            console.error('Failed to fetch post details:', error);
            toast.error(t('common.error'));
            navigate(-1);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [postId]);

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || !post) return;
        try {
            await contentService.createComment({
                postId: post.id,
                content: commentText,
                userId: 1 // TODO: Use real user ID from context
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
                        <button className={styles.actionBtn}><Bookmark size={18} /></button>
                        <button className={`${styles.actionBtn} ${styles.likeBtn}`}>
                            <Heart size={18} />
                            <span>0</span>
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
                        <img
                            src={author?.avatar || `https://ui-avatars.com/api/?name=${author?.firstname}&background=random`}
                            alt="avatar"
                            className={styles.authorAvatar}
                        />
                        <div className={styles.authorInfo}>
                            <span className={styles.authorName}>{author?.firstname} {author?.lastname}</span>
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
                                        <div className={styles.commentAuthor}>
                                            <span className={styles.commentAuthorName}>Пользователь #{comment.userId}</span>
                                            <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                        </div>
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
        </div>
    );
};

export default PostDetailPage;
