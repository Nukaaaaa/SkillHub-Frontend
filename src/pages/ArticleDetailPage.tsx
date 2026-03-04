import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    ChevronLeft,
    Heart,
    Bookmark,
    Share2,
    Bot,
    Clock,
    Calendar
} from 'lucide-react';
import 'highlight.js/styles/atom-one-dark.css';

import { contentService } from '../api/contentService';
import { userService } from '../api/userService';
import type { Article, User } from '../types';
import Loader from '../components/Loader';
import Button from '../components/Button';
import styles from './ArticleDetailPage.module.css';

const ArticleDetailPage: React.FC = () => {
    const { roomId, articleId } = useParams<{ roomId: string; articleId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [article, setArticle] = useState<Article | null>(null);
    const [author, setAuthor] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!articleId) return;
        setLoading(true);
        try {
            const articles = await contentService.getArticlesByRoom(Number(roomId));
            const found = articles.find(a => a.id === Number(articleId));

            if (found) {
                setArticle(found);
                const userProfile = await userService.getUserById(found.userId);
                setAuthor(userProfile);
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
    };

    useEffect(() => {
        fetchData();
    }, [articleId]);

    if (loading) return <Loader />;
    if (!article) return null;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <button className={styles.backBtn} onClick={() => navigate(-1)}>
                        <ChevronLeft size={20} />
                        Назад к списку
                    </button>

                    <div className={styles.headerActions}>
                        <button className={styles.actionBtn}><Share2 size={18} /></button>
                        <button className={styles.actionBtn}><Bookmark size={18} /></button>
                        <button className={`${styles.actionBtn} ${styles.likeBtn}`}>
                            <Heart size={18} />
                            <span>1.2k</span>
                        </button>
                    </div>
                </header>

                <main className={styles.mainContent}>
                    <div className={styles.articleMeta}>
                        <div className={styles.difficultyBadge}>{article.difficultyLevel || 'INTERMEDIATE'}</div>
                        <div className={styles.aiBadge}>
                            <Bot size={14} />
                            AI Score: {article.aiScore?.toFixed(1) || '9.4'}
                        </div>
                        <div className={styles.metaInfo}>
                            <Clock size={14} />
                            12 мин чтения
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
                            <span className={styles.authorBio}>{author?.role || 'Senior Software Engineer'}</span>
                        </div>
                        <Button variant="secondary" className={styles.followBtn}>Подписаться</Button>
                    </div>

                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{ __html: article.content }}
                    />

                    <footer className={styles.articleFooter}>
                        <div className={styles.tags}>
                            <span className={styles.tag}>#Architecture</span>
                            <span className={styles.tag}>#Highload</span>
                            <span className={styles.tag}>#SystemDesign</span>
                        </div>
                    </footer>
                </main>

                <aside className={styles.sidebar}>
                    <div className={styles.sidebarWidget}>
                        <h3>Об авторе</h3>
                        <p>{author?.bio || 'Страстный разработчик, делюсь опытом проектирования масштабируемых систем.'}</p>
                        <hr />
                        <div className={styles.authorStats}>
                            <div>
                                <strong>24</strong>
                                <span>Статьи</span>
                            </div>
                            <div>
                                <strong>1.5k</strong>
                                <span>Читателей</span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.sidebarWidget}>
                        <h3>Содержание</h3>
                        <nav className={styles.toc}>
                            <a href="#">Введение</a>
                            <a href="#">Основные принципы</a>
                            <a href="#">Практические примеры</a>
                            <a href="#">Заключение</a>
                        </nav>
                    </div>
                </aside>
            </div>

            <section className={styles.commentsSection}>
                <div className={styles.container}>
                    <div className={styles.commentsHeader}>
                        <h2>Комментарии (12)</h2>
                        <div className={styles.commentsFilters}>
                            <button className={styles.activeFilter}>Лучшие</button>
                            <button>Новые</button>
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
        </div>
    );
};

export default ArticleDetailPage;
