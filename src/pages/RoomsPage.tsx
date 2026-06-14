import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RoomsPage.module.css';
import { roomService } from '../api/roomService';
import { directionService } from '../api/directionService';
import type { Room, Direction } from '../types';
import Loader from '../components/Loader';
import { MessageSquare, Users, SearchX, PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import AiRecommendations from '../components/AiRecommendations';
import RoomIcon from '../components/RoomIcon';
import CreateRoomModal from '../components/CreateRoomModal';

const RoomsPage: React.FC = () => {
    const { directionSlug } = useParams<{ directionSlug: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, joinedRoomIds } = useAuth();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [direction, setDirection] = useState<Direction | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'my'>('all');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchData = async () => {
        if (!directionSlug) return;
        try {
            setLoading(true);
            const [roomsData, dirData] = await Promise.all([
                roomService.getRoomsByDirection(directionSlug),
                directionService.getDirection(directionSlug)
            ]);

            setRooms(roomsData || []);
            setDirection(dirData || null);
        } catch (error) {
            console.error('Failed to fetch rooms and direction:', error);
            toast.error(t('common.offline'));
            setRooms([]);
            setDirection(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [directionSlug]);

    const handleRoomClick = (roomSlug: string) => {
        navigate(`/rooms/${roomSlug}`);
    };

    const toggleTag = (e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        setSelectedTag(prev => prev === tag ? null : tag);
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageHeader}>
                <div className={styles.headerTitleRow}>
                    <h2 className={styles.title}>
                        {t('rooms.availableRooms') || 'Активные комнаты'}
                    </h2>
                    {(user?.role === 'ADMIN' || user?.role === 'MODERATOR') && (
                        <button
                            className={styles.createBtn}
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <PlusCircle size={18} />
                            <span>{t('rooms.createRoom') || 'Создать комнату'}</span>
                        </button>
                    )}
                </div>
                <p className={styles.subtitle}>
                    {direction ? t(direction.name) : '...'} - {t('rooms.subtitle') || 'Выберите направление для общения и обмена опытом'}
                </p>

                <div className={styles.filterTabs}>
                    <button
                        className={`${styles.filterTab} ${filterType === 'all' ? styles.activeTab : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        {t('rooms.allRooms') || 'Все комнаты'}
                    </button>
                    <button
                        className={`${styles.filterTab} ${filterType === 'my' ? styles.activeTab : ''}`}
                        onClick={() => setFilterType('my')}
                    >
                        {t('rooms.myRooms') || 'Мои комнаты'}
                    </button>
                </div>

                {selectedTag && (
                    <div className={styles.tagFilterInfo}>
                        <span>{t('rooms.filterByTag') || 'Фильтр по тегу'}: <strong>{selectedTag}</strong></span>
                        <button className={styles.clearTagBtn} onClick={() => setSelectedTag(null)}>{t('common.clear') || 'Очистить'}</button>
                    </div>
                )}
            </div>

            {filterType === 'all' && !selectedTag && rooms.length > 0 && (
                <AiRecommendations rooms={rooms} />
            )}

            <div className={styles.grid}>
                {rooms
                    .filter(room => filterType === 'all' || joinedRoomIds.includes(room.id))
                    .filter(room => !selectedTag || room.tags?.includes(selectedTag))
                    .map(room => {
                        return (
                            <div
                                key={room.id}
                                className={styles.roomCard}
                                onClick={() => handleRoomClick(room.slug)}
                            >
                                <div className={styles.cardTop}>
                                    <RoomIcon name={room.name} tags={room.tags} size={44} />
                                </div>

                                <h3 className={styles.roomTitle}>{t(room.name)}</h3>
                                <p className={styles.roomDescription}>{room.description || t('rooms.noDescription')}</p>

                                {room.tags && room.tags.filter(t => !t.startsWith('icon:')).length > 0 && (
                                    <div className={styles.tagList}>
                                        {room.tags
                                            .filter(tag => !tag.startsWith('icon:'))
                                            .map(tag => (
                                                <span 
                                                    key={tag} 
                                                    className={`${styles.tag} ${selectedTag === tag ? styles.activeTag : ''}`}
                                                    onClick={(e) => toggleTag(e, tag)}
                                                >
                                                    #{tag}
                                                </span>
                                            ))
                                        }
                                    </div>
                                )}

                                <div className={styles.cardFooter}>
                                    <div className={styles.statItem}>
                                        <MessageSquare size={14} />
                                        <span>{room.postsCount || 0} постов</span>
                                    </div>
                                    <div className={styles.statItem}>
                                        <Users size={14} />
                                        <span>{room.participantsCount || 0} участников</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                {rooms.length === 0 && (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <SearchX size={32} />
                        </div>
                        <h3 className={styles.emptyTitle}>
                            {selectedTag ? t('rooms.noRoomsWithTag') || 'По этому тегу ничего нет' : t('rooms.noRooms') || 'В этом направлении пока нет комнат'}
                        </h3>
                        <p className={styles.emptyText}>
                            {selectedTag 
                                ? t('rooms.tryOtherTag') || 'Попробуйте сбросить фильтры или поискать другой тег'
                                : t('rooms.createFirstPrompt') || 'Станьте первым, кто создаст пространство для общения в этом направлении!'}
                        </p>
                        {selectedTag ? (
                            <button className={styles.emptyCta} onClick={() => setSelectedTag(null)}>
                                {t('common.clear') || 'Сбросить фильтры'}
                            </button>
                        ) : (
                            <button className={styles.emptyCta} onClick={() => setIsCreateModalOpen(true)}>
                                <PlusCircle size={18} />
                                {t('rooms.createRoom') || 'Создать комнату'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {directionSlug && (
                <CreateRoomModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    directionSlug={directionSlug}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
};

export default RoomsPage;
