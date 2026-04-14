import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Trophy,
    Zap,
    Star,
    Lock,
    CheckCircle2,
    TrendingUp,
    ShieldCheck,
} from 'lucide-react';
import {
    achievementService,
    computeLevelData,
    getActivityColor,
    type UserStatsDto,
    type UserActivityDto,
    type UserProgressDto,
} from '../api/achievementService';
import Loader from '../components/Loader';
import styles from './AchievementsPage.module.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildActivityMap(data: UserActivityDto[]): Record<string, number> {
    const map: Record<string, number> = {};
    data.forEach((d) => (map[d.date] = d.count));
    return map;
}

/** Returns last 52 weeks of Sundays (start of each week column) */
function getLastYearWeeks(): Date[] {
    const weeks: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // go back to the most recent Sunday
    const dayOfWeek = today.getDay();
    const lastSunday = new Date(today);
    lastSunday.setDate(today.getDate() - dayOfWeek);
    for (let w = 51; w >= 0; w--) {
        const d = new Date(lastSunday);
        d.setDate(lastSunday.getDate() - w * 7);
        weeks.push(d);
    }
    return weeks;
}

function formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getMonthLabels(weeks: Date[]): { label: string; col: number }[] {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, col) => {
        const month = week.getMonth();
        if (month !== lastMonth) {
            labels.push({
                label: week.toLocaleString('default', { month: 'short' }),
                col,
            });
            lastMonth = month;
        }
    });
    return labels;
}

