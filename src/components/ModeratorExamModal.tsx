import React, { useState } from 'react';
import { 
    X, BrainCircuit, ArrowRight, CheckCircle2, 
    AlertCircle, Loader2, Award, ClipboardCheck, Sparkles,
    MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../api/aiService';
import { interactionService } from '../api/interactionService';
import { useAuth } from '../context/AuthContext';
import styles from './ModeratorExamModal.module.css';

interface ModeratorExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomName: string;
    roomId: number;
    roomSlug: string;
}

interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    skill_checked: string;
    question_type: string;
}

interface TestData {
    test_title: string;
    questions: Question[];
}

const ModeratorExamModal: React.FC<ModeratorExamModalProps> = ({ isOpen, onClose, roomName, roomId, roomSlug }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [step, setStep] = useState<'intro' | 'form' | 'test' | 'loading' | 'result'>('intro');
    
    // Form State
    const [fullName, setFullName] = useState('');
    const [specialization, setSpecialization] = useState('');
    const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
    
    // Test State
    const [testData, setTestData] = useState<TestData | null>(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [userAnswers, setUserAnswers] = useState<number[]>([]);
    
    // Result State
    const [evaluation, setEvaluation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const startApplication = () => setStep('form');

    const handleGenerateTest = async () => {
        if (!fullName.trim() || !specialization.trim()) {
            toast.error('Пожалуйста, заполните анкету полностью');
            return;
        }

        setIsLoading(true);
        try {
            const res = await aiService.generateModeratorTest({
                requestId: `test-${Date.now()}`,
                applicationId: Math.floor(Math.random() * 1000000), // Temporary ID until real application is created
                fullName,
                specialization,
                level,
                topics: specialization,
                experience: 'Student context',
                desiredRole: 'Moderator'
            });

            if (res.error) throw new Error(res.error);
            
            const parsedTest = JSON.parse(res.normalizedTestJson);
            setTestData(parsedTest);
            setStep('test');
        } catch (err) {
            console.error(err);
            toast.error('Не удалось сгенерировать тест. Попробуйте позже.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (optionIdx: number) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIdx] = optionIdx;
        setUserAnswers(newAnswers);

        if (currentQuestionIdx < (testData?.questions.length || 0) - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
        }
    };

    const submitTest = async () => {
        setIsLoading(true);
        setStep('loading');
        try {
            let correct = 0;
            testData?.questions.forEach((q, idx) => {
                if (userAnswers[idx] === q.correctIndex) correct++;
            });

            const scorePercent = Math.round((correct / (testData?.questions.length || 1)) * 100);

            const res = await aiService.evaluateModeratorApplication({
                requestId: `eval-${Date.now()}`,
                applicationId: Math.floor(Math.random() * 1000), 
                form: { fullName, specialization, level },
                testSummary: {
                    score_percent: scorePercent,
                    correct_answers: correct,
                    total_questions: testData?.questions.length,
                    passed: scorePercent >= 70
                },
                activity: {
                    reputation_proxy_score: 75,
                    reports_against_user: 0
                }
            });

            if (!res.success) throw new Error(res.error || 'Evaluation failed');
            
            // Submit as a report/application in interaction service
            await interactionService.submitReport(
                'moderator_application',
                currentUser?.id || 0,
                1, // Target Admin ID (generic)
                JSON.stringify({
                    roomId,
                    roomSlug,
                    roomName,
                    evaluation: res.aiSanitized,
                    testSummary: {
                        score: scorePercent,
                        correct
                    }
                }),
                roomId
            );

            setEvaluation(res.aiSanitized);
            setStep('result');
        } catch (err) {
            console.error(err);
            toast.error('Ошибка при оценке теста');
            setStep('test');
        } finally {
            setIsLoading(false);
        }
    };

    const contactAdmin = () => {
        // Assuming admin ID is 4 or 1 based on previous logs/context
        navigate(`/messenger?userId=4`); 
        onClose();
    };

    const renderHeader = () => (
        <div className={styles.header}>
            <div className={styles.headerContent}>
                <div className={styles.headerIcon}>
                    <BrainCircuit size={20} />
                </div>
                <h3>{roomName}: Стать модератором</h3>
            </div>
            <button className={styles.closeBtn} onClick={onClose}>
                <X size={20} />
            </button>
        </div>
    );

    const renderIntro = () => (
        <div className={styles.content}>
            <div className={styles.hero}>
                <Award size={64} className={styles.heroIcon} />
                <h2>Готовы помогать сообществу?</h2>
                <p>Наш ИИ подготовит для вас уникальный квалификационный тест, чтобы подтвердить ваши знания и навыки модерации.</p>
            </div>
            <div className={styles.features}>
                <div className={styles.featureItem}>
                    <Sparkles size={20} color="#8b5cf6" />
                    <span>Персональные вопросы по вашему стеку</span>
                </div>
                <div className={styles.featureItem}>
                    <ClipboardCheck size={20} color="#10b981" />
                    <span>Проверка этики и разруливания конфликтов</span>
                </div>
                <div className={styles.featureItem}>
                    <CheckCircle2 size={20} color="#3b82f6" />
                    <span>Мгновенный вердикт от ИИ</span>
                </div>
            </div>
            <button className={styles.primaryBtn} onClick={startApplication}>
                Начать подачу заявки 
                <ArrowRight size={18} />
            </button>
        </div>
    );

    const renderForm = () => (
        <div className={styles.content}>
            <h3>Краткая анкета</h3>
            <div className={styles.formGroup}>
                <label>Ваше полное имя</label>
                <input 
                    className={styles.input} 
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Напр. Иван Иванов"
                />
            </div>
            <div className={styles.formGroup}>
                <label>Ваша специализация (в этой комнате)</label>
                <input 
                    className={styles.input} 
                    value={specialization}
                    onChange={e => setSpecialization(e.target.value)}
                    placeholder="Напр. React разработчик, Python Expert"
                />
            </div>
            <div className={styles.formGroup}>
                <label>Ваш уровень</label>
                <div className={styles.levelRow}>
                    {(['beginner', 'intermediate', 'advanced'] as const).map(l => (
                        <button 
                            key={l}
                            className={`${styles.levelBtn} ${level === l ? styles.activeLevel : ''}`}
                            onClick={() => setLevel(l)}
                        >
                            {l.charAt(0).toUpperCase() + l.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            <button className={styles.primaryBtn} onClick={handleGenerateTest} disabled={isLoading}>
                {isLoading ? <Loader2 className={styles.spin} /> : 'Сгенерировать тест'}
            </button>
        </div>
    );

    const renderQuiz = () => {
        if (!testData) return null;
        const q = testData.questions[currentQuestionIdx];
        const progress = ((currentQuestionIdx + 1) / testData.questions.length) * 100;

        return (
            <div className={styles.content}>
                <div className={styles.quizHeader}>
                    <span className={styles.qType}>{q.question_type.toUpperCase()}</span>
                    <span className={styles.qCount}>Вопрос {currentQuestionIdx + 1}/{testData.questions.length}</span>
                </div>
                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                </div>
                <h2 className={styles.qText}>{q.question}</h2>
                <div className={styles.optionsGrid}>
                    {q.options.map((opt, idx) => (
                        <button 
                            key={idx} 
                            className={`${styles.optionBtn} ${userAnswers[currentQuestionIdx] === idx ? styles.activeOption : ''}`}
                            onClick={() => handleAnswer(idx)}
                        >
                            <span className={styles.optLetter}>{String.fromCharCode(65 + idx)}</span>
                            {opt}
                        </button>
                    ))}
                </div>
                {currentQuestionIdx === testData.questions.length - 1 && userAnswers[currentQuestionIdx] !== undefined && (
                    <button className={styles.submitBtn} onClick={submitTest}>
                        Завершить и отправить
                    </button>
                )}
            </div>
        );
    };

    const renderLoading = () => (
        <div className={styles.content}>
            <div className={styles.loaderArea}>
                <Loader2 size={48} className={styles.spin} />
                <h3>Анализируем ваши ответы...</h3>
                <p>Нейросеть проверяет ваши навыки и сопоставляет их с требованиями комнаты.</p>
            </div>
        </div>
    );

    const renderResult = () => {
        const isApproved = evaluation?.final_recommendation === 'approve';
        return (
            <div className={styles.content}>
                <div className={styles.resultHeader}>
                    {isApproved ? (
                        <CheckCircle2 color="#10b981" size={64} />
                    ) : (
                        <AlertCircle color="#f59e0b" size={64} />
                    )}
                    <h2>{isApproved ? 'Поздравляем!' : 'Требуется доработка'}</h2>
                </div>

                <div className={styles.statCards}>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Знания</span>
                        <span className={styles.statVal}>{evaluation?.knowledge_score}%</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statLabel}>Этичность</span>
                        <span className={styles.statVal}>{evaluation?.trust_score}%</span>
                    </div>
                </div>

                <div className={styles.evalReason}>
                    <h4>Вердикт ИИ:</h4>
                    <p>{evaluation?.reason}</p>
                </div>

                <div className={styles.actionButtons}>
                    {isApproved ? (
                        <>
                            <button className={styles.primaryBtn} onClick={contactAdmin}>
                                <MessageSquare size={18} />
                                Написать Админу
                            </button>
                            <p className={styles.hint}>Ваша заявка уже отправлена на проверку. Свяжитесь с админом для ускорения процесса.</p>
                        </>
                    ) : (
                        <button className={styles.secondaryBtn} onClick={onClose}>
                            Вернуться позже
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                {renderHeader()}
                {step === 'intro' && renderIntro()}
                {step === 'form' && renderForm()}
                {step === 'test' && renderQuiz()}
                {step === 'loading' && renderLoading()}
                {step === 'result' && renderResult()}
            </div>
        </div>
    );
};

export default ModeratorExamModal;
