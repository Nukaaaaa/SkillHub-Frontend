import React, { useState } from 'react';
import { X, CheckSquare, Loader2 } from 'lucide-react';
import { educationService } from '../api/educationService';
import type { ReviewDto, ReviewGradeDto } from '../api/educationService';
import { toast } from 'react-hot-toast';
import styles from './SubmitReviewModal.module.css';

interface SubmitReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    review: ReviewDto;
    onSubmitSuccess: () => void;
}

const SubmitReviewModal: React.FC<SubmitReviewModalProps> = ({
    isOpen,
    onClose,
    review,
    onSubmitSuccess
}) => {
    const [comment, setComment] = useState('');
    const [scores, setScores] = useState<Record<number, number>>({});
    const [gradeComments, setGradeComments] = useState<Record<number, string>>({});
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleScoreChange = (rubricId: number, val: number) => {
        setScores(prev => ({ ...prev, [rubricId]: val }));
    };

    const handleGradeCommentChange = (rubricId: number, val: string) => {
        setGradeComments(prev => ({ ...prev, [rubricId]: val }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate that all rubrics have scores
        const missingRubrics = (review.rubrics || []).filter(r => r.id !== undefined && scores[r.id] === undefined);
        if (missingRubrics.length > 0) {
            toast.error(`Пожалуйста, заполните оценки для всех критериев`);
            return;
        }

        if (!comment.trim()) {
            toast.error('Пожалуйста, напишите общий отзыв');
            return;
        }

        setSubmitting(true);
        try {
            const grades: ReviewGradeDto[] = (review.rubrics || []).map(r => ({
                rubricId: r.id!,
                score: scores[r.id!] || 0,
                comment: gradeComments[r.id!] || ''
            }));

            await educationService.submitReview(review.id!, {
                comment,
                grades
            });

            toast.success('Рецензия успешно отправлена!');
            onSubmitSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to submit review', error);
            toast.error('Не удалось отправить рецензию');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <header className={styles.header}>
                    <div className={styles.headerTitle}>
                        <CheckSquare size={20} color="#6366f1" />
                        <h2>Рецензирование решения</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.scrollArea}>
                        {/* Assignment Detail Info */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Задание: {review.assignmentTitle}</h3>
                            <p className={styles.assignmentDesc}>{review.assignmentDescription}</p>
                        </div>

                        {/* Student Solution */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Решение студента</h3>
                            <div className={styles.solutionBox}>
                                {review.solutionText || 'Решение предоставлено в файле.'}
                            </div>
                            {review.fileUrl && (
                                <div className={styles.fileLinkBox}>
                                    <span className={styles.fileLabel}>Прикрепленный файл:</span>
                                    <a 
                                        href={review.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className={styles.fileLink}
                                    >
                                        Открыть файл / Ссылку
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Rubrics/Criteria Grading */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Оценка по критериям</h3>
                            <p className={styles.sectionDesc}>Поставьте балл по каждому критерию оценки.</p>
                            
                            <div className={styles.rubricsList}>
                                {(review.rubrics || []).map((rubric) => (
                                    <div key={rubric.id} className={styles.rubricCard}>
                                        <div className={styles.rubricHeader}>
                                            <div className={styles.rubricInfo}>
                                                <h4>{rubric.criterionName}</h4>
                                                {rubric.description && <p>{rubric.description}</p>}
                                            </div>
                                            <div className={styles.scoreSelectWrapper}>
                                                <span className={styles.maxPointsLabel}>макс. {rubric.maxPoints}</span>
                                                <select
                                                    value={scores[rubric.id!] ?? ''}
                                                    onChange={(e) => handleScoreChange(rubric.id!, Number(e.target.value))}
                                                    required
                                                    className={styles.scoreSelect}
                                                >
                                                    <option value="" disabled>--</option>
                                                    {Array.from({ length: rubric.maxPoints + 1 }, (_, i) => (
                                                        <option key={i} value={i}>{i} б.</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Комментарий к этому критерию (необязательно)..."
                                            value={gradeComments[rubric.id!] ?? ''}
                                            onChange={(e) => handleGradeCommentChange(rubric.id!, e.target.value)}
                                            className={styles.rubricCommentInput}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* General feedback */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Общий отзыв</h3>
                            <p className={styles.sectionDesc}>Напишите общие замечания, советы по улучшению и ваше мнение о выполненной работе.</p>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Напишите развернутый комментарий о решении..."
                                required
                                rows={4}
                                className={styles.generalComment}
                            />
                        </div>
                    </div>

                    <footer className={styles.footer}>
                        <button 
                            type="button" 
                            className={styles.btnSecondary} 
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Отмена
                        </button>
                        <button 
                            type="submit" 
                            className={styles.btnPrimary}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className={styles.spin} size={16} />
                                    <span>Отправка...</span>
                                </>
                            ) : (
                                <span>Отправить рецензию</span>
                            )}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

export default SubmitReviewModal;
