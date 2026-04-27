import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
    Users, 
    Shield, 
    ShieldAlert, 
    Unlock, 
    Search,
    Loader2,
    CheckCircle,
    XCircle,
    ClipboardCheck,
    Sparkles,
    MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../api/adminService';
import { interactionService } from '../api/interactionService';
import { contentService } from '../api/contentService';
import { roomService } from '../api/roomService';
import type { User } from '../types';
import styles from './AdminPanelPage.module.css';
import { toast } from 'react-hot-toast';
import Avatar from '../components/Avatar';

interface Report {
    id: number;
    reporter_id: number;
    target_id: number;
    target_author_id: number;
    target_type: 'post' | 'article' | 'comment' | 'moderator_application';
    reason: string;
    status: 'OPEN' | 'REJECTED' | 'RESOLVED' | 'ESCALATED';
    created_at: string;
}

const AdminPanelPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'applications'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoomsForUsers, setSelectedRoomsForUsers] = useState<Record<number, string>>({});

    const fetchRooms = async () => {
        try {
            const data = await roomService.getAllRooms();
            setRooms(data);
        } catch (e) {
            console.error("Failed to fetch rooms");
        }
    };

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
            const data = await interactionService.getReports('OPEN');
            setReports(data.filter((r: any) => r.target_type !== 'moderator_application'));
            setApplications(data.filter((r: any) => r.target_type === 'moderator_application'));
        } catch (error) {
            toast.error('Ошибка при загрузке данных модерации');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            fetchRooms();
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

    const handleAssignModerator = async (userId: number) => {
        const roomSlug = selectedRoomsForUsers[userId];
        if (!roomSlug) {
            toast.error('Выберите комнату для назначения');
            return;
        }

        try {
            // 1. Join room with MODERATOR role (or update if already joined)
            await roomService.joinRoom(roomSlug, userId, 'MODERATOR');
            // 2. We can also optionally update global role if needed
            await adminService.updateUserRole(userId, 'MODERATOR');
            
            toast.success('Пользователь назначен модератором комнаты');
            fetchUsers();
        } catch (e) {
            // If already in room, try updating role
            try {
                await roomService.updateMemberRole(roomSlug, userId, 'MODERATOR');
                await adminService.updateUserRole(userId, 'MODERATOR');
                toast.success('Пользователь назначен модератором комнаты');
                fetchUsers();
            } catch (err) {
                toast.error('Ошибка при назначении модератора');
            }
        }
    };

    const handleApproveApplication = async (app: any) => {
        try {
            const details = JSON.parse(app.reason);
            // 1. Assign to room
            await roomService.joinRoom(details.roomSlug, app.target_id, 'MODERATOR').catch(() => 
                roomService.updateMemberRole(details.roomSlug, app.target_id, 'MODERATOR')
            );
            // 2. Set global role
            await adminService.updateUserRole(app.target_id, 'MODERATOR');
            // 3. Resolve report
            await interactionService.updateReportStatus(app.id, 'RESOLVED');
            
            toast.success(`Заявка одобрена! Модератор назначен в ${details.roomName}`);
            fetchReports();
        } catch (e) {
            toast.error('Ошибка при одобрении заявки');
        }
    };

    const handleRejectApplication = async (app: any) => {
        try {
            await interactionService.updateReportStatus(app.id, 'REJECTED');
            toast.success('Заявка отклонена');
            fetchReports();
        } catch (e) {
            toast.error('Ошибка при отклонении');
        }
    };

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
            if (report.target_type === 'comment') await contentService.deleteComment(report.target_id);

            await adminService.blockUser(report.target_author_id, 60);
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
                    <div className={`${styles.statIcon} ${styles.iconPurple}`}>
                        <ClipboardCheck size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{applications.length}</p>
                        <p className={styles.statLabel}>Новые заявки</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.iconRed}`}>
                        <ShieldAlert size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <p className={styles.statValue}>{reports.length}</p>
                        <p className={styles.statLabel}>Жалобы</p>
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
                    className={`${styles.tabBtn} ${activeTab === 'applications' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    <ClipboardCheck size={18} />
                    Заявки в модераторы
                    {applications.length > 0 && <span className={styles.indicator}>{applications.length}</span>}
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
                {activeTab === 'users' && (
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
                                    <th>Назначить в комнату</th>
                                    <th className={styles.actionsCell}>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className={styles.userCell}>
                                                <Avatar 
                                                    src={user.avatar_url || user.avatar} 
                                                    name={user.firstname || user.name} 
                                                    size="sm"
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
                                            <div className={styles.roomAssignBox}>
                                                <select 
                                                    className={styles.roomSelect}
                                                    value={selectedRoomsForUsers[user.id] || ''}
                                                    onChange={(e) => setSelectedRoomsForUsers(prev => ({...prev, [user.id]: e.target.value}))}
                                                >
                                                    <option value="">Выберите комнату...</option>
                                                    {rooms.map(r => <option key={r.id} value={r.slug}>{r.name}</option>)}
                                                </select>
                                                <button 
                                                    className={styles.assignBtn}
                                                    onClick={() => handleAssignModerator(user.id)}
                                                    disabled={!selectedRoomsForUsers[user.id]}
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className={styles.actionsCell}>
                                            {isBlocked(user) ? (
                                                <button 
                                                    className={styles.unblockBtn}
                                                    onClick={() => handleUnblock(user.id)}
                                                >
                                                    <Unlock size={14} /> Разблокировать
                                                </button>
                                            ) : (
                                                <div className={styles.blockRow}>
                                                    <button onClick={() => handleBlock(user.id, 15)}>15м</button>
                                                    <button onClick={() => handleBlock(user.id, 60)}>1ч</button>
                                                    <button onClick={() => handleBlock(user.id, 1440)}>24ч</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {activeTab === 'applications' && (
                    <div className={styles.reportsContainer}>
                        {applications.length === 0 ? (
                            <div className={styles.emptyState}>
                                <CheckCircle size={48} />
                                <p>Заявок от модераторов пока нет.</p>
                            </div>
                        ) : (
                            <table className={styles.usersTable}>
                                <thead>
                                    <tr>
                                        <th>Кандидат</th>
                                        <th>Комната</th>
                                        <th>ИИ Вердикт</th>
                                        <th>Балл ИИ</th>
                                        <th className={styles.actionsCell}>Решение</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => {
                                        const details = JSON.parse(app.reason);
                                        return (
                                            <tr key={app.id}>
                                                <td>User #{app.target_id}</td>
                                                <td><strong>{details.roomName}</strong></td>
                                                <td>
                                                    <div className={styles.aiVerdict}>
                                                        <Sparkles size={14} color="#8b5cf6" />
                                                        <span>{details.evaluation.reason}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={styles.scoreBadge} style={{ transform: `scale(${0.8 + (details.testSummary.score / 200)})` }}>
                                                        {details.testSummary.score}%
                                                    </span>
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <button className={styles.resolveBtn} onClick={() => handleApproveApplication(app)}>
                                                        <CheckCircle size={14} /> Принять
                                                    </button>
                                                    <button className={styles.rejectBtn} onClick={() => handleRejectApplication(app)}>
                                                        <XCircle size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'reports' && (
                    <div className={styles.reportsContainer}>
                        {reports.length === 0 ? (
                            <div className={styles.emptyState}>
                                <CheckCircle size={48} />
                                <p>Жалоб нет. Сообщество ведет себя хорошо!</p>
                            </div>
                        ) : (
                            <table className={styles.usersTable}>
                                <thead>
                                    <tr>
                                        <th>Тип</th>
                                        <th>Текст/Контент</th>
                                        <th>Причина</th>
                                        <th>Дата</th>
                                        <th className={styles.actionsCell}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.map(report => (
                                        <tr key={report.id}>
                                            <td><span className={styles.targetBadge}>{report.target_type}</span></td>
                                            <td>#{report.target_id}</td>
                                            <td>{report.reason}</td>
                                            <td>{new Date(report.created_at).toLocaleDateString()}</td>
                                            <td className={styles.actionsCell}>
                                                <button className={styles.rejectBtn} onClick={() => handleRejectReport(report.id)}>Игнор</button>
                                                <button className={styles.resolveBtn} onClick={() => handleResolveAndBlock(report)}>Блок</button>
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
