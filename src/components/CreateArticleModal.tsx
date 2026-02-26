import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    X,
    Bold,
    Italic,
    Link as LinkIcon,
    Code,
    Image as ImageIcon,
    List,
    Brain,
    Bot
} from 'lucide-react';

import { contentService } from '../api/contentService';
import { useAuth } from '../context/AuthContext';
import styles from './CreateArticleModal.module.css';

interface CreateArticleModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomId: number;
    onSuccess?: () => void;
}

const CreateArticleModal: React.FC<CreateArticleModalProps> = ({
    isOpen,
    onClose,
    roomId,
    onSuccess
}) => {
    const { t } = useTranslation();
    const { user } = useAuth();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setContent('');
            setTags([]);
            setDifficulty('BEGINNER');
        }
    }, [isOpen]);

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
        if (!title.trim() || !content.trim()) {
            toast.error('Заполните заголовок и содержание');
            return;
        }

        setSubmitting(true);
        try {
            await contentService.createArticle({
                title,
                content,
                roomId,
                userId: user?.id,
                difficultyLevel: difficulty,
            });
            toast.success('Статья успешно опубликована!');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to publish article', error);
            toast.error('Ошибка при публикации статьи');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div className={styles.modalContent}>
                <nav className={styles.nav}>
                    <div className={styles.navLeft}>
                        <button className={styles.closeBtn} onClick={onClose}>
                            <X size={24} />
                        </button>
                        <h1 className={styles.title}>Написать профессиональную статью</h1>
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
                            {submitting ? 'Публикация...' : 'Опубликовать'}
                        </button>
                    </div>
                </nav>

                <main className={styles.main}>
                    <div className={styles.editorSection}>
                        <div className={styles.formArea}>
                            <input
                                type="text"
                                className={styles.titleInput}
                                placeholder="Заголовок вашей статьи..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                maxLength={120}
                                autoFocus
                            />

                            <div className={styles.toolbar}>
                                <button className={styles.toolBtn}><Bold size={18} /></button>
                                <button className={styles.toolBtn}><Italic size={18} /></button>
                                <button className={styles.toolBtn}><LinkIcon size={18} /></button>
                                <button className={styles.toolBtn}><Code size={18} /></button>
                                <button className={styles.toolBtn}><ImageIcon size={18} /></button>
                                <div className={styles.divider} />
                                <button className={styles.toolBtn}><List size={18} /></button>
                            </div>

                            <textarea
                                className={styles.contentArea}
                                placeholder="Начните писать здесь профессиональный контент..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>
                    </div>

                    <aside className={styles.sidebar}>
                        <div className={styles.widget}>
                            <h3 className={styles.widgetTitle}>Настройки статьи</h3>

                            <div className={styles.settingGroup}>
                                <label className={styles.settingLabel}>Уровень сложности</label>
                                <select
                                    className={styles.select}
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value as any)}
                                >
                                    <option value="BEGINNER">Junior</option>
                                    <option value="INTERMEDIATE">Middle</option>
                                    <option value="ADVANCED">Senior</option>
                                </select>
                            </div>

                            <div className={styles.settingGroup}>
                                <label className={styles.settingLabel} style={{ marginTop: '1.5rem' }}>Теги</label>
                                <div className={styles.tagInputWrapper}>
                                    <input
                                        type="text"
                                        className={styles.select}
                                        placeholder="Введите тег и нажмите Enter..."
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
                                ИИ проверит вашу статью на техническую грамотность в реальном времени.
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
                                <Brain size={80} />
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
};

export default CreateArticleModal;
