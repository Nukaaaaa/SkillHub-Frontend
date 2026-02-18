import React from 'react';
import styles from './Button.module.css';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger';
    isLoading?: boolean;
    fullWidth?: boolean;
    icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading = false,
    fullWidth = false,
    icon,
    className,
    disabled,
    ...props
}) => {
    const modeClass = styles[variant];
    const widthClass = fullWidth ? styles.fullWidth : '';
    const loadingClass = isLoading ? styles.loading : '';

    return (
        <button
            className={`${styles.button} ${modeClass} ${widthClass} ${loadingClass} ${className || ''}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            {!isLoading && icon && <span>{icon}</span>}
            {children}
        </button>
    );
};

export default Button;
