import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, ChevronDown, Check } from 'lucide-react';
import styles from './LanguageSelector.module.css';

const LanguageSelector: React.FC<{ variant?: 'sidebar' | 'header' | 'floating' }> = ({ variant = 'sidebar' }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'ru', label: 'Русский', flag: '🇷🇺' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'kk', label: 'Қазақша', flag: '🇰🇿' }
    ];

    const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

    const toggleDropdown = () => setIsOpen(!isOpen);

    const changeLanguage = (code: string) => {
        i18n.changeLanguage(code);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`${styles.container} ${styles[variant]}`} ref={dropdownRef}>
            <button className={styles.trigger} onClick={toggleDropdown}>
                <div className={styles.triggerInfo}>
                    <Languages size={18} className={styles.langIcon} />
                    <span className={styles.currentLabel}>{currentLanguage.code.toUpperCase()}</span>
                </div>
                <ChevronDown size={14} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            className={`${styles.option} ${i18n.language === lang.code ? styles.optionActive : ''}`}
                            onClick={() => changeLanguage(lang.code)}
                        >
                            <span className={styles.flag}>{lang.flag}</span>
                            <span className={styles.label}>{lang.label}</span>
                            {i18n.language === lang.code && <Check size={14} className={styles.checkIcon} />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
