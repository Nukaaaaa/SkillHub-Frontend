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
import LanguageSelector from './LanguageSelector';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

const RoomLayout: React.FC = () => {
    const { roomSlug } = useParams<{ roomSlug: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);
    const [onlineCount, setOnlineCount] = useState<number>(0);
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const { isMember, joinRoom, leaveRoom, token } = useAuth();

    useEffect(() => {
        const fetchRoom = async () => {
            if (!roomSlug) return;
            try {
                const data = await roomService.getRoom(roomSlug);
                setRoom(data);
                setOnlineCount(data.onlineCount || 0);
            } catch (error) {
                console.error('Failed to fetch room', error);
            } finally {
                setLoading(false);
            }
        };
        fetchRoom();
    }, [roomSlug]);

    // Manage WebSocket connection for presence
    useEffect(() => {
        if (!roomSlug || !token) return;

        const ws = new WebSocket(`ws://localhost:8081/api/presence/ws?token=${token}`);

        ws.onopen = () => {
            console.log('Presence WebSocket connected for room', roomSlug);
            // Optional: If backend expects a join message
            // ws.send(JSON.stringify({ type: 'join_room', roomId: room?.id }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && typeof data.onlineCount === 'number') {
                    setOnlineCount(data.onlineCount);
                }
            } catch (e) {
                console.error('Failed to parse presence update', e);
            }
        };

        ws.onerror = (error) => {
            console.error('Presence WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('Presence WebSocket disconnected for room', roomSlug);
        };

        // Cleanup: close connection when leaving room component
        return () => {
            ws.close();
        };
    }, [roomSlug, token]);

    const handleJoin = async () => {
        if (!roomSlug) return;
        setJoining(true);
        try {
            await joinRoom(roomSlug);
            toast.success(t('rooms.joined') || 'Вы вступили в комнату!');
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setJoining(false);
        }
    };

    const handleLeave = async () => {
        if (!roomSlug) return;
        if (!window.confirm(t('rooms.leaveConfirm') || 'Вы уверены, что хотите покинуть комнату?')) return;

        setLeaving(true);
        try {
            await leaveRoom(roomSlug);
            toast.success(t('rooms.leaveSuccess') || 'Вы покинули комнату');
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
            to: `/rooms/${roomSlug}`,
            icon: <MessageSquare size={20} />,
            label: t('rooms.discussions'),
            end: true
        },
        {
            to: `/rooms/${roomSlug}/articles`,
            icon: <FileText size={20} />,
            label: t('rooms.articles')
        },
        {
            to: `/rooms/${roomSlug}/wiki`,
            icon: <BookOpen size={20} />,
            label: t('rooms.wiki')
        },
        {
            to: `/rooms/${roomSlug}/members`,
            icon: <Users size={20} />,
            label: t('members.title')
        }
    ];

    return (
        <div className={styles.roomLayout}>
            <aside className={styles.roomSidebar}>
                <div className={styles.sidebarBrand}>
                    <span className={styles.brandShort}>S</span>
                    <span className={styles.brandFull}>SkillHub</span>
                </div>

                <nav className={styles.sidebarNav}>
                    <button
                        className={styles.navLink}
                        onClick={() => navigate(`/${room.directionSlug}/rooms`)}
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

                <div className={styles.sidebarFooter}>
                    <LanguageSelector variant="sidebar" />
                </div>
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
                                    <span><Users size={12} /> {room.participantsCount || 0}</span>
                                    <span>•</span>
                                    <span className={styles.onlineBadge}>{onlineCount} в сети</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.headerActions}>
                            {isMember(room.id) ? (
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
