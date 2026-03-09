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

// Helper to get random avatars for demo purposes
const getDemoAvatars = (count: number) => [
    'https://i.pravatar.cc/150?u=1',
    'https://i.pravatar.cc/150?u=2',
    'https://i.pravatar.cc/150?u=3'
].slice(0, count);

const RoomsPage: React.FC = () => {
    const { directionId } = useParams<{ directionId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [direction, setDirection] = useState<Direction | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'my'>('all');
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const { joinedRoomIds } = useAuth();

    const fetchData = async () => {
        if (!directionId) return;
        const dirIdNum = Number(directionId);
        try {
            setLoading(true);
            const [roomsData, dirData] = await Promise.all([
                roomService.getRoomsByDirection(dirIdNum),
                directionService.getDirection(dirIdNum)
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
    }, [directionId]);

    const handleRoomClick = (roomId: number) => {
        navigate(`/rooms/${roomId}`);
    };

    const toggleTag = (e: React.MouseEvent, tag: string) => {
        e.stopPropagation();
        setSelectedTag(prev => prev === tag ? null : tag);
    };

    if (loading) return <Loader />;



    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageHeader}>
                <h2 className={styles.title}>
                    {t('rooms.availableRooms') || 'Активные комнаты'}
                </h2>
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

            <div className={styles.grid}>
                {rooms
                    .filter(room => filterType === 'all' || joinedRoomIds.includes(room.id))
                    .filter(room => !selectedTag || room.tags?.includes(selectedTag))
                    .map(room => {
                        const demoAvatars = getDemoAvatars(Math.min(3, room.participantsCount || 0));
                        const extraMembers = (room.participantsCount || 0) - demoAvatars.length;

                        return (
                            <div
                                key={room.id}
                                className={styles.roomCard}
                                onClick={() => handleRoomClick(room.id)}
                            >
                                <div className={styles.cardTop}>
                                    <div className={styles.memberStack}>
                                        {demoAvatars.map((url, i) => (
                                            <div key={i} className={styles.memberAvatar}>
                                                <img src={url} alt="member" />
                                            </div>
                                        ))}
                                        {extraMembers > 0 && (
                                            <div className={styles.moreMembers}>+{extraMembers}</div>
                                        )}
                                    </div>
                                </div>

                                <h3 className={styles.roomTitle}>{t(room.name)}</h3>
                                <p className={styles.roomDescription}>{room.description || t('rooms.noDescription')}</p>

                                {room.tags && room.tags.length > 0 && (
                                    <div className={styles.tagList}>
                                        {room.tags.map(tag => (
                                            <span 
                                                key={tag} 
                                                className={`${styles.tag} ${selectedTag === tag ? styles.activeTag : ''}`}
                                                onClick={(e) => toggleTag(e, tag)}
                                            >
                                                #{tag}
                                            </span>
                                        ))}
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
                            <button className={styles.emptyCta}>
                                <PlusCircle size={18} />
                                {t('rooms.createRoom') || 'Создать комнату'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomsPage;
