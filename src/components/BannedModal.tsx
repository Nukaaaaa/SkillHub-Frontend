import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { ShieldAlert, Timer } from 'lucide-react';
import styles from './BannedModal.module.css';

interface BannedModalProps {
    isOpen: boolean;
    onClose: () => void;
    blockedUntil: string;
}

const BannedModal: React.FC<BannedModalProps> = ({ isOpen, onClose, blockedUntil }) => {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        if (!isOpen || !blockedUntil) return;

        const updateTimer = () => {
            const now = new Date().getTime();
            const target = new Date(blockedUntil).getTime();
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft('00:00:00');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            let timeString = '';
            if (days > 0) timeString += `${days}д `;
            timeString += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            setTimeLeft(timeString);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [isOpen, blockedUntil]);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Аккаунт заблокирован"
        >
            <div className={styles.container}>
                <div className={styles.iconWrapper}>
                    <ShieldAlert size={48} className={styles.icon} />
                </div>
                
                <h2 className={styles.heading}>Ваш доступ ограничен</h2>
                <p className={styles.message}>
                    Администрация приняла решение о временной блокировке вашего аккаунта за нарушение правил платформы.
                </p>

                <div className={styles.timerSection}>
                    <div className={styles.timerLabel}>
                        <Timer size={16} />
                        <span>До разблокировки осталось:</span>
                    </div>
                    <div className={styles.timerValue}>{timeLeft}</div>
                </div>

                <p className={styles.footer}>
                    После истечения этого времени вы снова сможете пользоваться всеми функциями SkillHub.
                </p>
                
                <button className={styles.button} onClick={onClose}>
                    Понятно
                </button>
            </div>
        </Modal>
    );
};

export default BannedModal;
