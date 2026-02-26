import React, { useEffect, useState } from 'react';
import { Outlet, useParams, useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    MessageSquare,
    FileText,
    BookOpen,
    Users,
    Server
} from 'lucide-react';
import { roomService } from '../api/roomService';
import type { Room } from '../types';
import styles from './RoomLayout.module.css';
import Loader from './Loader';

const RoomLayout: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [room, setRoom] = useState<Room | null>(null);
    const [loading, setLoading] = useState(true);

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
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition">
                                + {t('common.create')}
                            </button>
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
