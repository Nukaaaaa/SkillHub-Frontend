import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RoomsPage.module.css';
import { roomService } from '../api/roomService';
import type { Room, RoomDto } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Loader from '../components/Loader';
import { Plus, Edit2, Trash2, ArrowLeft, LogIn, Users, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

const RoomsPage: React.FC = () => {
    const { directionId } = useParams<{ directionId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t } = useTranslation();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [userRoomIds, setUserRoomIds] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [formData, setFormData] = useState<RoomDto>({
        directionId: Number(directionId),
        name: '',
        description: '',
        isPrivate: false
    });

    const fetchRooms = async () => {
        if (!directionId) return;
        try {
            setLoading(true);
            const [roomsData, userRoomsData] = await Promise.all([
                roomService.getRoomsByDirection(Number(directionId)),
                user ? roomService.getUserRooms(user.id) : Promise.resolve([])
            ]);
            setRooms(roomsData);
            setUserRoomIds(userRoomsData.map(r => r.id));
        } catch (error) {
            console.error('Failed to fetch rooms:', error);
            showToast(t('common.offline'), 'info');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [directionId, user?.id]);

    const handleOpenModal = (room?: Room) => {
        if (room) {
            setEditingRoom(room);
            setFormData({
                directionId: room.directionId,
                name: t(room.name),
                description: t(room.description),
                isPrivate: room.isPrivate
            });
        } else {
            setEditingRoom(null);
            setFormData({
                directionId: Number(directionId),
                name: '',
                description: '',
                isPrivate: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
        if (e && 'preventDefault' in e) e.preventDefault();
        try {
            await roomService.createRoom(formData, editingRoom?.id);
            showToast(editingRoom ? t('rooms.roomUpdated') : t('rooms.roomCreated'));
            setIsModalOpen(false);
            fetchRooms();
        } catch (error) {
            showToast(t('common.error'), 'error');
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm(t('rooms.deleteConfirm'))) {
            try {
                await roomService.deleteRoom(id);
                showToast(t('rooms.roomDeleted'), 'info');
                fetchRooms();
            } catch (error) {
                showToast(t('common.error'), 'error');
            }
        }
    };

    const handleJoin = async (roomId: number) => {
        if (!user) {
            showToast(t('common.error'), 'info');
            return;
        }
        try {
            await roomService.joinRoom(roomId, user.id);
            showToast(t('rooms.joined'));
            fetchRooms();
        } catch (error) {
            showToast(t('common.error'), 'error');
        }
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => navigate('/')} icon={<ArrowLeft size={20} />} />
                    <h2 className={styles.title}>{t('rooms.title')}</h2>
                </div>
                <Button icon={<Plus size={20} />} onClick={() => handleOpenModal()}>
                    {t('rooms.createRoom')}
                </Button>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder={t('rooms.searchPlaceholder')}
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button className={styles.searchButton}>{t('common.search')}</Button>
                </div>
            </div>

            <div className={styles.grid}>
                {rooms
                    .filter(room => t(room.name).toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(room => (
                        <Card key={room.id} title={t(room.name)}>
                            <div className={room.description ? styles.roomInfo : undefined}>
                                <span className={styles.label}>{t('rooms.description')}</span>
                                <p className={styles.value}>{t(room.description) || t('rooms.noDescription')}</p>
                            </div>
                            <div className={styles.roomInfo}>
                                <span className={styles.label}>{t('rooms.access')}</span>
                                <p className={styles.value}>{room.isPrivate ? t('rooms.private') : t('rooms.public')}</p>
                            </div>
                            <div className={styles.actions}>
                                {userRoomIds.includes(room.id) ? (
                                    <Button
                                        variant="secondary"
                                        icon={<Users size={16} />}
                                        onClick={() => navigate(`/rooms/${room.id}/members`)}
                                    >
                                        {t('rooms.member')}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="secondary"
                                        icon={<LogIn size={16} />}
                                        onClick={() => handleJoin(room.id)}
                                    >
                                        {t('rooms.join')}
                                    </Button>
                                )}
                                <Button
                                    variant="secondary"
                                    icon={<Edit2 size={16} />}
                                    onClick={() => handleOpenModal(room)}
                                />
                                <Button
                                    variant="danger"
                                    icon={<Trash2 size={16} />}
                                    onClick={() => handleDelete(room.id)}
                                />
                            </div>
                        </Card>
                    ))}
                {rooms.length === 0 && (
                    <p className={styles.empty}>{t('rooms.noRooms')}</p>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingRoom ? t('rooms.editRoom') : t('rooms.createRoom')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSubmit}>{editingRoom ? t('common.save') : t('common.create')}</Button>
                    </>
                }
            >
                <form className={styles.form} onSubmit={handleSubmit}>
                    <Input
                        label={t('rooms.roomName')}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label={t('rooms.description')}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="isPrivate"
                            checked={formData.isPrivate}
                            onChange={e => setFormData({ ...formData, isPrivate: e.target.checked })}
                        />
                        <label htmlFor="isPrivate">{t('rooms.isPrivate')}</label>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RoomsPage;
