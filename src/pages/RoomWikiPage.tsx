import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Search,
    History,
    FolderOpen,
    Folder,
    FileText,
    ChevronRight,
    Download,
    BookOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { contentService } from '../api/contentService';
import type { WikiEntry } from '../types';
import Loader from '../components/Loader';
import styles from './RoomWikiPage.module.css';

const RoomWikiPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();

    const [wikiEntries, setWikiEntries] = useState<WikiEntry[]>([]);
    const [sections, setSections] = useState<{ id: number; roomId: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null);
    const [activeSection, setActiveSection] = useState<number | null>(null);

    const fetchWiki = async () => {
        if (!roomId) return;
        try {
            setLoading(true);
            const [data, secs] = await Promise.all([
                contentService.getWikiByRoom(Number(roomId)),
                contentService.getWikiSectionsByRoom(Number(roomId)).catch(() => []),
            ]);
            setWikiEntries(data);
            setSections(secs);
            if (data.length > 0) setSelectedEntry(data[0]);
        } catch (error) {
            console.error('Failed to fetch wiki:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWiki();
    }, [roomId]);

    if (loading) return <Loader />;

    return (
        <div className={styles.wikiContainer}>
            <header className={styles.wikiHeader}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={18} />
                    <input
                        type="text"
                        placeholder="Поиск по базе знаний (напр. 'Индексы в SQL')..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.headerMeta}>
                    <span className={styles.versionTag}>Версия: 2.4.0</span>
                    <button className={styles.historyBtn}>
                        <History size={18} />
                    </button>
                </div>
            </header>

            <div className={styles.mainLayout}>
                {/* Left Sidebar */}
                <aside className={styles.leftSidebar}>
                    <div className={styles.sidebarTitle}>Разделы</div>
                    <div className={styles.navGroup}>
                        <div
                            className={`${styles.navItem} ${activeSection === null ? styles.navItemActive : ''}`}
                            onClick={() => { setActiveSection(null); setSelectedEntry(null); }}
                        >
                            <FolderOpen size={16} />
                            <span>Все записи</span>
                        </div>

                        {/* Real sections from backend */}
                        {sections.map(sec => (
                            <div key={sec.id}>
                                <div
                                    className={`${styles.navItem} ${activeSection === sec.id ? styles.navItemActive : ''}`}
                                    onClick={() => { setActiveSection(sec.id); setSelectedEntry(null); }}
                                >
                                    <Folder size={16} />
                                    <span>{sec.name}</span>
                                </div>

                                {/* Entries in this section */}
                                {activeSection === sec.id && (
                                    <div className={styles.subMenu}>
                                        {wikiEntries
                                            .filter((e: any) => e.sectionId === sec.id && e.title.toLowerCase().includes(searchTerm.toLowerCase()))
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
                                )}
                            </div>
                        ))}

                        {/* Entries without a section */}
                        <div className={styles.subMenu}>
                            {wikiEntries
                                .filter((e: any) => !e.sectionId && e.title.toLowerCase().includes(searchTerm.toLowerCase()))
                                .map(entry => (
                                    <div
                                        key={entry.id}
                                        className={`${styles.subNavItem} ${selectedEntry?.id === entry.id ? styles.subItemActive : ''}`}
                                        onClick={() => setSelectedEntry(entry)}
                                    >
                                        <BookOpen size={14} style={{ opacity: 0.5 }} />
                                        <span>{entry.title}</span>
                                    </div>
                                ))}
                        </div>

                        {!wikiEntries.length && !loading && (
                            <div className="px-6 py-4 text-xs text-gray-400 italic">
                                В этой комнате пока нет записей в базе знаний.
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.contentArea}>
                    <div className={styles.articleWrapper}>
                        <nav className={styles.breadcrumbs}>
                            <span>База</span>
                            <ChevronRight size={10} />
                            <span>{selectedEntry ? 'Статьи' : 'Архитектура'}</span>
                            <ChevronRight size={10} />
                            <span className={styles.breadcrumbActive}>
                                {selectedEntry ? selectedEntry.title : 'Микросервисы'}
                            </span>
                        </nav>

                        <h1 className={styles.articleTitle}>
                            {selectedEntry ? selectedEntry.title : wikiEntries.length === 0 ? 'База знаний пуста' : 'Выберите запись из списка слева'}
                        </h1>

                        {selectedEntry && (
                            <div className={styles.metadataBar}>
                                <div className={styles.metaItem}>
                                    <div className={styles.aiIcon}>AI</div>
                                    <div>
                                        <p className={styles.metaLabel}>AI Score</p>
                                        <p className={`${styles.metaValue} ${styles.scoreValue}`}>9.8 / 10</p>
                                    </div>
                                </div>
                                <div className={styles.divider} />
                                <div className={styles.metaItem}>
                                    <div>
                                        <p className={styles.metaLabel}>Сложность</p>
                                        <p className={`${styles.metaValue} ${styles.diffValue}`}>MIDDLE+</p>
                                    </div>
                                </div>
                                <div className={styles.divider} />
                                <div className={styles.metaItem}>
                                    <div>
                                        <p className={styles.metaLabel}>Обновлено</p>
                                        <p className={styles.metaValue}>
                                            {new Date(selectedEntry.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <article className={styles.richContent}>
                            {selectedEntry ? (
                                <div dangerouslySetInnerHTML={{ __html: selectedEntry.content }} />
                            ) : wikiEntries.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    Система Вики работает так: модераторы читают статьи пользователей в разделе "Статьи" комнаты. 
                                    Если статья качественная, модератор нажимает "Добавить в Базу знаний". 
                                    После этого статья навсегда сохраняется здесь как часть общей документации группы.
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                                    Пожалуйста, выберите нужную запись из меню слева для начала чтения.
                                </div>
                            )}
                        </article>

                        <footer className={styles.footerSection}>
                            <div className={styles.authorsList}>
                                <p className={styles.authorLabel}>Авторы:</p>
                                <div className={styles.authorAvatars}>
                                    <img src="https://ui-avatars.com/api/?name=Admin&background=random" className={styles.authorAvatar} alt="avatar" />
                                    <img src="https://ui-avatars.com/api/?name=Expert&background=random" className={styles.authorAvatar} alt="avatar" />
                                </div>
                            </div>
                            <div className={styles.footerActions}>
                                <button className={styles.ghostBtn} onClick={() => toast.success('Спасибо! Мы проверим это сообщение.')}>Нашли ошибку?</button>
                                <button className={styles.primaryBtn} onClick={() => toast.loading('Генерация PDF...', { duration: 2000 })}>
                                    <Download size={14} style={{ marginRight: '0.5rem' }} />
                                    Скачать PDF
                                </button>
                            </div>
                        </footer>
                    </div>
                </main>

                {/* Right Sidebar */}
                <aside className={styles.rightSidebar}>
                    <h4 className={styles.tocTitle}>На этой странице</h4>
                    <ul className={styles.tocList}>
                        <li className={`${styles.tocItem} ${styles.tocItemActive}`}>Определение</li>
                        <li className={styles.tocItem}>Основные принципы</li>
                        <li className={styles.tocItem}>Преимущества</li>
                        <li className={styles.tocItem}>Сравнение с монолитом</li>
                        <li className={styles.tocItem}>Заключение</li>
                    </ul>

                    <div className={styles.aiWidget}>
                        <p className={styles.aiWidgetTitle}>AI Ассистент</p>
                        <p className={styles.aiWidgetDesc}>
                            Я могу кратко пересказать эту статью или ответить на вопросы по ней.
                        </p>
                        <button className={styles.aiWidgetBtn} onClick={() => toast('AI Ассистент скоро будет доступен!', { icon: '🤖' })}>Задать вопрос</button>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default RoomWikiPage;
