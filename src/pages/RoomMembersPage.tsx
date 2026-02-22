import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './RoomMembersPage.module.css';
import { roomService } from '../api/roomService';
import type { UserRoom } from '../types';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { ArrowLeft, User, Shield, UserMinus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const RoomMembersPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [members, setMembers] = useState<UserRoom[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMembers = async () => {
        if (!roomId) return;
        try {
            setLoading(true);
            const data = await roomService.getMembers(Number(roomId));
            setMembers(data);
        } catch (error) {
            console.error('Failed to fetch members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, [roomId]);

    const handleLeave = async () => {
        if (!roomId || !user) return;
        if (window.confirm(t('rooms.leaveConfirm'))) {
            try {
                await roomService.leaveRoom(Number(roomId), user.id);
                toast.success(t('rooms.leaveSuccess'));
                navigate(-1);
            } catch (error) {
                toast.error(t('common.error'));
            }
        }
    };

    if (loading) return <Loader />;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Button variant="secondary" onClick={() => navigate(-1)} icon={<ArrowLeft size={20} />} />
                    <h2 className={styles.title}>{t('members.title')}</h2>
                </div>
                <Button variant="danger" icon={<UserMinus size={20} />} onClick={handleLeave}>
                    {t('members.leaveRoom')}
                </Button>
            </div>

            <div className={styles.memberList}>
                {members.map(member => (
                    <div key={member.userId} className={styles.memberItem}>
                        <div className={styles.memberInfo}>
                            <div className={styles.avatar}>
                                {member.userId === user?.id ? t('members.me') : <User size={20} />}
                            </div>
                            <div>
                                <div className={styles.memberName}>
                                    {t(member.name ?? '')} {member.userId === user?.id && <span className={styles.me}>({t('members.me')})</span>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    {member.role === 'OWNER' && <Shield size={14} color="var(--primary-color)" />}
                                    <span className={styles.role}>
                                        {t(`members.${member.role}`)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RoomMembersPage;
