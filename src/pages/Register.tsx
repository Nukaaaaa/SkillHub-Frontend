import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import styles from './Register.module.css';

const Register: React.FC = () => {
    const { t } = useTranslation();
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [universite, setUniversite] = useState('');
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(false);

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const loadingToast = toast.loading(t('common.loading') || 'Creating account...');
        try {
            await register({
                firstname,
                lastname,
                email,
                password,
                universite,
                bio
            });
            toast.success(t('login.registerSuccess'), { id: loadingToast });
            navigate('/');
        } catch (error) {
            toast.error(t('login.registerError'), { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.bodyWrapper}>
            <div className={styles.registerContainer}>
                {/* Left Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.circleDecoration}></div>

                    <div className={styles.sidebarContent}>
                        <div className={styles.iconWrapper}>
                            <i className="fas fa-rocket"></i>
                        </div>
                        <h2 className={styles.sidebarTitle}>
                            {t('login.registerSidebarTitle')}
                        </h2>
                        <p className={styles.sidebarText}>
                            {t('login.registerSidebarText')}
                        </p>
                    </div>

                    <div className={styles.sidebarFooter}>
                        <div className={styles.avatars}>
                            <img
                                className={styles.avatar}
                                src="https://ui-avatars.com/api/?name=Doc&background=random"
                                alt="avatar"
                            />
                            <img
                                className={styles.avatar}
                                src="https://ui-avatars.com/api/?name=Artist&background=random"
                                alt="avatar"
                            />
                            <img
                                className={styles.avatar}
                                src="https://ui-avatars.com/api/?name=Lawyer&background=random"
                                alt="avatar"
                            />
                        </div>
                        <p className={styles.statsText}>
                            {t('login.registerSidebarStats')}
                        </p>
                    </div>
                </div>

                {/* Right Form Section */}
                <div className={styles.formSection}>
                    <h3 className={styles.formTitle}>{t('login.registerTitle')}</h3>
                    <p className={styles.formSubtitle}>
                        {t('login.registerFormSubtitle')}
                    </p>

                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('profile.name')}</label>
                                <input
                                    type="text"
                                    placeholder="Имя"
                                    className={styles.input}
                                    value={firstname}
                                    onChange={(e) => setFirstname(e.target.value)}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>{t('profile.lastname')}</label>
                                <input
                                    type="text"
                                    placeholder="Фамилия"
                                    className={styles.input}
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('login.email')}</label>
                            <input
                                type="email"
                                placeholder="alex@example.com"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('login.password')}</label>
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
                            <label className={styles.label}>{t('profile.universite') || 'Университет'}</label>
                            <input
                                type="text"
                                placeholder="Название учебного заведения"
                                className={styles.input}
                                value={universite}
                                onChange={(e) => setUniversite(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>{t('profile.bio')}</label>
                            <textarea
                                placeholder="Краткая информация о себе..."
                                className={`${styles.input} ${styles.textarea}`}
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? '...' : t('login.registerSubmit')}
                        </button>
                    </form>

                    <p className={styles.loginPrompt}>
                        {t('login.haveAccount')} {' '}
                        <Link to="/login" className={styles.loginLink}>
                            {t('login.submit')}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
