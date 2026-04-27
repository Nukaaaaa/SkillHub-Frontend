import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { getServiceClient } from '../api/client';
import styles from './ForgotPassword.module.css';
import LanguageSelector from '../components/LanguageSelector';

const userClient = getServiceClient('USER');

const ForgotPassword: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const loadingToast = toast.loading(t('common.loading') || 'Отправка кода...');
        try {
            await userClient.post('/auth/password/forgot', { email });
            toast.success('Код для сброса пароля отправлен на вашу почку', { id: loadingToast });
            setStep(2);
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('common.error'), { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Пароли не совпадают');
            return;
        }
        
        setLoading(true);
        const loadingToast = toast.loading(t('common.loading') || 'Обновление пароля...');
        try {
            await userClient.post('/auth/password/reset', {
                email,
                code,
                password,
                confirm_password: confirmPassword
            });
            toast.success('Пароль успешно изменен! Теперь вы можете войти.', { id: loadingToast });
            navigate('/login');
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('common.error'), { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.bodyWrapper}>
            <LanguageSelector variant="floating" />
            <div className={styles.authContainer}>
                <div className={styles.header}>
                    <div className={styles.logoWrapper}>
                        <div className={styles.logoIcon}>
                            <i className="fas fa-key"></i>
                        </div>
                    </div>
                    <h1 className={styles.title}>
                        {step === 1 ? 'Восстановление доступа' : 'Новый пароль'}
                    </h1>
                    <p className={styles.subtitle}>
                        {step === 1 
                            ? 'Введите почту, чтобы получить код доступа' 
                            : 'Введите код из письма и новый пароль'}
                    </p>
                </div>

                {step === 1 ? (
                    <form className={styles.form} onSubmit={handleSendCode}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('login.email')}</label>
                            <input
                                type="email"
                                placeholder="example@mail.com"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? 'Отправка...' : 'Отправить код'}
                        </button>
                    </form>
                ) : (
                    <form className={styles.form} onSubmit={handleResetPassword}>
                        <div className={styles.infoBox}>
                            <div className={styles.infoIcon}><i className="fas fa-info-circle"></i></div>
                            <div className={styles.infoText}>
                                Код отправлен на <strong>{email}</strong>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Код подтверждения (6 цифр)</label>
                            <input
                                type="text"
                                placeholder="000000"
                                className={`${styles.input} ${styles.codeInput}`}
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                maxLength={6}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Новый пароль</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Подтвердите пароль</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className={styles.input}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitButton} disabled={loading}>
                            {loading ? 'Обновление...' : 'Сменить пароль'}
                        </button>
                        
                        <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
                            onClick={() => setStep(1)}
                        >
                            Использовать другой Email
                        </button>
                    </form>
                )}

                <div className={styles.backToLogin}>
                    <Link to="/login" className={styles.backLink}>
                        <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
                        Вернуться ко входу
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
