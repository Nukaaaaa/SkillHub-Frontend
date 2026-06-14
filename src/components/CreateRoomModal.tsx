import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Loader2 } from 'lucide-react';
import styles from './CreateRoomModal.module.css';
import { roomService } from '../api/roomService';
import RoomIcon from './RoomIcon';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface CreateRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    directionSlug: string;
    onSuccess: () => void;
}

const AVAILABLE_ICONS = [
    { key: 'react', name: 'React' },
    { key: 'python', name: 'Python' },
    { key: 'postgres', name: 'PostgreSQL' },
    { key: 'typescript', name: 'TypeScript' },
    { key: 'javascript', name: 'JavaScript' },
    { key: 'node', name: 'Node.js' },
    { key: 'docker', name: 'Docker' },
    { key: 'java', name: 'Java' },
    { key: 'go', name: 'Go / Golang' },
    { key: 'vue', name: 'Vue' },
    { key: 'angular', name: 'Angular' },
    { key: 'htmlcss', name: 'HTML / CSS' },
    { key: 'git', name: 'Git' },
    { key: 'linux', name: 'Linux' },
    { key: 'robot', name: 'Robotics' },
    { key: 'ai', name: 'AI / ML' }
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
    isOpen,
    onClose,
    directionSlug,
    onSuccess
}) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [tagString, setTagString] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<string>('react');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
            // Reset form
            setName('');
            setDescription('');
            setIsPrivate(false);
            setTagString('');
            setSelectedIcon('react');
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error(t('rooms.roomNameRequired') || 'Введите название комнаты');
            return;
        }

        setSubmitting(true);
        try {
            // Process tags: split by comma, clean whitespace, remove empty values
            const customTags = tagString
                .split(',')
                .map(t => t.trim().toLowerCase())
                .filter(t => t.length > 0);

            // Add the special icon tag
            const finalTags = [...customTags, `icon:${selectedIcon}`];

            // Generate clean slug from name
            const generatedSlug = name
                .toLowerCase()
                .replace(/[^a-zа-я0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim();

            await roomService.createRoom({
                name: name.trim(),
                description: description.trim(),
                isPrivate,
                directionSlug,
                slug: generatedSlug,
                tags: finalTags
            });

            toast.success(t('rooms.roomCreated') || 'Комната успешно создана!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create room:', error);
            toast.error(error.response?.data?.message || 'Ошибка при создании комнаты');
        } finally {
            setSubmitting(false);
        }
    };

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{t('rooms.createRoom') || 'Создать комнату'}</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className={styles.body}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('rooms.roomName') || 'Название комнаты'} *</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Например: React Ecosystem"
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('rooms.description') || 'Описание'}</label>
                            <textarea
                                className={styles.textarea}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Опишите тему, технологии и цели этой комнаты..."
                                rows={3}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Теги (через запятую)</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={tagString}
                                onChange={(e) => setTagString(e.target.value)}
                                placeholder="frontend, hooks, state"
                            />
                        </div>

                        <div className={styles.iconGridSection}>
                            <label className={styles.label}>Выберите иконку стека</label>
                            <div className={styles.iconGrid}>
                                {AVAILABLE_ICONS.map(icon => (
                                    <div
                                        key={icon.key}
                                        className={`${styles.iconItem} ${selectedIcon === icon.key ? styles.selectedIconItem : ''}`}
                                        onClick={() => setSelectedIcon(icon.key)}
                                    >
                                        <RoomIcon
                                            name=""
                                            tags={[`icon:${icon.key}`]}
                                            size={32}
                                        />
                                        <span className={styles.iconName}>{icon.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                />
                                <span>{t('rooms.isPrivate') || 'Приватная комната'}</span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
                            {t('common.cancel') || 'Отмена'}
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={submitting}>
                            {submitting ? (
                                <>
                                    <Loader2 className="spin" size={16} />
                                    Создание...
                                </>
                            ) : (
                                t('common.create') || 'Создать'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CreateRoomModal;
