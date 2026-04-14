import React, { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import styles from './ReportModal.module.css';
import { interactionService } from '../api/interactionService';
import type { TargetType } from '../api/interactionService';
import { toast } from 'react-hot-toast';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: TargetType;
    targetId: number;
    targetAuthorId: number;
    onSuccess?: () => void;
}

const REPORT_REASONS = [
    'Спам или реклама',
    'Оскорбления или ненависть',
    'Недостоверная информация',
    'Плагиат / Нарушение авторских прав',
    'Неуместный контент (NSFW)',
    'Другое'
];

const ReportModal: React.FC<ReportModalProps> = ({ 
    isOpen, 
    onClose, 
    targetType, 
    targetId, 
    targetAuthorId,
    onSuccess 
}) => {
    const [selectedReason, setSelectedReason] = useState<string>(REPORT_REASONS[0]);
    const [customReason, setCustomReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        const finalReason = selectedReason === 'Другое' ? customReason : selectedReason;
        
        if (!finalReason.trim()) {
            toast.error('Пожалуйста, укажите причину жалобы');
            return;
        }

        try {
            setIsSubmitting(true);
            await interactionService.submitReport(
                targetType,
                targetId,
                targetAuthorId,
                finalReason
            );
            toast.success('Жалоба успешно отправлена');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to submit report:', error);
            toast.error('Не удалось отправить жалобу. Попробуйте позже.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <Flag className={styles.titleIcon} size={20} />
                        <h3 className={styles.title}>Пожаловаться на материал</h3>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} disabled={isSubmitting}>
                        <X size={20} />
                    </button>
                </header>

                <div className={styles.content}>
                    <p className={styles.description}>
                        Ваша жалоба будет отправлена модераторам для проверки. 
                        Пожалуйста, выберите подходящую причину или опишите её детально.
                    </p>

                    <div className={styles.reasonGroup}>
                        <label className={styles.label}>Причина жалобы</label>
                        <select 
                            className={styles.select}
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            disabled={isSubmitting}
                        >
                            {REPORT_REASONS.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                            ))}
                        </select>
                    </div>

                    {selectedReason === 'Другое' && (
                        <div className={styles.reasonGroup}>
                            <label className={styles.label}>Подробное описание</label>
                            <textarea 
                                className={styles.textarea}
                                placeholder="Опишите проблему своими словами..."
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    )}
                </div>

                <footer className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose} disabled={isSubmitting}>
                        Отмена
                    </button>
                    <button 
                        className={styles.confirmBtn} 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span>Отправка...</span>
                        ) : (
                            <>
                                <AlertTriangle size={16} />
                                Отправить жалобу
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ReportModal;
