import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Medal,
    Trophy,
    Zap,
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

    const achievements: Achievement[] = [];

    const stats = [
        { label: t('profile.reputation'), value: "0", icon: <Trophy size={20} color="#f59e0b" /> },
        { label: t('profile.tabs.achievements'), value: "0/0", icon: <Medal size={20} color="#6366f1" /> },
        { label: "Уровень", value: "1", icon: <Zap size={20} color="#10b981" /> }
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
                {achievements.length > 0 ? (
                    achievements.map((achievement) => (
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
                    ))
                ) : (
                    <div className={styles.empty} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
                        <p>{t('common.noData')}</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Этот раздел будет наполняться по мере ваших успехов</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AchievementsPage;
