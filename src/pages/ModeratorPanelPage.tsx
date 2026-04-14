import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, Database, ShieldAlert, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { interactionService } from '../api/interactionService';
import { contentService } from '../api/contentService';
import { adminService } from '../api/adminService';
import styles from './ModeratorPanelPage.module.css';
import adminStyles from './AdminPanelPage.module.css';
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

const ModeratorPanelPage: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

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
        if (user && (user.role === 'MODERATOR' || user.role === 'ADMIN')) {
            fetchReports();
        }
    }, [user]);

    if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) {
        return <Navigate to="/dashboard" replace />;
    }

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
            // Delete content
            if (report.target_type === 'post') await contentService.deletePost(report.target_id);
            if (report.target_type === 'article') await contentService.deleteArticle(report.target_id);

            // Block user & resolve report
            await adminService.blockUser(report.target_author_id, 60);
            await interactionService.updateReportStatus(report.id, 'RESOLVED');
            
            setReports(prev => prev.filter(r => r.id !== report.id));
            toast.success('Контент удален, пользователь заблокирован');
        } catch (error) {
            toast.error('Ошибка при обработке жалобы');
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className={adminStyles.spin} size={32} />
                    <p>Загрузка данных...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Модераторская панель</h1>
                <p className={styles.subtitle}>Проверка контента, жалобы пользователей и актуализация Базы Знаний.</p>
            </header>

            <div className={styles.grid}>
                <section className={styles.panel} style={{ gridColumn: '1 / -1' }}>
                    <h2 className={styles.panelTitle}>
                        <AlertTriangle size={20} color="#f59e0b" />
                        Жалобы на контент
                    </h2>
                    
                    <div className={adminStyles.reportsContainer} style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                        {reports.length === 0 ? (
                            <div className={adminStyles.emptyState}>
                                <CheckCircle size={48} />
                                <p>Активных жалоб нет. Все чисто!</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className={adminStyles.usersTable}>
                                    <thead>
                                        <tr>
                                            <th>Тип</th>
                                            <th>Причина</th>
                                            <th>Автор контента (ID)</th>
                                            <th>Дата</th>
                                            <th className={adminStyles.actionsCell}>Модерация</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reports.map(report => (
                                            <tr key={report.id} className={adminStyles.reportRow}>
                                                <td>
                                                    <span className={adminStyles.targetBadge}>
                                                        {report.target_type === 'post' ? <MessageSquare size={12} /> : null}
                                                        {report.target_type}
                                                    </span>
                                                </td>
                                                <td className={adminStyles.reasonCol}>
                                                    {report.reason}
                                                </td>
                                                <td>
                                                    <div className={adminStyles.userCell}>
                                                        <AlertCircle size={16} color="#ef4444" />
                                                        <span>User #{report.target_author_id}</span>
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                                                    {new Date(report.created_at).toLocaleString()}
                                                </td>
                                                <td className={adminStyles.actionsCell}>
                                                    <button 
                                                        className={adminStyles.rejectBtn}
                                                        onClick={() => handleRejectReport(report.id)}
                                                    >
                                                        <XCircle size={14} style={{ marginRight: '4px' }} />
                                                        Отклонить
                                                    </button>
                                                    <button 
                                                        className={adminStyles.resolveBtn}
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
                            </div>
                        )}
                    </div>
                </section>

                <section className={styles.panel} style={{ gridColumn: '1 / -1' }}>
                    <h2 className={styles.panelTitle}>
                        <Database size={20} color="#3b82f6" />
                        Управление Wiki
                    </h2>
                    
                    <div className={styles.list}>
                        <div className={styles.wikiManageItem}>
                            <div>
                                <p className={styles.wikiRoomName}>Backend Комната</p>
                                <p className={styles.wikiStats}>12 записей, 4 раздела</p>
                            </div>
                            <button className={`${styles.btn} ${styles.btnReject}`}>Открыть</button>
                        </div>
                        <div className={styles.wikiManageItem}>
                            <div>
                                <p className={styles.wikiRoomName}>DevOps Практика</p>
                                <p className={styles.wikiStats}>3 записи, 1 раздел</p>
                            </div>
                            <button className={`${styles.btn} ${styles.btnReject}`}>Открыть</button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ModeratorPanelPage;
