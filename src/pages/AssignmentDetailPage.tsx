import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    BookOpen, 
    CheckCircle, 
    AlertCircle, 
    Loader2, 
    Plus, 
    Trash2, 
    Send,
    MessageSquare,
    Star,
    Clock,
    RefreshCw
} from 'lucide-react';
import { educationService } from '../api/educationService';
import type { AssignmentDto, SubmissionDto, RubricDto, ReviewDto, DisputeDto } from '../api/educationService';
import { roomService } from '../api/roomService';
import { contentService } from '../api/contentService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import styles from './AssignmentDetailPage.module.css';

const AssignmentDetailPage: React.FC = () => {
    const { roomSlug, skillId } = useParams<{ roomSlug: string, skillId: string }>();
    const navigate = useNavigate();
    const { user, getUserRoomRoleBySlug } = useAuth();

    const [assignment, setAssignment] = useState<AssignmentDto | null>(null);
    const [submission, setSubmission] = useState<SubmissionDto | null>(null);
    interface ExtendedReviewDto extends ReviewDto {
        isNew?: boolean;
    }
    const [reviews, setReviews] = useState<ExtendedReviewDto[]>([]);
    const [newReviewsCount, setNewReviewsCount] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [disputes, setDisputes] = useState<DisputeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [matchingSection, setMatchingSection] = useState<any | null>(null);

    const lastFetchedRef = useRef<number>(Date.now());

    const fetchReviews = async (isInitial = false, subId?: number) => {
        const targetSubId = subId || submission?.id;
        if (!targetSubId) return;
        setIsRefreshing(true);
        try {
            const revs = await educationService.getReviewsForSubmission(targetSubId).catch(() => []);
            const now = Date.now();
            if (isInitial) {
                setReviews(revs);
            } else {
                const enriched = revs.map(r => ({
                    ...r,
                    isNew: r.createdAt ? new Date(r.createdAt).getTime() > lastFetchedRef.current : false
                }));
                const newCount = enriched.filter(r => r.isNew).length;
                setNewReviewsCount(newCount);
                setReviews(enriched);
            }
            lastFetchedRef.current = now;
        } catch (e) {
            console.error('Failed to fetch reviews', e);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible' && submission?.id) {
                fetchReviews(false, submission.id);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [submission?.id]);
    
    // Score & Threshold Calculation
    const maxRubricPoints = assignment ? assignment.rubrics.reduce((sum, r) => sum + (r.maxPoints || 0), 0) : 0;
    const reviewsCount = reviews.length;
    let avgObtainedPoints = 0;
    let avgScorePercent = 0;
    
    if (reviewsCount > 0 && maxRubricPoints > 0) {
        const totalPointsAcrossReviews = reviews.reduce((sum, review) => {
            const reviewPoints = review.grades.reduce((s, g) => s + g.score, 0);
            return sum + reviewPoints;
        }, 0);
        avgObtainedPoints = Number((totalPointsAcrossReviews / reviewsCount).toFixed(1));
        avgScorePercent = Math.round((avgObtainedPoints / maxRubricPoints) * 100);
    }
    
    // Assignment Creation Form State (Admins/Mods)
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newRubrics, setNewRubrics] = useState<RubricDto[]>([
        { criterionName: 'Правильность выполнения', maxPoints: 10, description: 'Соответствие решения условиям задачи' }
    ]);
    const [creating, setCreating] = useState(false);

    // Solution Submission Form State (Students)
    const [solutionText, setSolutionText] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Dispute state
    const [showDisputeForm, setShowDisputeForm] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [disputing, setDisputing] = useState(false);

    const fetchData = async () => {
        if (!skillId) return null;
        setLoading(true);
        try {
            // 1. Fetch Assignment
            const assignData = await educationService.getAssignmentBySkill(Number(skillId))
                .catch(() => null);
            setAssignment(assignData);

            let mySub: SubmissionDto | null = null;

            if (assignData) {
                // 2. Fetch Student Submission if exists
                const mySubs = await educationService.getMySubmissions().catch(() => []);
                mySub = mySubs.find(s => s.assignmentId === assignData.id) || null;
                setSubmission(mySub);

                if (mySub && mySub.id) {
                    // 3. Fetch Reviews for my submission
                    await fetchReviews(true, mySub.id);

                    // 4. Fetch Disputes
                    const ds = await educationService.getDisputesForSubmission(mySub.id).catch(() => []);
                    setDisputes(ds);
                    
                    if (mySub.status === 'NEEDS_REVISION') {
                        setSolutionText(mySub.solutionText);
                        setFileUrl(mySub.fileUrl || '');
                    }
                } else {
                    setReviews([]);
                    setNewReviewsCount(0);
                }
            }

            // Fetch room and matching wiki section
            if (roomSlug) {
                try {
                    const r = await roomService.getRoom(roomSlug);
                    if (r && r.id) {
                        const sections = await contentService.getWikiSectionsByRoom(r.id);
                        const match = sections.find((s: any) => s.skillId === Number(skillId));
                        setMatchingSection(match || null);
                    }
                } catch (e) {
                    console.error("Failed to fetch room or wiki sections", e);
                }
            }

            return mySub;
        } catch (error) {
            console.error('Failed to fetch assignment details', error);
            toast.error('Ошибка при загрузке деталей задания');
        } finally {
            setLoading(false);
        }
        return null;
    };

    useEffect(() => {
        fetchData();
    }, [skillId]);

    // Rubric Add/Delete
    const handleAddRubric = () => {
        setNewRubrics([...newRubrics, { criterionName: '', maxPoints: 5, description: '' }]);
    };

    const handleDeleteRubric = (index: number) => {
        if (newRubrics.length <= 1) {
            toast.error('Необходимо указать хотя бы один критерий оценки');
            return;
        }
        setNewRubrics(newRubrics.filter((_, idx) => idx !== index));
    };

    const handleRubricChange = (index: number, field: keyof RubricDto, val: any) => {
        const updated = [...newRubrics];
        updated[index] = { ...updated[index], [field]: val };
        setNewRubrics(updated);
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!skillId || !newTitle.trim() || !newDesc.trim()) return;

        // Validation
        const invalid = newRubrics.some(r => !r.criterionName.trim() || r.maxPoints <= 0);
        if (invalid) {
            toast.error('Пожалуйста, заполните все поля критериев оценки и укажите корректные баллы');
            return;
        }

        setCreating(true);
        try {
            await educationService.createAssignment({
                id: 0,
                skillId: Number(skillId),
                title: newTitle,
                description: newDesc,
                rubrics: newRubrics,
                createdAt: ''
            });
            toast.success('Практическое задание успешно опубликовано!');
            fetchData();
        } catch (error) {
            console.error('Failed to create assignment', error);
            toast.error('Не удалось опубликовать задание');
        } finally {
            setCreating(false);
        }
    };

    const handleSolutionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignment || !solutionText.trim()) return;

        setSubmitting(true);
        try {
            await educationService.submitSolution({
                assignmentId: assignment.id,
                solutionText,
                fileUrl
            });
            toast.success(submission ? 'Решение успешно обновлено!' : 'Решение отправлено на проверку!');
            const updatedSub = await fetchData();
            if (updatedSub && updatedSub.id) {
                setTimeout(() => {
                    fetchReviews(false, updatedSub.id);
                }, 5000);
            }
        } catch (error) {
            console.error('Failed to submit solution', error);
            toast.error('Не удалось отправить решение');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDisputeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!submission || !submission.id || !disputeReason.trim()) return;

        setDisputing(true);
        try {
            await educationService.createDispute(submission.id, disputeReason);
            toast.success('Апелляция успешно отправлена модераторам');
            setDisputeReason('');
            setShowDisputeForm(false);
            fetchData();
        } catch (error) {
            console.error('Failed to submit dispute', error);
            toast.error('Не удалось отправить апелляцию');
        } finally {
            setDisputing(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingBox}>
                <Loader2 className={styles.spin} size={40} />
                <p>Загрузка деталей задания...</p>
            </div>
        );
    }

    const localRole = roomSlug ? getUserRoomRoleBySlug(roomSlug) : null;
    const canManageAssignment = user?.role === 'ADMIN' || user?.role === 'MODERATOR' || localRole === 'ROOM_ADMIN' || localRole === 'EXPERT';

    return (
        <div className={styles.container}>
            <button 
                className={styles.backBtn}
                onClick={() => navigate(`/rooms/${roomSlug}/skills`)}
            >
                <ArrowLeft size={16} />
                <span>Назад к карте навыков</span>
            </button>

            {/* CASE 1: No Assignment Published yet */}
            {!assignment && (
                <div className={styles.noAssignmentBox}>
                    {canManageAssignment ? (
                        <div className={styles.creatorCard}>
                            <h2>Создание практического задания</h2>
                            <p className={styles.subtitle}>Опубликуйте описание практической работы и определите чек-лист критериев для Peer Review.</p>
                            
                            <form onSubmit={handleCreateAssignment} className={styles.createForm}>
                                <div className={styles.formGroup}>
                                    <label>Название практической работы</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        placeholder="Например: Разработка Todo-приложения на React"
                                        className={styles.input}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Инструкция по выполнению задания</label>
                                    <textarea 
                                        required
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Опишите техническое задание, требования к коду и шаги для проверки..."
                                        rows={6}
                                        className={styles.textarea}
                                    />
                                </div>

                                <div className={styles.rubricsSection}>
                                    <div className={styles.rubricsHeader}>
                                        <h3>Критерии оценки (Рубрики)</h3>
                                        <button 
                                            type="button" 
                                            className={styles.addRubricBtn}
                                            onClick={handleAddRubric}
                                        >
                                            <Plus size={14} /> Добавить критерий
                                        </button>
                                    </div>
                                    <p className={styles.sectionHelp}>Используйте четкие, понятные формулировки критериев, чтобы другие студенты могли объективно оценить работу.</p>

                                    <div className={styles.rubricsList}>
                                        {newRubrics.map((rubric, index) => (
                                            <div key={index} className={styles.rubricRow}>
                                                <div className={styles.rubricField}>
                                                    <input 
                                                        type="text"
                                                        placeholder="Название критерия (например: Качество верстки)"
                                                        value={rubric.criterionName}
                                                        onChange={(e) => handleRubricChange(index, 'criterionName', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className={styles.rubricScoreField}>
                                                    <input 
                                                        type="number"
                                                        placeholder="Макс. балл"
                                                        value={rubric.maxPoints || ''}
                                                        onChange={(e) => handleRubricChange(index, 'maxPoints', Number(e.target.value))}
                                                        required
                                                        min="1"
                                                    />
                                                </div>
                                                <div className={styles.rubricDescField}>
                                                    <input 
                                                        type="text"
                                                        placeholder="Краткое описание (что проверять)..."
                                                        value={rubric.description || ''}
                                                        onChange={(e) => handleRubricChange(index, 'description', e.target.value)}
                                                    />
                                                </div>
                                                <button 
                                                    type="button" 
                                                    className={styles.deleteRubricBtn}
                                                    onClick={() => handleDeleteRubric(index)}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className={styles.submitBtn}
                                    disabled={creating}
                                >
                                    {creating ? 'Публикация...' : 'Опубликовать задание'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <BookOpen size={48} />
                            <h2>Задание еще не опубликовано</h2>
                            <p>Для этого навыка практическое задание еще не создано модератором сообщества. Пожалуйста, зайдите позже.</p>
                        </div>
                    )}
                </div>
            )}

            {/* CASE 2: Assignment Details */}
            {assignment && (
                <div className={styles.assignmentLayout}>
                    {/* Assignment Instructions (Left Panel) */}
                    <div className={styles.mainContent}>
                        <div className={styles.card}>
                            <h1 className={styles.title}>{assignment.title}</h1>
                            <div className={styles.descBox}>
                                <h3>Инструкции к заданию</h3>
                                <p className={styles.description}>{assignment.description}</p>
                            </div>

                            {matchingSection && matchingSection.entries && matchingSection.entries.length > 0 && (
                                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', borderLeft: '4px solid #6366f1' }}>
                                    <h3 style={{ margin: '0 0 0.75rem 0', color: '#4f46e5', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <BookOpen size={18} />
                                        📚 Обучающие материалы:
                                    </h3>
                                    <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px', listStyleType: 'disc' }}>
                                        {matchingSection.entries.map((entry: any) => (
                                            <li key={entry.id}>
                                                <Link 
                                                    to={`/rooms/${roomSlug}/articles/${entry.sourceArticleId}`} 
                                                    state={{ from: 'skills' }}
                                                    style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 600, fontSize: '0.9375rem' }}
                                                >
                                                    {entry.title}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className={styles.criteriaBox}>
                                <h3>Критерии взаимного оценивания</h3>
                                <div className={styles.rubricsDisplayList}>
                                    {assignment.rubrics.map((rubric) => (
                                        <div key={rubric.id} className={styles.rubricDisplayItem}>
                                            <div className={styles.rubricBadge}>{rubric.maxPoints} б.</div>
                                            <div className={styles.rubricInfo}>
                                                <h4>{rubric.criterionName}</h4>
                                                {rubric.description && <p>{rubric.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Peer Reviews / Feedback (If Student Submitted) */}
                        {submission && (
                            <div className={styles.reviewsWidget}>
                                <h2 className={styles.reviewsHeader}>
                                    Отзывы одногруппников (Peer Feedback)
                                    {newReviewsCount > 0 && (
                                        <span className={styles.newBadge}>+{newReviewsCount}</span>
                                    )}
                                    <button 
                                        className={styles.refreshBtn} 
                                        onClick={() => fetchReviews(false)} 
                                        title="Обновить отзывы"
                                        disabled={isRefreshing}
                                    >
                                        <RefreshCw size={16} className={isRefreshing ? styles.spin : ''} />
                                    </button>
                                </h2>
                                {reviews.length > 0 ? (
                                    <div className={styles.reviewsList}>
                                        {reviews.map((review) => {
                                            // Calculate total score for this review
                                            const obtained = review.grades.reduce((sum, g) => sum + g.score, 0);
                                            const max = assignment.rubrics.reduce((sum, r) => sum + (r.maxPoints || 0), 0);

                                            return (
                                                <div 
                                                    key={review.id} 
                                                    className={`${styles.reviewCard} ${review.isNew ? styles.newReview : ''}`}
                                                >
                                                    <div className={styles.reviewHeader}>
                                                        <div className={styles.reviewerInfo}>
                                                            <MessageSquare size={16} color="#6366f1" />
                                                            <h4>Рецензент №{reviews.indexOf(review) + 1}</h4>
                                                        </div>
                                                        <div className={styles.reviewScore}>
                                                            <Star size={16} fill="#f59e0b" color="#f59e0b" />
                                                            <span>Оценка: <strong>{obtained}</strong> / {max} б.</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <p className={styles.reviewComment}>{review.comment}</p>
                                                    
                                                    {review.grades.length > 0 && (
                                                        <div className={styles.gradesList}>
                                                            {review.grades.map((grade) => {
                                                                const rubric = assignment.rubrics.find(r => r.id === grade.rubricId);
                                                                return (
                                                                    <div key={grade.rubricId} className={styles.gradeItem}>
                                                                        <span className={styles.gradeCrit}>{rubric?.criterionName}:</span>
                                                                        <span className={styles.gradeScore}>{grade.score} б.</span>
                                                                        {grade.comment && <span className={styles.gradeComm}>— {grade.comment}</span>}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={styles.emptyReviewsState}>
                                        <p>Отзывов пока нет. Другие студенты проверят ваше решение в ближайшее время.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Submission Area / Solution Status (Right Panel) */}
                    <div className={styles.sidebar}>
                        <div className={styles.card}>
                            <h2>Ваше решение</h2>

                            {/* Solution Status Header */}
                            {submission && (
                                <div className={styles.submissionStatusBox}>
                                    {submission.status === 'PENDING' && (
                                        <div className={`${styles.statusAlert} ${styles.alertPending}`}>
                                            <Clock size={20} />
                                            <div>
                                                <h4>Ожидает проверки</h4>
                                                <p>Решение загружено. Для подтверждения навыка требуется, чтобы другие студенты проверили вашу работу (нужно 2 рецензии).</p>
                                            </div>
                                        </div>
                                    )}
                                    {submission.status === 'UNDER_REVIEW' && (
                                        <div className={`${styles.statusAlert} ${styles.alertReview}`}>
                                            <Loader2 className={styles.spin} size={20} />
                                            <div>
                                                <h4>Проверяется сообществом</h4>
                                                <p>Ваша работа находится на рецензировании. Ожидайте отзывов коллег.</p>
                                            </div>
                                        </div>
                                    )}
                                    {submission.status === 'NEEDS_REVISION' && (
                                        <>
                                            <div className={`${styles.statusAlert} ${styles.alertRevision}`} style={{ marginBottom: '0.75rem' }}>
                                                <AlertCircle size={20} />
                                                <div>
                                                    <h4>Требуется доработка</h4>
                                                    <p>Ваша работа набрала меньше 70% проходного балла. Изучите комментарии слева, исправьте недочеты и отправьте обновленное решение ниже.</p>
                                                </div>
                                            </div>

                                            {disputes.some(d => d.status === 'PENDING') ? (
                                                <div className={styles.disputePendingBox}>
                                                    <Clock size={16} />
                                                    <span><strong>Апелляция на рассмотрении:</strong> Модераторы проверяют ваши оценки.</span>
                                                </div>
                                            ) : (
                                                <div className={styles.disputeActionBox}>
                                                    {disputes.some(d => d.status === 'RESOLVED_REJECTED') && (
                                                        <div className={styles.disputeRejectedBox}>
                                                            <strong>Апелляция отклонена модератором:</strong>
                                                            <p className={styles.resolutionComment}>
                                                                "{disputes.find(d => d.status === 'RESOLVED_REJECTED')?.resolutionComment}"
                                                            </p>
                                                        </div>
                                                    )}
                                                    
                                                    {!showDisputeForm ? (
                                                        <button 
                                                            type="button" 
                                                            className={styles.disputeBtn}
                                                            onClick={() => setShowDisputeForm(true)}
                                                        >
                                                            Оспорить оценку (Подать апелляцию)
                                                        </button>
                                                    ) : (
                                                        <form onSubmit={handleDisputeSubmit} className={styles.disputeForm}>
                                                            <h4>Подача апелляции</h4>
                                                            <textarea
                                                                required
                                                                value={disputeReason}
                                                                onChange={(e) => setDisputeReason(e.target.value)}
                                                                placeholder="Опишите, почему вы не согласны с оценкой сокурсников..."
                                                                rows={3}
                                                                className={styles.disputeTextarea}
                                                            />
                                                            <div className={styles.disputeFormActions}>
                                                                <button 
                                                                    type="button" 
                                                                    className={styles.btnCancel}
                                                                    onClick={() => setShowDisputeForm(false)}
                                                                >
                                                                    Отмена
                                                                </button>
                                                                <button 
                                                                    type="submit" 
                                                                    className={styles.btnSubmit}
                                                                    disabled={disputing}
                                                                >
                                                                    {disputing ? 'Отправка...' : 'Отправить'}
                                                                </button>
                                                            </div>
                                                        </form>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {submission.status === 'COMPLETED' && (
                                        <div className={`${styles.statusAlert} ${styles.alertCompleted}`}>
                                            <CheckCircle size={20} />
                                            <div>
                                                <h4>Задание зачтено!</h4>
                                                <p>Поздравляем! Ваша работа успешно прошла взаимную проверку. Навык освоен.</p>
                                            </div>
                                        </div>
                                    )}

                                    {reviewsCount > 0 && (
                                        <div className={styles.scoreBarCard}>
                                            <div className={styles.scoreBarHeader}>
                                                <span>Средний балл: <strong>{avgObtainedPoints} / {maxRubricPoints} б.</strong> ({avgScorePercent}%)</span>
                                                <span>Порог: 70%</span>
                                            </div>
                                            <div className={styles.scoreBarBg}>
                                                <div 
                                                    className={`${styles.scoreBarFill} ${avgScorePercent >= 70 ? styles.scoreBarPass : styles.scoreBarFail}`}
                                                    style={{ width: `${Math.min(avgScorePercent, 100)}%` }}
                                                />
                                                <div className={styles.thresholdMarker} style={{ left: '70%' }} />
                                            </div>
                                            <p className={styles.scoreBarHint}>
                                                {avgScorePercent >= 70 
                                                    ? '🎉 Вы набрали достаточный балл для сдачи!' 
                                                    : '⚠️ Средний балл ниже проходного порога (70%).'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Submission Form (Only if no submission or status is NEEDS_REVISION) */}
                            {(!submission || submission.status === 'NEEDS_REVISION') && (
                                <form onSubmit={handleSolutionSubmit} className={styles.solutionForm}>
                                    <div className={styles.formGroup}>
                                        <label>Текст решения / Ссылка на код</label>
                                        <textarea
                                            required
                                            value={solutionText}
                                            onChange={(e) => setSolutionText(e.target.value)}
                                            placeholder="Опишите ваше решение, вставьте код или укажите ссылку на ваш GitHub репозиторий..."
                                            rows={8}
                                            className={styles.solutionTextarea}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Ссылка на файл (необязательно)</label>
                                        <input
                                            type="url"
                                            value={fileUrl}
                                            onChange={(e) => setFileUrl(e.target.value)}
                                            placeholder="https://github.com/your-username/repo"
                                            className={styles.fileInput}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        className={styles.solutionSubmitBtn}
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className={styles.spin} size={16} />
                                                <span>Отправка решения...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                <span>{submission ? 'Обновить решение' : 'Отправить решение'}</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}

                            {/* View solution text if already completed or pending */}
                            {submission && submission.status !== 'NEEDS_REVISION' && (
                                <div className={styles.submittedSolutionView}>
                                    <h4>Текст вашего решения:</h4>
                                    <div className={styles.solutionPreviewBox}>
                                        {submission.solutionText}
                                    </div>
                                    {submission.fileUrl && (
                                        <div className={styles.submittedFileBox}>
                                            <span>Прикрепленный ресурс:</span>
                                            <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                                                Открыть ссылку
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentDetailPage;
