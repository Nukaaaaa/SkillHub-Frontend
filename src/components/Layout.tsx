import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
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
    Languages,
    LogOut,
    Search
} from 'lucide-react';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleLanguage = () => {
        const nextLng = i18n.language === 'ru' ? 'en' : 'ru';
        i18n.changeLanguage(nextLng);
    };

    const navItems = [
        { to: user?.selectedDirectionId ? `/${user.selectedDirectionId}/rooms` : '/', icon: <DoorOpen size={20} />, label: t('nav.rooms') },
        { to: '/saved', icon: <Bookmark size={20} />, label: t('nav.saved') },
        { to: '/wiki', icon: <Book size={20} />, label: t('nav.wiki') },
        { to: '/achievements', icon: <Medal size={20} />, label: t('nav.achievements') },
    ];

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarBrand}>
                    <div className={styles.logo}>
                        <Layers size={24} color="#4f46e5" />
                        <h1>DevHub</h1>
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
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.reputationCard}>
                        <p className={styles.repLabel}>Репутация</p>
                        <p className={styles.repValue}>1,250 pts</p>
                    </div>

                    <div className={styles.systemActions}>
                        <button onClick={toggleLanguage} className={styles.actionBtn}>
                            <Languages size={16} />
                            <span>{i18n.language.toUpperCase()}</span>
                        </button>
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
                            placeholder="Поиск по комнатам..."
                        />
                    </div>
                    <div className={styles.headerActions}>
                        <button className={styles.createRoomBtn}>
                            + Создать комнату
                        </button>
                        <div className={styles.userAvatar}>
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                                alt="avatar"
                            />
                        </div>
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
