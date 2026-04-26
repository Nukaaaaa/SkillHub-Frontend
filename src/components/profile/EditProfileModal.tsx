import React, { useState, useRef } from 'react';
import { X, Camera, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import styles from './EditProfileModal.module.css';
import Avatar from '../Avatar';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        firstname: user?.firstname || '',
        lastname: user?.lastname || '',
        bio: user?.bio || '',
        universite: user?.universite || '',
        avatar: user?.avatar || '',
        githubUrl: user?.githubUrl || '',
        avatarFile: undefined as File | undefined
    });

    const [isSaving, setIsSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen && user) {
            setFormData({
                firstname: user.firstname || '',
                lastname: user.lastname || '',
                bio: user.bio || '',
                universite: user.universite || '',
                avatar: user.avatar || '',
                githubUrl: user.githubUrl || '',
                avatarFile: undefined
            });
            setPreviewUrl(user.avatar || null);
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreviewUrl(base64String);
                setFormData(prev => ({ ...prev, avatarFile: file }));
            };
            reader.readAsDataURL(file);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateUser(formData);
            toast.success(t('settings.profileUpdated'));
            onClose();
        } catch (error) {
            console.error('Failed to update profile:', error);
            toast.error(t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{t('profile.edit')}</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className={styles.editForm}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatarPreviewContainer}>
                            <Avatar 
                                src={previewUrl} 
                                name={user.firstname || user.name} 
                                size="xl"
                                className={styles.avatarPreview}
                            />
                            <button
                                type="button"
                                className={styles.uploadOverlay}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera size={24} />
                            </button>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <p className={styles.avatarNote}>{t('common.offline')}</p>
                    </div>

                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('profile.name')}</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.firstname}
                                onChange={e => setFormData(prev => ({ ...prev, firstname: e.target.value }))}
                                placeholder={t('profile.name')}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('profile.lastname')}</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.lastname}
                                onChange={e => setFormData(prev => ({ ...prev, lastname: e.target.value }))}
                                placeholder={t('profile.lastname')}
                                required
                            />
                        </div>
                        <div className={styles.formGroup + ' ' + styles.fullWidth}>
                            <label className={styles.label}>{t('profile.university')}</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.universite}
                                onChange={e => setFormData(prev => ({ ...prev, universite: e.target.value }))}
                                placeholder={t('profile.university')}
                            />
                        </div>
                        <div className={styles.formGroup + ' ' + styles.fullWidth}>
                            <label className={styles.label}>{t('profile.bio')}</label>
                            <textarea
                                className={styles.textarea}
                                value={formData.bio}
                                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                placeholder={t('profile.bioPlaceholder') || t('profile.noBio')}
                                rows={4}
                            />
                        </div>
                        <div className={styles.formGroup + ' ' + styles.fullWidth}>
                            <label className={styles.label}>{t('profile.githubUrl')}</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.githubUrl}
                                onChange={e => setFormData(prev => ({ ...prev, githubUrl: e.target.value }))}
                                placeholder={t('profile.githubPlaceholder')}
                            />
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={isSaving}>
                            {t('common.cancel')}
                        </button>
                        <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                            {isSaving ? (
                                <div className={styles.spinner} />
                            ) : (
                                <><Check size={18} /> {t('common.save')}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;
