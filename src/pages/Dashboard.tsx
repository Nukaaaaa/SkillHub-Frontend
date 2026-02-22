import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import { directionService } from '../api/directionService';
import type { Direction } from '../types';
import Loader from '../components/Loader';
import { Plus, Edit2, Trash2, Check } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// Map direction icons by index
const DIRECTION_ICONS = ['💻', '🏥', '📐', '⚙️', '📈', '🔬', '🎨', '📚', '🌍', '🎯'];

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
            } catch (error) {
                toast.error(t('common.error'));
            }
        }
    };

    const handleConfirm = () => {
        if (!selectedId) {
            toast.error(t('dashboard.pleaseSelect'));
            return;
        }
        selectDirection(selectedId);
        navigate(`/${selectedId}/rooms`);
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.container}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>{t('dashboard.title')}</h1>
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
                    return (
                        <div
                            key={dir.id}
                            className={`${styles.card} ${isSelected ? styles.selected : ''}`}
                            onClick={() => setSelectedId(dir.id)}
                        >
                            <div className={styles.cardIcon}>
                                {DIRECTION_ICONS[idx % DIRECTION_ICONS.length]}
                            </div>
                            <div className={styles.cardContent}>
                                <h3 className={styles.cardTitle}>{t(dir.name)}</h3>
                                <p className={styles.cardDescription}>{t(dir.description)}</p>
                            </div>
                            {isSelected && (
                                <div className={styles.selectedBadge}>
                                    <Check size={14} />
                                </div>
                            )}
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

            {directions.length > 0 && (
                <div className={styles.confirmSection}>
                    <Button
                        onClick={handleConfirm}
                        className={styles.confirmBtn}
                    >
                        {selectedId
                            ? `${t('dashboard.rooms')} →`
                            : t('dashboard.selectToConfirm')}
                    </Button>
                </div>
            )}

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
