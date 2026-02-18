import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './Layout.module.css';
import { LayoutDashboard, LogOut, User, Users, Settings, Languages, Zap } from 'lucide-react';

const Layout: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleLanguage = () => {
        const nextLng = i18n.language === 'ru' ? 'en' : i18n.language === 'en' ? 'kk' : 'ru';
        i18n.changeLanguage(nextLng);
    };

    const navItems = [
        { to: '/', icon: <LayoutDashboard size={20} />, label: t('nav.directions') },
        { to: '/profile', icon: <User size={20} />, label: t('nav.profile') },
        { to: '/community', icon: <Users size={20} />, label: t('nav.community') },
        { to: '/settings', icon: <Settings size={20} />, label: t('nav.settings') },
    ];

    return (
        <div className={styles.layout}>
            <aside className={styles.sidebar}>
                <div className={styles.logo}>
                    <Zap size={24} className={styles.logoIcon} fill="var(--primary-color)" />
                    <h1>Skill<span>Hub</span></h1>
                </div>

                <nav className={styles.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `${styles.navLink} ${isActive ? styles.active : ''}`
                            }
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <button onClick={toggleLanguage} className={styles.footerBtn}>
                        <Languages size={18} />
                        <span>{i18n.language.toUpperCase()}</span>
                    </button>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={18} />
                        <span>{t('common.logout')}</span>
                    </button>
                </div>
            </aside>
            <main className={styles.main}>
                <header className={styles.header}>
                    <h2 className={styles.title}>{t('nav.overview')}</h2>
                    <div className={styles.userProfile}>
                        <span>{t('common.welcome')}, {t(user?.name || 'common.defaultUser')}</span>
                        <div className={styles.avatar}></div>
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
