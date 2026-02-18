import React, { useEffect, useState } from 'react';
import styles from './Dashboard.module.css';
import Card from '../components/Card';
import { directionService } from '../api/directionService';
import type { Direction } from '../types';
import Loader from '../components/Loader';

import { Plus, Edit2, Trash2, ArrowRight, Search } from 'lucide-react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const [directions, setDirections] = useState<Direction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDir, setEditingDir] = useState<Direction | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const navigate = useNavigate();

    const fetchDirections = async () => {
        try {
            setLoading(true);
            const data = await directionService.getDirections();
            setDirections(data);
        } catch (error) {
            console.error('Failed to fetch:', error);
            showToast(t('common.offline'), 'info');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDirections();
    }, []);

    const handleOpenModal = (dir?: Direction) => {
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
            await directionService.createDirection(formData, editingDir?.id);
            showToast(editingDir ? t('common.save') + '!' : t('common.create') + '!');
            setIsModalOpen(false);
            fetchDirections();
        } catch (error) {
            showToast(t('common.error'), 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('common.delete') + '?')) {
            try {
                await directionService.deleteDirection(id);
                showToast(t('common.delete'), 'info');
                fetchDirections();
            } catch (error) {
                showToast(t('common.error'), 'error');
            }
        }
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{t('dashboard.title')}</h2>
                <Button
                    icon={<Plus size={20} />}
                    onClick={() => handleOpenModal()}
                >
                    {t('dashboard.addDirection')}
                </Button>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder={t('dashboard.searchPlaceholder')}
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button className={styles.searchButton}>{t('common.search')}</Button>
                </div>
            </div>

            <div className={styles.grid}>
                {directions
                    .filter(dir => t(dir.name).toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(dir => (
                        <Card key={dir.id} title={t(dir.name)}>
                            <div className={styles.cardContent}>
                                <p className={styles.cardDescription}>{t(dir.description)}</p>
                                <div className={styles.actions}>
                                    <Button
                                        variant="secondary"
                                        icon={<ArrowRight size={16} />}
                                        onClick={() => navigate(`/${dir.id}/rooms`)}
                                    >
                                        {t('dashboard.rooms')}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        icon={<Edit2 size={16} />}
                                        onClick={() => handleOpenModal(dir)}
                                    />
                                    <Button
                                        variant="danger"
                                        icon={<Trash2 size={16} />}
                                        onClick={() => handleDelete(dir.id)}
                                    />
                                </div>
                            </div>
                        </Card>
                    ))}
                {directions.length === 0 && !loading && (
                    <div className={styles.empty}>
                        <p>{t('common.noData')}</p>
                    </div>
                )}
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
