import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { 
    Award, 
    BookOpen, 
    CheckCircle, 
    Clock, 
    Plus, 
    ShieldAlert, 
    ClipboardList,
    AlertCircle,
    UserCheck,
    ChevronRight,
    Loader2,
    Search,
    X,
    Sparkles
} from 'lucide-react';
import { educationService } from '../api/educationService';
import type { SkillDto, ReviewDto, ExpertValidationRequestDto } from '../api/educationService';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import type { Room } from '../types';
import { contentService } from '../api/contentService';
import SubmitReviewModal from '../components/SubmitReviewModal';
import SkillsChart from '../components/SkillsChart';
import styles from './RoomSkillsPage.module.css';
import { useTranslation } from 'react-i18next';

const RoomSkillsPage: React.FC = () => {
    const { roomSlug } = useParams<{ roomSlug: string }>();
    const { room } = useOutletContext<{ room: Room }>();
    const navigate = useNavigate();
    const { user, getUserRoomRole } = useAuth();
    const { t } = useTranslation();

    const [skills, setSkills] = useState<SkillDto[]>([]);
    const [assignedReviews, setAssignedReviews] = useState<ReviewDto[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Admin Add Skill Form State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newSkillName, setNewSkillName] = useState('');
    const [newSkillDesc, setNewSkillDesc] = useState('');
    const [requiresExpert, setRequiresExpert] = useState(false);
    const [adding, setAdding] = useState(false);

    // Peer Review Modal State
    const [activeReview, setActiveReview] = useState<ReviewDto | null>(null);

    // Expert Validation State
    const [pendingValidations, setPendingValidations] = useState<ExpertValidationRequestDto[]>([]);
    const [activeValidation, setActiveValidation] = useState<ExpertValidationRequestDto | null>(null);
    const [expertComment, setExpertComment] = useState('');
    const [resolvingValidation, setResolvingValidation] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem('hideSkillsOnboarding'));

    const handleCloseOnboarding = () => {
        localStorage.setItem('hideSkillsOnboarding', 'true');
        setShowOnboarding(false);
    };

    const fetchData = async () => {
        if (!roomSlug) return;
        try {
            const [skillsData, reviewsData, validationsData, sectionsData] = await Promise.all([
                educationService.getSkillsByRoom(roomSlug),
                educationService.getAssignedReviews().catch(() => []),
                educationService.getPendingValidations().catch(() => []),
                room?.id ? contentService.getWikiSectionsByRoom(room.id).catch(() => []) : Promise.resolve([])
            ]);
            setSkills(skillsData);
            setAssignedReviews(reviewsData);
            setPendingValidations(validationsData);
            setSections(sectionsData);
        } catch (error) {
            console.error('Failed to fetch education data', error);
            toast.error('Ошибка при загрузке образовательных данных');
        } finally {
            setLoading(false);
        }
    };

    const handleResolveValidation = async (approved: boolean) => {
        if (!activeValidation) return;
        setResolvingValidation(true);
        try {
            await educationService.resolveValidation(activeValidation.id, approved, expertComment);
            toast.success(approved ? 'Решение успешно подтверждено!' : 'Решение отправлено на доработку');
            setActiveValidation(null);
            setExpertComment('');
            fetchData();
        } catch (error) {
            console.error('Failed to resolve validation', error);
            toast.error('Не удалось отправить вердикт');
        } finally {
            setResolvingValidation(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [roomSlug]);

    const handleCreateSkill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!room?.id || !newSkillName.trim()) return;

        setAdding(true);
        try {
            const skill = await educationService.createSkill(
                room.id,
                newSkillName,
                newSkillDesc,
                requiresExpert
            );

            // Auto-create WikiSection in ContentService
            try {
                await contentService.createWikiSection(room.id, newSkillName, skill.id);
            } catch (wikiErr) {
                console.error("Failed to auto-create wiki section for skill", wikiErr);
            }

            toast.success('Навык успешно добавлен!');
            setNewSkillName('');
            setNewSkillDesc('');
            setRequiresExpert(false);
            setIsAddOpen(false);
            fetchData();
        } catch (error) {
            console.error('Failed to create skill', error);
            toast.error('Не удалось добавить навык');
        } finally {
            setAdding(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingBox}>
                <Loader2 className={styles.spin} size={40} />
                <p>Загрузка карты навыков...</p>
            </div>
        );
    }

    const localRole = room ? getUserRoomRole(room.id) : null;
    const canManageSkills = user?.role === 'ADMIN' || user?.role === 'MODERATOR' || localRole === 'ROOM_ADMIN' || localRole === 'EXPERT';

    const filteredSkills = skills.filter((skill) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            skill.name.toLowerCase().includes(query) ||
            (skill.description && skill.description.toLowerCase().includes(query))
        );
    });

    const completedSkillsCount = skills.filter(s => s.userStatus === 'COMPLETED' || s.userStatus === 'CONFIRMED').length;
    const totalSkillsCount = skills.length;
    const progressPercent = totalSkillsCount > 0 ? Math.round((completedSkillsCount / totalSkillsCount) * 100) : 0;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerTitle}>
                    <h1>Навыки и Практика</h1>
                    <p>Изучайте конкретные навыки, выполняйте практические работы и оценивайте коллег.</p>
                </div>
                {canManageSkills && (
                    <button 
                         className={styles.addSkillBtn}
                         onClick={() => setIsAddOpen(!isAddOpen)}
                    >
                        <Plus size={18} />
                        <span>Добавить навык</span>
                    </button>
                )}
            </header>

            {/* Onboarding Banner */}
            {showOnboarding && (
                <div className={styles.onboardingBanner}>
                    <div className={styles.onboardingIcon}>
                        <Sparkles size={24} color="#6366f1" />
                    </div>
                    <div className={styles.onboardingContent}>
                        <h4>👋 Добро пожаловать в раздел «Навыки и Практика»!</h4>
                        <p>
                            Здесь вы можете развивать свои профессиональные навыки. Изучайте материалы из Вики, выполняйте задания и отправляйте их на проверку. 
                            Система использует <strong>взаимное оценивание (Peer Review)</strong>: ваше решение проверяют одногруппники, а вы помогаете оценивать их работы. 
                            Для некоторых сложных навыков требуется финальное подтверждение от эксперта.
                        </p>
                    </div>
                    <button className={styles.closeOnboardingBtn} onClick={handleCloseOnboarding} title="Закрыть подсказку">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Overall Progress Bar */}
            {totalSkillsCount > 0 && (
                <div className={styles.progressCard}>
                    <div className={styles.progressInfo}>
                        <div className={styles.progressLabel}>
                            <Award size={18} color="#6366f1" />
                            <span>Прогресс освоения трека</span>
                        </div>
                        <span className={styles.progressValue}>
                            {completedSkillsCount} из {totalSkillsCount} ({progressPercent}%)
                        </span>
                    </div>
                    <div className={styles.progressBarBg}>
                        <div 
                            className={styles.progressBarFill} 
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Admin Form to add skill */}
            {isAddOpen && canManageSkills && (
                <div className={styles.adminFormBox}>
                    <h3>Новый практический навык</h3>
                    <form onSubmit={handleCreateSkill} className={styles.adminForm}>
                        <div className={styles.formGroup}>
                            <label>Название навыка</label>
                            <input 
                                type="text" 
                                required
                                value={newSkillName}
                                onChange={(e) => setNewSkillName(e.target.value)}
                                placeholder="Например: Архитектура REST API"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Описание</label>
                            <textarea 
                                value={newSkillDesc}
                                onChange={(e) => setNewSkillDesc(e.target.value)}
                                placeholder="Опишите, какие знания и практики включает данный навык..."
                                rows={3}
                            />
                        </div>
                        <div className={styles.checkboxGroup}>
                            <input 
                                type="checkbox"
                                id="requiresExpert"
                                checked={requiresExpert}
                                onChange={(e) => setRequiresExpert(e.target.checked)}
                            />
                            <label htmlFor="requiresExpert">Требуется экспертная валидация (для сложных навыков)</label>
                        </div>
                        <div className={styles.formActions}>
                            <button 
                                type="button" 
                                className={styles.btnCancel}
                                onClick={() => setIsAddOpen(false)}
                            >
                                Отмена
                            </button>
                            <button 
                                type="submit" 
                                className={styles.btnSubmit}
                                disabled={adding}
                            >
                                {adding ? 'Добавление...' : 'Создать навык'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className={styles.grid}>
                {/* Main Skills List */}
                <div className={styles.skillsColumn}>
                    <div className={styles.sectionHeaderWithSearch}>
                        <h2 className={styles.sectionTitle}>
                            <Award size={20} color="#4f46e5" />
                            Карта навыков трека
                        </h2>
                        {skills.length > 0 && (
                            <div className={styles.searchWrapper}>
                                <Search size={16} className={styles.searchIcon} />
                                <input 
                                    type="text"
                                    placeholder="Поиск навыков..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={styles.searchInput}
                                />
                                {searchQuery && (
                                    <button 
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className={styles.clearSearchBtn}
                                        title="Очистить поиск"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {skills.length === 0 ? (
                        <div className={styles.emptyBox}>
                            <BookOpen size={48} />
                            <p>В этом треке пока нет добавленных навыков.</p>
                            {canManageSkills && <p className={styles.emptyHint}>Нажмите "Добавить навык" вверху, чтобы начать наполнение.</p>}
                        </div>
                    ) : filteredSkills.length === 0 ? (
                        <div className={styles.emptyBox}>
                            <Search size={48} className={styles.emptyIcon} />
                            <p>Навыки по запросу "{searchQuery}" не найдены.</p>
                            <button 
                                onClick={() => setSearchQuery('')}
                                className={styles.clearSearchLinkBtn}
                            >
                                Сбросить поиск
                            </button>
                        </div>
                    ) : (
                        <div className={styles.skillsList}>
                            {filteredSkills.map((skill) => {
                                // Determine status color & text
                                let statusText = t('skillStatus.notStarted');
                                let statusClass = styles.statusNotStarted;
                                let statusIcon = <Clock size={14} />;

                                if (skill.userStatus === 'LEARNING') {
                                    statusText = t('skillStatus.learning');
                                    statusClass = styles.statusLearning;
                                    statusIcon = <AlertCircle size={14} />;
                                } else if (skill.userStatus === 'COMPLETED') {
                                    statusText = t('skillStatus.completed');
                                    statusClass = styles.statusCompleted;
                                    statusIcon = <UserCheck size={14} />;
                                } else if (skill.userStatus === 'CONFIRMED') {
                                    statusText = t('skillStatus.confirmed');
                                    statusClass = styles.statusConfirmed;
                                    statusIcon = <CheckCircle size={14} />;
                                }

                                return (
                                    <div key={skill.id} className={styles.skillCard}>
                                        <div className={styles.skillMain}>
                                            <div className={styles.skillHeader}>
                                                <h3>{skill.name}</h3>
                                                <span className={`${styles.statusBadge} ${statusClass}`}>
                                                    {statusIcon}
                                                    <span>{statusText}</span>
                                                </span>
                                            </div>
                                            <p className={styles.skillDesc}>{skill.description}</p>
                                            {skill.requiresExpertValidation && (
                                                <span className={styles.expertRequiredBadge}>
                                                    <ShieldAlert size={12} />
                                                    Требуется экспертная проверка
                                                </span>
                                            )}
                                        </div>

                                        {(() => {
                                            const sec = sections.find(s => s.skillId === skill.id);
                                            if (sec && sec.entries && sec.entries.length > 0) {
                                                return (
                                                    <div style={{ margin: '0 1rem 1rem 1rem', padding: '0.75rem', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '6px', borderLeft: '3px solid #6366f1' }}>
                                                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#4f46e5', fontSize: '0.8125rem', fontWeight: 600 }}>📚 Обучающие материалы:</h5>
                                                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', listStyleType: 'disc' }}>
                                                            {sec.entries.map((entry: any) => (
                                                                <li key={entry.id} style={{ marginBottom: '4px' }}>
                                                                    <Link to={`/rooms/${roomSlug}/articles/${entry.sourceArticleId}`} state={{ from: 'skills' }} style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
                                                                        {entry.title}
                                                                    </Link>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        <button 
                                            className={styles.actionBtn}
                                            onClick={() => navigate(`/rooms/${roomSlug}/skills/${skill.id}/assignment`)}
                                        >
                                            <span>
                                                {skill.userStatus === 'CONFIRMED' || skill.userStatus === 'COMPLETED'
                                                    ? 'Посмотреть задание'
                                                    : 'Перейти к заданию'}
                                            </span>
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar - Peer Reviews for checking */}
                <div className={styles.sidebarColumn}>
                    {skills.length >= 3 && (
                        <div className={styles.sidebarWidget}>
                            <div className={styles.widgetHeader}>
                                <Award size={18} color="#6366f1" />
                                <h3>Карта компетенций</h3>
                            </div>
                            <div className={styles.chartWrapper}>
                                <SkillsChart 
                                    data={skills.map(skill => {
                                        let val = 0;
                                        if (skill.userStatus === 'CONFIRMED') val = 100;
                                        else if (skill.userStatus === 'COMPLETED') val = 75;
                                        else if (skill.userStatus === 'LEARNING') val = 35;
                                        return {
                                            subject: skill.name.length > 15 ? skill.name.slice(0, 15) + '...' : skill.name,
                                            value: val
                                        };
                                    })} 
                                    size={240} 
                                />
                            </div>
                        </div>
                    )}

                    <div className={`${styles.sidebarWidget} ${assignedReviews.length > 0 ? styles.widgetWithNotifications : ''}`}>
                        <div className={styles.widgetHeader}>
                            <ClipboardList size={18} color="#6366f1" />
                            <h3>Взаимная проверка (Peer Review)</h3>
                            {assignedReviews.length > 0 && (
                                <span className={styles.notificationBadge}>
                                    {assignedReviews.length}
                                </span>
                            )}
                        </div>
                        <p className={styles.widgetIntro}>
                            Для завершения обучения вам необходимо проверить решения ваших коллег по назначенным работам.
                        </p>

                        {assignedReviews.length === 0 ? (
                            <div className={styles.emptyReviews}>
                                <CheckCircle size={32} color="#10b981" />
                                <p>У вас нет назначенных работ на проверку. Вы всё сделали!</p>
                            </div>
                        ) : (
                            <div className={styles.reviewsList}>
                                {assignedReviews.map((review) => (
                                    <div key={review.id} className={styles.reviewCard}>
                                        <div className={styles.reviewInfo}>
                                            <h4>{review.assignmentTitle}</h4>
                                            <p>Решение студента #{review.reviewerId === user?.id ? 'коллеги' : 'сокурсника'}</p>
                                        </div>
                                        <button 
                                            className={styles.reviewBtn}
                                            onClick={() => setActiveReview(review)}
                                        >
                                            Проверить
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {pendingValidations.length > 0 && (
                        <div className={styles.sidebarWidget}>
                            <div className={styles.widgetHeader}>
                                <UserCheck size={18} color="#10b981" />
                                <h3>Экспертная валидация</h3>
                            </div>
                            <p className={styles.widgetIntro}>
                                Вы являетесь экспертом. Пожалуйста, проверьте и подтвердите выполнение сложных навыков.
                            </p>
                            <div className={styles.reviewsList}>
                                {pendingValidations.map((req) => (
                                    <div key={req.id} className={styles.reviewCard}>
                                        <div className={styles.reviewInfo}>
                                            <h4>{req.skillName}</h4>
                                            <p>Задание: {req.assignmentTitle}</p>
                                            <p>Студент #{req.studentId}</p>
                                        </div>
                                        <button 
                                            className={styles.expertBtn}
                                            onClick={() => {
                                                setActiveValidation(req);
                                                setExpertComment('');
                                            }}
                                        >
                                            Проверить
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {activeReview && (
                <SubmitReviewModal
                    isOpen={!!activeReview}
                    onClose={() => setActiveReview(null)}
                    review={activeReview}
                    onSubmitSuccess={fetchData}
                />
            )}

            {activeValidation && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>Экспертная валидация решения</h3>
                            <button className={styles.modalCloseBtn} onClick={() => setActiveValidation(null)}>×</button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.modalSection}>
                                <strong>Навык</strong>
                                <span>{activeValidation.skillName}</span>
                            </div>
                            <div className={styles.modalSection}>
                                <strong>Задание</strong>
                                <span>{activeValidation.assignmentTitle}</span>
                                <p className={styles.modalDescText}>{activeValidation.assignmentDescription}</p>
                            </div>
                            <div className={styles.modalSection}>
                                <strong>Решение студента</strong>
                                <div className={styles.modalSolutionText}>{activeValidation.solutionText}</div>
                            </div>
                            {activeValidation.fileUrl && (
                                <div className={styles.modalSection}>
                                    <strong>Прикрепленный файл</strong>
                                    <a href={activeValidation.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.modalFileLink}>
                                        Открыть файл с решением
                                    </a>
                                </div>
                            )}
                            <div className={styles.modalSection}>
                                <strong>Ваш отзыв / Комментарий</strong>
                                <textarea
                                    className={styles.modalTextarea}
                                    placeholder="Напишите рецензию или укажите причины отклонения..."
                                    rows={4}
                                    value={expertComment}
                                    onChange={(e) => setExpertComment(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.btnReject}
                                disabled={resolvingValidation}
                                onClick={() => handleResolveValidation(false)}
                            >
                                Отклонить (На доработку)
                            </button>
                            <button 
                                className={styles.btnApprove}
                                disabled={resolvingValidation}
                                onClick={() => handleResolveValidation(true)}
                            >
                                Подтвердить навык
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomSkillsPage;
