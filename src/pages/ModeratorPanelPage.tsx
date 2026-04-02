import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './ModeratorPanelPage.module.css';

const ModeratorPanelPage: React.FC = () => {
    const { user } = useAuth();
    
    // Mocks for prototype UI
    const [reports] = useState([
        { id: 1, type: 'СПАМ', info: 'Комментарий к статье "Основы Go"', date: '10 мин назад' },
        { id: 2, type: 'НАРУШЕНИЕ', info: 'Пост "Неприемлемый контент"', date: '2 часа назад' }
    ]);

    // Role verification
    if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Модераторская панель</h1>
                <p className={styles.subtitle}>Проверка контента, жалобы пользователей и актуализация Базы Знаний.</p>
            </header>

            <div className={styles.grid}>
                <section className={styles.panel}>
                    <h2 className={styles.panelTitle}>
                        <AlertTriangle size={20} color="#f59e0b" />
                        Жалобы на контент
                    </h2>
                    
                    {reports.length > 0 ? (
                        <div className={styles.list}>
                            {reports.map((report) => (
                                <div key={report.id} className={styles.reportCard}>
                                    <div className={styles.reportHeader}>
                                        <span className={styles.reportType}>{report.type}</span>
                                        <span className={styles.reportDate}>{report.date}</span>
                                    </div>
                                    <div className={styles.reportContent}>
                                        <h4>{report.info}</h4>
                                        <p>Пользователь подал жалобу. Требуется ваше вмешательство.</p>
                                    </div>
                                    <div className={styles.actions}>
                                        <button className={`${styles.btn} ${styles.btnApprove}`}>
                                            <CheckCircle size={16} /> Оставить
                                        </button>
                                        <button className={`${styles.btn} ${styles.btnReject}`}>
                                            <XCircle size={16} /> Удалить контент
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>Всё чисто! Нет открытых жалоб.</div>
                    )}
                </section>

                <section className={styles.panel}>
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
