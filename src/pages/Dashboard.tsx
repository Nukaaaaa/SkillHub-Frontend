import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { directionService } from '../api/directionService';
import type { Direction } from '../types';
import Loader from '../components/Loader';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDir, setEditingDir] = useState<Direction | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
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

    const handleOpenModal = (e: React.MouseEvent, dir?: Direction) => {
        e.stopPropagation();
        if (dir) {
            setEditingDir(dir);
            setFormData({ name: t(dir.name), description: t(dir.description) });
        } else {
            setEditingDir(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e && 'preventDefault' in e) e.preventDefault();
        try {
            if (editingDir?.id) {
                await directionService.updateDirection(editingDir.id, formData);
            } else {
                await directionService.createDirection(formData);
            }
            toast.success(editingDir ? t('common.save') + '!' : t('common.create') + '!');
            setIsModalOpen(false);
            fetchDirections();
        } catch (error) {
            toast.error(t('common.error'));
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm(t('common.delete') + '?')) {
            try {
                await directionService.deleteDirection(id);
                toast.success(t('common.delete'));
                fetchDirections();
                if (selectedId === id) setSelectedId(null);
            } catch (error) {
                toast.error(t('common.error'));
            }
        }
    };

    const handleConfirm = () => {
        if (!selectedId) return;
        selectDirection(selectedId);
        if (from === 'profile') {
            navigate('/profile');
        } else {
            navigate(`/${selectedId}/rooms`);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.container}>
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
                <Button
                    icon={<Plus size={18} />}
                    onClick={(e) => handleOpenModal(e as React.MouseEvent)}
                    variant="secondary"
                >
                    {t('dashboard.addDirection')}
                </Button>
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

                            <div className={styles.cardAdminActions}>
                                <button
                                    className={styles.adminBtn}
                                    onClick={(e) => handleOpenModal(e, dir)}
                                    title={t('common.edit')}
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    className={`${styles.adminBtn} ${styles.danger}`}
                                    onClick={(e) => handleDelete(e, dir.id)}
                                    title={t('common.delete')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
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
                <div className={styles.counterSection}>
                    <span className={styles.counterValue}>
                        {selectedId ? 1 : 0}
                    </span>
                    <span className={styles.counterLabel}>
                        {t('dashboard.selectedCount')}
                    </span>
                </div>
                <button
                    onClick={handleConfirm}
                    disabled={!selectedId}
                    className={`${styles.confirmBtn} ${selectedId ? styles.activeConfirmBtn : ''}`}
                >
                    {t('dashboard.startWorking')}
                </button>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDir ? t('common.edit') : t('common.create')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSubmit}>{editingDir ? t('common.save') : t('common.create')}</Button>
                    </>
                }
            >
                <form className={styles.form} onSubmit={handleSubmit}>
                    <Input
                        label={t('dashboard.directionName')}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label={t('dashboard.directionDescription')}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </form>
            </Modal>
        </div>
    );
};

export default Dashboard;
