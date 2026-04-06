import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { directionService } from '../api/directionService';
import type { Direction } from '../types';
import Loader from '../components/Loader';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/LanguageSelector';

// Mockup styling mapping
const DIRECTION_STYLES = [
    { icon: 'fas fa-laptop-code', bg: '#eff6ff', color: '#3b82f6' }, // Blue
    { icon: 'fas fa-stethoscope', bg: '#fef2f2', color: '#ef4444' }, // Red
    { icon: 'fas fa-chart-line', bg: '#fffbeb', color: '#f59e0b' }, // Amber
    { icon: 'fas fa-graduation-cap', bg: '#ecfdf5', color: '#10b981' }, // Emerald
    { icon: 'fas fa-gavel', bg: '#eef2ff', color: '#6366f1' }, // Indigo
    { icon: 'fas fa-microchip', bg: '#fff7ed', color: '#f97316' }, // Orange
    { icon: 'fas fa-paint-brush', bg: '#fdf2f8', color: '#ec4899' }, // Pink
    { icon: 'fas fa-brain', bg: '#faf5ff', color: '#a855f7' }, // Purple
];

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const { selectDirection } = useAuth();
    const [directions, setDirections] = useState<Direction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const from = searchParams.get('from');

    const fetchDirections = async () => {
        try {
            setLoading(true);
            const data = await directionService.getDirections();
            setDirections(data);
        } catch (error) {
            console.error('Failed to fetch:', error);
            toast.error(t('common.offline'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDirections();
    }, []);


    const handleConfirm = () => {
        if (!selectedId) return;
        const selectedDir = directions.find(d => d.id === selectedId);
        if (!selectedDir) return;

        selectDirection(selectedId, selectedDir.slug);
        if (from === 'profile') {
            navigate('/profile');
        } else {
            navigate(`/${selectedDir.slug}/rooms`);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.container}>
            <LanguageSelector variant="floating" />
            <div className={styles.pageHeader}>
                <div className={styles.welcomeBadge}>
                    {t('dashboard.welcomeBadge')}
                </div>
                <h1 className={styles.pageTitle}>
                    <Trans
                        i18nKey="dashboard.title"
                        values={{ highlight: t('dashboard.titleHighlight') }}
                        components={{ span: <span className={styles.highlight} /> }}
                    />
                </h1>
                <p className={styles.pageSubtitle}>{t('dashboard.subtitle')}</p>
            </div>

            <div className={styles.topActions}>
            </div>

            <div className={styles.grid}>
                {directions.map((dir, idx) => {
                    const isSelected = selectedId === dir.id;
                    const style = DIRECTION_STYLES[idx % DIRECTION_STYLES.length];

                    return (
                        <div
                            key={dir.id}
                            className={`${styles.card} ${isSelected ? styles.selected : ''}`}
                            onClick={() => setSelectedId(isSelected ? null : dir.id)}
                        >
                            <div
                                className={styles.cardIconWrapper}
                                style={{ backgroundColor: style.bg, color: style.color }}
                            >
                                <i className={style.icon}></i>
                            </div>

                            <h3 className={styles.cardTitle}>{t(dir.name)}</h3>
                            <p className={styles.cardDescription}>{t(dir.description)}</p>

                            {/* Admin actions removed for users */}
                        </div>
                    );
                })}

                {directions.length === 0 && !loading && (
                    <div className={styles.empty}>
                        <p>{t('common.noData')}</p>
                    </div>
                )}
            </div>

            <div className={styles.stickyFooter}>
                <button
                    onClick={handleConfirm}
                    disabled={!selectedId}
                    className={`${styles.confirmBtn} ${selectedId ? styles.activeConfirmBtn : ''}`}
                >
                    {t('dashboard.startWorking')}
                </button>
            </div>

        </div>
    );
};

export default Dashboard;
