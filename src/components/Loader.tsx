import React from 'react';
import styles from './Loader.module.css';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
    fullScreen?: boolean;
    size?: number;
    className?: string;
}

const Loader: React.FC<LoaderProps> = ({ fullScreen = false, size = 32, className }) => {
    return (
        <div className={`${styles.container} ${fullScreen ? styles.fullScreen : ''} ${className || ''}`}>
            <Loader2 className={styles.spinner} size={size} />
        </div>
    );
};

export default Loader;
