import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Search,
    TrendingUp,
    Star,
    Layout,
    Database,
    Shield,
    Cpu,
    Network,
    Globe,
    BookOpen,
    Flame,
    Bot,
    X,
    ChevronRight,
    ExternalLink,
    Tag,
} from 'lucide-react';
import styles from './WikiPage.module.css';
import { wikiService } from '../api/wikiService';
import { roomService } from '../api/roomService';
import { useAuth } from '../context/AuthContext';
import type { WikiLandingResponse, ArticlePreview, CategoryStat } from '../types';

// Маппинг имён категорий на иконки и цвета
const CATEGORY_META: Record<string, { icon: React.ReactNode; color: string }> = {
    backend:      { icon: <Database size={22} />,  color: '#3b82f6' },
    frontend:     { icon: <Layout size={22} />,    color: '#ef4444' },
    devops:       { icon: <Cpu size={22} />,       color: '#10b981' },
    architecture: { icon: <Network size={22} />,   color: '#8b5cf6' },
    security:     { icon: <Shield size={22} />,    color: '#f59e0b' },
    default:      { icon: <BookOpen size={22} />,  color: '#64748b' },
};

const getCategoryMeta = (name: string) => {
    const key = name.toLowerCase();
    return CATEGORY_META[key] || CATEGORY_META.default;
};

const AiScoreBadge: React.FC<{ score: number }> = ({ score }) => {
    if (score < 7) return null;
    return (
        <span className={styles.aiScore}>
            <Bot size={11} />
            {score.toFixed(1)}
        </span>
    );
};

// Скелетон-карточка пока грузятся данные
const SkeletonCard: React.FC = () => (
    <div className={styles.skeletonCard}>
        <div className={styles.skeletonLine} style={{ width: '60%', height: '14px' }} />
        <div className={styles.skeletonLine} style={{ width: '90%', height: '12px', marginTop: '8px' }} />
        <div className={styles.skeletonLine} style={{ width: '75%', height: '12px', marginTop: '6px' }} />
    </div>
);

