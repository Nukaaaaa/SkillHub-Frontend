import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Search,
    Crown,
    Medal,
    ChevronRight,
    Trophy
} from 'lucide-react';

import { roomService } from '../api/roomService';
import { userService } from '../api/userService';
import { achievementService } from '../api/achievementService';
import type { UserRoom, User, Room } from '../types';
import Loader from '../components/Loader';
import styles from './RoomMembersPage.module.css';
import Avatar from '../components/Avatar';

const RoomMembersPage: React.FC = () => {
    const { room } = useOutletContext<{ room: Room }>();
    const { t } = useTranslation();

    const [members, setMembers] = useState<UserRoom[]>([]);
    const [memberProfiles, setMemberProfiles] = useState<Record<number, User>>({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'reputation' | 'date'>('reputation');

    const fetchMembers = async () => {
        if (!room) return;
        try {
            setLoading(true);
            const data = await roomService.getMembers(room.slug);
            setMembers(data);

            const profilePromises = data.map(m =>
                userService.getUserById(m.userId).catch(err => {
                    console.warn(`Failed to fetch profile for user ${m.userId}`, err);
                    return null;
                })
            );
            const profiles = await Promise.all(profilePromises);

            // Also fetch stats for each profile to show reputation
            const statsPromises = profiles.map(p => 
                p ? achievementService.getUserStats(p.id).catch(() => null) : null
            );
            const allStats = await Promise.all(statsPromises);

            const profileMap: Record<number, User> = {};
            profiles.forEach((p, idx) => {
                if (p) {
                    const stats = allStats[idx];
                    profileMap[p.id] = {
                        ...p,
                        stats: stats ? {
                            roomsJoined: stats.directionStats?.length || 0,
                            sessionsAttended: Math.floor(stats.totalXp / 100), // Demo proxy for articles/sessions
                            points: stats.totalXp
                        } : p.stats
                    };
                }
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
    }, [room?.id]);

    const filteredMembers = members.filter(m => {
        const profile = memberProfiles[m.userId];
        if (!profile) return false;

        const fullName = [profile.firstname, profile.lastname].filter(Boolean).join(' ') || profile.name || '';
        return fullName.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => {
        const profileA = memberProfiles[a.userId];
        const profileB = memberProfiles[b.userId];
        const pointsA = profileA?.stats?.points || 0;
        const pointsB = profileB?.stats?.points || 0;

        if (sortBy === 'reputation') {
            return pointsB - pointsA;
        }
        return 0;
    });

    const getMemberName = (m: UserRoom) => {
        const profile = memberProfiles[m.userId];
        if (profile) {
            const fullName = [profile.firstname, profile.lastname].filter(Boolean).join(' ');
            return fullName || profile.name || `User #${m.userId}`;
        }
        return m.name || `User #${m.userId}`;
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
                            {filteredMembers.length} {t('members.countLabel') || 'участников'}
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
                                    <Avatar 
                                        src={memberProfiles[leader.userId]?.avatar} 
                                        name={getMemberName(leader)} 
                                        size="lg"
                                        className={styles.leaderAvatar}
                                    />
                                    <span className={styles.rankBadge}>{index + 1}</span>
                                </div>
                                <h4 className={styles.leaderName}>{getMemberName(leader)}</h4>

                                <div className={styles.badgeStack}>
                                    <span className={`${styles.badge} ${leader.role === 'OWNER' ? styles.roleAdmin :
                                        leader.role === 'ADMIN' ? styles.roleExpert : styles.roleMember}`}>
                                        {(leader.role || 'MEMBER').toLowerCase()}
                                    </span>
                                </div>

                                <div className={styles.cardStats}>
                                    <div className={styles.statItem}>
                                        <p className={styles.statNum}>{memberProfiles[leader.userId]?.stats?.points || 0}</p>
                                        <p className={styles.statLabel}>{t('members.reputation') || 'Репутация'}</p>
                                    </div>
                                    <div className={styles.statItem}>
                                        <p className={styles.statNum}>{memberProfiles[leader.userId]?.stats?.sessionsAttended || 0}</p>
                                        <p className={styles.statLabel}>{t('members.articles') || 'Сессии'}</p>
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
                                                <Avatar 
                                                    src={memberProfiles[member.userId]?.avatar} 
                                                    name={getMemberName(member)} 
                                                    size="sm"
                                                    className={styles.tableAvatar}
                                                />
                                                <div>
                                                    <p className={styles.userName}>{getMemberName(member)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.memberCell}>
                                            <span className={`${styles.badge} ${member.role === 'OWNER' ? styles.roleAdmin :
                                                member.role === 'ADMIN' ? styles.roleExpert :
                                                    styles.roleMember
                                                }`}>
                                                {(member.role || 'MEMBER').toLowerCase()}
                                            </span>
                                        </td>
                                        <td className={styles.memberCell}>
                                            <div className={styles.activityGroup}>
                                                <div className={styles.activityItem} title="Баллы">
                                                    <Trophy size={14} /> {memberProfiles[member.userId]?.stats?.points || 0}
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
