import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import type { Article, Post, Comment } from '../types';
import { 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    Database, 
    ShieldAlert, 
    MessageSquare, 
    Loader2, 
    ExternalLink, 
    Sparkles, 
    Brain, 
    ClipboardCheck, 
    Users 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AiReviewModal from '../components/AiReviewModal';
import styles from './ModeratorPanelPage.module.css';
import adminStyles from './AdminPanelPage.module.css';
import { toast } from 'react-hot-toast';
import { MOCK_REPORTS, MOCK_ARTICLES } from '../api/mockData';
import type { MockReport } from '../api/mockData';

const ModeratorPanelPage: React.FC = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState<MockReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'reports' | 'applications'>('reports');
    
    // AI Audit State
    const [auditItem, setAuditItem] = useState<{title: string, content: string, type: 'article' | 'post'} | null>(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            // Temporarily using Mock Data for demonstration
            setTimeout(() => {
                setReports(MOCK_REPORTS as any);
                setLoading(false);
            }, 800);
        } catch (error) {
            toast.error('Ошибка при загрузке данных');
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

    const handleRejectReport = (reportId: number) => {
        setReports(prev => prev.filter(r => r.id !== reportId));
        toast.success('Жалоба отклонена (Mock)');
    };

    const handleEscalateReport = (reportId: number) => {
        setReports(prev => prev.filter(r => r.id !== reportId));
        toast.success('Жалоба передана администратору (Mock)');
    };

    const handleAiAudit = (report: MockReport) => {
        toast.loading('AI изучает контент...', { id: 'audit' });
        
        let title = '';
        let content = '';
        
        const mockArticle = MOCK_ARTICLES.find(a => a.id === report.target_id);
        if (mockArticle) {
            title = mockArticle.title || '';
            content = mockArticle.content || '';
        } else {
            title = report.target_type === 'article' ? 'Безопасность Node.js' : `Пост #${report.target_id}`;
            content = 'В данной статье рассматриваются основные принципы обеспечения безопасности Node.js приложений, такие как предотвращение SQL-инъекций и XSS атак. Рекомендуется использовать проверенные библиотеки для валидации входа.';
        }

        setTimeout(() => {
            toast.dismiss('audit');
            setAuditItem({ title, content, type: report.target_type === 'article' ? 'article' : 'post' });
        }, 1200);
    };

    const regularReports = reports.filter(r => r.target_type !== 'moderator_application');
    const applications = reports.filter(r => r.target_type === 'moderator_application');

    if (loading) {
        return (
            <div className={styles.container}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Loader2 className={adminStyles.spin} size={32} />
                    <p>Подключение к ИИ-сервису...</p>
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

            <div className={adminStyles.tabs} style={{ marginBottom: '2rem' }}>
                <button 
                    className={`${adminStyles.tabBtn} ${activeTab === 'reports' ? adminStyles.activeTab : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    <AlertTriangle size={18} />
                    Активные жалобы ({regularReports.length})
                </button>
                <button 
                    className={`${adminStyles.tabBtn} ${activeTab === 'applications' ? adminStyles.activeTab : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    <ClipboardCheck size={18} />
                    Заявки в модераторы ({applications.length})
                </button>
            </div>

            <div className={styles.grid}>
                {activeTab === 'reports' ? (
                    <section className={styles.panel} style={{ gridColumn: '1 / -1' }}>
                        <h2 className={styles.panelTitle}>
                            <AlertTriangle size={20} color="#f59e0b" />
                            Жалобы на контент
                        </h2>
                        
                        <div className={adminStyles.reportsContainer} style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                            {regularReports.length === 0 ? (
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
                                                <th>Автор</th>
                                                <th className={adminStyles.actionsCell}>Инструменты AI</th>
                                                <th className={adminStyles.actionsCell}>Действия</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {regularReports.map(report => (
                                                <tr key={report.id} className={adminStyles.reportRow}>
                                                    <td>
                                                        <span className={adminStyles.targetBadge}>
                                                            {report.target_type === 'post' ? <MessageSquare size={12} /> : null}
                                                            {report.target_type}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <Link 
                                                            to="#" 
                                                            className={adminStyles.contentLink}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6' }}
                                                        >
                                                            <ExternalLink size={12} />
                                                            Открыть
                                                        </Link>
                                                    </td>
                                                    <td className={adminStyles.reasonCol}>{report.reason}</td>
                                                    <td>User #{report.target_author_id}</td>
                                                    <td className={adminStyles.actionsCell}>
                                                        <button 
                                                            className={styles.aiAuditBtn}
                                                            onClick={() => handleAiAudit(report)}
                                                            title="Запустить AI проверку на токсичность и тех. грамотность"
                                                        >
                                                            <Brain size={14} />
                                                            AI Аудит
                                                        </button>
                                                    </td>
                                                    <td className={adminStyles.actionsCell}>
                                                        <button 
                                                            className={adminStyles.rejectBtn}
                                                            onClick={() => handleRejectReport(report.id)}
                                                        >
                                                            <XCircle size={14} /> Ложная
                                                        </button>
                                                        <button 
                                                            className={adminStyles.resolveBtn}
                                                            onClick={() => handleEscalateReport(report.id)}
                                                            style={{ background: '#f59e0b', color: 'white' }}
                                                        >
                                                            <ShieldAlert size={14} /> Админу
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
                ) : (
                    <section className={styles.panel} style={{ gridColumn: '1 / -1' }}>
                        <h2 className={styles.panelTitle}>
                            <ClipboardCheck size={20} color="#8b5cf6" />
                            Кандидаты в модераторы
                        </h2>
                        
                        <div className={adminStyles.reportsContainer} style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                            {applications.length === 0 ? (
                                <div className={adminStyles.emptyState}>
                                    <Users size={48} />
                                    <p>Пока никто не подал заявку в ваши комнаты.</p>
                                </div>
                            ) : (
                                <table className={adminStyles.usersTable}>
                                    <thead>
                                        <tr>
                                            <th>Кандидат</th>
                                            <th>Комната</th>
                                            <th>Вердикт ИИ</th>
                                            <th>Балл ИИ</th>
                                            <th>Статус</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applications.map(app => {
                                            const details = JSON.parse(app.reason);
                                            return (
                                                <tr key={app.id}>
                                                    <td>User #{app.target_id}</td>
                                                    <td>{details.roomName}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6366f1', fontSize: '0.8125rem' }}>
                                                            <Sparkles size={14} />
                                                            {details.evaluation.reason}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={adminStyles.scoreBadge}>
                                                            {details.testSummary.score}%
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>На рассмотрении у админа</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                )}

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

            {auditItem && (
                <AiReviewModal
                    isOpen={!!auditItem}
                    onClose={() => setAuditItem(null)}
                    title={auditItem.title}
                    content={auditItem.content}
                    type={auditItem.type}
                />
            )}
        </div>
    );
};

export default ModeratorPanelPage;
