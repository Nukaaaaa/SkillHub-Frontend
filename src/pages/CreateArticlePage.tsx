import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    X,
    Brain,
    Bot
} from 'lucide-react';
import RichTextEditor from '../components/RichTextEditor';

import { contentService } from '../api/contentService';
import { aiService } from '../api/aiService';
import type { ArticleModerationResponse } from '../api/aiService';
import { useAuth } from '../context/AuthContext';
import type { Room } from '../types';
import { Loader2 } from 'lucide-react';
import AiDecisionModal from '../components/AiDecisionModal';
import styles from './CreatePostPage.module.css';

const CreateArticlePage: React.FC = () => {
    const { room } = useOutletContext<{ room: Room }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [submitting, setSubmitting] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);

    // AI Related State
    const [aiResult, setAiResult] = useState<ArticleModerationResponse | null>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiDecision, setShowAiDecision] = useState(false);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleAiCheck = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error('Заполните заголовок и текст для проверки');
            return;
        }

        setAiLoading(true);
        try {
            const result = await aiService.moderateArticle({
                requestId: `req-${Date.now()}`,
                roomId: room.id,
                difficultyLevel: difficulty,
                title,
                content
            });
            setAiResult(result);
            if (result.verdict === 'APPROVED') {
                toast.success('AI Инспектор: Контент одобрен!');
            } else {
                toast.error(`AI Инспектор: ${result.verdict}`);
            }
        } catch (error) {
            console.error('AI Moderation failed', error);
            toast.error('Не удалось связаться с AI Инспектором');
        } finally {
            setAiLoading(false);
        }
    };

    const handlePublish = async (forcedStatus?: 'PUBLISHED' | 'DRAFT' | 'DELETED') => {
        if (!title.trim() || !content.trim() || !room) {
            toast.error(t('common.error') || 'Заполните заголовок и содержание');
            return;
        }

        // If user just clicks "Publish" but AI found issues, show decision modal
        if (!forcedStatus && aiResult?.verdict === 'NEEDS_REVISION') {
            setShowAiDecision(true);
            return;
        }

        if (forcedStatus === 'DELETED') {
            navigate(-1);
            return;
        }

        setSubmitting(true);
        try {
            await contentService.createArticle({
                title,
                content,
                roomId: room.id,
                userId: user?.id,
                difficultyLevel: difficulty,
                tags: tags,
                articleStatus: forcedStatus || 'PUBLISHED',
                aiModerationVerdict: aiResult?.verdict || null,
                aiModerationNote: aiResult?.note || null
            });
            
            const actionText = forcedStatus === 'DRAFT' ? 'сохранена как черновик' : 'успешно опубликована';
            toast.success(`Статья ${actionText}!`);
            
            navigate(`/rooms/${room.slug}/articles`);
        } catch (error) {
            console.error('Failed to publish article', error);
            toast.error(t('common.error') || 'Ошибка при сохранении статьи');
        } finally {
            setSubmitting(false);
            setShowAiDecision(false);
        }
    };

    const handleCloseWithCheck = () => {
        if (aiResult?.verdict === 'NEEDS_REVISION' && (title.trim() || content.trim())) {
            setShowAiDecision(true);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className={styles.createPage}>
            <nav className={styles.nav}>
                <div className={styles.navLeft}>
                    <button className={styles.closeBtn} onClick={handleCloseWithCheck}>
                        <X size={24} />
                    </button>
                    <h1 className={styles.title}>{t('article.edit') || 'Написать статью'}</h1>
                </div>
                <div className={styles.navRight}>
                    <span className={styles.autoSaveInfo}>
                        Черновик сохранен в {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                        className={styles.publishBtn}
                        onClick={() => handlePublish()}
                        disabled={submitting || !title.trim() || !content.trim()}
                    >
                        {submitting ? t('common.loading') : (t('common.publish') || 'Опубликовать')}
                    </button>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.editorSection}>
                    <div className={styles.formArea}>
                        <div className={styles.titleFieldGroup} style={{ marginBottom: '1.5rem' }}>
                            <input
                                type="text"
                                className={styles.titleInput}
                                placeholder={t('article.title') || 'Заголовок статьи...'}
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={120}
                                autoFocus
                            />
                        </div>

                        <RichTextEditor
                            content={content}
                            onChange={setContent}
                            placeholder={t('rooms.writeHere') || 'Начните писать здесь профессиональный контент...'}
                        />
                    </div>
                </div>

                <aside className={styles.sidebar}>
                    <div className={styles.widget}>
                        <h3 className={styles.widgetTitle}>{t('settings.title') || 'Настройки'}</h3>

                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel}>{t('article.difficulty') || 'Уровень сложности'}</label>
                            <select
                                className={styles.select}
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as any)}
                            >
                                <option value="BEGINNER">{t('difficulty.beginner') || 'Junior'}</option>
                                <option value="INTERMEDIATE">{t('difficulty.intermediate') || 'Middle'}</option>
                                <option value="ADVANCED">{t('difficulty.advanced') || 'Senior'}</option>
                            </select>
                        </div>

                        <div className={styles.settingGroup} style={{ marginTop: '1.5rem' }}>
                            <label className={styles.settingLabel}>{t('tags.title') || 'Теги'}</label>
                            <div className={styles.tagInputWrapper}>
                                <input
                                    type="text"
                                    className={styles.select}
                                    placeholder={t('tags.placeholder') || 'Введите тег...'}
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleAddTag}
                                />
                                <div className={styles.tagsCloud}>
                                    {tags.map(tag => (
                                        <span key={tag} className={styles.tag}>
                                            #{tag}
                                            <button className={styles.removeTag} onClick={() => removeTag(tag)}>
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.aiWidget}>
                        <div className={styles.aiHeader}>
                            <div className={styles.aiIcon}>
                                <Bot size={20} />
                            </div>
                            <span className={styles.aiTitle}>AI Инспектор</span>
                        </div>
                        <p className={styles.aiText}>
                            {aiResult ? aiResult.note : 'ИИ анализирует вашу статью на техническую грамотность в реальном времени.'}
                        </p>
                        
                        {aiResult && (
                            <div className={`${styles.verdict} ${styles[aiResult.verdict]}`}>
                                {aiResult.verdict}
                            </div>
                        )}

                        <div className={styles.aiProgress}>
                            <div className={styles.progressLabel}>
                                <span>Профессионализм</span>
                                <span>{aiResult?.qualityScore ?? '--'}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${aiResult?.qualityScore ?? 0}%` }}></div>
                            </div>
                        </div>

                        <button 
                            className={styles.aiActionBtn} 
                            onClick={handleAiCheck}
                            disabled={aiLoading || !title.trim() || !content.trim()}
                            style={{ width: '100%', marginTop: '1rem' }}
                        >
                            {aiLoading ? (
                                <>
                                    <Loader2 className={styles.spin} size={16} />
                                    Анализирую...
                                </>
                            ) : (
                                <>
                                    <Brain size={16} />
                                    Запустить проверку
                                </>
                            )}
                        </button>

                        <div className={styles.aiBgIcon}>
                            <Brain />
                        </div>
                    </div>
                </aside>
            </main>

            <AiDecisionModal 
                isOpen={showAiDecision}
                onClose={() => setShowAiDecision(false)}
                aiNote={aiResult?.note || null}
                onAction={(status) => handlePublish(status)}
            />
        </div>
    );
};

export default CreateArticlePage;
