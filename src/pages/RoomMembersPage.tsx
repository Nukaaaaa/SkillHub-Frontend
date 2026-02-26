import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Search,
    Crown,
    Medal,
    MessageSquare,
    Heart,
    ChevronRight
} from 'lucide-react';

import { roomService } from '../api/roomService';
import { userService } from '../api/userService';
import type { UserRoom, User } from '../types';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import styles from './RoomMembersPage.module.css';

const RoomMembersPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { t } = useTranslation();

    const [members, setMembers] = useState<UserRoom[]>([]);
    const [memberProfiles, setMemberProfiles] = useState<Record<number, User>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'reputation' | 'date'>('reputation');

    const fetchMembers = async () => {
        if (!roomId) return;
        try {
            setLoading(true);
            const data = await roomService.getMembers(Number(roomId));
            setMembers(data);

            // Fetch profiles for all members
            const profilePromises = data.map(m => userService.getUserById(m.userId));
            const profiles = await Promise.all(profilePromises);

            const profileMap: Record<number, User> = {};
            profiles.forEach(p => {
                profileMap[p.id] = p;
            });
            setMemberProfiles(profileMap);
        } catch (error) {
            console.error('Failed to fetch members or profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [roomId]);

    const filteredMembers = members.filter(m => {
        const profile = memberProfiles[m.userId];
        const name = profile ? `${profile.firstname} ${profile.lastname}` : (m.name || '');
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => {
        if (sortBy === 'reputation') {
            return (b.userId % 500) - (a.userId % 500);
        }
        return 0;
    });

    const getMemberName = (m: UserRoom) => {
        const profile = memberProfiles[m.userId];
        return profile ? `${profile.firstname} ${profile.lastname}` : `User #${m.userId}`;
    };

    const getMemberAvatar = (m: UserRoom) => {
        const profile = memberProfiles[m.userId];
        if (profile?.avatar) return profile.avatar;
        return `https://ui-avatars.com/api/?name=${getMemberName(m)}&background=random`;
    };

    const leaders = filteredMembers.slice(0, 3);

    if (loading) return <Loader />;

    return (
        <div className={styles.membersContainer}>
            <header className={styles.pageHeader}>
                <div className={styles.headerContent}>
                    <div>
                        <h1>{t('members.communityTitle') || 'Комьюнити'}</h1>
                        <p className={styles.pageSubtitle}>
                            {members.length} {t('members.countLabel') || 'участников'} • {Math.round(members.length * 0.03)} {t('members.expertsLabel') || 'экспертов в этой комнате'}
                        </p>
                    </div>
                    <div className={styles.searchArea}>
                        <Search className={styles.searchIcon} size={18} />
                        <input
                            type="text"
                            placeholder={t('members.searchPlaceholder') || 'Найти эксперта...'}
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className={styles.contentWrapper}>
                {/* Leaders Section */}
                <section className={styles.leadersSection}>
                    <h2 className={styles.sectionLabel}>
                        <Crown size={16} className="text-amber-500 mr-2" />
                        {t('members.reputationLeaders') || 'Лидеры по репутации'}
                    </h2>
                    <div className={styles.leadersGrid}>
                        {leaders.map((leader, index) => (
                            <div key={leader.userId} className={styles.leaderCard}>
                                <div className={styles.medalIcon}>
                                    <Medal />
                                </div>
                                <div className={styles.avatarWrapper}>
                                    <img
                                        src={getMemberAvatar(leader)}
                                        className={styles.leaderAvatar}
                                        alt="avatar"
                                    />
                                    <span className={styles.rankBadge}>{index + 1}</span>
                                </div>
                                <h4 className={styles.leaderName}>{getMemberName(leader)}</h4>
                                <p className={styles.leaderHandle}>@{getMemberName(leader).toLowerCase().replace(/\s+/g, '_')}</p>

                                <div className={styles.badgeStack}>
                                    <span className={`${styles.badge} ${leader.role === 'OWNER' ? styles.roleAdmin : styles.roleExpert}`}>
                                        {leader.role === 'OWNER' ? 'Admin' : 'Expert'}
                                    </span>
                                    {index === 0 && (
                                        <span className={`${styles.badge} ${styles.topContributor}`}>
                                            TOP CONTRIBUTOR
                                        </span>
                                    )}
                                </div>

                                <div className={styles.cardStats}>
                                    <div className={styles.statItem}>
                                        <p className={styles.statNum}>{(leader.userId % 500) * 10}k</p>
                                        <p className={styles.statLabel}>{t('members.reputation') || 'Репутация'}</p>
                                    </div>
                                    <div className={styles.statItem}>
                                        <p className={styles.statNum}>{leader.userId % 50}</p>
                                        <p className={styles.statLabel}>{t('members.articles') || 'Статьи'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* All Members Section */}
                <section className={styles.allMembersSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionLabel}>
                            {t('members.allMembers') || 'Все участники'}
                        </h2>
                        <div className={styles.sortGroup}>
                            <button
                                className={`${styles.sortBtn} ${sortBy === 'reputation' ? styles.sortBtnActive : styles.sortBtnInactive}`}
                                onClick={() => setSortBy('reputation')}
                            >
                                По репутации
                            </button>
                            <button
                                className={`${styles.sortBtn} ${sortBy === 'date' ? styles.sortBtnActive : styles.sortBtnInactive}`}
                                onClick={() => setSortBy('date')}
                            >
                                По дате входа
                            </button>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.membersTable}>
                            <thead className={styles.tableHead}>
                                <tr>
                                    <th>{t('members.memberCol') || 'Участник'}</th>
                                    <th>{t('members.roleCol') || 'Роль'}</th>
                                    <th>{t('members.activityCol') || 'Активность'}</th>
                                    <th style={{ textAlign: 'right' }}>{t('members.profileCol') || 'Профиль'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map(member => (
                                    <tr key={member.userId} className={styles.memberRow}>
                                        <td className={styles.memberCell}>
                                            <div className={styles.userCellInfo}>
                                                <img
                                                    src={getMemberAvatar(member)}
                                                    className={styles.tableAvatar}
                                                    alt="avatar"
                                                />
                                                <div>
                                                    <p className={styles.userName}>{getMemberName(member)}</p>
                                                    <p className={styles.userHandle}>@{getMemberName(member).toLowerCase().replace(/\s+/g, '_')}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.memberCell}>
                                            <span className={`${styles.badge} ${member.role === 'OWNER' ? styles.roleAdmin :
                                                member.role === 'ADMIN' ? styles.roleExpert :
                                                    styles.roleMember
                                                }`}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className={styles.memberCell}>
                                            <div className={styles.activityGroup}>
                                                <div className={styles.activityItem} title="Посты">
                                                    <MessageSquare size={14} /> {member.userId % 20}
                                                </div>
                                                <div className={styles.activityItem} title="Лайки">
                                                    <Heart size={14} /> {member.userId % 100}
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.memberCell} style={{ textAlign: 'right' }}>
                                            <button className={styles.profileBtn}>
                                                <ChevronRight size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default RoomMembersPage;
