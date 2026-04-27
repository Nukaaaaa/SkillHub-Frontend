import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Loader2, BrainCircuit } from 'lucide-react';
import { aiService } from '../api/aiService';
import { useAuth } from '../context/AuthContext';
import type { Room } from '../types';
import styles from './AiRecommendations.module.css';
import { useNavigate } from 'react-router-dom';

interface AiRecommendationsProps {
    rooms: Room[];
}

const AiRecommendations: React.FC<AiRecommendationsProps> = ({ rooms }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [recommendedRooms, setRecommendedRooms] = useState<Room[]>([]);
    const [explanation, setExplanation] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAiRecoms = async () => {
        if (!user || rooms.length === 0) return;
        
        setLoading(true);
        setError(null);
        try {
            // Combine bio and skills for interests
            const interests = `${user.bio || ''} ${user.skills?.join(', ') || ''}`.trim();
            
            if (!interests) {
                setLoading(false);
                return;
            }

            const roomList = rooms.map(r => ({
                id: r.slug,
                title: r.name,
                description: r.description || ''
            }));
            
            const result = await aiService.getRecommendations({
                userInterests: interests,
                availableRooms: roomList
            });

            // Match slugs from response to room objects
            const matched = rooms.filter(r => 
                result.recommendedRoomSlugs.some(slug => 
                    r.slug.toLowerCase() === slug.toLowerCase() || 
                    r.name.toLowerCase().includes(slug.toLowerCase())
                )
            );

            setRecommendedRooms(matched.slice(0, 3));
            setExplanation(result.explanation);
        } catch (err) {
            console.error('AI Recommendations failed', err);
            setError('Не удалось загрузить рекомендации ИИ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getAiRecoms();
    }, [user?.id, rooms.length]);

    if (!user || (!user.bio && (!user.skills || user.skills.length === 0))) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.header}>
                    <div className={styles.titleInfo}>
                        <div className={styles.iconBox}>
                            <Sparkles size={20} color="#f59e0b" />
                        </div>
                        <div>
                            <h3>Познакомьтесь с ИИ-помощником</h3>
                            <p>Заполните профиль, чтобы получить персональные рекомендации</p>
                        </div>
                    </div>
                </div>
                <div className={styles.emptyPrompt} onClick={() => navigate('/profile')}>
                    <p>Добавьте информацию "О себе" и свои навыки в профиле, и я подберу для вас идеальные учебные комнаты!</p>
                    <ArrowRight size={16} />
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className={styles.containerLoading}>
                <Loader2 className={styles.spin} />
                <span>ИИ изучает ваши интересы...</span>
            </div>
        );
    }

    if (error || recommendedRooms.length === 0) {
        return null;
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <div className={styles.titleInfo}>
                    <div className={styles.iconBox}>
                        <BrainCircuit size={20} />
                    </div>
                    <div>
                        <h3>Интеллектуальный подбор</h3>
                        <p>На основе ваших интересов и навыков</p>
                    </div>
                </div>
                <Sparkles className={styles.sparkleIcon} size={24} />
            </div>

            <div className={styles.explanation}>
                <p>"{explanation}"</p>
            </div>

            <div className={styles.roomsGrid}>
                {recommendedRooms.map(room => (
                    <div 
                        key={room.id} 
                        className={styles.roomCard}
                        onClick={() => navigate(`/rooms/${room.slug}`)}
                    >
                        <div className={styles.roomInfo}>
                            <h4>{room.name}</h4>
                            <p>{room.participantsCount || 0} участников</p>
                        </div>
                        <ArrowRight size={18} className={styles.arrow} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AiRecommendations;
