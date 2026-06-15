import React from 'react';
import { Outlet, NavLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './Layout.module.css';
import {
    DoorOpen,
    Bookmark,
    Book,
    Medal,
    UserCircle,
    Layers,
    LogOut,
    Search,
    Shield,
    Activity,
    Bell,
    MessageSquare
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { achievementService } from '../api/achievementService';
import Avatar from './Avatar';

const Layout: React.FC = () => {
    const { user, logout, isLocalModerator } = useAuth();
    const navigate = useNavigate();
    const { directionSlug } = useParams<{ directionSlug?: string }>();
    const { t } = useTranslation();

    const [notifOpen, setNotifOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [totalXp, setTotalXp] = React.useState<number>(0);

    const mockNotifs: any[] = [];

    React.useEffect(() => {
        if (user) {
            achievementService.getMyStats().then(stats => {
                setTotalXp(stats.totalXp);
            }).catch(err => console.error('Failed to fetch sidebar stats:', err));
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };


    const currentDirection = directionSlug || user?.selectedDirectionSlug;

    const navItems = [
        { to: currentDirection ? `/${currentDirection}/rooms` : '/', icon: <DoorOpen size={20} />, label: t('nav.rooms') },
        { to: '/chat', icon: <MessageSquare size={20} />, label: t('nav.messages') || 'Сообщения' },
        { to: '/saved', icon: <Bookmark size={20} />, label: t('nav.saved') },
        ...(currentDirection ? [{ to: `/${currentDirection}/wiki`, icon: <Book size={20} />, label: t('nav.wiki') }] : []),
        { to: '/achievements', icon: <Medal size={20} />, label: t('nav.achievements') },
    ];

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarBrand}>
                    <div className={styles.logo}>
                        <Layers size={24} color="#4f46e5" />
                        <h1>SkillHub</h1>
                    </div>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.active : ''}`
                            }
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}

                    <hr className={styles.divider} />

                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            `${styles.navLink} ${isActive ? styles.active : ''}`
                        }
                    >
                        <span className={styles.navIcon}><UserCircle size={20} /></span>
                        <span>{t('nav.profile')}</span>
                    </NavLink>

                    {user?.role === 'ADMIN' && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.active : ''}`
                            }
                        >
                            <span className={styles.navIcon}><Shield size={20} /></span>
                            <span>Админ панель</span>
                        </NavLink>
                    )}

                    {(user?.role === 'ADMIN' || user?.role === 'MODERATOR' || isLocalModerator) && (
                        <NavLink
                            to="/moderator"
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.active : ''}`
                            }
                        >
                            <span className={styles.navIcon}><Activity size={20} /></span>
                            <span>Модераторская</span>
                        </NavLink>
                    )}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.reputationCard}>
                        <p className={styles.repLabel}>Всего XP</p>
                        <p className={styles.repValue}>{totalXp.toLocaleString()} XP</p>
                    </div>

                    <div className={styles.systemActions}>
                        <button onClick={handleLogout} className={styles.actionBtn}>
                            <LogOut size={16} />
                            <span>{t('common.logout')}</span>
                        </button>
                    </div>
                </div>
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                    <div className={styles.searchBar}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder={t('rooms.searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearchQuery(val);
                                setSearchResults([]); // No API for search yet
                            }}
                        />
                        {searchQuery.length > 1 && searchResults.length === 0 && (
                            <div className={styles.searchResults}>
                                <div className={styles.searchResultItem}>
                                    <div className={styles.resContent}>
                                        <p style={{ color: '#6b7280' }}>{t('common.searchUnavailable') || 'Поиск временно недоступен'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.headerActions}>
                        <LanguageSelector variant="header" />
                        <Avatar 
                            src={user?.avatar} 
                            name={user?.firstname || user?.name} 
                            size="sm"
                            className={styles.userAvatar}
                            onClick={() => navigate('/profile')}
                        />
                    </div>
                </header>

                <div className={styles.content}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
