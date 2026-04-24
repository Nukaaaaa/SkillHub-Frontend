import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import styles from './Register.module.css';
import LanguageSelector from '../components/LanguageSelector';

const Register: React.FC = () => {
    const { t } = useTranslation();
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [code, setCode] = useState('');
    const [step, setStep] = useState<1 | 2>(1);
    const [universite, setUniversite] = useState('');
    const [bio, setBio] = useState('');
    const [avatar, setAvatar] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const { register, registerSendCode } = useAuth();
    const navigate = useNavigate();

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Пароли не совпадают!');
            return;
        }
        setLoading(true);
        const loadingToast = toast.loading('Отправка кода на почту...');
        try {
            await registerSendCode(email);
            toast.success('Код отправлен! Проверьте вашу почту.', { id: loadingToast });
            setStep(2);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Ошибка отправки кода', { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const loadingToast = toast.loading(t('common.loading') || 'Creating account...');
        try {
            await register({
                firstname,
                lastname,
                email,
                password,
                confirm_password: confirmPassword,
                code,
                universite,
                bio,
                avatar: avatar || undefined
            });
            toast.success(t('login.registerSuccess'), { id: loadingToast });
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.error || t('login.registerError'), { id: loadingToast });
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        // Social login will be implemented with full OAuth flow
        console.log(`Social login initiated for ${provider}`);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatar(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={styles.bodyWrapper}>
            <LanguageSelector variant="floating" />
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

                    <div className={styles.socialGrid}>
                        <button className={styles.socialButton} type="button" onClick={() => handleSocialLogin('Google')}>
                            <i className="fab fa-google" style={{ color: '#ea4335' }}></i> Google
                        </button>
                        <button className={styles.socialButton} type="button" onClick={() => handleSocialLogin('LinkedIn')}>
                            <i className="fab fa-linkedin" style={{ color: '#0077b5' }}></i> LinkedIn
                        </button>
                        <button className={styles.socialButton} type="button" onClick={() => handleSocialLogin('GitHub')}>
                            <i className="fab fa-github" style={{ color: '#333' }}></i> GitHub
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <div className={styles.dividerLine}></div>
                        <span className={styles.dividerText}>{t('login.orWithEmail')}</span>
                        <div className={styles.dividerLine}></div>
                    </div>

                    <form className={styles.form} onSubmit={step === 1 ? handleSendCode : handleRegister}>
                        {step === 1 && (
                            <>
                        <div className={styles.avatarUpload}>
                            <div className={styles.avatarPreviewWrapper}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar preview" className={styles.avatarPreview} />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        <i className="fas fa-camera"></i>
                                    </div>
                                )}
                                <label htmlFor="avatar-input" className={styles.uploadOverlay}>
                                    <i className="fas fa-plus"></i>
                                </label>
                            </div>
                            <div className={styles.avatarInfo}>
                                <span className={styles.avatarLabel}>{t('profile.uploadAvatar') || 'Загрузить аватар'}</span>
                                <p className={styles.avatarHint}>JPG, PNG или GIF (макс. 5MB)</p>
                            </div>
                            <input 
                                id="avatar-input"
                                type="file" 
                                accept="image/*" 
                                onChange={handleAvatarChange} 
                                className={styles.hiddenInput}
                            />
                        </div>

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

                        <div className={styles.formRow}>
                            <div className={styles.formGroup} style={{ position: 'relative' }}>
                                <label className={styles.label}>{t('login.password')}</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={styles.input}
                                    style={{ paddingRight: '40px' }}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
                                >
                                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
                            <div className={styles.formGroup} style={{ position: 'relative' }}>
                                <label className={styles.label}>Подтвердите</label>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className={styles.input}
                                    style={{ paddingRight: '40px' }}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{ position: 'absolute', right: '10px', top: '38px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
                                >
                                    <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                </button>
                            </div>
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

                            </>
                        )}

                        {step === 2 && (
                            <>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Введите 6-значный код из почты</label>
                                    <input
                                        type="text"
                                        placeholder="______"
                                        className={styles.input}
                                        style={{ fontSize: '24px', letterSpacing: '8px', textAlign: 'center' }}
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                        required
                                        maxLength={6}
                                    />
                                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px', textAlign: 'center' }}>
                                        Мы отправили код подтверждения на {email}
                                    </p>
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? '...' : (step === 1 ? 'Далее (Отправить код)' : t('login.registerSubmit'))}
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
