import React from 'react';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css'; // Reuse container styles
import Card from '../components/Card';
import { User, Mail, Shield, Award } from 'lucide-react';
import SkillsChart from '../components/SkillsChart';
import { useTranslation } from 'react-i18next';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const { t } = useTranslation();

    if (!user) return <div className={styles.container}>{t('nav.profile')}</div>;

    const skillData = user.skillLevels && user.skillLevels.length > 0
        ? user.skillLevels
        : [
            { subject: t('profile.technology'), value: 0 },
            { subject: t('profile.medicine'), value: 0 },
            { subject: t('profile.engineering'), value: 0 },
            { subject: t('profile.architecture'), value: 0 },
            { subject: t('profile.law'), value: 0 },
            { subject: t('profile.economics'), value: 0 },
            { subject: t('profile.arts'), value: 0 }
        ];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{t('profile.title')}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1.2fr', gap: '2rem', alignItems: 'start' }}>
                <Card title={t('profile.info')}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                width: '4.5rem',
                                height: '4.5rem',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(var(--primary-rgb), 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid var(--primary-color)'
                            }}>
                                <User size={36} color="var(--primary-color)" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{t(user.name ?? '')}</h3>
                                <p style={{ color: 'var(--primary-color)', fontWeight: 600, margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>
                                    {t(user.role ?? '') || t('profile.activeMember')}
                                </p>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                {t(user.bio ?? '') || t('profile.noBio')}
                            </p>
                        </div>

                        <div style={{ display: 'grid', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Mail size={18} color="var(--text-secondary)" />
                                <span style={{ fontSize: '0.95rem' }}>{user.email}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Shield size={18} color="var(--text-secondary)" />
                                <span style={{ fontSize: '0.95rem' }}>{t('profile.status')}: {user.isMentor ? t('profile.mentor') : t('profile.student')}</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title={t('profile.skills')}>
                    <div style={{ padding: '0.5rem 0' }}>
                        <SkillsChart data={skillData} />
                    </div>
                </Card>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                <Card title={t('profile.achievements')}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {['Fast Learner', 'Room Starter', 'Skill Master'].map((badge, i) => (
                            <div key={i} style={{
                                padding: '1rem',
                                borderRadius: '1rem',
                                border: '1px solid var(--border-color)',
                                background: 'rgba(var(--primary-rgb), 0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                minWidth: '100px',
                                flex: 1
                            }}>
                                <Award size={28} color="var(--primary-color)" />
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>{badge}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title={t('profile.stats')}>
                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('profile.roomsJoined')}</span>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.stats?.roomsJoined || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('profile.sessions')}</span>
                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user.stats?.sessionsAttended || 0}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('profile.points')}</span>
                            <span style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.1rem' }}>
                                {user.stats?.points || 0}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;
