import React from 'react';
import styles from './Card.module.css';

interface CardProps {
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, footer, className }) => {
    return (
        <div className={`${styles.card} ${className || ''}`}>
            {title && (
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                </div>
            )}
            <div className={styles.body}>
                {children}
            </div>
            {footer && (
                <div className={styles.footer}>
                    {footer}
                </div>
            )}
        </div>
    );
};

export default Card;
