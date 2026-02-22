import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import styles from './Login.module.css';
import { Zap, Mail, Lock, User, School, FileText } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';

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
        try {
            await register({
                firstname,
                lastname,
                email,
                password,
                universite,
                bio
            });
            navigate('/');
        } catch (error) {
            alert('Registration failed. Check if email is already in use or fill all fields.');
        } finally {
            setLoading(false);
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
                    <p className={styles.subtitle}>{t('login.registerTitle') || 'Create your account'}</p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <Input
                                label={t('profile.name') || 'First Name'}
                                type="text"
                                icon={<User size={18} />}
                                placeholder="John"
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                                required
                            />
                            <Input
                                label={t('profile.lastname') || 'Last Name'}
                                type="text"
                                icon={<User size={18} />}
                                placeholder="Doe"
                                value={lastname}
                                onChange={(e) => setLastname(e.target.value)}
                                required
                            />
                        </div>

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

                        <Input
                            label={t('profile.university') || 'University'}
                            type="text"
                            icon={<School size={18} />}
                            placeholder="Harvard University"
                            value={universite}
                            onChange={(e) => setUniversite(e.target.value)}
                            required
                        />

                        <Input
                            label={t('profile.bio') || 'About you'}
                            type="text"
                            icon={<FileText size={18} />}
                            placeholder="Computer Science Student..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className={styles.submitButton} disabled={loading}>
                        {loading ? '...' : (t('login.registerSubmit') || 'Register')}
                    </Button>

                    <div className={styles.footer}>
                        <span>{t('login.haveAccount') || 'Already have an account?'} </span>
                        <Link to="/login" className={styles.link}>
                            {t('login.submit')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
