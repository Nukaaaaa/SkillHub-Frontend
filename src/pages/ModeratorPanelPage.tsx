import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, Database, ShieldAlert, MessageSquare, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { interactionService } from '../api/interactionService';
import styles from './ModeratorPanelPage.module.css';
import adminStyles from './AdminPanelPage.module.css';
import { toast } from 'react-hot-toast';

interface Report {
    id: number;
    reporter_id: number;
    target_id: number;
    target_author_id: number;
    target_type: 'post' | 'article' | 'comment';
    reason: string;
    status: 'OPEN' | 'REJECTED' | 'RESOLVED' | 'ESCALATED';
    created_at: string;
}

const ModeratorPanelPage: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await interactionService.getReports('OPEN');
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

    const handleEscalateReport = async (reportId: number) => {
        try {
            await interactionService.updateReportStatus(reportId, 'ESCALATED');
            setReports(prev => prev.filter(r => r.id !== reportId));
            toast.success('Жалоба передана администратору');
        } catch (error) {
            toast.error('Ошибка при передаче жалобы');
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
                                            <th>Контент</th>
                                            <th>Причина</th>
                                            <th>Автор (ID)</th>
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
                                                <td>
                                                    {report.target_type === 'comment' ? (
                                                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem' }}>
                                                            Коммент #{report.target_id}
                                                        </span>
                                                    ) : (
                                                        <Link 
                                                            to={report.target_type === 'article' ? `/articles/${report.target_id}` : `/posts/${report.target_id}`} 
                                                            target="_blank"
                                                            className={adminStyles.contentLink}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', textDecoration: 'underline' }}
                                                        >
                                                            <ExternalLink size={12} />
                                                            Открыть {report.target_type}
                                                        </Link>
                                                    )}
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
                                                        Ложная
                                                    </button>
                                                    <button 
                                                        className={adminStyles.resolveBtn}
                                                        onClick={() => handleEscalateReport(report.id)}
                                                        style={{ background: '#f59e0b', color: 'white' }}
                                                    >
                                                        <ShieldAlert size={14} style={{ marginRight: '4px' }} />
                                                        Админу
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
