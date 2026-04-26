import React, { useState } from 'react';
import { getFullMediaUrl } from '../utils/urlUtils';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  isOnline?: boolean;
  onClick?: () => void;
  alt?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name = 'User', 
  size = 'md', 
  className = '', 
  isOnline,
  onClick,
  alt = 'avatar'
}) => {
  const [error, setError] = useState(false);
  
  const fullUrl = getFullMediaUrl(src);
  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=4f46e5&color=fff&size=256`;
  
  const finalSrc = (error || !fullUrl) ? fallbackUrl : fullUrl;

  const getSizePx = () => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 64;
      case 'xl': return 120;
      default: return 40;
    }
  };

  const sizePx = getSizePx();

  return (
    <div 
      className={`${styles.avatarContainer} ${className} ${onClick ? styles.clickable : ''}`}
      style={{ width: sizePx, height: sizePx }}
      onClick={onClick}
    >
      <img
        src={finalSrc}
        alt={alt}
        className={styles.avatarImg}
        onError={() => setError(true)}
        loading="lazy"
      />
      {isOnline !== undefined && (
        <span className={`${styles.statusDot} ${isOnline ? styles.online : styles.offline}`} />
      )}
    </div>
  );
};

export default Avatar;
