import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
    label,
    error,
    icon,
    className,
    id,
    ...props
}) => {
    const inputId = id || props.name;

    return (
        <div className={`${styles.wrapper} ${className || ''}`}>
            {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
            <div className={styles.inputContainer}>
                {icon && <span className={styles.icon}>{icon}</span>}
                <input
                    id={inputId}
                    className={`${styles.input} ${error ? styles.error : ''} ${icon ? styles.inputWithIcon : ''}`}
                    {...props}
                />
            </div>
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Input;
