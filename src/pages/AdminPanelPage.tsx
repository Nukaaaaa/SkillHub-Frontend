import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
    Users, 
    Shield, 
    ShieldAlert, 
    ShieldCheck, 
    Clock, 
    Unlock, 
    Search,
    Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../api/adminService';
import type { User } from '../types';
import styles from './AdminPanelPage.module.css';
import { toast } from 'react-hot-toast';

const AdminPanelPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers();
            setUsers(data);
        } catch (error) {
            toast.error('Ошибка при загрузке пользователей');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            fetchUsers();
        }
    }, [currentUser]);

    if (!currentUser || currentUser.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            await adminService.updateUserRole(userId, newRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success(`Роль пользователя изменена на ${newRole}`);
        } catch (error) {
            toast.error('Не удалось изменить роль');
        }
    };

    const handleBlock = async (userId: number, minutes: number) => {
        try {
            await adminService.blockUser(userId, minutes);
            const blockedUntil = new Date(Date.now() + minutes * 60000).toISOString();
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked_until: blockedUntil } : u));
            toast.success(`Пользователь заблокирован на ${minutes} мин.`);
        } catch (error) {
            toast.error('Ошибка при блокировке');
        }
    };

    const handleUnblock = async (userId: number) => {
        try {
            await adminService.unblockUser(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, blocked_until: undefined } : u));
            toast.success('Пользователь разблокирован');
        } catch (error) {
            toast.error('Ошибка при разблокировке');
        }
    };

    const isBlocked = (user: User) => {
        if (!user.blocked_until) return false;
        return new Date(user.blocked_until) > new Date();
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${u.firstname} ${u.lastname}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader2 className={styles.spin} size={48} />
                <p>Загрузка панели управления...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerIcon}>
                    <Shield size={32} />
                </div>
                <div>
                    <h1 className={styles.title}>Панель администратора</h1>
                    <p className={styles.subtitle}>Управление пользователями, ролями и безопасностью системы</p>
                </div>
            </header>

            <div className={styles.dashboardGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconBlue}`}>
                        <Users size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{users.length}</p>
                        <p className={styles.statLabel}>Всего пользователей</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconRed}`}>
                        <ShieldAlert size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{users.filter(u => isBlocked(u)).length}</p>
                        <p className={styles.statLabel}>Заблокировано</p>
                    </div>
                </div>
            </div>

            <section className={styles.managementSection}>
                <div className={styles.tableToolbar}>
                    <div className={styles.searchWrapper}>
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Поиск по email или имени..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className={styles.usersTable}>
                    <thead>
                        <tr>
                            <th>Пользователь</th>
                            <th>Роль</th>
                            <th>Статус</th>
                            <th className={styles.actionsCell}>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div className={styles.userCell}>
                                        <img 
                                            src={user.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.firstname}`} 
                                            alt={user.firstname} 
                                            className={styles.avatar}
                                        />
                                        <div>
                                            <span className={styles.userName}>{user.firstname} {user.lastname}</span>
                                            <span className={styles.userEmail}>{user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <select 
                                        className={styles.roleSelect}
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    >
                                        <option value="USER">USER</option>
                                        <option value="MODERATOR">MODERATOR</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </td>
                                <td>
                                    {isBlocked(user) ? (
                                        <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>
                                            <ShieldAlert size={12} /> Заблокирован
                                        </span>
                                    ) : (
                                        <span className={`${styles.roleBadge} ${styles.roleModerator}`}>
                                            <ShieldCheck size={12} /> Активен
                                        </span>
                                    )}
                                </td>
                                <td className={styles.actionsCell}>
                                    {isBlocked(user) ? (
                                        <button 
                                            className={styles.actionBtn}
                                            onClick={() => handleUnblock(user.id)}
                                            title="Разблокировать"
                                        >
                                            <Unlock size={18} />
                                        </button>
                                    ) : (
                                        <div className={styles.blockActions}>
                                            <div className={styles.blockPresets}>
                                                <button onClick={() => handleBlock(user.id, 1)}>1м</button>
                                                <button onClick={() => handleBlock(user.id, 15)}>15м</button>
                                                <button onClick={() => handleBlock(user.id, 30)}>30м</button>
                                                <button onClick={() => handleBlock(user.id, 60)}>60м</button>
                                            </div>
                                            <Clock size={16} />
                                        </div>
                                    )}
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