// ─── Access gradient colors per achievement (fallback by id) ──────────────────
const GRADIENT_PALETTE = [
    'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface XpCardProps {
    stats: UserStatsDto;
}
const XpCard: React.FC<XpCardProps> = ({ stats }) => {
    const { level, xpInLevel, xpPerLevel, progressPercent } = computeLevelData(stats.totalXp);
    return (
        <div className={styles.xpCard}>
            <div className={styles.xpHeader}>
                <div className={styles.xpLevelBadge}>
                    <Zap size={18} />
                    <span>Уровень {level}</span>
                </div>
                <span className={styles.xpTotal}>{stats.totalXp.toLocaleString()} XP</span>
            </div>
            <div className={styles.xpBarTrack}>
                <div
                    className={styles.xpBarFill}
                    style={{ width: `${progressPercent}%` }}
                />
            </div>
            <div className={styles.xpBarLabels}>
                <span>{xpInLevel} / {xpPerLevel} XP до следующего уровня</span>
                <span>{progressPercent}%</span>
            </div>
            <div className={styles.xpStats}>
                <div className={styles.xpStat}>
                    <Trophy size={16} className={styles.xpStatIcon} />
                    <div>
                        <span className={styles.xpStatValue}>{stats.reputation}</span>
                        <span className={styles.xpStatLabel}>Репутация</span>
                    </div>
                </div>
                <div className={styles.xpStat}>
                    <ShieldCheck size={16} className={styles.xpStatIcon} />
                    <div>
                        <span className={styles.xpStatValue}>{level}</span>
                        <span className={styles.xpStatLabel}>Текущий уровень</span>
                    </div>
                </div>
                <div className={styles.xpStat}>
                    <TrendingUp size={16} className={styles.xpStatIcon} />
                    <div>
                        <span className={styles.xpStatValue}>{stats.totalXp.toLocaleString()}</span>
                        <span className={styles.xpStatLabel}>Всего XP</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ActivityGridProps {
    data: UserActivityDto[];
}
const ActivityGrid: React.FC<ActivityGridProps> = ({ data }) => {
    const map = buildActivityMap(data);
    const weeks = getLastYearWeeks();
    const monthLabels = getMonthLabels(weeks);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const totalActivities = data.reduce((s, d) => s + d.count, 0);

    return (
        <div className={styles.activitySection}>
            <div className={styles.activeSectionHeader}>
                <h3 className={styles.sectionTitle}>Активность</h3>
                <span className={styles.activityTotal}>{totalActivities} действий за год</span>
            </div>
            <div className={styles.gridWrapper}>
                {/* Day labels */}
                <div className={styles.dayLabels}>
                    {days.map((d) => (
                        <span key={d} className={styles.dayLabel}>{d}</span>
                    ))}
                </div>
                <div className={styles.gridScroll}>
                    {/* Month labels */}
                    <div className={styles.monthLabels}>
                        {monthLabels.map((m) => (
                            <span
                                key={`${m.label}-${m.col}`}
                                className={styles.monthLabel}
                                style={{ gridColumn: m.col + 1 }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>
                    {/* Grid */}
                    <div className={styles.activityGrid}>
                        {weeks.map((weekStart, wi) => (
                            <div key={wi} className={styles.weekCol}>
                                {Array.from({ length: 7 }).map((_, di) => {
                                    const day = new Date(weekStart);
                                    day.setDate(weekStart.getDate() + di);
                                    const dateStr = formatDate(day);
                                    const count = map[dateStr] ?? 0;
                                    const color = getActivityColor(count);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    if (day > today) return <div key={di} className={styles.gridCell} style={{ background: 'transparent' }} />;
                                    return (
                                        <div
                                            key={di}
                                            className={styles.gridCell}
                                            style={{ background: color }}
                                            title={`${dateStr}: ${count}`}
                                        />
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Legend */}
            <div className={styles.activityLegend}>
                <span className={styles.legendLabel}>Меньше</span>
                {[0, 1, 4, 8, 13].map((v) => (
                    <div
                        key={v}
                        className={styles.legendCell}
                        style={{ background: getActivityColor(v) }}
                    />
                ))}
                <span className={styles.legendLabel}>Больше</span>
            </div>
        </div>
    );
};

interface AchievementCardProps {
    achievement: UserProgressDto;
    index: number;
}
const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, index }) => {
    const gradient = GRADIENT_PALETTE[index % GRADIENT_PALETTE.length];
    const progress = achievement.targetCount > 0
        ? Math.min(Math.round((achievement.currentCount / achievement.targetCount) * 100), 100)
        : 0;

    return (
        <div className={`${styles.card} ${achievement.isUnlocked ? styles.unlocked : ''}`}>
            <div className={styles.cardHeader}>
                <div
                    className={styles.iconWrapper}
                    style={{
                        background: achievement.isUnlocked ? gradient : '#f1f5f9',
                        color: achievement.isUnlocked ? 'white' : '#94a3b8',
                    }}
                >
                    {achievement.iconUrl ? (
                        <img src={achievement.iconUrl} alt="" width={28} height={28} className={styles.iconImg} />
                    ) : achievement.isUnlocked ? (
                        <CheckCircle2 size={28} />
                    ) : (
                        <Lock size={28} />
                    )}
                </div>
                {achievement.isUnlocked && achievement.unlockedAt && (
                    <span className={styles.dateBadge}>
                        {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                        })}
                    </span>
                )}
                {!achievement.isUnlocked && (
                    <span className={styles.lockedBadge}>
                        <Lock size={12} /> Заблокировано
                    </span>
                )}
            </div>

            <h3 className={styles.cardTitle}>{achievement.name}</h3>
            <p className={styles.cardDesc}>{achievement.description}</p>

            <div className={styles.progressContainer}>
                <div className={styles.progressHeader}>
                    <span>Прогресс</span>
                    <span>{achievement.currentCount} / {achievement.targetCount}</span>
                </div>
                <div className={styles.progressBar}>
                    <div
                        className={styles.progressFill}
                        style={{
                            width: `${progress}%`,
                            background: achievement.isUnlocked ? gradient : '#6366f1',
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabType = 'all' | 'unlocked' | 'locked';

const AchievementsPage: React.FC = () => {
    const { t } = useTranslation();

    const [stats, setStats] = useState<UserStatsDto | null>(null);
    const [activity, setActivity] = useState<UserActivityDto[]>([]);
    const [achievements, setAchievements] = useState<UserProgressDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<TabType>('all');

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsData, activityData, achievementsData] = await Promise.all([
                achievementService.getMyStats(),
                achievementService.getMyActivity(),
                achievementService.getMyAchievements(),
            ]);
            setStats(statsData);
            setActivity(activityData);
            setAchievements(achievementsData);
        } catch (err) {
            console.error('Failed to load achievements data:', err);
            setError('Не удалось загрузить данные. Проверьте подключение к серверу.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const filteredAchievements = achievements.filter((a) => {
        if (tab === 'unlocked') return a.isUnlocked;
        if (tab === 'locked') return !a.isUnlocked;
        return true;
    });

    const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loaderWrapper}><Loader /></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.errorState}>
                    <Star size={40} className={styles.errorIcon} />
                    <h2>Ошибка загрузки</h2>
                    <p>{error}</p>
                    <button className={styles.retryBtn} onClick={fetchAll}>
                        Попробовать снова
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* ── Header ── */}
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>{t('nav.achievements') || 'Достижения'}</h1>
                    <p>Твой путь профессионального роста и признания в сообществе</p>
                    <div className={styles.headerBadges}>
                        <span className={styles.badge}>
                            <CheckCircle2 size={14} /> {unlockedCount} получено
                        </span>
                        <span className={styles.badge}>
                            <Star size={14} /> {achievements.length} всего
                        </span>
                    </div>
                </div>
            </header>

            {/* ── XP / Level Card ── */}
            {stats && <XpCard stats={stats} />}

            {/* ── Activity Grid ── */}
            <ActivityGrid data={activity} />

            {/* ── Achievements Tabs ── */}
            <section className={styles.achievementsSection}>
                <div className={styles.tabsRow}>
                    <h3 className={styles.sectionTitle}>Мои достижения</h3>
                    <div className={styles.tabs}>
                        {(['all', 'unlocked', 'locked'] as TabType[]).map((t) => (
                            <button
                                key={t}
                                className={`${styles.tabBtn} ${tab === t ? styles.tabBtnActive : ''}`}
                                onClick={() => setTab(t)}
                            >
                                {t === 'all' ? 'Все' : t === 'unlocked' ? 'Получены' : 'Заблокированы'}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredAchievements.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Trophy size={40} className={styles.emptyIcon} />
                        <p>Здесь пока пусто</p>
                        <p className={styles.emptySubtext}>Начните читать статьи и комментировать, чтобы зарабатывать достижения</p>
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filteredAchievements.map((achievement, index) => (
                            <AchievementCard key={achievement.achievementId} achievement={achievement} index={index} />
                        ))}
                    </div>
                )}
            </section>

            {/* ── XP Earnings Guide ── */}
            <section className={styles.guideSection}>
                <h3 className={styles.sectionTitle}>Как зарабатывать XP?</h3>
                <div className={styles.guideGrid}>
                    {[
                        { action: 'Чтение статьи', xp: '+5 XP', icon: '📖' },
                        { action: 'Комментарий', xp: '+15 XP', icon: '💬' },
                        { action: 'Публикация статьи', xp: '+100 XP', icon: '✍️' },
                        { action: 'Получение реакции', xp: '+10 XP +10 Реп.', icon: '❤️' },
                        { action: 'Вход в систему', xp: '+20 XP / день', icon: '🔑' },
                    ].map((item) => (
                        <div key={item.action} className={styles.guideCard}>
                            <span className={styles.guideEmoji}>{item.icon}</span>
                            <div className={styles.guideInfo}>
                                <span className={styles.guideAction}>{item.action}</span>
                                <span className={styles.guideXp}>{item.xp}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default AchievementsPage;
