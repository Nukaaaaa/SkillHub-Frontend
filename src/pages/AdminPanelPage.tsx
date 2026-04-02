import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, Users, Activity, Settings, UserPlus, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './AdminPanelPage.module.css';

const AdminPanelPage: React.FC = () => {
    const { user } = useAuth();
    
    // Some mock data representing global users until we have a real fetch users endpoint
    const [mockUsers] = useState([
        { id: 1, name: 'Alice Smith', email: 'alice@example.com', role: 'ADMIN', lastActive: '2 min ago' },
        { id: 2, name: 'Бекболат Ахметов', email: 'bek@example.com', role: 'MODERATOR', lastActive: '1 hr ago' },
        { id: 3, name: 'Nukaaaaa', email: 'student@example.com', role: 'USER', lastActive: '12 hrs ago' },
    ]);

    if (!user || user.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Панель Администратора</h1>
                <p className={styles.subtitle}>Добро пожаловать, {user.firstname}! Здесь вы управляете доступом всей платформы.</p>
            </header>

            <div className={styles.dashboardGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                        <Users size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>1,248</p>
                        <p className={styles.statLabel}>Всего пользователей</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                        <Shield size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>14</p>
                        <p className={styles.statLabel}>Модераторов на портале</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconGreen}`}>
                        <Activity size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>892</p>
                        <p className={styles.statLabel}>Активны за 24ч</p>
                    </div>
                </div>
            </div>

            <section className={styles.managementSection}>
                <h2 className={styles.sectionTitle}>
                    <Settings size={20} />
                    Управление ролями
                </h2>
                
                <table className={styles.usersTable}>
                    <thead>
                        <tr>
                            <th>Пользователь</th>
                            <th>Роль</th>
                            <th>Последняя активность</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockUsers.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div className={styles.userCell}>
                                        <img src={`https://ui-avatars.com/api/?name=${u.name}&background=random`} alt="" className={styles.avatar} />
                                        <div>
                                            <p className={styles.userName}>{u.name}</p>
                                            <p className={styles.userEmail}>{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`${styles.roleBadge} ${
                                        u.role === 'ADMIN' ? styles.roleAdmin :
                                        u.role === 'MODERATOR' ? styles.roleModerator :
                                        styles.roleUser
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td>
                                    <span style={{ color: 'var(--text-secondary)' }}>{u.lastActive}</span>
                                </td>
                                <td>
                                    <div className={styles.actionsCell}>
                                        {u.role !== 'ADMIN' && (
                                            <button className={styles.actionBtn} title="Повысить до модератора">
                                                <UserPlus size={16} />
                                            </button>
                                        )}
                                        <button className={styles.actionBtn}>
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default AdminPanelPage;
