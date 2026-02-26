import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import {
    X,
    Pencil,
    HelpCircle,
    Bold,
    Italic,
    Link as LinkIcon,
    Code,
    Image as ImageIcon,
    List,
    Brain,
    Bot
} from 'lucide-react';

import { roomService } from '../api/roomService';
import { contentService } from '../api/contentService';
import type { Room, DifficultyLevel } from '../types';
import { useAuth } from '../context/AuthContext';
import styles from './CreatePostPage.module.css';
import Loader from '../components/Loader';

const CreatePostPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Initial state from location (if navigated from a specific room)
    const queryParams = new URLSearchParams(location.search);
    const initialRoomId = queryParams.get('roomId') ? Number(queryParams.get('roomId')) : undefined;
    const initialType = (queryParams.get('type') as 'POST' | 'QUESTION' | 'ARTICLE') || 'POST';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);

    // Form State
    const [type, setType] = useState<'POST' | 'QUESTION'>(initialType === 'ARTICLE' ? 'POST' : initialType as 'POST' | 'QUESTION');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [roomId, setRoomId] = useState<number | undefined>(initialRoomId);
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('INTERMEDIATE');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>(['go', 'sql']);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                // Fetch all rooms or rooms joined by user
                const data = await roomService.getRoomsByDirection(user?.selectedDirectionId || 1);
                setRooms(data);
                if (!roomId && data.length > 0) {
                    setRoomId(data[0].id);
                }
            } catch (error) {
                console.error('Failed to fetch rooms', error);
                toast.error(t('common.error'));
            } finally {
                setLoading(false);
            }
        };
        fetchRooms();
    }, [user, roomId, t]);


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
        if (!content.trim() || !roomId || !title.trim()) {
            toast.error(t('common.error'));
            return;
        }

        setSubmitting(true);
        try {
            await contentService.createPost({
                title,
                content,
                roomId,
                userId: user?.id,
                postType: type === 'QUESTION' ? 'QUESTION' : 'DISCUSSION'
            });
            toast.success(t('post.created'));
            navigate(`/rooms/${roomId}`);
        } catch (error) {
            console.error('Failed to publish', error);
            toast.error(t('common.error'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.createPage}>
            <nav className={styles.nav}>
                <div className={styles.navLeft}>
                    <button className={styles.closeBtn} onClick={() => navigate(-1)}>
                        <X size={24} />
                    </button>
                    <h1 className={styles.title}>{t('rooms.newPost') || 'Новая публикация'}</h1>
                </div>
                <div className={styles.navRight}>
                    <span className={styles.autoSaveInfo}>
                        Автосохранение в {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                        className={styles.publishBtn}
                        onClick={handlePublish}
                        disabled={submitting || !content.trim()}
                    >
                        {submitting ? t('common.loading') : (t('common.publish') || 'Опубликовать')}
                    </button>
                </div>
            </nav>

            <main className={styles.main}>
                <div className={styles.editorSection}>
                    <div className={styles.typeSelector}>
                        <button
                            className={`${styles.typeBtn} ${type === 'POST' ? styles.active : ''}`}
                            onClick={() => setType('POST')}
                        >
                            <Pencil size={18} />
                            {t('rooms.post') || 'Пост'}
                        </button>
                        <button
                            className={`${styles.typeBtn} ${type === 'QUESTION' ? styles.active : ''}`}
                            onClick={() => setType('QUESTION')}
                        >
                            <HelpCircle size={18} />
                            {t('rooms.question') || 'Вопрос'}
                        </button>
                    </div>

                    <div className={styles.formArea}>
                        <input
                            type="text"
                            className={styles.titleInput}
                            placeholder={t('article.title') || 'Заголовок публикации'}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={120}
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
                            placeholder={t('rooms.writeHere') || 'Начните писать здесь...'}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                </div>

                <aside className={styles.sidebar}>
                    <div className={styles.widget}>
                        <h3 className={styles.widgetTitle}>{t('settings.title') || 'Настройки'}</h3>

                        <div className={styles.settingGroup}>
                            <label className={styles.settingLabel}>{t('rooms.room') || 'Комната'}</label>
                            <select
                                className={styles.select}
                                value={roomId}
                                onChange={(e) => setRoomId(Number(e.target.value))}
                            >
                                {rooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                ))}
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
                            ИИ анализирует ваш текст на профессионализм и точность в реальном времени.
                        </p>
                        <div className={styles.aiProgress}>
                            <div className={styles.progressLabel}>
                                <span>Профессионализм</span>
                                <span>85%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: '85%' }}></div>
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

export default CreatePostPage;
