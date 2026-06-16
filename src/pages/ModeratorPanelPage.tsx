import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
    AlertTriangle, 
    CheckCircle, 
    XCircle, 
    MessageSquare, 
    Loader2, 
    ExternalLink, 
    Brain, 
    ClipboardCheck, 
    Scale
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AiReviewModal from '../components/AiReviewModal';
import styles from './ModeratorPanelPage.module.css';
import adminStyles from './AdminPanelPage.module.css';
import { toast } from 'react-hot-toast';
import { contentService } from '../api/contentService';
import { educationService } from '../api/educationService';
import type { DisputeDto } from '../api/educationService';
import { interactionService } from '../api/interactionService';
import type { Report } from '../api/interactionService';

const ModeratorPanelPage: React.FC = () => {
    const { user, isLocalModerator, roomRoles } = useAuth();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const showDisputesTab = user?.role === 'ADMIN' || (isLocalModerator && user?.role !== 'MODERATOR');
    const [activeTab, setActiveTab] = useState<'reports' | 'disputes'>('reports');
    
    // Dispute States
    const [disputes, setDisputes] = useState<DisputeDto[]>([]);
    const [resolvingDisputeId, setResolvingDisputeId] = useState<number | null>(null);
    const [moderatorComment, setModeratorComment] = useState('');
    const [loadingDisputes, setLoadingDisputes] = useState(false);
    
    // AI Audit State
    const [auditItem, setAuditItem] = useState<{title: string, content: string, type: 'article' | 'post'} | null>(null);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const data = await interactionService.getReports('OPEN');
            setReports(data);
        } catch (error) {
            toast.error('Ошибка при загрузке данных');
        } finally {
            setLoading(false);
        }
    };

    const fetchDisputes = async () => {
        try {
            setLoadingDisputes(true);
            const data = await educationService.getPendingDisputes();
            setDisputes(data);
        } catch (error) {
            console.error('Failed to fetch disputes', error);
            toast.error('Не удалось загрузить споры');
        } finally {
            setLoadingDisputes(false);
        }
    };

    const handleResolveDispute = async (disputeId: number, approved: boolean) => {
        setResolvingDisputeId(disputeId);
        try {
            await educationService.resolveDispute(disputeId, approved, moderatorComment);
            toast.success(approved ? 'Апелляция удовлетворена!' : 'Апелляция отклонена');
            setModeratorComment('');
            fetchDisputes();
        } catch (error) {
            console.error('Failed to resolve dispute', error);
            toast.error('Не удалось отправить вердикт');
        } finally {
            setResolvingDisputeId(null);
        }
    };

    const isGlobalMod = user && (user.role === 'MODERATOR' || user.role === 'ADMIN');

    useEffect(() => {
        if (user) {
            if (showDisputesTab) {
                fetchDisputes();
            }
            if (isGlobalMod) {
                fetchReports();
                if (!showDisputesTab) {
                    setActiveTab('reports');
                }
            } else {
                setActiveTab('disputes');
                setLoading(false);
            }
        }
    }, [user, isGlobalMod, showDisputesTab]);

    if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN' && !isLocalModerator)) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleRejectReport = async (reportId: number) => {
        try {
            await interactionService.updateReportStatus(reportId, 'REJECTED');
            setReports(prev => prev.filter(r => r.id !== reportId));
            toast.success('Жалоба отклонена');
        } catch (error) {
            toast.error('Не удалось отклонить жалобу');
        }
    };

    const handleEscalateReport = async (reportId: number) => {
        try {
            await interactionService.updateReportStatus(reportId, 'ESCALATED');
            setReports(prev => prev.filter(r => r.id !== reportId));
            toast.success('Жалоба передана администратору');
        } catch (error) {
            toast.error('Не удалось передать жалобу');
        }
    };

    const handleAiAudit = async (report: Report) => {
        toast.loading('Загрузка контента для AI аудита...', { id: 'audit' });
        
        try {
            let title = '';
            let content = '';
            
            if (report.target_type === 'article') {
                const article = await contentService.getArticle(report.target_id);
                title = article.title;
                content = article.content;
            } else if (report.target_type === 'post') {
                const post = await contentService.getPost(report.target_id);
                title = `Пост #${post.id}`;
                content = post.content;
            } else {
                toast.dismiss('audit');
                toast.error('Тип контента не поддерживается AI');
                return;
            }

            toast.dismiss('audit');
            setAuditItem({ title, content, type: report.target_type === 'article' ? 'article' : 'post' });
        } catch (error) {
            toast.dismiss('audit');
            toast.error('Не удалось загрузить контент');
        }
    };

    const handleInspectComplaint = async (complaint: Report) => {
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

    const moderatedRoomIds = Object.keys(roomRoles || {})
        .map(Number)
        .filter(id => ['MODERATOR', 'ROOM_ADMIN', 'EXPERT'].includes(roomRoles[id]));

    const regularReports = reports.filter(r => {
        if (r.target_type === 'moderator_application') return false;
        if (r.room_id) {
            return moderatedRoomIds.includes(r.room_id);
        }
        return isGlobalMod;
    });

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

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <span className={styles.statLabel}>Активные жалобы</span>
                        <h3 className={styles.statValue}>{regularReports.length}</h3>
                    </div>
                </div>
                {showDisputesTab && (
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                            <Scale size={24} />
                        </div>
                        <div>
                            <span className={styles.statLabel}>Споры в очереди</span>
                            <h3 className={styles.statValue}>{disputes.length}</h3>
                        </div>
                    </div>
                )}
            </div>

            {isGlobalMod && showDisputesTab && (
                <div className={adminStyles.tabs} style={{ marginBottom: '2rem' }}>
                    <button 
                        className={`${adminStyles.tabBtn} ${activeTab === 'reports' ? adminStyles.activeTab : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        <AlertTriangle size={18} />
                        Активные жалобы ({regularReports.length})
                    </button>
                    <button 
                        className={`${adminStyles.tabBtn} ${activeTab === 'disputes' ? adminStyles.activeTab : ''}`}
                        onClick={() => setActiveTab('disputes')}
                    >
                        <Scale size={18} />
                        Споры Peer Review ({disputes.length})
                    </button>
                </div>
            )}

            <div className={styles.grid}>
                {activeTab === 'reports' && (
                    <section className={styles.panel}>
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
                                                        <button 
                                                            onClick={() => handleInspectComplaint(report)}
                                                            className={adminStyles.contentLink}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                                        >
                                                            <ExternalLink size={12} />
                                                            Открыть
                                                        </button>
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
                                                            style={{ background: '#10b981', color: 'white' }}
                                                        >
                                                            <CheckCircle size={14} /> Передать Админу
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
                )}



                {activeTab === 'disputes' && (
                    <section className={styles.panel}>
                        <h2 className={styles.panelTitle}>
                            <Scale size={20} color="#6366f1" />
                            Споры по оцениванию Peer Review
                        </h2>
                        <div className={adminStyles.reportsContainer} style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                            {loadingDisputes ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '2rem' }}>
                                    <Loader2 className={adminStyles.spin} size={24} />
                                    <p>Загрузка споров...</p>
                                </div>
                            ) : disputes.length === 0 ? (
                                <div className={adminStyles.emptyState}>
                                    <CheckCircle size={48} />
                                    <p>Активных споров нет. Всё проверено!</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {disputes.map(dispute => (
                                        <div key={dispute.id} className={styles.disputeCard}>
                                            <div className={styles.disputeHeader}>
                                                <div>
                                                    <span className={styles.disputeTag}>Спор #{dispute.id}</span>
                                                    <h4>{dispute.assignmentTitle}</h4>
                                                    <span className={styles.studentId}>Студент #{dispute.studentId}</span>
                                                </div>
                                                <span className={styles.dateTag}>
                                                    {new Date(dispute.createdAt).toLocaleString('ru-RU')}
                                                </span>
                                            </div>
                                            
                                            <div className={styles.disputeBody}>
                                                <div className={styles.disputeSection}>
                                                    <h5>Описание задания</h5>
                                                    <p>{dispute.assignmentDescription}</p>
                                                </div>
                                                
                                                <div className={styles.disputeSection}>
                                                    <h5>Решение студента</h5>
                                                    <pre className={styles.disputeSolutionPre}>{dispute.solutionText}</pre>
                                                    {dispute.fileUrl && (
                                                        <a href={dispute.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.disputeFileLink}>
                                                            Открыть прикрепленный файл решения
                                                        </a>
                                                    )}
                                                </div>

                                                <div className={styles.disputeSection}>
                                                    <h5>Обоснование апелляции студентом</h5>
                                                    <p className={styles.disputeReasonText}>{dispute.reason}</p>
                                                </div>

                                                <div className={styles.disputeSection}>
                                                    <h5>Вердикт модератора</h5>
                                                    <textarea
                                                        className={styles.disputeTextarea}
                                                        placeholder="Опишите ваше решение по апелляции..."
                                                        rows={3}
                                                        value={moderatorComment}
                                                        onChange={(e) => setModeratorComment(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className={styles.disputeFooter}>
                                                <button
                                                    className={styles.btnDisputeReject}
                                                    disabled={resolvingDisputeId === dispute.id}
                                                    onClick={() => handleResolveDispute(dispute.id, false)}
                                                >
                                                    Отклонить апелляцию
                                                </button>
                                                <button
                                                    className={styles.btnDisputeApprove}
                                                    disabled={resolvingDisputeId === dispute.id}
                                                    onClick={() => handleResolveDispute(dispute.id, true)}
                                                >
                                                    Удовлетворить (Зачесть работу)
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                <aside className={styles.sidebar}>
                    {/* Guide Card */}
                    <div className={styles.sidebarCard}>
                        <h3 className={styles.sidebarCardTitle}>
                            <ClipboardCheck size={18} color="#10b981" />
                            Руководство по модерации
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                                <span><strong>Жалобы на контент:</strong> Рассматривайте жалобы пользователей. Вы можете отклонить жалобу как ложную или эскалировать её администратору.</span>
                            </div>
                            {showDisputesTab && (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                                    <span><strong>Споры Peer Review:</strong> Рассматривайте апелляции, изучайте решения студентов и выносите вердикты (удовлетворить или отклонить).</span>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
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
