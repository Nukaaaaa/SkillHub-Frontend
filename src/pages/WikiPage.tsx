import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Search,
    Book,
    ChevronRight,
    ExternalLink,
    TrendingUp,
    Star,
    Layout,
    Database,
    Shield,
    Cpu,
    Network
} from 'lucide-react';
import styles from './WikiPage.module.css';

const WikiPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const categories = [
        { name: "Backend", icon: <Database size={24} />, count: 124, color: "#3b82f6" },
        { name: "Frontend", icon: <Layout size={24} />, count: 86, color: "#ef4444" },
        { name: "DevOps", icon: <Cpu size={24} />, count: 42, color: "#10b981" },
        { name: "Architecture", icon: <Network size={24} />, count: 31, color: "#8b5cf6" },
        { name: "Security", icon: <Shield size={24} />, count: 19, color: "#f59e0b" }
    ];

    const trending = [
        "Оптимизация индексов в PostgreSQL",
        "JWT vs OAuth2: Что выбрать?",
        "Принципы SOLID на практике",
        "Введение в Kubernetes для разработчиков",
        "Архитектура чистой папки в React"
    ];

    return (
        <div className={styles.container}>
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1>База знаний SkillHub</h1>
                    <p>Коллективная мудрость профессионального сообщества</p>
                    <div className={styles.searchLarge}>
                        <Search size={22} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Поиск по всей базе знаний..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className={styles.searchBtn}>Найти</button>
                    </div>
                </div>
            </section>

            <main className={styles.mainContent}>
                <div className={styles.categoryGrid}>
                    {categories.map((cat, i) => (
                        <div key={i} className={styles.categoryCard}>
                            <div className={styles.categoryIcon} style={{ background: `${cat.color}15`, color: cat.color }}>
                                {cat.icon}
                            </div>
                            <div className={styles.categoryInfo}>
                                <h3>{cat.name}</h3>
                                <span>{cat.count} статей</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.cols}>
                    <div className={styles.trendingCol}>
                        <div className={styles.sectionHeader}>
                            <TrendingUp size={18} />
                            <h2>Популярные темы</h2>
                        </div>
                        <div className={styles.trendingList}>
                            {trending.map((item, i) => (
                                <a key={i} href="#" className={styles.trendingItem}>
                                    <ChevronRight size={16} />
                                    <span>{item}</span>
                                </a>
                            ))}
                        </div>
                    </div>

                    <div className={styles.featuredCol}>
                        <div className={styles.sectionHeader}>
                            <Star size={18} />
                            <h2>Рекомендовано для вас</h2>
                        </div>
                        <div className={styles.featuredCard}>
                            <div className={styles.featuredTag}>Статья недели</div>
                            <h3>Построение масштабируемых систем на Go</h3>
                            <p>Узнайте лучшие практики использования горутин, каналов и контекста для создания высоконагруженных сервисов...</p>
                            <button className={styles.readBtn}>
                                Читать далее
                                <ExternalLink size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default WikiPage;