const WikiPage: React.FC = () => {
    const { directionSlug } = useParams<{ directionSlug?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [landing, setLanding] = useState<WikiLandingResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [roomIds, setRoomIds] = useState<number[] | undefined>(undefined);

    // Поиск
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<ArticlePreview[]>([]);
    const [searching, setSearching] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    // Шаг 1: Если есть directionSlug — получаем roomIds для этого направления
    useEffect(() => {
        const loadRoomIds = async () => {
            if (!directionSlug) {
                setRoomIds(undefined);
                return;
            }
            try {
                const rooms = await roomService.getRoomsByDirection(directionSlug);
                setRoomIds(rooms.map(r => r.id));
            } catch {
                setRoomIds(undefined);
            }
        };
        loadRoomIds();
    }, [directionSlug]);

    // Шаг 2: Загружаем лендинг (глобальный или локальный)
    useEffect(() => {
        const loadLanding = async () => {
            setLoading(true);
            try {
                const data = await wikiService.getLanding(roomIds);
                setLanding(data);
            } catch (err) {
                console.error('Failed to load wiki landing:', err);
                setLanding(null);
            } finally {
                setLoading(false);
            }
        };
        // Если directionSlug есть, ждём пока roomIds загрузятся
        if (directionSlug && roomIds === undefined) return;
        loadLanding();
    }, [roomIds, directionSlug]);

    // Поиск с debounce
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setSearchOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            setSearchOpen(true);
            try {
                const results = await wikiService.search(searchTerm.trim(), roomIds);
                setSearchResults(results);
            } catch {
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 400);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchTerm, roomIds]);

    // Закрываем дропдаун поиска при клике за его пределами
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Трекинг просмотра с задержкой 2 секунды
    const handleArticleClick = useCallback((article: ArticlePreview) => {
        // Переходим на страницу статьи
        navigate(`/wiki/articles/${article.id}`);
        // Отправляем просмотр через 2 секунды
        setTimeout(() => {
            wikiService.trackView(article.id, user?.id).catch(() => null);
        }, 2000);
    }, [navigate, user?.id]);



    return (
        <div className={styles.container}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.modeBadge}>
                        <Tag size={14} /> Направление: {directionSlug}
                    </div>
                    <h1>База знаний SkillHub</h1>
                    <p>Коллективная мудрость профессионального сообщества</p>

                    {/* Поиск */}
                    <div className={styles.searchWrapper} ref={searchRef}>
                        <div className={styles.searchLarge}>
                            <Search size={22} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder={`Поиск знаний в ${directionSlug}...`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                onFocus={() => searchResults.length > 0 && setSearchOpen(true)}
                            />
                            {searchTerm && (
                                <button className={styles.clearBtn} onClick={() => {
                                    setSearchTerm('');
                                    setSearchOpen(false);
                                }}>
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Выпадающий список результатов */}
                        {searchOpen && (
                            <div className={styles.searchDropdown}>
                                {searching ? (
                                    <div className={styles.searchStatus}>Поиск...</div>
                                ) : searchResults.length === 0 ? (
                                    <div className={styles.searchStatus}>Ничего не найдено по «{searchTerm}»</div>
                                ) : (
                                    searchResults.map(article => (
                                        <div
                                            key={article.id}
                                            className={styles.searchResultItem}
                                            onClick={() => {
                                                setSearchOpen(false);
                                                setSearchTerm('');
                                                handleArticleClick(article);
                                            }}
                                        >
                                            <div className={styles.searchResultTitle}>
                                                {article.title}
                                                <AiScoreBadge score={article.aiScore} />
                                            </div>
                                            <p className={styles.searchResultPreview}>{article.previewText}</p>
                                            {article.tags.length > 0 && (
                                                <div className={styles.searchResultTags}>
                                                    {article.tags.slice(0, 4).map(tag => (
                                                        <span key={tag} className={styles.tagChip}>#{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <main className={styles.mainContent}>
                {/* Категории */}
                <section className={styles.categoriesSection}>
                    <div className={styles.sectionHeader}>
                        <BookOpen size={18} />
                        <h2>Категории</h2>
                    </div>
                    <div className={styles.categoryGrid}>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className={`${styles.categoryCard} ${styles.skeletonCat}`}>
                                    <div className={styles.skeletonIcon} />
                                    <div style={{ flex: 1 }}>
                                        <div className={styles.skeletonLine} style={{ width: '60%', height: '14px' }} />
                                        <div className={styles.skeletonLine} style={{ width: '40%', height: '11px', marginTop: '6px' }} />
                                    </div>
                                </div>
                            ))
                        ) : landing?.categories.length === 0 ? (
                            <p className={styles.emptyState}>Категории не найдены</p>
                        ) : (
                            landing?.categories.map((cat: CategoryStat) => {
                                const meta = getCategoryMeta(cat.name);
                                return (
                                    <div key={cat.name} className={styles.categoryCard}>
                                        <div
                                            className={styles.categoryIcon}
                                            style={{ background: `${meta.color}18`, color: meta.color }}
                                        >
                                            {meta.icon}
                                        </div>
                                        <div className={styles.categoryInfo}>
                                            <h3>{cat.name}</h3>
                                            <span>{cat.articleCount} статей</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Колонки: Популярное + Статья недели */}
                <div className={styles.cols}>
                    {/* Популярное за неделю */}
                    <div className={styles.trendingCol}>
                        <div className={styles.sectionHeader}>
                            <Flame size={18} />
                            <h2>Популярное за неделю</h2>
                        </div>
                        <div className={styles.trendingList}>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
                            ) : landing?.popular.length === 0 ? (
                                <div className={styles.emptyCol}>
                                    <TrendingUp size={32} opacity={0.2} />
                                    <p>Пока нет популярных статей</p>
                                </div>
                            ) : (
                                landing?.popular.map((article, idx) => (
                                    <div
                                        key={article.id}
                                        className={styles.trendingItem}
                                        onClick={() => handleArticleClick(article)}
                                    >
                                        <span className={styles.trendingRank}>#{idx + 1}</span>
                                        <div className={styles.trendingBody}>
                                            <div className={styles.trendingTitle}>
                                                {article.title}
                                                <AiScoreBadge score={article.aiScore} />
                                            </div>
                                            {article.tags.length > 0 && (
                                                <div className={styles.trendingTags}>
                                                    {article.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className={styles.tagChip}>#{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={16} className={styles.trendingArrow} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Статья недели */}
                    <div className={styles.featuredCol}>
                        <div className={styles.sectionHeader}>
                            <Star size={18} />
                            <h2>Рекомендовано для вас</h2>
                        </div>
                        {loading ? (
                            <div className={`${styles.featuredCard} ${styles.featuredSkeleton}`}>
                                <div className={styles.skeletonLine} style={{ width: '30%', height: '12px', marginBottom: '1.5rem' }} />
                                <div className={styles.skeletonLine} style={{ width: '85%', height: '24px' }} />
                                <div className={styles.skeletonLine} style={{ width: '70%', height: '24px', marginTop: '10px' }} />
                                <div className={styles.skeletonLine} style={{ width: '95%', height: '14px', marginTop: '1.5rem' }} />
                                <div className={styles.skeletonLine} style={{ width: '80%', height: '14px', marginTop: '8px' }} />
                            </div>
                        ) : landing?.recommended ? (
                            <div className={styles.featuredCard}>
                                <div className={styles.featuredTopRow}>
                                    <div className={styles.featuredTag}>Статья недели</div>
                                    <AiScoreBadge score={landing.recommended.aiScore} />
                                </div>
                                <h3>{landing.recommended.title}</h3>
                                <p>{landing.recommended.previewText}</p>
                                {landing.recommended.tags.length > 0 && (
                                    <div className={styles.featuredTags}>
                                        {landing.recommended.tags.map(tag => (
                                            <span key={tag} className={styles.tagChip}>#{tag}</span>
                                        ))}
                                    </div>
                                )}
                                <button
                                    className={styles.readBtn}
                                    onClick={() => landing.recommended && handleArticleClick(landing.recommended)}
                                >
                                    Читать далее
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        ) : (
                            <div className={`${styles.featuredCard} ${styles.featuredEmpty}`}>
                                <Star size={40} opacity={0.15} />
                                <p>AI ещё не выбрал статью недели</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WikiPage;
