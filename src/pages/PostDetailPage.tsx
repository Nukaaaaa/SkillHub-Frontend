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
    Flag,
    Trash2,
    CornerDownRight
} from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';

import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import { roomService } from '../api/roomService';
import { interactionService } from '../api/interactionService';
import type { TargetType } from '../api/interactionService';
import type { Post, User, Comment } from '../types';
import Loader from '../components/Loader';
import Button from '../components/Button';
import ReportModal from '../components/ReportModal';
import Avatar from '../components/Avatar';
import styles from './PostDetailPage.module.css';

const PostDetailPage: React.FC = () => {
    const { user: currentUser, getUserRoomRole } = useAuth();
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
    const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [commentLikes, setCommentLikes] = useState<Record<number, number>>({});
    const [likedComments, setLikedComments] = useState<Record<number, boolean>>({});
    const [reportTargetType, setReportTargetType] = useState<TargetType>('post');
    const [reportTargetId, setReportTargetId] = useState<number>(0);
    const [reportTargetAuthorId, setReportTargetAuthorId] = useState<number>(0);


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
            await loadCommentLikes(postComments);
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

    const loadCommentLikes = async (comms: any[]) => {
        const likesMap: Record<number, number> = {};
        const likedMap: Record<number, boolean> = {};
        await Promise.all(comms.map(async (c) => {
            try {
                const count = await interactionService.countLikes('comment', c.id);
                likesMap[c.id] = count;
                if (currentUser?.id) {
                    likedMap[c.id] = localStorage.getItem(`liked_comment_${currentUser.id}_${c.id}`) === 'true';
                }
            } catch (e) {
                console.error(`Failed to load likes for comment ${c.id}`, e);
            }
        }));
        setCommentLikes(likesMap);
        setLikedComments(likedMap);
    };

    const handleCommentSubmit = async (parentId?: number) => {
        const text = parentId ? replyText : commentText;
        if (!text.trim() || !post) return;
        try {
            await contentService.createComment({
                postId: post.id,
                content: text,
                userId: currentUser?.id || 0,
                parentId: parentId
            });
            toast.success(parentId ? 'Ответ добавлен' : 'Комментарий добавлен');
            if (parentId) {
                setReplyText('');
                setReplyingToCommentId(null);
            } else {
                setCommentText('');
            }
            
            // Refresh comments
            const newComments = await contentService.getCommentsByPost(post.id);
            setComments(newComments);
            await loadCommentLikes(newComments);

            // Refresh authors
            const commentUserIds = Array.from(new Set(newComments.map((c: Comment) => c.userId)));
            const profilePromises = commentUserIds.map((id: number) => userService.getUserById(id).catch(() => null));
            const profiles = await Promise.all(profilePromises);

            const profileMap: Record<number, User> = {};
            profiles.forEach(p => {
                if (p) profileMap[p.id] = p;
            });
            setCommentAuthors(profileMap);

        } catch (error) {
            toast.error('Не удалось отправить комментарий');
        }
    };

    const handleLikeComment = async (commentId: number, commentAuthorId: number) => {
        if (!currentUser) {
            toast.error('Пожалуйста, авторизуйтесь');
            return;
        }
        const isLikedStatus = likedComments[commentId];
        try {
            if (isLikedStatus) {
                await interactionService.removeLike('comment', commentId);
                setCommentLikes(prev => ({ ...prev, [commentId]: Math.max(0, (prev[commentId] || 1) - 1) }));
                localStorage.removeItem(`liked_comment_${currentUser.id}_${commentId}`);
                setLikedComments(prev => ({ ...prev, [commentId]: false }));
            } else {
                await interactionService.addLike(
                    'comment',
                    commentId,
                    commentAuthorId,
                    room?.directionId
                );
                setCommentLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) + 1 }));
                localStorage.setItem(`liked_comment_${currentUser.id}_${commentId}`, 'true');
                setLikedComments(prev => ({ ...prev, [commentId]: true }));
            }
        } catch (e: any) {
            console.error('Failed to like comment', e);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!post) return;
        if (!window.confirm('Вы уверены, что хотите удалить этот комментарий? Все ответы также будут удалены.')) {
            return;
        }
        try {
            await contentService.deleteComment(commentId);
            toast.success('Комментарий удален');
            const newComments = await contentService.getCommentsByPost(post.id);
            setComments(newComments);
            await loadCommentLikes(newComments);
        } catch (e) {
            toast.error('Не удалось удалить комментарий');
        }
    };

    const triggerReport = (type: TargetType, id: number, authorId: number) => {
        setReportTargetType(type);
        setReportTargetId(id);
        setReportTargetAuthorId(authorId);
        setIsReportModalOpen(true);
    };

    const handleAcceptAnswer = async (commentId: number) => {
        if (!post) return;
        try {
            await contentService.acceptComment(commentId);
            toast.success('Решение принято');
            const newComments = await contentService.getCommentsByPost(post.id);
            setComments(newComments);
        } catch (e) {
            toast.error('Не удалось отметить решение');
        }
    };

    interface CommentNode {
        id: number;
        postId: number;
        userId: number;
        content: string;
        isAccepted: boolean;
        createdAt: string;
        updatedAt?: string;
        parentId?: number;
        replies: CommentNode[];
    }

    const buildCommentTree = (list: any[]): CommentNode[] => {
        const map: Record<number, CommentNode> = {};
        const roots: CommentNode[] = [];
        
        list.forEach(c => {
            map[c.id] = { ...c, replies: [] };
        });
        
        list.forEach(c => {
            const node = map[c.id];
            if (c.parentId) {
                const parent = map[c.parentId];
                if (parent) {
                    parent.replies.push(node);
                } else {
                    roots.push(node);
                }
            } else {
                roots.push(node);
            }
        });

        const sortNodes = (a: CommentNode, b: CommentNode) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        roots.sort(sortNodes);
        Object.values(map).forEach(node => {
            node.replies.sort(sortNodes);
        });

        return roots;
    };

    const commentTree = buildCommentTree(comments);

    const renderCommentNode = (node: CommentNode, depth: number = 0): React.ReactNode => {
        const cAuthor = commentAuthors[node.userId];
        const authorName = cAuthor ? `${cAuthor.firstname} ${cAuthor.lastname}` : `Пользователь #${node.userId}`;
        const authorAvatar = cAuthor?.avatar;
        const authorRole = cAuthor?.role;
        const isPostAuthor = post ? Number(node.userId) === Number(post.userId) : false;

        const isLikedStatus = likedComments[node.id] || false;
        const likesCount = commentLikes[node.id] || 0;

        const isReplying = replyingToCommentId === node.id;
        const localRole = room ? getUserRoomRole(room.id) : null;
        const isModeratorOrAdmin = currentUser?.role === 'MODERATOR' || currentUser?.role === 'ADMIN' || localRole === 'ROOM_ADMIN' || localRole === 'EXPERT' || localRole === 'MODERATOR';
        const canDelete = currentUser && (Number(currentUser.id) === Number(node.userId) || isModeratorOrAdmin);
        const canAccept = currentUser && post && Number(currentUser.id) === Number(post.userId) && post.postType === 'QUESTION' && !node.parentId;

        return (
            <div 
                key={node.id} 
                className={`${styles.commentWrapper} ${depth === 0 ? styles.rootComment : ''}`}
            >
                {depth > 0 && <div className={styles.replyConnector} />}
                <div className={`${styles.commentCard} ${node.isAccepted ? styles.acceptedComment : ''}`}>
                    <div className={styles.commentHeader}>
                        <div className={styles.commentAuthorInfo}>
                            <Avatar 
                                src={authorAvatar}
                                name={authorName} 
                                size="sm" 
                            />
                            <div className={styles.commentAuthorMeta}>
                                <span className={styles.commentAuthorName}>{authorName}</span>
                                {isPostAuthor && (
                                    <span className={styles.authorBadge} title="Автор поста">Автор</span>
                                )}
                                {authorRole && <span className={styles.commentAuthorRole}>{authorRole}</span>}
                            </div>
                        </div>
                        <div className={styles.commentHeaderRight}>
                            {node.isAccepted && (
                                <span className={styles.acceptedBadge}>
                                    <CheckCircle2 size={14} /> Решение принято автором
                                </span>
                            )}
                            <span className={styles.commentDate}>
                                {node.createdAt ? new Date(node.createdAt).toLocaleDateString() : 'Только что'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.commentBody}>
                        {node.content}
                    </div>

                    <div className={styles.commentFooterActions}>
                        <button 
                            className={`${styles.commentActionBtn} ${isLikedStatus ? styles.commentLiked : ''}`}
                            onClick={() => handleLikeComment(node.id, node.userId)}
                        >
                            <Heart size={14} fill={isLikedStatus ? "currentColor" : "none"} />
                            <span>{likesCount}</span>
                        </button>

                        {currentUser && (
                            <button 
                                className={styles.commentActionBtn}
                                onClick={() => {
                                    setReplyingToCommentId(isReplying ? null : node.id);
                                    setReplyText('');
                                }}
                            >
                                <CornerDownRight size={14} />
                                <span>Ответить</span>
                            </button>
                        )}

                        {currentUser && Number(currentUser.id) !== Number(node.userId) && (
                            <button 
                                className={styles.commentActionBtn}
                                onClick={() => triggerReport('comment', node.id, node.userId)}
                            >
                                <Flag size={14} />
                                <span>Пожаловаться</span>
                            </button>
                        )}

                        {canAccept && (
                            <button 
                                className={`${styles.commentActionBtn} ${node.isAccepted ? styles.unacceptBtn : styles.acceptBtn}`}
                                onClick={() => handleAcceptAnswer(node.id)}
                            >
                                <CheckCircle2 size={14} />
                                <span>{node.isAccepted ? 'Снять пометку' : 'Решение'}</span>
                            </button>
                        )}

                        {canDelete && (
                            <button 
                                className={`${styles.commentActionBtn} ${styles.commentDeleteBtn}`}
                                onClick={() => handleDeleteComment(node.id)}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {isReplying && (
                    <div className={styles.replyInputWrapper}>
                        <textarea 
                            placeholder="Написать ответ..." 
                            className={styles.replyArea}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                        />
                        <div className={styles.replyActions}>
                            <button 
                                className={styles.cancelReplyBtn}
                                onClick={() => {
                                    setReplyingToCommentId(null);
                                    setReplyText('');
                                }}
                            >
                                Отмена
                            </button>
                            <Button 
                                onClick={() => handleCommentSubmit(node.id)} 
                                disabled={!replyText.trim()}
                            >
                                Ответить
                            </Button>
                        </div>
                    </div>
                )}

                {node.replies && node.replies.map(reply => renderCommentNode(reply, depth + 1))}
            </div>
        );
    };


    if (loading) return <Loader />;
    if (!post) return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ChevronLeft size={20} />
                        Назад
                    </button>
                </header>
                <main className={styles.mainContent} style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <h2>Пост не найден</h2>
                    <p style={{ color: '#6b7280', marginTop: '1rem' }}>Возможно, он был удален или вы перешли по неверной ссылке.</p>
                </main>
            </div>
        </div>
    );

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
                        {currentUser && Number(currentUser.id) !== Number(post.userId) && (
                            <button 
                                className={`${styles.actionBtn} ${isReported ? styles.reported : ''}`} 
                                onClick={() => {
                                    if (!isReported) triggerReport('post', Number(postId), post.userId);
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
                            <Avatar 
                                src={author?.avatar} 
                                name={author?.firstname} 
                                size="md"
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
                            <Button onClick={() => handleCommentSubmit()} disabled={!commentText.trim()}>
                                Отправить
                            </Button>
                        </div>
                    </div>

                    <div className={styles.commentsList}>
                        {commentTree.length === 0 ? (
                            <p className={styles.noComments}>{post.postType === 'QUESTION' ? 'Будьте первым, кто ответит!' : 'Пока нет комментариев.'}</p>
                        ) : (
                            commentTree.map(node => renderCommentNode(node))
                        )}
                    </div>
                </section>
            </div>

            <ReportModal 
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType={reportTargetType}
                targetId={reportTargetId}
                targetAuthorId={reportTargetAuthorId}
                roomId={post?.roomId || room?.id}
                onSuccess={() => {
                    if (reportTargetType === 'post') {
                        setIsReported(true);
                    } else {
                        toast.success('Жалоба успешно отправлена');
                    }
                }}
            />
        </div>
    );
};

export default PostDetailPage;
