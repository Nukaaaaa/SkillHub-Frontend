import React, { useState, useEffect } from 'react';
import { 
    X, 
    Brain, 
    Bot, 
    ShieldCheck, 
    Zap, 
    FileText, 
    CheckCircle2, 
    AlertCircle,
    Loader2
} from 'lucide-react';
import { aiService } from '../api/aiService';
import type { ArticleModerationResponse } from '../api/aiService';
import styles from './AiReviewModal.module.css';

export interface ArticleAnalysisResponse {
    summary: string;
    keyTakeaways: string[];
    error?: string;
}

interface AiReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    type: 'article' | 'post';
}

const AiReviewModal: React.FC<AiReviewModalProps> = ({
    isOpen,
    onClose,
    title,
    content,
    type
}) => {
    const [loading, setLoading] = useState(true);
    const [modResult, setModResult] = useState<ArticleModerationResponse | null>(null);
    const [analysisResult, setAnalysisResult] = useState<ArticleAnalysisResponse | null>(null);
    const [activeTab, setActiveTab] = useState<'moderation' | 'analysis'>('moderation');

    useEffect(() => {
        if (isOpen) {
            performFullAudit();
        }
    }, [isOpen]);

    const performFullAudit = async () => {
        setLoading(true);
        try {
            const [mod, analysis] = await Promise.all([
                aiService.moderateArticle({
                    requestId: `audit-mod-${Date.now()}`,
                    roomId: 1, 
                    difficultyLevel: 'INTERMEDIATE',
                    title,
                    content
                }),
                aiService.analyzeArticle({
                    title,
                    content
                })
            ]);
            setModResult(mod);
            // Handle keyTakeaways mapping
            const sanitizedAnalysis: ArticleAnalysisResponse = {
                summary: analysis.summary,
                keyTakeaways: (analysis as any).keyTakeaways || (analysis as any).takeaways || [],
                error: (analysis as any).error
            };
            setAnalysisResult(sanitizedAnalysis);
        } catch (e) {
            console.error('AI Audit failed', e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <div className={styles.iconCircle}>
                            <Brain size={24} color="#8b5cf6" />
                        </div>
                        <div>
                            <h2 className={styles.title}>AI Технический Аудит</h2>
                            <p className={styles.subtitle}>{type === 'article' ? 'Статья' : 'Пост'}: {title}</p>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className={styles.tabs}>
                    <button 
                        className={`${styles.tabBtn} ${activeTab === 'moderation' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('moderation')}
                    >
                        <ShieldCheck size={18} />
                        Вердикт ИИ
                    </button>
                    <button 
                        className={`${styles.tabBtn} ${activeTab === 'analysis' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('analysis')}
                    >
                        <Zap size={18} />
                        Глубокий анализ
                    </button>
                </div>

                <main className={styles.content}>
                    {loading ? (
                        <div className={styles.loaderArea}>
                            <Loader2 className={styles.spin} size={48} />
                            <p>Нейросеть изучает контент...</p>
                        </div>
                    ) : (
                        <div className={styles.resultsGrid}>
                            {activeTab === 'moderation' ? (
                                <div className={styles.modSection}>
                                    <div className={`${styles.verdictCard} ${styles[modResult?.verdict || 'PENDING']}`}>
                                        <div className={styles.verdictIcon}>
                                            {modResult?.verdict === 'APPROVED' ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                                        </div>
                                        <div>
                                            <h3>{modResult?.verdict === 'APPROVED' ? 'Контент одобрен' : 'Требует внимания'}</h3>
                                            <p className={styles.scoreText}>Инструментальная оценка качества: <strong>{modResult?.qualityScore}%</strong></p>
                                        </div>
                                    </div>

                                    <div className={styles.noteSection}>
                                        <h4>Комментарий ИИ:</h4>
                                        <div className={styles.noteContent}>
                                            {modResult?.note || "Не удалось выполнить AI-проверку. Попробуйте позже или отредактируйте текст."}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.analysisSection}>
                                    <div className={styles.summaryBox}>
                                        <h4><FileText size={18} /> Краткое резюме:</h4>
                                        <p>{analysisResult?.summary || "Резюме недоступно"}</p>
                                    </div>

                                    <div className={styles.takeawaysBox}>
                                        <h4><Bot size={18} /> Основные тезисы:</h4>
                                        <ul className={styles.takeawaysList}>
                                            {analysisResult?.keyTakeaways && analysisResult.keyTakeaways.length > 0 ? (
                                                analysisResult.keyTakeaways.map((task, idx) => (
                                                    <li key={idx}>{task}</li>
                                                ))
                                            ) : (
                                                <li style={{ background: '#fef2f2', color: '#ef4444' }}>Тезисы не были сформированы (возможно, текст слишком короткий)</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>

                <footer className={styles.footer}>
                    <button className={styles.primaryBtn} onClick={onClose}>Закрыть отчет</button>
                </footer>
            </div>
        </div>
    );
};

export default AiReviewModal;
