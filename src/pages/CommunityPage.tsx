import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Star, UserPlus, MessageSquare, X, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { MOCK_USERS, updateMockUsers } from '../mockData';
import styles from './CommunityPage.module.css';

const CommunityPage: React.FC = () => {
    const { t } = useTranslation();
    const { user: currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
    const { showToast } = useToast();

    // Mentor editing states
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', role: '', bio: '' });

    // Get unique skills from all users
    const allSkills = Array.from(new Set(MOCK_USERS.flatMap(u => u.skills))).sort();

    const filteredUsers = MOCK_USERS.filter(u => {
        const nameMatch = t(u.name ?? '').toLowerCase().includes(searchQuery.toLowerCase());
        const skillMatch = u.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesSearch = nameMatch || skillMatch;

        // Multi-skill AND logic: user must have ALL selected skills
        const matchesSkills = selectedSkills.length === 0 ||
            selectedSkills.every(s => u.skills.includes(s));

        return matchesSearch && matchesSkills;
    });

    const toggleSkill = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const handleInvite = (name: string) => {
        showToast(t('community.inviteSent', { name }));
    };

    const handleMessage = (name: string) => {
        showToast(t('community.messageOpened', { name }));
    };

    const handleEditClick = (u: any) => {
        setEditingUser(u);
        setFormData({
            name: t(u.name ?? ''),
            role: t(u.role ?? ''),
            bio: t(u.bio ?? '')
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (!editingUser) return;

        const updatedUsers = MOCK_USERS.map(u => {
            if (u.id === editingUser.id) {
                const updates: any = { ...formData };
                // Key preservation logic
                if (formData.name === t(editingUser.name)) updates.name = editingUser.name;
                if (formData.role === t(editingUser.role)) updates.role = editingUser.role;
                if (formData.bio === t(editingUser.bio)) updates.bio = editingUser.bio;

                return { ...u, ...updates };
            }
            return u;
        });

        updateMockUsers(updatedUsers);
        showToast(t('common.save'));
        setIsEditModalOpen(false);
    };

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

            <div className={styles.grid}>
                {filteredUsers.map(u => (
                    <Card key={u.id} title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {t(u.name ?? '')}
                            {u.isMentor && <Star size={16} fill="#FFD700" color="#FFD700" />}
                        </div>
                    }>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--primary-color)', fontWeight: 600, margin: 0, fontSize: '0.9rem' }}>
                                    {t(u.role ?? '')}
                                </p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>
                                    {t(u.bio ?? '')}
                                </p>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {u.skills.map(skill => (
                                    <span key={skill} className={styles.skillBadge}>
                                        {skill}
                                    </span>
                                ))}
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: currentUser?.isMentor ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <Button
                                    variant="secondary"
                                    icon={<UserPlus size={16} />}
                                    onClick={() => handleInvite(t(u.name ?? ''))}
                                >
                                    {t('community.invite')}
                                </Button>
                                <Button
                                    variant="secondary"
                                    icon={<MessageSquare size={16} />}
                                    onClick={() => handleMessage(t(u.name ?? ''))}
                                >
                                    {t('community.message')}
                                </Button>
                                {currentUser?.isMentor && !u.isMentor && (
                                    <Button
                                        variant="secondary"
                                        icon={<Edit2 size={16} />}
                                        onClick={() => handleEditClick(u)}
                                    />
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className={styles.empty}>
                    <p>{t('common.noData')}</p>
                </div>
            )}

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title={t('common.edit')}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>{t('common.cancel')}</Button>
                        <Button onClick={handleSaveEdit}>{t('common.save')}</Button>
                    </>
                }
            >
                <div style={{ display: 'grid', gap: '1.25rem', padding: '0.5rem 0' }}>
                    <Input
                        label={t('profile.name')}
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label={t('profile.role')}
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                    />
                    <Input
                        label={t('profile.bio')}
                        value={formData.bio}
                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                    />
                </div>
            </Modal>
        </div>
    );
};

export default CommunityPage;
