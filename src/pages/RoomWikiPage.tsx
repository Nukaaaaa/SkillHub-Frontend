import React, { useEffect, useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import {
    Search,
    History,
    FileText,
    Download,
    BookOpen,
    Heart,
    Bookmark,
    ArrowLeft,
    Award,
    Sparkles,
    X,
    Loader2,
    Clock,
    Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { contentService } from '../api/contentService';
import { interactionService } from '../api/interactionService';
import { aiService } from '../api/aiService';
import { useAuth } from '../context/AuthContext';
import type { WikiEntry, Room } from '../types';
import Loader from '../components/Loader';
import styles from './RoomWikiPage.module.css';

const RoomWikiPage: React.FC = () => {
    const { room } = useOutletContext<{ room: Room }>();
    const location = useLocation();

    const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);
    const [sections, setSections] = useState<{ id: number; roomId: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null);
    const [activeSection, setActiveSection] = useState<number | null>(null);

    useEffect(() => {
        if (location.state && typeof location.state.activeSection !== 'undefined') {
            setActiveSection(location.state.activeSection);
        }
    }, [location.state]);
    const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [parsedContent, setParsedContent] = useState<string>('');
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const { user, getUserRoomRole } = useAuth();
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    
    // AI Assistant Drawer State
    const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [aiKeyTakeaways, setAiKeyTakeaways] = useState<string[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const localRole = room ? getUserRoomRole(room.id) : null;
    const isModeratorOrAdmin = user?.role === 'MODERATOR' || user?.role === 'ADMIN' || localRole === 'ROOM_ADMIN' || localRole === 'EXPERT' || localRole === 'MODERATOR';

    const fetchWiki = async () => {
        if (!room) return;
        try {
            setLoading(true);
            const [data, secs] = await Promise.all([
                contentService.getWikiByRoom(room.id),
                contentService.getWikiSectionsByRoom(room.id).catch(() => []),
            ]);
            setWikiEntries(data);
            setSections(secs);
            // Default on landing view: no selected entry auto-selected
            setSelectedEntry(null);
        } catch (error) {
            console.error('Failed to fetch wiki:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInteractions = async () => {
        if (!selectedEntry) return;
        try {
            const [count, bookmarks] = await Promise.all([
                interactionService.countLikes('article', selectedEntry.id),
                interactionService.getMyBookmarks()
            ]);
            setLikes(count);
            const saved = bookmarks.some((b: any) => b.target_type === 'article' && b.target_id === selectedEntry.id);
            setIsBookmarked(saved);
            
            const localLiked = localStorage.getItem(`liked_article_${selectedEntry.id}`) === 'true';
            setIsLiked(localLiked);
        } catch (e) {
            console.error('Failed to fetch interactions', e);
        }
    };

    useEffect(() => {
        fetchWiki();
    }, [room?.id]);

    useEffect(() => {
        if (selectedEntry) {
            fetchInteractions();
        }
    }, [selectedEntry?.id]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [selectedEntry]);

    useEffect(() => {
        if (!selectedEntry) {
            setHeadings([]);
            setParsedContent('');
            return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(selectedEntry.content, 'text/html');
        const headingElements = doc.querySelectorAll('h1, h2, h3');
        const newHeadings: { id: string; text: string; level: number }[] = [];

        headingElements.forEach((el, index) => {
            const id = `wiki-heading-${index}`;
            el.id = id;
            newHeadings.push({
                id,
                text: el.textContent || '',
                level: parseInt(el.tagName.replace('H', ''), 10)
            });
        });

        setParsedContent(doc.body.innerHTML);
        setHeadings(newHeadings);
    }, [selectedEntry]);

    // AI Drawer reset when article changes
    useEffect(() => {
        setAiSummary('');
        setAiKeyTakeaways([]);
        setIsAiDrawerOpen(false);
        setAiError(null);
    }, [selectedEntry?.id]);

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

                    if (bestId) setActiveId(bestId);
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

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    const handleLike = async () => {
        if (!selectedEntry) return;
        try {
            if (isLiked) {
                await interactionService.removeLike('article', selectedEntry.id);
                setLikes(prev => Math.max(0, prev - 1));
                localStorage.removeItem(`liked_article_${selectedEntry.id}`);
                setIsLiked(false);
            } else {
                await interactionService.addLike('article', selectedEntry.id, undefined, room?.directionId);
                setLikes(prev => prev + 1);
                localStorage.setItem(`liked_article_${selectedEntry.id}`, 'true');
                setIsLiked(true);
            }
        } catch (e) {
            toast.error('Ошибка при лайке');
        }
    };

    const handleBookmark = async () => {
        if (!selectedEntry) return;
        try {
            if (isBookmarked) {
                await interactionService.removeBookmark('article', selectedEntry.id);
                setIsBookmarked(false);
                toast.success('Удалено из закладок');
            } else {
                await interactionService.addBookmark('article', selectedEntry.id);
                setIsBookmarked(true);
                toast.success('Добавлено в закладки');
            }
        } catch (e) {
            toast.error('Ошибка работы с закладками');
        }
    };

    const handleCreateSection = async () => {
        if (!newSectionName.trim() || !room) return;
        try {
            const section = await contentService.createWikiSection(room.id, newSectionName.trim());
            setSections(prev => [...prev, section]);
            setNewSectionName('');
            setIsAddingSection(false);
            toast.success('Раздел успешно создан!');
        } catch (error) {
            console.error('Failed to create section:', error);
            toast.error('Ошибка при создании раздела');
        }
    };

    const handleAskAi = async () => {
        if (!selectedEntry) return;
        setIsAiDrawerOpen(true);
        if (aiSummary) return; // Already analyzed

        setAiLoading(true);
        setAiError(null);
        try {
            // Strip HTML tags for clean text analysis
            const cleanText = selectedEntry.content.replace(/<[^>]*>?/gm, '');
            const result = await aiService.analyzeArticle({
                title: selectedEntry.title,
                content: cleanText.slice(0, 5000)
            });
            
            if (result.error) {
                setAiError(result.error);
            } else {
                setAiSummary(result.summary || 'Краткое содержание недоступно.');
                setAiKeyTakeaways(result.keyTakeaways || []);
            }
        } catch (err) {
            console.error('AI analysis failed:', err);
            setAiError('Не удалось выполнить ИИ-анализ статьи. Попробуйте еще раз.');
        } finally {
            setAiLoading(false);
        }
    };

    if (loading) return <Loader />;

    // Helper: list of gradients for skill folders
    const getFolderGradient = (id: number) => {
        const gradients = [
            'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
            'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
        ];
        return gradients[id % gradients.length];
    };

    // Render logic for different views
    const renderWikiContent = () => {
        // Level 3: Article View (selectedEntry is active)
        if (selectedEntry) {
            return (
                <div className={styles.articlePageLayout}>
                    <div className={styles.container}>
                        <header className={styles.header}>
                            <button className={styles.backBtn} onClick={() => setSelectedEntry(null)} title="Назад">
                                <ArrowLeft size={20} />
                                Назад
                            </button>

                            <div className={styles.headerActions}>
                                <button className={styles.actionBtn} onClick={handleBookmark} title="В закладки">
                                    <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                                </button>
                                <button className={styles.actionBtn} onClick={() => toast.success('PDF готов к скачиванию')} title="Скачать PDF">
                                    <Download size={18} />
                                </button>
                                <button className={`${styles.actionBtn} ${styles.likeBtn} ${isLiked ? styles.liked : ''}`} onClick={handleLike} title="Лайкнуть">
                                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                                    <span>{likes}</span>
                                </button>
                            </div>
                        </header>

                        <main className={styles.mainContent}>
                            <div className={styles.articleMeta}>
                                <div className={`${styles.difficultyBadge} ${styles.badgeSenior}`}>
                                    Advanced
                                </div>
                                <div className={styles.aiBadge}>
                                    <Sparkles size={14} />
                                    AI Score: 9.5
                                </div>
                                <div className={styles.metaInfo}>
                                    <Clock size={14} />
                                    {(() => {
                                        const text = selectedEntry.content.replace(/<[^>]*>?/gm, '');
                                        const words = text.trim().split(/\s+/).length;
                                        const wpm = 225;
                                        return Math.max(1, Math.ceil(words / wpm));
                                    })()} мин чтения
                                </div>
                                <div className={styles.metaInfo}>
                                    <Calendar size={14} />
                                    {new Date(selectedEntry.updatedAt).toLocaleDateString()}
                                </div>
                            </div>

                            <h1 className={styles.title}>{selectedEntry.title}</h1>

                            <div className={styles.content} dangerouslySetInnerHTML={{ __html: parsedContent }} />
                        </main>

                        {/* Right Sidebar for scroll outline & AI */}
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
                                                    scrollToHeading(h.id);
                                                }}
                                                style={{ marginLeft: h.level === 3 ? '1rem' : '0' }}
                                            >
                                                {h.text}
                                            </a>
                                        ))}
                                    </nav>
                                </div>
                            )}

                            <div className={styles.aiWidget}>
                                <div className={styles.aiWidgetTitleRow}>
                                    <Sparkles size={16} color="#8b5cf6" />
                                    <div className={styles.aiWidgetTitle}>AI Ассистент</div>
                                </div>
                                <div className={styles.aiWidgetDesc}>Я помогу вам разобраться в сложных темах этой статьи, составлю краткие выводы и резюме.</div>
                                <button className={styles.aiWidgetBtn} onClick={handleAskAi}>
                                    Спросить AI
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            );
        }

        // Level 2: Articles List in Selected Section/Skill (activeSection is selected)
        if (activeSection !== null) {
            const activeSectionObj = sections.find(s => s.id === activeSection);
            const sectionEntries = wikiEntries.filter(e => activeSection === 0 ? !e.sectionId : e.sectionId === activeSection);

            return (
                <div className={styles.sectionPageLayout}>
                    <div className={styles.sectionHeader}>
                        <button className={styles.backBtn} onClick={() => setActiveSection(null)}>
                            <ArrowLeft size={16} />
                            <span>Назад к навыкам</span>
                        </button>
                        <h2 className={styles.sectionTitleText}>
                            <Award size={22} color="#4f46e5" />
                            {activeSectionObj?.name || 'Общие материалы'}
                        </h2>
                    </div>

                    {sectionEntries.length === 0 ? (
                        <div className={styles.emptyContent}>
                            <div className={styles.emptyIconWrapper}>
                                <FileText size={40} />
                            </div>
                            <h3>По этому навыку еще нет статей</h3>
                            <p>Вы можете перенести полезные статьи сообщества в Вики из детального просмотра статей.</p>
                            <button className={styles.backBtn} style={{ marginTop: '1rem' }} onClick={() => setActiveSection(null)}>Вернуться к навыкам</button>
                        </div>
                    ) : (
                        <div className={styles.articlesListGrid}>
                            {sectionEntries.map(entry => (
                                <div
                                    key={entry.id}
                                    className={styles.articleCardCompact}
                                    onClick={() => setSelectedEntry(entry)}
                                >
                                    <div className={styles.cardHeaderCompact}>
                                        <div className={styles.fileIconWrapper}>
                                            <FileText size={20} color="#4f46e5" />
                                        </div>
                                        <span className={styles.cardReadTime}>5 мин чтения</span>
                                    </div>
                                    <h4 className={styles.cardTitleCompact}>{entry.title}</h4>
                                    <div className={styles.cardFooterCompact}>
                                        <div className={styles.aiBadgeCompact}>
                                            <Sparkles size={12} color="#8b5cf6" />
                                            <span>AI: 9.5</span>
                                        </div>
                                        <span className={styles.cardLevelCompact}>Advanced</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Level 1: Landing grid of sections (skills) and Search results
        const isSearching = searchTerm.trim().length > 0;
        const searchResults = wikiEntries.filter(entry => 
            entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            entry.content.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const searchSections = sections.filter(sec =>
            sec.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className={styles.landingLayout}>
                {isSearching ? (
                    <div className={styles.searchResultsSection}>
                        <div className={styles.sectionHeader}>
                            <h3>Результаты поиска по запросу «{searchTerm}»</h3>
                            <button className={styles.clearSearchBtn} onClick={() => setSearchTerm('')}>Очистить</button>
                        </div>

                        {searchResults.length === 0 && searchSections.length === 0 ? (
                            <div className={styles.emptyContent}>
                                <Search size={40} />
                                <h3>Ничего не найдено</h3>
                                <p>Попробуйте ввести другое ключевое слово или проверьте орфографию.</p>
                            </div>
                        ) : (
                            <>
                                {searchSections.length > 0 && (
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 750, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Award size={18} color="#4f46e5" />
                                            Найденные разделы ({searchSections.length})
                                        </h4>
                                        <div className={styles.sectionsGrid}>
                                            {searchSections.map(sec => {
                                                const sectionEntries = wikiEntries.filter(e => e.sectionId === sec.id);
                                                return (
                                                    <div
                                                        key={sec.id}
                                                        className={styles.sectionCard}
                                                        onClick={() => {
                                                            setActiveSection(sec.id);
                                                            setSearchTerm('');
                                                        }}
                                                    >
                                                        <div className={styles.sectionCardTop}>
                                                            <div className={styles.folderIconContainer} style={{ background: getFolderGradient(sec.id) }}>
                                                                <Award size={24} color="white" />
                                                            </div>
                                                            <span className={styles.articlesCountBadge}>
                                                                {sectionEntries.length} статей
                                                            </span>
                                                        </div>
                                                        <h4 className={styles.sectionCardTitle}>{sec.name}</h4>
                                                        <p className={styles.sectionCardDesc}>Практический навык и обучающие материалы.</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {searchResults.length > 0 && (
                                    <div>
                                        <h4 style={{ fontSize: '1.1rem', fontWeight: 750, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <FileText size={18} color="#4f46e5" />
                                            Найденные статьи ({searchResults.length})
                                        </h4>
                                        <div className={styles.articlesListGrid}>
                                            {searchResults.map(entry => {
                                                const secObj = sections.find(s => s.id === entry.sectionId);
                                                return (
                                                    <div
                                                        key={entry.id}
                                                        className={styles.articleCardCompact}
                                                        onClick={() => {
                                                            setSelectedEntry(entry);
                                                            setActiveSection(entry.sectionId || null);
                                                        }}
                                                    >
                                                        <div className={styles.cardHeaderCompact}>
                                                            <div className={styles.fileIconWrapper}>
                                                                <FileText size={20} color="#4f46e5" />
                                                            </div>
                                                            <span className={styles.cardReadTime}>{secObj?.name || 'Общее'}</span>
                                                        </div>
                                                        <h4 className={styles.cardTitleCompact}>{entry.title}</h4>
                                                        <div className={styles.cardFooterCompact}>
                                                            <div className={styles.aiBadgeCompact}>
                                                                <Sparkles size={12} color="#8b5cf6" />
                                                                <span>AI: 9.5</span>
                                                            </div>
                                                            <span className={styles.cardLevelCompact}>Advanced</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ) : (
                    <div className={styles.skillsGridSection}>
                        <div className={styles.gridHeader}>
                            <h3>Изучаемые навыки и темы</h3>
                            <p>Выберите навык, чтобы ознакомиться с учебными материалами базы знаний.</p>
                        </div>

                        <div className={styles.sectionsGrid}>
                            {/* General/Common section card */}
                            <div
                                className={styles.sectionCard}
                                onClick={() => setActiveSection(0)} // 0 represents General section
                            >
                                <div className={styles.sectionCardTop}>
                                    <div className={styles.folderIconContainer} style={{ background: 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)' }}>
                                        <BookOpen size={24} color="white" />
                                    </div>
                                    <span className={styles.articlesCountBadge}>
                                        {wikiEntries.filter(e => !e.sectionId).length} статей
                                    </span>
                                </div>
                                <h4 className={styles.sectionCardTitle}>Общие материалы</h4>
                                <p className={styles.sectionCardDesc}>Общая база знаний, вспомогательные статьи и материалы.</p>
                            </div>

                            {/* Skills list cards */}
                            {sections.map(sec => {
                                const sectionEntries = wikiEntries.filter(e => e.sectionId === sec.id);
                                return (
                                    <div
                                        key={sec.id}
                                        className={styles.sectionCard}
                                        onClick={() => setActiveSection(sec.id)}
                                    >
                                        <div className={styles.sectionCardTop}>
                                            <div className={styles.folderIconContainer} style={{ background: getFolderGradient(sec.id) }}>
                                                <Award size={24} color="white" />
                                            </div>
                                            <span className={styles.articlesCountBadge}>
                                                {sectionEntries.length} статей
                                            </span>
                                        </div>
                                        <h4 className={styles.sectionCardTitle}>{sec.name}</h4>
                                        <p className={styles.sectionCardDesc}>Практический навык и обучающие материалы.</p>
                                    </div>
                                );
                            })}

                            {/* Moderator Create Section inline card */}
                            {isModeratorOrAdmin && (
                                <div className={`${styles.sectionCard} ${styles.addSectionCard}`}>
                                    {isAddingSection ? (
                                        <div className={styles.addSectionForm}>
                                            <h4>Новый навык (раздел)</h4>
                                            <input
                                                type="text"
                                                placeholder="Введите название..."
                                                className={styles.addSectionInput}
                                                value={newSectionName}
                                                onChange={(e) => setNewSectionName(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                                                autoFocus
                                            />
                                            <div className={styles.addSectionActions}>
                                                <button className={styles.confirmBtn} onClick={handleCreateSection}>ОК</button>
                                                <button className={styles.cancelBtn} onClick={() => setIsAddingSection(false)}>Отмена</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.addSectionTrigger} onClick={() => setIsAddingSection(true)}>
                                            <PlusCircle size={28} color="#4f46e5" />
                                            <span>Добавить навык</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.wikiContainer}>
            <header className={styles.wikiHeader}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Поиск по базе знаний (название, ключевые слова)..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className={styles.clearSearchBtnX} onClick={() => setSearchTerm('')}>
                            <X size={16} />
                        </button>
                    )}
                </div>
                <div className={styles.headerMeta}>
                    <span className={styles.versionTag}>Версия: 2.4.0</span>
                    <button className={styles.historyBtn} title="История изменений"><History size={18} /></button>
                </div>
            </header>

            <div className={styles.mainLayout}>
                {renderWikiContent()}
            </div>

            {/* AI Assistant Drawer */}
            {isAiDrawerOpen && selectedEntry && (
                <div className={styles.drawerOverlay} onClick={() => setIsAiDrawerOpen(false)}>
                    <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.drawerHeader}>
                            <div className={styles.drawerTitleRow}>
                                <Sparkles size={20} color="#8b5cf6" />
                                <h3>ИИ Ассистент</h3>
                            </div>
                            <button className={styles.drawerCloseBtn} onClick={() => setIsAiDrawerOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.drawerBody}>
                            <h4 className={styles.drawerArticleTitle}>{selectedEntry.title}</h4>
                            {aiLoading ? (
                                <div className={styles.aiDrawerLoading}>
                                    <Loader2 className={`${styles.spin} spin`} size={36} color="#8b5cf6" />
                                    <p>ИИ изучает статью и готовит выводы...</p>
                                </div>
                            ) : aiError ? (
                                <div className={styles.aiDrawerError}>
                                    <p>{aiError}</p>
                                    <button onClick={handleAskAi} className={styles.retryBtn}>Повторить</button>
                                </div>
                            ) : (
                                <div className={styles.aiAnalysisContent}>
                                    <div className={styles.analysisSection}>
                                        <h5>Краткое резюме</h5>
                                        <p>{aiSummary}</p>
                                    </div>
                                    {aiKeyTakeaways.length > 0 && (
                                        <div className={styles.analysisSection}>
                                            <h5>Ключевые выводы</h5>
                                            <ul className={styles.takeawaysList}>
                                                {aiKeyTakeaways.map((takeaway, idx) => (
                                                    <li key={idx}>{takeaway}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Auxiliary PlusCircle inline SVG wrapper to avoid extra imports
const PlusCircle = ({ size, color }: { size: number; color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
    </svg>
);

export default RoomWikiPage;
