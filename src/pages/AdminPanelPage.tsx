import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
    Users, 
    Shield, 
    Unlock, 
    Search,
    Loader2,
    CheckCircle,
    XCircle,
    ClipboardCheck,
    Sparkles,
    ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../api/adminService';
import { interactionService } from '../api/interactionService';
import { roomService } from '../api/roomService';
import { contentService } from '../api/contentService';
import type { User, Room } from '../types';
import styles from './AdminPanelPage.module.css';
import { toast } from 'react-hot-toast';
import Avatar from '../components/Avatar';

const AdminPanelPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'users' | 'applications' | 'complaints'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [complaints, setComplaints] = useState<any[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, reportsData, roomsData] = await Promise.all([
                adminService.getAllUsers(),
                interactionService.getReports(''),
                roomService.getAllRooms()
            ]);
            setUsers(usersData);
            setApplications(reportsData.filter((r: any) => r.target_type === 'moderator_application' && r.status === 'OPEN'));
            setComplaints(reportsData.filter((r: any) => r.target_type !== 'moderator_application' && r.status === 'ESCALATED'));
            setRooms(roomsData);
        } catch (error) {
            toast.error('Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser?.role === 'ADMIN') {
            fetchData();
        }
    }, [currentUser]);

    if (!currentUser || currentUser.role !== 'ADMIN') {
        return <Navigate to="/dashboard" replace />;
    }

    const handleApproveApplication = async (app: any) => {
        try {
            const details = JSON.parse(app.reason);
            // 1. Assign to room
            await roomService.joinRoom(details.roomSlug, app.target_id, 'MODERATOR').catch(() => 
                roomService.updateMemberRole(details.roomSlug, app.target_id, 'MODERATOR')
            );
            // 2. Resolve report
            await interactionService.updateReportStatus(app.id, 'RESOLVED');
            
            toast.success(`Заявка одобрена! Модератор назначен в ${details.roomName}`);
            fetchData();
        } catch (e) {
            toast.error('Ошибка при одобрении заявки');
        }
    };

    const handleRejectApplication = async (app: any) => {
        try {
            await interactionService.updateReportStatus(app.id, 'REJECTED');
            toast.success('Заявка отклонена');
            fetchData();
        } catch (e) {
            toast.error('Ошибка при отклонении');
        }
    };

    const handleRejectComplaint = async (reportId: number) => {
        try {
            await interactionService.updateReportStatus(reportId, 'REJECTED');
            toast.success('Жалоба отклонена');
            fetchData();
        } catch (e) {
            toast.error('Ошибка при отклонении жалобы');
        }
    };

    const handleResolveComplaint = async (complaint: any) => {
        try {
            await adminService.blockUser(complaint.target_author_id, 15);
            await interactionService.updateReportStatus(complaint.id, 'RESOLVED');
            toast.success('Пользователь заблокирован на 15 мин, жалоба принята');
            fetchData();
        } catch (e) {
            toast.error('Ошибка при обработке жалобы');
        }
    };

    const handleInspectComplaint = async (complaint: any) => {
        try {
            if (complaint.target_type === 'article') {
                window.open(`/articles/${complaint.target_id}`, '_blank');
            } else if (complaint.target_type === 'post') {
                window.open(`/posts/${complaint.target_id}`, '_blank');
            } else if (complaint.target_type === 'comment') {
                const comment = await contentService.getComment(complaint.target_id);
                if (comment.postId) {
                    window.open(`/posts/${comment.postId}`, '_blank');
                } else if (comment.articleId) {
                    window.open(`/articles/${comment.articleId}`, '_blank');
                } else {
                    toast.error('Не удалось определить местоположение комментария');
                }
            } else {
                toast.error('Контент недоступен для данного типа');
            }
        } catch (e) {
            toast.error('Ошибка при открытии или контент был удален');
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

    const handleAssignRoom = async (userId: number, roomSlug: string) => {
        try {
            await roomService.joinRoom(roomSlug, userId, 'MODERATOR').catch(() =>
                roomService.updateMemberRole(roomSlug, userId, 'MODERATOR')
            );
            toast.success('Пользователь назначен модератором в комнату');
        } catch (error) {
            toast.error('Ошибка при назначении в комнату');
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
                        <p className={styles.statValue}>{complaints.length}</p>
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
                    className={`${styles.tabBtn} ${activeTab === 'complaints' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('complaints')}
                >
                    <ShieldAlert size={18} />
                    Жалобы
                    {complaints.length > 0 && <span className={styles.indicator}>{complaints.length}</span>}
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
                                            {user.role !== 'ADMIN' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <select
                                                        className={styles.roleSelect}
                                                        onChange={(e) => handleAssignRoom(user.id, e.target.value)}
                                                        defaultValue=""
                                                        style={{ minWidth: '160px' }}
                                                    >
                                                        <option value="" disabled>Выберите комнату...</option>
                                                        {rooms.map(r => (
                                                            <option key={r.id} value={r.slug}>{r.name}</option>
                                                        ))}
                                                    </select>
                                                    <CheckCircle size={16} color="#6b7280" />
                                                </div>
                                            )}
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
                                        const targetUser = users.find(u => u.id === app.target_id);
                                        return (
                                            <tr key={app.id}>
                                                <td>
                                                    {targetUser ? (
                                                        <div className={styles.userCell}>
                                                            <Avatar src={targetUser.avatar_url || targetUser.avatar} name={targetUser.firstname || targetUser.name} size="sm" className={styles.avatar} />
                                                            <div>
                                                                <span className={styles.userName}>{targetUser.firstname} {targetUser.lastname}</span>
                                                                <span className={styles.userEmail}>{targetUser.email}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        `User #${app.target_id}`
                                                    )}
                                                </td>
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

                {activeTab === 'complaints' && (
                    <div className={styles.reportsContainer}>
                        {complaints.length === 0 ? (
                            <div className={styles.emptyState}>
                                <CheckCircle size={48} />
                                <p>Нет активных жалоб.</p>
                            </div>
                        ) : (
                            <table className={styles.usersTable}>
                                <thead>
                                    <tr>
                                        <th>Тип</th>
                                        <th>Причина</th>
                                        <th>Автор</th>
                                        <th className={styles.actionsCell}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {complaints.map(complaint => {
                                        const authorUser = users.find(u => u.id === complaint.target_author_id);
                                        return (
                                            <tr key={complaint.id}>
                                                <td>{complaint.target_type}</td>
                                                <td>
                                                    <div className={styles.reasonWithInspect}>
                                                        <span>{complaint.reason}</span>
                                                        <button 
                                                            className={styles.inspectBtn} 
                                                            onClick={() => handleInspectComplaint(complaint)}
                                                        >
                                                            <Search size={14} /> Проверить
                                                        </button>
                                                    </div>
                                                </td>
                                                <td>
                                                    {authorUser ? (
                                                        <div className={styles.userCell}>
                                                            <Avatar src={authorUser.avatar_url || authorUser.avatar} name={authorUser.firstname || authorUser.name} size="sm" className={styles.avatar} />
                                                            <div>
                                                                <span className={styles.userName}>{authorUser.firstname} {authorUser.lastname}</span>
                                                                <span className={styles.userEmail}>{authorUser.email}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        `User #${complaint.target_author_id}`
                                                    )}
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <button 
                                                        className={styles.rejectBtn}
                                                        onClick={() => handleRejectComplaint(complaint.id)}
                                                    >
                                                        <XCircle size={14} /> Отказать
                                                    </button>
                                                    <button 
                                                        className={styles.resolveBtn}
                                                        onClick={() => handleResolveComplaint(complaint)}
                                                    >
                                                        <ShieldAlert size={14} /> Принять
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


            </section>
        </div>
    );
};


export default AdminPanelPage;
