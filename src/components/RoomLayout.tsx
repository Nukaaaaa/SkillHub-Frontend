import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    MessageSquare,
    FileText,
    BookOpen,
    Users,
    Server,
    LogOut
} from 'lucide-react';
import { roomService } from '../api/roomService';
import type { Room } from '../types';
import styles from './RoomLayout.module.css';
import Loader from './Loader';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const RoomLayout: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const { isMember, joinRoom, leaveRoom } = useAuth();

    useEffect(() => {
        const fetchRoom = async () => {
            if (!roomId) return;
            try {
                const data = await roomService.getRoom(Number(roomId));
                setRoom(data);
            } catch (error) {
                console.error('Failed to fetch room', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [roomId]);

    const handleJoin = async () => {
        if (!roomId) return;
        setJoining(true);
        try {
            await joinRoom(Number(roomId));
            toast.success(t('rooms.joinedSuccess') || 'Вы вступили в комнату!');
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!roomId) return;
        if (!window.confirm(t('rooms.leaveConfirm') || 'Вы уверены, что хотите покинуть комнату?')) return;

        setLeaving(true);
        try {
            await leaveRoom(Number(roomId));
            toast.success(t('rooms.leftSuccess') || 'Вы покинули комнату');
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setLeaving(false);
        }
    };

    if (loading) return <Loader />;
    if (!room) return <div>Room not found</div>;

    const navItems = [
        {
            to: `/rooms/${roomId}`,
            icon: <MessageSquare size={20} />,
            label: t('rooms.discussions'),
            end: true
        },
        {
            to: `/rooms/${roomId}/articles`,
            icon: <FileText size={20} />,
            label: t('rooms.articles')
        },
        {
            to: `/rooms/${roomId}/wiki`,
            icon: <BookOpen size={20} />,
            label: t('rooms.wiki')
        },
        {
            to: `/rooms/${roomId}/members`,
            icon: <Users size={20} />,
            label: t('members.title')
        }
    ];

    return (
        <div className={styles.roomLayout}>
            <aside className={styles.roomSidebar}>
                <div className={styles.sidebarBrand}>
                    <span className={styles.brandShort}>D</span>
                    <span className={styles.brandFull}>DevHub</span>
                </div>

                <nav className={styles.sidebarNav}>
                    <button
                        className={styles.navLink}
                        onClick={() => navigate(`/${room.directionId}/rooms`)}
                    >
                        <ArrowLeft size={20} />
                        <span>{t('common.back')}</span>
                    </button>

                    <div className={styles.sidebarDivider} />

                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.active : ''}`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>

            <main className={styles.mainArea}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <div className={styles.roomInfo}>
                            <div className={styles.roomIcon}>
                                <Server size={24} />
                            </div>
                            <div className={styles.roomText}>
                                <h1>{room.name}</h1>
                                <div className={styles.roomStats}>
                                    <span><Users size={12} /> 2.4k</span>
                                    <span>•</span>
                                    <span className={styles.onlineBadge}>18 в сети</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            {isMember(Number(roomId)) ? (
                                <button
                                    className={styles.leaveBtn}
                                    onClick={handleLeave}
                                    disabled={leaving}
                                >
                                    <LogOut size={16} />
                                    <span>{leaving ? t('common.loading') : (t('rooms.leave') || 'Покинуть')}</span>
                                </button>
                            ) : (
                                <button
                                    className={styles.joinBtn}
                                    onClick={handleJoin}
                                    disabled={joining}
                                >
                                    {joining ? t('common.loading') : (
                                        <>
                                            <Users size={16} />
                                            <span>{t('rooms.join') || 'Вступить в комнату'}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <div className={styles.content}>
                    <div className={styles.innerContent}>
                        <Outlet context={{ room }} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default RoomLayout;
