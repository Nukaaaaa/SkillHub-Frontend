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
import { useAuth } from '../context/AuthContext';
import type { Room } from '../types';
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

    const handlePublish = async () => {
        if (!title.trim() || !content.trim() || !room) {
            toast.error(t('common.error') || 'Заполните заголовок и содержание');
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
                tags: tags
            });
            toast.success(t('article.published') || 'Статья успешно опубликована!');
            navigate(`/rooms/${room.slug}/articles`);
        } catch (error) {
            console.error('Failed to publish article', error);
            toast.error(t('common.error') || 'Ошибка при публикации статьи');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.createPage}>
            <nav className={styles.nav}>
                <div className={styles.navLeft}>
                    <button className={styles.closeBtn} onClick={() => navigate(-1)}>
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
                        onClick={handlePublish}
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
                            ИИ анализирует вашу статью на техническую грамотность в реальном времени.
                        </p>
                        <div className={styles.aiProgress}>
                            <div className={styles.progressLabel}>
                                <span>Профессионализм</span>
                                <span>--%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: '0%' }}></div>
                            </div>
                        </div>
                        <div className={styles.aiBgIcon}>
                            <Brain />
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default CreateArticlePage;
