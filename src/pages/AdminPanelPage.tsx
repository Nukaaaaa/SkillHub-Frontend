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
    Loader2,
    MessageSquare,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../api/adminService';
import { interactionService } from '../api/interactionService';
import { contentService } from '../api/contentService';
import type { User } from '../types';
import styles from './AdminPanelPage.module.css';
import { toast } from 'react-hot-toast';

interface Report {
    id: number;
    reporter_id: number;
    target_id: number;
    target_author_id: number;
    target_type: string;
    reason: string;
    status: 'OPEN' | 'REJECTED' | 'RESOLVED';
    created_at: string;
}

const AdminPanelPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'reports'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
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

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await interactionService.getReports();
            setReports(data);
        } catch (error) {
            toast.error('Ошибка при загрузке жалоб');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            if (activeTab === 'users') {
                fetchUsers();
            } else {
                fetchReports();
            }
        }
    }, [currentUser, activeTab]);

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

    const handleRejectReport = async (reportId: number) => {
        try {
            await interactionService.updateReportStatus(reportId, 'REJECTED');
            setReports(prev => prev.filter(r => r.id !== reportId));
            toast.success('Жалоба отклонена');
        } catch (error) {
            toast.error('Ошибка при отклонении жалобы');
        }
    };

    const handleResolveAndBlock = async (report: Report) => {
        try {
            if (report.target_type === 'post') await contentService.deletePost(report.target_id);
            if (report.target_type === 'article') await contentService.deleteArticle(report.target_id);

            // 1. Block the author (default 60 mins for moderation)
            await adminService.blockUser(report.target_author_id, 60);
            // 2. Resolve the report
            await interactionService.updateReportStatus(report.id, 'RESOLVED');
            
            setReports(prev => prev.filter(r => r.id !== report.id));
            toast.success('Контент удален, пользователь заблокирован');
        } catch (error) {
            toast.error('Ошибка при обработке жалобы');
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
                <p>Загрузка данных...</p>
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
                    <p className={styles.subtitle}>Управление пользователями, жалобами и безопасностью системы</p>
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
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                        <AlertCircle size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{reports.length}</p>
                        <p className={styles.statLabel}>Активных жалоб</p>
                    </div>
                </div>
            </div>

            <div className={styles.tabs}>
                <button 
                    className={`${styles.tabBtn} ${activeTab === 'users' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={18} />
                    Пользователи
                </button>
                <button 
                    className={`${styles.tabBtn} ${activeTab === 'reports' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <ShieldAlert size={18} />
                    Жалобы
                </button>
            </div>

            <section className={styles.managementSection}>
                {activeTab === 'users' ? (
                    <>
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
                    </>
                ) : (
                    <div className={styles.reportsContainer}>
                        {reports.length === 0 ? (
                            <div className={styles.emptyState}>
                                <CheckCircle size={48} />
                                <p>Активных жалоб нет. Все чисто!</p>
                            </div>
                        ) : (
                            <table className={styles.usersTable}>
                                <thead>
                                    <tr>
                                        <th>Тип</th>
                                        <th>Причина</th>
                                        <th>Автор контента (ID)</th>
                                        <th>Дата</th>
                                        <th className={styles.actionsCell}>Модерация</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(report => (
                                        <tr key={report.id} className={styles.reportRow}>
                                            <td>
                                                <span className={styles.targetBadge}>
                                                    {report.target_type === 'post' ? <MessageSquare size={12} /> : null}
                                                    {report.target_type}
                                                </span>
                                            </td>
                                            <td className={styles.reasonCol}>
                                                {report.reason}
                                            </td>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <AlertCircle size={16} color="#ef4444" />
                                                    <span>User #{report.target_author_id}</span>
                                                </div>
                                            </td>
                                            <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                                                {new Date(report.created_at).toLocaleString()}
                                            </td>
                                            <td className={styles.actionsCell}>
                                                <button 
                                                    className={styles.rejectBtn}
                                                    onClick={() => handleRejectReport(report.id)}
                                                >
                                                    <XCircle size={14} style={{ marginRight: '4px' }} />
                                                    Отклонить
                                                </button>
                                                <button 
                                                    className={styles.resolveBtn}
                                                    onClick={() => handleResolveAndBlock(report)}
                                                >
                                                    <ShieldAlert size={14} style={{ marginRight: '4px' }} />
                                                    Удалить & Блок
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default AdminPanelPage;
