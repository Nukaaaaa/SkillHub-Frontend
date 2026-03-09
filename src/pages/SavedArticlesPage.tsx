import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Bookmark,
    Search,
    Clock,
    Trash2,
    Share2,
    ExternalLink
} from 'lucide-react';
import styles from './SavedArticlesPage.module.css';

interface SavedArticle {
    id: number;
    title: string;
    preview: string;
    author: string;
    savedAt: string;
    readTime: string;
    category: string;
}

const SavedArticlesPage: React.FC = () => {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const savedArticles: SavedArticle[] = []; // To be populated from API



    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>{t('nav.saved') || 'Сохраненные статьи'}</h1>
                    <p>{savedArticles.length} материалов отложено на потом</p>
                </div>
                <div className={styles.searchBox}>
                    <Search size={18} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Поиск по сохраненным..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className={styles.articlesList}>
                {savedArticles.map(article => (
                    <div key={article.id} className={styles.articleCard}>
                        <div className={styles.cardMain}>
                            <div className={styles.cardHeader}>
                                <span className={styles.categoryBadge}>{article.category}</span>
                                <div className={styles.savedMeta}>
                                    <Clock size={14} />
                                    <span>Сохранено {article.savedAt}</span>
                                </div>
                            </div>
                            <h2 className={styles.articleTitle}>{article.title}</h2>
                            <p className={styles.articlePreview}>{article.preview}</p>
                            <div className={styles.cardFooter}>
                                <span className={styles.authorName}>{article.author}</span>
                                <span className={styles.separator}>•</span>
                                <span className={styles.readTime}>{article.readTime} чтения</span>
                            </div>
                        </div>
                        <div className={styles.cardActions}>
                            <button className={styles.actionBtn} title="Открыть">
                                <ExternalLink size={18} />
                            </button>
                            <button className={styles.actionBtn} title="Поделиться">
                                <Share2 size={18} />
                            </button>
                            <button className={styles.actionBtn} title="Удалить">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {savedArticles.length === 0 && (
                <div className={styles.emptyState}>
                    <Bookmark size={48} className={styles.emptyIcon} />
                    <h3>У вас нет сохраненных статей</h3>
                    <p>Добавляйте статьи в закладки, чтобы прочитать их позже.</p>
                </div>
            )}
        </div>
    );
};

export default SavedArticlesPage;
