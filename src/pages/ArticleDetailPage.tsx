import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    Heart,
    Bookmark,
    Share2,
    Bot,
    Clock,
    Calendar,
    FileText,
    ArrowLeft,
    Loader,
    BookOpen,
    Flag,
    Sparkles,
    Lightbulb,
    Trash2,
    CornerDownRight,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import type { TargetType } from '../api/interactionService';

// @ts-ignore
import html2pdf from 'html2pdf.js';
import 'highlight.js/styles/atom-one-dark.css';

import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import { roomService } from '../api/roomService';
import { interactionService } from '../api/interactionService';
import { aiService } from '../api/aiService';
import { useAuth } from '../context/AuthContext';
import type { Article, User, WikiEntry, Room } from '../types';
import Button from '../components/Button';
import SectionSelectModal from '../components/wiki/SectionSelectModal';
import ReportModal from '../components/ReportModal';
import Avatar from '../components/Avatar';
import styles from './ArticleDetailPage.module.css';

const ArticleDetailPage: React.FC = () => {
    const { articleId } = useParams<{ articleId: string }>();
    const context = useOutletContext<{ room: Room } | null>();
    const roomFromContext = context?.room;

    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, getUserRoomRole } = useAuth();
    const articleRef = useRef<HTMLDivElement>(null);

    const [article, setArticle] = useState<Article | null>(null);
    const [room, setRoom] = useState<Room | null>(roomFromContext || null);
    const [author, setAuthor] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [parsedContent, setParsedContent] = useState<string>('');
    const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    const [likes, setLikes] = useState<number>(0);
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
    const [isReported, setIsReported] = useState<boolean>(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const [isInWiki, setIsInWiki] = useState<boolean>(false);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const [replyingToCommentId, setReplyingToCommentId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [commentLikes, setCommentLikes] = useState<Record<number, number>>({});
    const [likedComments, setLikedComments] = useState<Record<number, boolean>>({});
    const [commentAuthors, setCommentAuthors] = useState<Record<number, User>>({});
    const [reportTargetType, setReportTargetType] = useState<TargetType>('article');
    const [reportTargetId, setReportTargetId] = useState<number>(0);
    const [reportTargetAuthorId, setReportTargetAuthorId] = useState<number>(0);
    const [aiAnalysis, setAiAnalysis] = useState<{ summary: string; keyTakeaways: string[] } | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [isAiCollapsed, setIsAiCollapsed] = useState(false);

    const localRole = room ? getUserRoomRole(room.id) : null;
    const isModeratorOrAdmin = user?.role === 'MODERATOR' || user?.role === 'ADMIN' || localRole === 'ROOM_ADMIN' || localRole === 'EXPERT' || localRole === 'MODERATOR';
    const associatedSection = article?.sectionId ? sections.find(s => s.id === article.sectionId) : null;
    const sectionName = associatedSection ? associatedSection.name : '';

    const fetchData = async () => {
        if (!articleId) return;
        setLoading(true);
        try {
            // First, fetch the article itself
            const found = await contentService.getArticle(Number(articleId));

            if (found) {
                setArticle(found);

                // Then fetch or set room info
                let currentRoom: Room | null = roomFromContext || null;
                if (!currentRoom) {
                    try {
                        // Use roomId from article if slug is not available
                        currentRoom = await roomService.getRoom(found.roomId.toString()).catch(() => null);
                        if (currentRoom) setRoom(currentRoom);
                    } catch (e) {
                        console.error("Could not fetch room metadata", e);
                    }
                }

                // Metadata depends on room ID
                const effectiveRoomId = currentRoom?.id || found.roomId;

                const userProfile = await userService.getUserById(found.userId).catch(() => null);
                setAuthor(userProfile);

                // Extra data for wiki/sections
                checkIfInWiki(found.title, effectiveRoomId);
                try {
                    const secs = await contentService.getWikiSectionsByRoom(effectiveRoomId);
                    setSections(secs);
                } catch (e) {
                    console.error('Failed to fetch sections', e);
                }

                // Fetch comments
                const comms = await contentService.getCommentsByPost(Number(articleId));
                setComments(comms);
                await fetchCommentAuthors(comms);
                await loadCommentLikes(comms);

                // Start AI analysis
                handleAiAnalyze(found.title, found.content);

            } else {
                toast.error('Статья не найдена');
                navigate(-1);
            }
        } catch (error) {
            console.error('Failed to fetch article details:', error);
            toast.error(t('common.error'));
        } finally {
            setLoading(false);
        }

        try {
            const count = await interactionService.countLikes('article', Number(articleId));
            setLikes(count);

            const bookmarks = await interactionService.getMyBookmarks();
            const saved = bookmarks.some((b: any) => b.target_type === 'article' && b.target_id === Number(articleId));
            setIsBookmarked(saved);

            const localLiked = user?.id ? localStorage.getItem(`liked_article_${user.id}_${articleId}`) === 'true' : false;
            setIsLiked(localLiked);
        } catch (e) {
            console.error('Failed to fetch interaction data', e);
        }
    };

    const checkIfInWiki = async (articleTitle: string, roomId: number) => {
        try {
            const wiki = await contentService.getWikiByRoom(roomId).catch(() => []);
            const alreadyPresent = wiki.some((e: WikiEntry) => e.title === articleTitle);
            setIsInWiki(alreadyPresent);
        } catch (error) {
            console.error('Failed to check wiki status:', error);
        }
    };

    const handleLike = async () => {
        if (!articleId) return;
        try {
            if (isLiked) {
                await interactionService.removeLike('article', Number(articleId));
                setLikes(prev => Math.max(0, prev - 1));
                if (user?.id) localStorage.removeItem(`liked_article_${user.id}_${articleId}`);
                setIsLiked(false);
            } else {
                if (!article) return; // Add null check for lint
                // Pass authorId and directionId for gamification
                await interactionService.addLike(
                    'article',
                    Number(articleId),
                    article.userId,
                    room?.directionId
                );
                setLikes(prev => prev + 1);
                if (user?.id) localStorage.setItem(`liked_article_${user.id}_${articleId}`, 'true');
                setIsLiked(true);
            }
        } catch (e: any) {
            if (e.response?.status === 400 && !isLiked) {
                if (user?.id) localStorage.setItem(`liked_article_${user.id}_${articleId}`, 'true');
                setIsLiked(true);
            } else if (e.response?.status === 400 && isLiked) {
                if (user?.id) localStorage.removeItem(`liked_article_${user.id}_${articleId}`);
                setIsLiked(false);
            } else {
                toast.error(t('common.error') || 'Ошибка при лайке');
            }
        }
    };

    const handleBookmark = async () => {
        if (!articleId) return;
        try {
            if (isBookmarked) {
                await interactionService.removeBookmark('article', Number(articleId));
                toast.success('Удалено из закладок');
                setIsBookmarked(false);
            } else {
                await interactionService.addBookmark(
                    'article',
                    Number(articleId),
                    article?.userId,
                    room?.directionId
                );
                toast.success('Добавлено в закладки');
                setIsBookmarked(true);
            }
        } catch (e: any) {
            if (e.response?.status === 400 && !isBookmarked) {
                setIsBookmarked(true);
            } else {
                toast.error(t('common.error') || 'Ошибка при работе с закладками');
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [articleId]);

    useEffect(() => {
        if (!article) return;

        const parser = new DOMParser();
        const doc = parser.parseFromString(article.content, 'text/html');
        const headingElements = doc.querySelectorAll('h1, h2, h3');
        const newHeadings: { id: string; text: string; level: number }[] = [];

        headingElements.forEach((el, index) => {
            const id = `heading-${index}`;
            el.id = id;
            newHeadings.push({
                id,
                text: el.textContent || '',
                level: parseInt(el.tagName.replace('H', ''), 10)
            });
        });

        setParsedContent(doc.body.innerHTML);
        setHeadings(newHeadings);
    }, [article]);

    useEffect(() => {
        if (headings.length === 0) return;

        const visibleHeadings = new Map<string, number>();

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        visibleHeadings.set(entry.target.id, entry.target.getBoundingClientRect().top);
                    } else {
                        visibleHeadings.delete(entry.target.id);
                    }
                });

                if (visibleHeadings.size > 0) {
                    const visibleIds = Array.from(visibleHeadings.keys());
                    const bestId = headings
                        .map(h => h.id)
                        .find(id => visibleIds.includes(id));

                    if (bestId) setActiveId(bestId || '');
                }
            },
            { rootMargin: '-100px 0px -80% 0px' }
        );

        headings.forEach((h) => {
            const el = document.getElementById(h.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [headings]);

    const fetchCommentAuthors = async (comms: any[]) => {
        const commentUserIds = Array.from(new Set(comms.map((c: any) => c.userId)));
        const profilePromises = commentUserIds.map((id: number) => userService.getUserById(id).catch(() => null));
        const profiles = await Promise.all(profilePromises);

        const profileMap: Record<number, User> = {};
        profiles.forEach(p => {
            if (p) profileMap[p.id] = p;
        });
        setCommentAuthors(profileMap);
    };

    const loadCommentLikes = async (comms: any[]) => {
        const likesMap: Record<number, number> = {};
        const likedMap: Record<number, boolean> = {};
        await Promise.all(comms.map(async (c) => {
            try {
                const count = await interactionService.countLikes('comment', c.id);
                likesMap[c.id] = count;
                if (user?.id) {
                    likedMap[c.id] = localStorage.getItem(`liked_comment_${user.id}_${c.id}`) === 'true';
                }
            } catch (e) {
                console.error(`Failed to load likes for comment ${c.id}`, e);
            }
        }));
        setCommentLikes(likesMap);
        setLikedComments(likedMap);
    };

    const handleAddComment = async (parentId?: number) => {
        const text = parentId ? replyText : commentText;
        if (!text.trim() || !user || !articleId) return;
        setSubmittingComment(true);
        try {
            await contentService.createComment({
                userId: user.id,
                postId: Number(articleId),
                content: text,
                parentId: parentId
            });
            toast.success(parentId ? 'Ответ добавлен' : 'Комментарий добавлен');
            if (parentId) {
                setReplyText('');
                setReplyingToCommentId(null);
            } else {
                setCommentText('');
            }

            // Refresh comments list
            const comms = await contentService.getCommentsByPost(Number(articleId));
            setComments(comms);
            await fetchCommentAuthors(comms);
            await loadCommentLikes(comms);
        } catch (e) {
            toast.error('Не удалось отправить комментарий');
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleLikeComment = async (commentId: number, commentAuthorId: number) => {
        if (!user) {
            toast.error(t('auth.pleaseLogin', 'Пожалуйста, авторизуйтесь'));
            return;
        }
        const isLikedStatus = likedComments[commentId];
        try {
            if (isLikedStatus) {
                await interactionService.removeLike('comment', commentId);
                setCommentLikes(prev => ({ ...prev, [commentId]: Math.max(0, (prev[commentId] || 1) - 1) }));
                localStorage.removeItem(`liked_comment_${user.id}_${commentId}`);
                setLikedComments(prev => ({ ...prev, [commentId]: false }));
            } else {
                await interactionService.addLike(
                    'comment',
                    commentId,
                    commentAuthorId,
                    room?.directionId
                );
                setCommentLikes(prev => ({ ...prev, [commentId]: (prev[commentId] || 0) + 1 }));
                localStorage.setItem(`liked_comment_${user.id}_${commentId}`, 'true');
                setLikedComments(prev => ({ ...prev, [commentId]: true }));
            }
        } catch (e: any) {
            console.error('Failed to like comment', e);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот комментарий? Все ответы также будут удалены.')) {
            return;
        }
        try {
            await contentService.deleteComment(commentId);
            toast.success('Комментарий удален');
            const comms = await contentService.getCommentsByPost(Number(articleId));
            setComments(comms);
            await fetchCommentAuthors(comms);
            await loadCommentLikes(comms);
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


    const handleDownloadPDF = () => {
        if (!articleRef.current || !article) return;

        setDownloading(true);
        const element = articleRef.current;
        const opt = {
            margin: [15, 15] as [number, number],
            filename: `${article.title}.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setDownloading(false);
        }).catch((err: any) => {
            console.error('PDF generation error:', err);
            setDownloading(false);
            toast.error('Ошибка при генерации PDF');
        });
    };

    const handleAiAnalyze = async (title: string, content: string) => {
        setAnalyzing(true);
        try {
            const cleanContent = content.replace(/<[^>]*>?/gm, '');
            const res = await aiService.analyzeArticle({ title, content: cleanContent });
            if (!res.error) {
                setAiAnalysis({ summary: res.summary, keyTakeaways: res.keyTakeaways });
            }
        } catch (e) {
            console.error("AI Analysis failed", e);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleConfirmWiki = async (sectionId?: number) => {
        if (!articleId) return;
        try {
            await contentService.createWikiFromArticle(Number(articleId), sectionId);
            setIsInWiki(true);
            setIsModalOpen(false);
            toast.success('Статья добавлена в базу знаний!');
        } catch (e: any) {
            toast.error('Ошибка при добавлении в вики');
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
        const authorName = cAuthor ? `${cAuthor.firstname} ${cAuthor.lastname}` : `User #${node.userId}`;
        const authorAvatar = cAuthor?.avatar;
        const authorRole = cAuthor?.role;
        const isArticleAuthor = Number(node.userId) === Number(article?.userId || 0);

        const isLiked = likedComments[node.id] || false;
        const likesCount = commentLikes[node.id] || 0;

        const isReplying = replyingToCommentId === node.id;
        const canDelete = user && (Number(user.id) === Number(node.userId) || isModeratorOrAdmin);

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
                                {isArticleAuthor && (
                                    <span className={styles.authorBadge} title={t('article.author', 'Автор')}>{t('article.author', 'Автор')}</span>
                                )}
                                {authorRole && <span className={styles.commentAuthorRole}>{authorRole}</span>}
                            </div>
                        </div>
                        <span className={styles.commentDate}>
                            {node.createdAt ? new Date(node.createdAt).toLocaleDateString() : 'Только что'}
                        </span>
                    </div>

                    <div className={styles.commentBody}>
                        {node.content}
                    </div>

                    <div className={styles.commentFooterActions}>
                        <button
                            className={`${styles.commentActionBtn} ${isLiked ? styles.commentLiked : ''}`}
                            onClick={() => handleLikeComment(node.id, node.userId)}
                        >
                            <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                            <span>{likesCount}</span>
                        </button>

                        {user && (
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

                        {user && Number(user.id) !== Number(node.userId) && (
                            <button
                                className={styles.commentActionBtn}
                                onClick={() => triggerReport('comment', node.id, node.userId)}
                            >
                                <Flag size={14} />
                                <span>Пожаловаться</span>
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
                                onClick={() => handleAddComment(node.id)}
                                disabled={submittingComment || !replyText.trim()}
                            >
                                {submittingComment ? 'Отправка...' : 'Ответить'}
                            </Button>
                        </div>
                    </div>
                )}

                {node.replies && node.replies.map(reply => renderCommentNode(reply, depth + 1))}
            </div>
        );
    };


    if (loading) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.spinner}></div>
                <p>{t('common.loading') || 'Загрузка...'}</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className={styles.errorState}>
                <p>{t('article.notFound') || 'Статья не найдена'}</p>
                <button onClick={() => navigate(-1)}>{t('common.back')}</button>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                        {t('common.back')}
                    </button>

                    <div className={styles.headerActions}>
                        <button className={styles.actionBtn}><Share2 size={18} /></button>
                        {user && Number(user.id) !== Number(article.userId) && (
                            <button
                                className={`${styles.actionBtn} ${isReported ? styles.reportedItem : ''}`}
                                onClick={() => {
                                    if (!isReported) triggerReport('article', Number(articleId), article.userId);
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
                        <button
                            className={styles.actionBtn}
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            title={t('common.downloadPDF') || 'Скачать PDF'}
                        >
                            {downloading ? <Loader size={18} className={styles.spinning} /> : <FileText size={18} />}
                        </button>
                        {isModeratorOrAdmin && (
                            article.sectionId ? (
                                <button
                                    className={`${styles.actionBtn} ${styles.likeBtn} ${styles.wikiApproveBtn} ${isInWiki ? styles.activeActionBtn : ''}`}
                                    title={isInWiki ? 'В Базе знаний' : `Одобрить и добавить в Wiki (Раздел: ${sectionName || '...'})`}
                                    onClick={() => !isInWiki && handleConfirmWiki(article.sectionId)}
                                    disabled={isInWiki}
                                >
                                    <BookOpen size={18} fill={isInWiki ? "currentColor" : "none"} />
                                    <span>
                                        {isInWiki ? 'В Базе знаний' : `Одобрить и добавить в Wiki (Раздел: ${sectionName || '...'})`}
                                    </span>
                                </button>
                            ) : (
                                <button
                                    className={`${styles.actionBtn} ${isInWiki ? styles.activeActionBtn : ''}`}
                                    title="Добавить в Базу знаний"
                                    onClick={() => !isInWiki && setIsModalOpen(true)}
                                    disabled={isInWiki}
                                >
                                    <BookOpen size={18} fill={isInWiki ? "currentColor" : "none"} />
                                </button>
                            )
                        )}
                        {aiAnalysis && (
                            <button 
                                className={`${styles.actionBtn} ${styles.aiBtnHeader}`} 
                                onClick={() => setIsAiCollapsed(!isAiCollapsed)}
                                title="ИИ Саммари"
                            >
                                <Bot size={18} className={!isAiCollapsed ? styles.aiActiveIcon : ''} />
                            </button>
                        )}
                        <button className={`${styles.actionBtn} ${styles.likeBtn} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
                            <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                            <span>{likes}</span>
                        </button>
                    </div>
                </header>

                <main className={styles.mainContent} ref={articleRef}>
                    <div className={styles.articleMeta}>
                        <div className={`
                            ${styles.difficultyBadge} 
                            ${article.difficultyLevel === 'ADVANCED' ? styles.badgeSenior :
                                article.difficultyLevel === 'INTERMEDIATE' ? styles.badgeMiddle :
                                    styles.badgeJunior}
                        `}>
                            {t(`difficulty.${(article.difficultyLevel || 'BEGINNER').toLowerCase()}`)}
                        </div>
                        <div className={styles.aiBadge}>
                            <Bot size={14} />
                            AI Score: {article.aiScore?.toFixed(1) || '—'}
                        </div>
                        <div className={styles.metaInfo}>
                            <Clock size={14} />
                            {(() => {
                                const text = article.content.replace(/<[^>]*>?/gm, '');
                                const words = text.trim().split(/\s+/).length;
                                const wpm = 225;
                                return Math.max(1, Math.ceil(words / wpm));
                            })()} {t('common.minRead') || 'мин чтения'}
                        </div>
                        <div className={styles.metaInfo}>
                            <Calendar size={14} />
                            {new Date(article.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <h1 className={styles.title}>{article.title}</h1>

                    <div className={styles.authorSection}>
                        <Avatar
                            src={author?.avatar}
                            name={author?.firstname}
                            size="md"
                            className={styles.authorAvatar}
                        />
                        <div className={styles.authorInfo}>
                            <span className={styles.authorName}>{author?.firstname} {author?.lastname}</span>
                            <span className={styles.authorBio}>{author?.role || ''}</span>
                        </div>
                        <Button variant="secondary" className={styles.followBtn}>Подписаться</Button>
                    </div>

                    {/* AI Assistant Section - Collapsible Executive Summary */}
                    {analyzing ? (
                        <div className={styles.aiContentSummaryLoading}>
                            <Sparkles size={16} className={`${styles.spinning} ${styles.aiSparkle}`} />
                            <span>ИИ готовит краткое резюме...</span>
                        </div>
                    ) : aiAnalysis ? (
                        <div className={`${styles.aiContentSummary} ${isAiCollapsed ? styles.collapsed : ''}`}>
                            <button 
                                className={styles.aiContentSummaryHeader}
                                onClick={() => setIsAiCollapsed(!isAiCollapsed)}
                                type="button"
                            >
                                <div className={styles.aiHeaderTitle}>
                                    <Sparkles size={16} className={styles.aiSparkle} />
                                    <span>Краткое резюме статьи от ИИ</span>
                                </div>
                                <span className={styles.collapseIcon}>
                                    {isAiCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                                </span>
                            </button>
                            {!isAiCollapsed && (
                                <div className={styles.aiContentSummaryBody}>
                                    <p className={styles.aiSummaryText}>{aiAnalysis.summary}</p>
                                    {aiAnalysis.keyTakeaways && aiAnalysis.keyTakeaways.length > 0 && (
                                        <div className={styles.aiTakeawaysSection}>
                                            <h4>Ключевые инсайты статьи:</h4>
                                            <ul className={styles.aiTakeawaysList}>
                                                {aiAnalysis.keyTakeaways.map((t, idx) => (
                                                    <li key={idx}>
                                                        <Lightbulb size={14} className={styles.insightIcon} />
                                                        <span>{t}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}

                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{ __html: parsedContent || article.content }}
                    />

                    

                    <footer className={styles.articleFooter}>
                        <div className={styles.tags}>
                            {article.tags?.map(tag => (
                                <span key={tag} className={styles.tag}>#{tag}</span>
                            ))}
                        </div>
                    </footer>
                </main>

                <aside className={styles.sidebar}>
                    {headings.length > 0 && (
                        <div className={styles.sidebarWidget}>
                            <h3 className={styles.tocTitle}>Содержание</h3>
                            <nav className={styles.toc}>
                                {headings.map(h => (
                                    <a
                                        key={h.id}
                                        href={`#${h.id}`}
                                        className={`
                                            ${h.level === 3 ? styles.tocSubitem : ''} 
                                            ${activeId === h.id ? styles.activeTocItem : ''}
                                        `}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setActiveId(h.id);
                                            const el = document.getElementById(h.id);
                                            if (el) {
                                                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }
                                        }}
                                        style={{ marginLeft: h.level === 3 ? '1rem' : '0' }}
                                    >
                                        {h.text}
                                    </a>
                                ))}
                            </nav>
                        </div>
                    )}

                    <div className={styles.sidebarWidget}>
                        <div className={styles.authorWidgetHeader}>
                            <Link to={`/profile/${author?.id}`}>
                                <Avatar
                                    src={author?.avatar}
                                    name={author?.firstname}
                                    size="lg"
                                    className={styles.sidebarAvatar}
                                />
                            </Link>
                            <div>
                                <Link to={author?.id ? `/profile/${author.id}` : '#'} className={styles.authorNameLink}>
                                    <h3 className={styles.sidebarAuthorName}>
                                        {author ? [author.firstname, author.lastname].filter(Boolean).join(' ') || author.name : `Пользователь #${article?.userId || ''}`}
                                    </h3>
                                </Link>
                                <p className={styles.sidebarAuthorBadge}>{author?.role || t('article.author', 'Автор')}</p>
                            </div>
                        </div>
                        <p className={styles.sidebarBio}>{author?.bio || ''}</p>
                        <hr className={styles.sidebarDivider} />
                        <div className={styles.authorStats}>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{author?.stats?.points || 0}</span>
                                <span className={styles.statLabel}>{t('profile.reputation') || 'Баллы'}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statValue}>{author?.stats?.roomsJoined || 0}</span>
                                <span className={styles.statLabel}>{t('nav.rooms', 'Комнаты')}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <section className={styles.commentsSection}>
                <div className={styles.commentsContainer}>
                    <div className={styles.commentsHeader}>
                        <h2>Комментарии ({comments.length})</h2>
                    </div>

                    <div className={styles.commentInputWrapper}>
                        <textarea
                            placeholder="Написать комментарий..."
                            className={styles.commentArea}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                        ></textarea>
                        <div className={styles.commentActions}>
                            <Button
                                onClick={() => handleAddComment()}
                                disabled={submittingComment || !commentText.trim()}
                            >
                                {submittingComment ? 'Отправка...' : 'Отправить'}
                            </Button>
                        </div>
                    </div>

                    <div className={styles.commentsList}>
                        {commentTree.length > 0 ? (
                            commentTree.map(node => renderCommentNode(node))
                        ) : (
                            <p className={styles.noComments}>Комментариев пока нет. Будьте первым!</p>
                        )}
                    </div>
                </div>
            </section>

            <SectionSelectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmWiki}
                sections={sections}
            />

            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType={reportTargetType}
                targetId={reportTargetId}
                targetAuthorId={reportTargetAuthorId}
                roomId={article?.roomId || room?.id}
                onSuccess={() => {
                    if (reportTargetType === 'article') {
                        setIsReported(true);
                    } else {
                        toast.success('Жалоба успешно отправлена');
                    }
                }}
            />
        </div>
    );
};

export default ArticleDetailPage;


