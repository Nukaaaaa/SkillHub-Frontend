import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Medal,
    Trophy,
    Star,
    Target,
    Zap,
    ShieldCheck,
    Users,
    MessageCircle,
    Hexagon
} from 'lucide-react';
import styles from './AchievementsPage.module.css';

interface Achievement {
    id: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    progress: number;
    unlockedAt?: string;
}

const AchievementsPage: React.FC = () => {
    const { t } = useTranslation();

    const achievements: Achievement[] = [
        {
            id: 1,
            title: "Первые шаги",
            description: "Вы вступили в свою первую профессиональную комнату",
            icon: <Zap size={24} />,
            color: "#6366f1",
            progress: 100,
            unlockedAt: "12 Фев 2026"
        },
        {
            id: 2,
            title: "Активный участник",
            description: "Оставьте 50 комментариев в обсуждениях",
            icon: <MessageCircle size={24} />,
            color: "#f59e0b",
            progress: 65
        },
        {
            id: 3,
            title: "Хранитель знаний",
            description: "Добавьте 5 статей в базу знаний (Wiki)",
            icon: <ShieldCheck size={24} />,
            color: "#10b981",
            progress: 40
        },
        {
            id: 4,
            title: "Лидер мнений",
            description: "Получите 100 лайков на свои посты",
            icon: <Star size={24} />,
            color: "#ef4444",
            progress: 82
        },
        {
            id: 5,
            title: "Сетевик",
            description: "Подпишитесь на 10 экспертов",
            icon: <Users size={24} />,
            color: "#8b5cf6",
            progress: 100,
            unlockedAt: "24 Фев 2026"
        },
        {
            id: 6,
            title: "Марафонец",
            description: "ПосещайтеSkillHub 7 дней подряд",
            icon: <Target size={24} />,
            color: "#ec4899",
            progress: 42
        }
    ];

    const stats = [
        { label: "Всего очков", value: "2,450", icon: <Trophy size={20} color="#f59e0b" /> },
        { label: "Разблокировано", value: "12/48", icon: <Medal size={20} color="#6366f1" /> },
        { label: "Уровень", value: "8", icon: <Zap size={20} color="#10b981" /> }
    ];

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>{t('nav.achievements') || 'Достижения'}</h1>
                    <p>Твой путь профессионального роста и признания в сообществе</p>
                </div>
                <div className={styles.statsRow}>
                    {stats.map((stat, i) => (
                        <div key={i} className={styles.statCard}>
                            <div className={styles.statIcon}>{stat.icon}</div>
                            <div className={styles.statInfo}>
                                <span className={styles.statLabel}>{stat.label}</span>
                                <span className={styles.statValue}>{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </header>

            <div className={styles.grid}>
                {achievements.map((achievement) => (
                    <div key={achievement.id} className={`${styles.card} ${achievement.unlockedAt ? styles.unlocked : ''}`}>
                        <div className={styles.cardHeader}>
                            <div
                                className={styles.iconWrapper}
                                style={{ background: achievement.unlockedAt ? achievement.color : '#f1f5f9', color: achievement.unlockedAt ? 'white' : '#94a3b8' }}
                            >
                                {achievement.icon}
                            </div>
                            {achievement.unlockedAt && (
                                <span className={styles.dateBadge}>{achievement.unlockedAt}</span>
                            )}
                        </div>
                        <h3 className={styles.cardTitle}>{achievement.title}</h3>
                        <p className={styles.cardDesc}>{achievement.description}</p>

                        <div className={styles.progressContainer}>
                            <div className={styles.progressHeader}>
                                <span>Прогресс</span>
                                <span>{achievement.progress}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{ width: `${achievement.progress}%`, background: achievement.color }}
                                />
                            </div>
                        </div>

                        {!achievement.unlockedAt && (
                            <div className={styles.lockOverlay}>
                                <Hexagon size={20} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AchievementsPage;
