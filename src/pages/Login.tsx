import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import styles from './Login.module.css';

const Login: React.FC = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const loadingToast = toast.loading(t('common.loading') || 'Logging in...');
        try {
            await login(email, password);
            toast.success(t('login.success') || 'Welcome back!', { id: loadingToast });
            navigate('/');
        } catch (error) {
            toast.error(t('login.error') || 'Invalid credentials. Please try again.', { id: loadingToast });
        }
    };

    return (
        <div className={styles.bodyWrapper}>
            <div className={styles.loginContainer}>
                <div className={styles.header}>
                    <div className={styles.logoWrapper}>
                        <div className={styles.logoIcon}>
                            <i className="fas fa-hubspot"></i>
                        </div>
                    </div>
                    <h1 className={styles.title}>{t('login.title')}</h1>
                    <p className={styles.subtitle}>{t('login.subtitle')}</p>
                </div>

                <div className={styles.card}>
                    <div className={styles.socialGrid}>
                        <button className={styles.socialButton} type="button">
                            <i className="fab fa-google" style={{ color: '#ea4335' }}></i> Google
                        </button>
                        <button className={styles.socialButton} type="button">
                            <i className="fab fa-linkedin" style={{ color: '#0077b5' }}></i> LinkedIn
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <div className={styles.dividerLine}></div>
                        <span className={styles.dividerText}>{t('login.orWithEmail')}</span>
                        <div className={styles.dividerLine}></div>
                    </div>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <div className={styles.labelWrapper}>
                                <label className={styles.label}>{t('login.email')}</label>
                            </div>
                            <input
                                type="email"
                                placeholder="example@mail.com"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <div className={styles.labelWrapper}>
                                <label className={styles.label}>{t('login.password')}</label>
                                <a href="#" className={styles.forgotLink}>{t('login.forgotPassword')}</a>
                            </div>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className={styles.input}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitButton}>
                            {t('login.signInAccount')}
                        </button>
                    </form>
                </div>

                <p className={styles.registerText}>
                    {t('login.newHere')} {' '}
                    <Link to="/register" className={styles.registerLink}>
                        {t('login.createAccount')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
