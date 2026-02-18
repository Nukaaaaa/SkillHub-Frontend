import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import styles from './SettingsPage.module.css';
import { Bell, Globe, Lock, AlertTriangle, RefreshCcw, User, Mail, FileText, Key } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const { user, updateUser, resetToDefaults } = useAuth();
    const { showToast } = useToast();
    const { t } = useTranslation();

    // Original values to compare and preserve keys
    const [initialUser, setInitialUser] = React.useState<any>(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: ''
    });

    // Initialize/Update form data when user or locale changes
    React.useEffect(() => {
        if (user) {
            setInitialUser(user);
            setFormData({
                name: t(user.name ?? ''),
                email: user.email ?? '',
                bio: t(user.bio ?? '')
            });
        }
    }, [user, t]);

    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    const handleSave = () => {
        const updates: any = { ...formData };

        // Key Preservation Logic:
        // If the current translated text in the input matches exactly what 
        // the original key translates to, we keep the original key!
        if (initialUser) {
            if (formData.name === t(initialUser.name)) updates.name = initialUser.name;
            if (formData.bio === t(initialUser.bio)) updates.bio = initialUser.bio;
        }

        updateUser(updates);
        showToast(t('settings.profileUpdated'));
    };

    const handlePasswordChange = (e?: React.FormEvent | React.MouseEvent) => {
        if (e && 'preventDefault' in e) e.preventDefault();

        if (!passwordData.new || !passwordData.confirm) {
            return; // Basic validation
        }

        if (passwordData.new !== passwordData.confirm) {
            showToast(t('settings.passwordMatchError'), 'error');
            return;
        }

        updateUser({ password: passwordData.new });
        showToast(t('settings.passwordUpdated'));
        setIsPasswordModalOpen(false);
        setPasswordData({ current: '', new: '', confirm: '' });
    };

    const handleReset = () => {
        if (window.confirm(t('settings.resetConfirm'))) {
            resetToDefaults();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{t('settings.title')}</h2>
            </div>

            <div style={{ display: 'grid', gap: '2rem' }}>
                <Card title={t('settings.account')}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
                            <Input
                                label={t('settings.displayName')}
                                icon={<User size={18} />}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                            <Input
                                label={t('settings.email')}
                                icon={<Mail size={18} />}
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <Input
                            label={t('settings.bio')}
                            icon={<FileText size={18} />}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            placeholder={t('settings.bioPlaceholder')}
                        />
                        <Button style={{ width: 'fit-content', padding: '0.6rem 2rem' }} onClick={handleSave}>
                            {t('settings.saveChanges')}
                        </Button>
                    </div>
                </Card>

                <Card title={t('settings.notifications')}>
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '0.5rem' }}>
                                    <Bell size={20} color="var(--primary-color)" />
                                </div>
                                <span style={{ fontWeight: 500 }}>{t('settings.emailNotifications')}</span>
                            </div>
                            <input type="checkbox" defaultChecked />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ padding: '0.5rem', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '0.5rem' }}>
                                    <Globe size={20} color="var(--primary-color)" />
                                </div>
                                <span style={{ fontWeight: 500 }}>{t('settings.publicProfile')}</span>
                            </div>
                            <input type="checkbox" defaultChecked />
                        </div>
                    </div>
                </Card>

                <Card title={t('settings.security')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', backgroundColor: 'rgba(var(--primary-rgb), 0.05)', borderRadius: '0.5rem' }}>
                                <Lock size={20} color="var(--primary-color)" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <p style={{ margin: 0, fontWeight: 500, fontSize: '0.95rem' }}>{t('settings.changePassword')}</p>
                                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Рекомендуется менять пароль раз в несколько месяцев</p>
                            </div>
                            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)}>
                                {t('settings.changePassword')}
                            </Button>
                        </div>

                        <div style={{
                            borderTop: '1px solid var(--border-color)',
                            paddingTop: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ff4444' }}>
                                <AlertTriangle size={20} />
                                <span style={{ fontWeight: 600 }}>{t('settings.dangerZone')}</span>
                            </div>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                                {t('settings.dangerZoneDesc')}
                            </p>
                            <Button
                                variant="secondary"
                                style={{ width: 'fit-content', borderColor: '#ff4444', color: '#ff4444' }}
                                icon={<RefreshCcw size={16} />}
                                onClick={handleReset}
                            >
                                {t('settings.resetData')}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
                title={t('settings.changePassword')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handlePasswordChange}>{t('settings.changePassword')}</Button>
                    </>
                }
            >
                <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '1.25rem', padding: '0.5rem 0' }}>
                    <Input
                        label={t('settings.currentPassword')}
                        type="password"
                        icon={<Key size={18} />}
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                        required
                    />
                    <Input
                        label={t('settings.newPassword')}
                        type="password"
                        icon={<Key size={18} />}
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        required
                    />
                    <Input
                        label={t('settings.confirmPassword')}
                        type="password"
                        icon={<Key size={18} />}
                        value={passwordData.confirm}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        required
                    />
                </form>
            </Modal>
        </div>
    );
};

export default SettingsPage;
