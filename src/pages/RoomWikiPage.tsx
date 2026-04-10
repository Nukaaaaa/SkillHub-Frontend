import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    Search,
    History,
    FolderOpen,
    Folder,
    FileText,
    ChevronRight,
    Download,
    BookOpen,
    Heart,
    Bookmark,
    Share2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { contentService } from '../api/contentService';
import { interactionService } from '../api/interactionService';
import { useAuth } from '../context/AuthContext';
import type { WikiEntry, Room } from '../types';
import Loader from '../components/Loader';
import styles from './RoomWikiPage.module.css';

const RoomWikiPage: React.FC = () => {
    const { room } = useOutletContext<{ room: Room }>();

    const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);
    const [sections, setSections] = useState<{ id: number; roomId: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null);
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
    const [activeId, setActiveId] = useState<string>('');
    const [parsedContent, setParsedContent] = useState<string>('');
    const [isLiked, setIsLiked] = useState(false);
    const [likes, setLikes] = useState(0);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const { user } = useAuth();
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    const isModeratorOrAdmin = user?.role === 'MODERATOR' || user?.role === 'ADMIN';

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
            if (data.length > 0 && !selectedEntry) setSelectedEntry(data[0]);
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
            const offset = 100;
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
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
                await interactionService.addLike('article', selectedEntry.id);
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
            toast.success('Раздел создан!');
        } catch (error) {
            console.error('Failed to create section:', error);
            toast.error('Ошибка при создании раздела');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.wikiContainer}>
            <header className={styles.wikiHeader}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Поиск по базе знаний..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.headerMeta}>
                    <span className={styles.versionTag}>Версия: 2.4.0</span>
                    <button className={styles.historyBtn}><History size={18} /></button>
                </div>
            </header>

            <div className={styles.mainLayout}>
                {/* Left Sidebar */}
                <aside className={styles.leftSidebar}>
                    <div className={styles.sidebarTitle}>РАЗДЕЛЫ</div>
                    <div className={styles.navGroup}>
                        <div
                            className={`${styles.navItem} ${activeSection === null ? styles.navItemActive : ''}`}
                            onClick={() => { setActiveSection(null); setSelectedEntry(null); }}
                        >
                            <FolderOpen size={16} />
                            <span>Все записи</span>
                        </div>

                        {sections.map(sec => (
                            <div
                                key={sec.id}
                                className={`${styles.navItem} ${activeSection === sec.id ? styles.navItemActive : ''}`}
                                onClick={() => { setActiveSection(sec.id); setSelectedEntry(null); }}
                            >
                                <Folder size={16} />
                                <span>{sec.name}</span>
                            </div>
                        ))}

                        {isModeratorOrAdmin && (
                            <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
                                {isAddingSection ? (
                                    <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.75rem' }}>
                                        <input
                                            type="text"
                                            placeholder="Название..."
                                            value={newSectionName}
                                            onChange={(e) => setNewSectionName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateSection()}
                                            style={{ width: '100%', padding: '0.25rem', marginBottom: '0.5rem', fontSize: '0.75rem' }}
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button onClick={handleCreateSection} style={{ fontSize: '0.7rem', color: '#2563eb' }}>ОК</button>
                                            <button onClick={() => setIsAddingSection(false)} style={{ fontSize: '0.7rem', color: '#ef4444' }}>Отмена</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingSection(true)}
                                        style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, background: 'none', border: '1px dashed #e2e8f0', width: '100%', padding: '0.5rem', borderRadius: '0.5rem' }}
                                    >
                                        + Добавить раздел
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <div className={styles.sidebarTitle}>СТАТЬИ</div>
                        <div className={styles.subMenu}>
                            {wikiEntries
                                .filter(e => (!activeSection || e.sectionId === activeSection) && e.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(entry => (
                                    <div
                                        key={entry.id}
                                        className={`${styles.subNavItem} ${selectedEntry?.id === entry.id ? styles.subItemActive : ''}`}
                                        onClick={() => setSelectedEntry(entry)}
                                    >
                                        <FileText size={14} style={{ opacity: 0.5 }} />
                                        <span>{entry.title}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.contentArea}>
                    <div className={styles.articleWrapper}>
                        <header className={styles.header}>
                            <nav className={styles.breadcrumbs}>
                                <span>База</span>
                                <ChevronRight size={10} />
                                <span>{sections.find(s => s.id === selectedEntry?.sectionId)?.name || 'Общее'}</span>
                                <ChevronRight size={10} />
                                <span className={styles.breadcrumbActive}>
                                    {selectedEntry ? selectedEntry.title : 'Выберите статью'}
                                </span>
                            </nav>

                            <div className={styles.headerActions}>
                                <button className={styles.actionBtn}><Share2 size={18} /></button>
                                <button className={styles.actionBtn} onClick={handleBookmark}>
                                    <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                                </button>
                                <button className={styles.actionBtn} onClick={() => toast.success('PDF готов')}>
                                    <Download size={18} />
                                </button>
                                <button className={`${styles.actionBtn} ${styles.likeBtn} ${isLiked ? styles.liked : ''}`} onClick={handleLike}>
                                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                                    <span>{likes}</span>
                                </button>
                            </div>
                        </header>

                        <div className={styles.metadataBar}>
                            <div className={styles.metaItem}>
                                <div className={styles.aiIcon}>AI</div>
                                <div>
                                    <div className={styles.metaLabel}>AI SCORE</div>
                                    <div className={`${styles.metaValue} ${styles.scoreValue}`}>9.5</div>
                                </div>
                            </div>
                            <div className={styles.divider} />
                            <div className={styles.metaItem}>
                                <div>
                                    <div className={styles.metaLabel}>СЛОЖНОСТЬ</div>
                                    <div className={`${styles.metaValue} ${styles.diffValue}`}>Advanced</div>
                                </div>
                            </div>
                            <div className={styles.divider} />
                            <div className={styles.metaItem}>
                                <div>
                                    <div className={styles.metaLabel}>ЧТЕНИЕ</div>
                                    <div className={styles.metaValue}>5 мин</div>
                                </div>
                            </div>
                        </div>

                        {selectedEntry ? (
                            <>
                                <h1 className={styles.articleTitle}>{selectedEntry.title}</h1>
                                <article className={styles.richContent} dangerouslySetInnerHTML={{ __html: parsedContent }} />
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                                <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                                <p>Выберите запись из списка слева, чтобы начать чтение</p>
                            </div>
                        )}
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className={styles.rightSidebar}>
                    <div className={styles.tocTitle}>Содержание</div>
                    <ul className={styles.tocList}>
                        {headings.map((h) => (
                            <li
                                key={h.id}
                                className={`${styles.tocItem} ${activeId === h.id ? styles.tocItemActive : ''}`}
                                onClick={() => scrollToHeading(h.id)}
                                style={{ paddingLeft: `${(h.level - 1) * 1}rem` }}
                            >
                                {h.text}
                            </li>
                        ))}
                    </ul>

                    <div className={styles.aiWidget}>
                        <div className={styles.aiWidgetTitle}>AI Ассистент</div>
                        <div className={styles.aiWidgetDesc}>Я помогу вам разобраться в сложных темах этой статьи.</div>
                        <button className={styles.aiWidgetBtn}>Спросить AI</button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default RoomWikiPage;
