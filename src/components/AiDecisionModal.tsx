import React from 'react';
import { 
    AlertCircle, 
    Send, 
    FileText, 
    Trash2, 
    X,
    Sparkles
} from 'lucide-react';
import styles from './AiDecisionModal.module.css';

interface AiDecisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: 'PUBLISHED' | 'DRAFT' | 'DELETED') => void;
    aiNote: string | null;
}

const AiDecisionModal: React.FC<AiDecisionModalProps> = ({
    isOpen,
    onClose,
    onAction,
    aiNote
}) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <div className={styles.aiBadge}>
                        <Sparkles size={16} />
                        <span>AI Рекомендация</span>
                    </div>
                </header>

                <main className={styles.content}>
                    <div className={styles.iconWrapper}>
                        <AlertCircle size={48} color="#f59e0b" />
                    </div>
                    
                    <h2 className={styles.title}>AI рекомендует доработать статью</h2>
                    
                    <div className={styles.noteBox}>
                        <p className={styles.subtitle}>Комментарий нейросети:</p>
                        <p className={styles.note}>{aiNote || "Статья требует небольших технических правок для лучшего восприятия сообществом."}</p>
                    </div>

                    <p className={styles.question}>Что вы хотите сделать?</p>
                </main>

                <footer className={styles.footer}>
                    <button 
                        className={`${styles.btn} ${styles.btnDelete}`}
                        onClick={() => onAction('DELETED')}
                    >
                        <Trash2 size={18} />
                        <span>Удалить</span>
                    </button>
                    
                    <button 
                        className={`${styles.btn} ${styles.btnDraft}`}
                        onClick={() => onAction('DRAFT')}
                    >
                        <FileText size={18} />
                        <span>В черновик</span>
                    </button>

                    <button 
                        className={`${styles.btn} ${styles.btnPublish}`}
                        onClick={() => onAction('PUBLISHED')}
                    >
                        <Send size={18} />
                        <span>Опубликовать всё равно</span>
                    </button>
                </footer>

                <button className={styles.closeBtn} onClick={onClose}>
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};

export default AiDecisionModal;
