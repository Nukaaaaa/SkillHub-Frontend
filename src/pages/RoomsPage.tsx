import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RoomsPage.module.css';
import { roomService } from '../api/roomService';
import { directionService } from '../api/directionService';
import type { Room, Direction } from '../types';
import Loader from '../components/Loader';
import { ArrowLeft, Users, FileText, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Mock helper to generate card stats based on room ID
const getRoomStats = (roomId: number) => {
    const seed = roomId * 13;
    return {
        online: (seed % 15) + 2,
        total: (seed % 50) + 20,
        articles: (seed % 20) + 5,
        questions: (seed % 40) + 10,
        lastActivity: (seed % 5) + 1,
        progress: (seed % 5) + 1,
        totalSteps: 5
    };
};

const RoomsPage: React.FC = () => {
    const { directionId } = useParams<{ directionId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [rooms, setRooms] = useState<Room[]>([]);
    const [direction, setDirection] = useState<Direction | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!directionId) return;
        try {
            setLoading(true);
            const [roomsData, dirData] = await Promise.all([
                roomService.getRoomsByDirection(Number(directionId)),
                directionService.getDirection(Number(directionId))
            ]);
            setRooms(roomsData);
            setDirection(dirData);
        } catch (error) {
            console.error('Failed to fetch rooms and direction:', error);
            toast.error(t('common.offline'));
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

    return (
        <div className={styles.pageWrapper}>
            <header className={styles.header}>
                <div style={{ position: 'absolute', left: '20px', top: '25px' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
                    >
                        <ArrowLeft size={20} />
                        {t('common.back')}
                    </button>
                </div>
                <h1>
                    {t('rooms.welcome', {
                        name: user?.firstname || user?.name || 'Алексей',
                        direction: direction ? t(direction.name) : '...'
                    })}
                </h1>
            </header>

            <div className={styles.container}>
                <h2 className={styles.sectionTitle}>{t('rooms.availableRooms')}</h2>
                <div className={styles.grid}>
                    {rooms.map(room => {
                        const stats = getRoomStats(room.id);
                        const progressPercent = (stats.progress / stats.totalSteps) * 100;

                        return (
                            <div
                                key={room.id}
                                className={styles.roomCard}
                                onClick={() => handleRoomClick(room.id)}
                            >
                                <div className={styles.imagePlaceholder}>
                                    <Activity size={48} />
                                </div>
                                <div className={styles.roomContent}>
                                    <h3>{t(room.name)}</h3>
                                    <p>{t(room.description) || t('rooms.noDescription')}</p>

                                    <div className={styles.roomStats}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                                            <Users size={12} />
                                            {t('rooms.online')}: {stats.online} / {t('rooms.total')}: {stats.total}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                                            <FileText size={12} />
                                            {t('rooms.articlesStats')}: {stats.articles}, {t('rooms.questions')}: {stats.questions}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <Activity size={12} />
                                            {t('rooms.lastActivity')}: {stats.lastActivity} {t('rooms.hoursAgo')}
                                        </div>
                                    </div>

                                    <div className={styles.progressContainer}>
                                        <span className={styles.progressLabel}>
                                            {t('rooms.yourProgress')}: {stats.progress} / {stats.totalSteps} {t('rooms.lessonsCompleted')}
                                        </span>
                                        <div className={styles.progressBar}>
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: `${progressPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        className={styles.enterButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRoomClick(room.id);
                                        }}
                                    >
                                        {t('rooms.view')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

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
