import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RoomsPage.module.css';
import { roomService } from '../api/roomService';
import { directionService } from '../api/directionService';
import type { Room, Direction } from '../types';
import Loader from '../components/Loader';
import { MessageSquare, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

// Room stats will be populated from the backend in future updates
const getRoomStats = () => {
    return {
        category: 'Backend', // Default placeholder
        posts: 0,
        participants: 0,
        members: [],
        extraMembers: 0
    };
};

const RoomsPage: React.FC = () => {
    const { directionId } = useParams<{ directionId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [direction, setDirection] = useState<Direction | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'all' | 'my'>('all');
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

    if (loading) return <Loader />;

    const getBadgeClass = (category: string) => {
        switch (category) {
            case 'Backend': return styles.badgeBackend;
            case 'Frontend': return styles.badgeFrontend;
            case 'DevOps': return styles.badgeDevOps;
            default: return styles.badgeGeneral;
        }
    };

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
            </div>

            <div className={styles.grid}>
                {rooms
                    .filter(room => filterType === 'all' || joinedRoomIds.includes(room.id))
                    .map(room => {
                        const stats = getRoomStats();

                        return (
                            <div
                                key={room.id}
                                className={styles.roomCard}
                                onClick={() => handleRoomClick(room.id)}
                            >
                                <div className={styles.cardTop}>
                                    <span className={`${styles.categoryBadge} ${getBadgeClass(stats.category)}`}>
                                        {stats.category}
                                    </span>
                                    <div className={styles.memberStack}>
                                        {stats.members.map((m, i) => (
                                            <div key={i} className={styles.memberAvatar}>
                                                <img src={m} alt="member" />
                                            </div>
                                        ))}
                                        <div className={styles.moreMembers}>+{stats.extraMembers}</div>
                                    </div>
                                </div>

                                <h3 className={styles.roomTitle}>{t(room.name)}</h3>
                                <p className={styles.roomDescription}>{t(room.description) || t('rooms.noDescription')}</p>

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
                    <div className={styles.empty}>
                        <p>{t('rooms.noRooms')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomsPage;
