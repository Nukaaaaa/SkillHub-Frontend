import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    BookOpen
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import 'highlight.js/styles/atom-one-dark.css';

import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import { interactionService } from '../api/interactionService';
import { useAuth } from '../context/AuthContext';
import type { Article, User, WikiEntry } from '../types';
import Button from '../components/Button';
import SectionSelectModal from '../components/wiki/SectionSelectModal';
import styles from './ArticleDetailPage.module.css';

const ArticleDetailPage: React.FC = () => {
    const { roomId, articleId } = useParams<{ roomId: string; articleId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const articleRef = useRef<HTMLDivElement>(null);

    const isModeratorOrAdmin = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

    const [article, setArticle] = useState<Article | null>(null);
    const [author, setAuthor] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [parsedContent, setParsedContent] = useState<string>('');
    const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    const [likes, setLikes] = useState<number>(0);
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
    const [isInWiki, setIsInWiki] = useState<boolean>(false);
    const [sections, setSections] = useState<{ id: number; name: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchData = async () => {
        if (!articleId) return;
        setLoading(true);
        try {
            const articles = await contentService.getArticlesByRoom(Number(roomId));
            const found = articles.find(a => a.id === Number(articleId));

            if (found) {
                setArticle(found);
                const userProfile = await userService.getUserById(found.userId).catch(() => null);
                setAuthor(userProfile);
                checkIfInWiki(found.title);
            } else {
                toast.error('Статья не найдена');
                navigate(`/rooms/${roomId}/articles`);
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

            const localLiked = localStorage.getItem(`liked_article_${articleId}`) === 'true';
            setIsLiked(localLiked);
        } catch (e) {
            console.error('Failed to fetch interaction data', e);
        }

        try {
            const secs = await contentService.getWikiSectionsByRoom(Number(roomId));
            setSections(secs);
        } catch (e) {
            console.error('Failed to fetch sections', e);
        }
    };

    const checkIfInWiki = async (articleTitle: string) => {
        try {
            const wiki = await contentService.getWikiByRoom(Number(roomId)).catch(() => []);
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
                localStorage.removeItem(`liked_article_${articleId}`);
                setIsLiked(false);
            } else {
                await interactionService.addLike('article', Number(articleId));
                setLikes(prev => prev + 1);
                localStorage.setItem(`liked_article_${articleId}`, 'true');
                setIsLiked(true);
            }
        } catch (e: any) {
            if (e.response?.status === 400 && !isLiked) {
                localStorage.setItem(`liked_article_${articleId}`, 'true');
                setIsLiked(true);
            } else if (e.response?.status === 400 && isLiked) {
                localStorage.removeItem(`liked_article_${articleId}`);
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
                await interactionService.addBookmark('article', Number(articleId));
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
                    // Find the heading that is physically FIRST in the document among visible ones
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
                            <button
                                className={`${styles.actionBtn} ${isInWiki ? styles.activeActionBtn : ''}`}
                                title="Добавить в Базу знаний"
                                onClick={() => !isInWiki && setIsModalOpen(true)}
                                disabled={isInWiki}
                            >
                                <BookOpen size={18} fill={isInWiki ? "currentColor" : "none"} />
                            </button>
                        )}
                        <button className={`${styles.actionBtn} ${styles.likeBtn}`} onClick={handleLike}>
                            <Heart size={18} fill={isLiked ? "var(--accent-primary)" : "none"} color={isLiked ? "var(--accent-primary)" : "currentColor"} />
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
                                const wpm = 225; // Adjusted for technical content
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
                        <img
                            src={author?.avatar || `https://ui-avatars.com/api/?name=${author?.firstname}&background=random`}
                            alt="avatar"
                            className={styles.authorAvatar}
                        />
                        <div className={styles.authorInfo}>
                            <span className={styles.authorName}>{author?.firstname} {author?.lastname}</span>
                            <span className={styles.authorBio}>{author?.role || ''}</span>
                        </div>
                        <Button variant="secondary" className={styles.followBtn}>Подписаться</Button>
                    </div>

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
                                <img
                                    src={author?.avatar || `https://ui-avatars.com/api/?name=${author?.firstname}&background=random`}
                                    alt="avatar"
                                    className={styles.sidebarAvatar}
                                />
                            </Link>
                            <div>
                                <Link to={`/profile/${author?.id}`} className={styles.authorNameLink}>
                                    <h3 className={styles.sidebarAuthorName}>{author?.firstname} {author?.lastname}</h3>
                                </Link>
                                <p className={styles.authorBadge}>{author?.role || 'Автор'}</p>
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
                                <span className={styles.statLabel}>Комнаты</span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <section className={styles.commentsSection}>
                <div className={styles.container}>
                    <div className={styles.commentsHeader}>
                        <h2>{t('article.comments') || 'Комментарии'} (0)</h2>
                        <div className={styles.commentsFilters}>
                        </div>
                    </div>

                    <div className={styles.commentInputWrapper}>
                        <textarea placeholder="Написать комментарий..." className={styles.commentArea}></textarea>
                        <div className={styles.commentActions}>
                            <Button>Отправить</Button>
                        </div>
                    </div>
                </div>
            </section>

            <SectionSelectModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmWiki}
                sections={sections}
            />
        </div>
    );
};

export default ArticleDetailPage;
