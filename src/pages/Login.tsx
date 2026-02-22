import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import styles from './Login.module.css';
import { Zap, Mail, Lock } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';

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
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.branding}>
                    <div className={styles.logo}>
                        <Zap size={32} color="white" fill="white" />
                    </div>
                    <h1 className={styles.brandName}>SkillHub</h1>
                    <p className={styles.subtitle}>{t('login.title')}</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <Input
                            label={t('login.email')}
                            type="email"
                            icon={<Mail size={18} />}
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label={t('login.password')}
                            type="password"
                            icon={<Lock size={18} />}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className={styles.submitButton}>
                        {t('login.submit')}
                    </Button>

                    <div className={styles.footer}>
                        <span>{t('login.noAccount') || "Don't have an account?"} </span>
                        <Link to="/register" className={styles.link}>
                            {t('login.registerHeader') || 'Sign Up'}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
