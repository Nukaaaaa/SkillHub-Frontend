import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Star, UserPlus, MessageSquare, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { userService } from '../api/userService';
import type { User } from '../types';
import styles from './CommunityPage.module.css';

const CommunityPage: React.FC = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const data = await userService.getAllUsers();
                setUsers(data);
            } catch (error) {
                toast.error(t('common.offline'));
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    // Get unique skills from all users
    const allSkills = Array.from(new Set(users.flatMap(u => u.skills || []))).sort();

    const filteredUsers = users.filter(u => {
        const nameMatch = (u.name ?? '').toLowerCase().includes(searchQuery.toLowerCase());
        const skillMatch = (u.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSearch = nameMatch || skillMatch;
        const matchesSkills = selectedSkills.length === 0 ||
            selectedSkills.every(s => (u.skills || []).includes(s));
        return matchesSearch && matchesSkills;
    });

    const toggleSkill = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
        );
    };

    const handleInvite = (name: string) => {
        toast.success(t('community.inviteSent', { name }));
    };

    const handleMessage = (name: string) => {
        toast.success(t('community.messageOpened', { name }));
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>{t('community.title')}</h2>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder={t('community.searchPlaceholder')}
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button className={styles.searchButton}>{t('common.search')}</Button>
                </div>
            </div>

            {allSkills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2rem' }}>
                    {allSkills.map(skill => {
                        const isSelected = selectedSkills.includes(skill);
                        return (
                            <div
                                key={skill}
                                onClick={() => toggleSkill(skill)}
                                style={{
                                    padding: '0.4rem 0.9rem',
                                    borderRadius: '2rem',
                                    backgroundColor: isSelected ? 'var(--primary-color)' : 'var(--background-color)',
                                    border: `1px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    color: isSelected ? 'white' : 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    fontWeight: isSelected ? '500' : '400',
                                    boxShadow: isSelected ? '0 4px 6px -1px rgba(var(--primary-rgb), 0.2)' : 'none'
                                }}
                            >
                                {skill}
                                {isSelected && <X size={14} />}
                            </div>
                        );
                    })}
                    {selectedSkills.length > 0 && (
                        <div
                            onClick={() => setSelectedSkills([])}
                            style={{
                                padding: '0.4rem 0.9rem',
                                borderRadius: '2rem',
                                backgroundColor: 'transparent',
                                border: '1px solid #ff4444',
                                color: '#ff4444',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500'
                            }}
                        >
                            {t('community.clearAll')}
                        </div>
                    )}
                </div>
            )}

            <div className={styles.grid}>
                {filteredUsers.map(u => (
                    <Card key={u.id} title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {u.name ?? `${u.firstname ?? ''} ${u.lastname ?? ''}`.trim()}
                            {u.isMentor && <Star size={16} fill="#FFD700" color="#FFD700" />}
                        </div>
                    }>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--primary-color)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                                    {u.status === 'MENTOR' ? t('profile.mentor') : t('profile.student')}
                                    {u.role && ` · ${u.role}`}
                                </p>
                                {u.bio && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                                        {u.bio}
                                    </p>
                                )}
                            </div>

                            {(u.skills || []).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {u.skills.map(skill => (
                                        <span key={skill} className={styles.skillBadge}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <Button
                                    variant="secondary"
                                    icon={<UserPlus size={16} />}
                                    onClick={() => handleInvite(u.name ?? '')}
                                >
                                    {t('community.invite')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    icon={<MessageSquare size={16} />}
                                    onClick={() => handleMessage(u.name ?? '')}
                                >
                                    {t('community.message')}
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredUsers.length === 0 && !loading && (
                <div className={styles.empty}>
                    <p>{t('common.noData')}</p>
                </div>
            )}
        </div>
    );
};

export default CommunityPage;
