import React, { useState } from 'react';
import { X, Folder, BookOpen } from 'lucide-react';
import styles from './SectionSelectModal.module.css';

interface SectionSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (sectionId: number | undefined) => void;
    sections: { id: number; name: string }[];
}

const SectionSelectModal: React.FC<SectionSelectModalProps> = ({ isOpen, onClose, onConfirm, sections }) => {
    const [selectedId, setSelectedId] = useState<number | undefined>();

    if (!isOpen) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <div className={styles.titleGroup}>
                        <BookOpen className={styles.titleIcon} size={20} />
                        <h3 className={styles.title}>Добавить в базу знаний</h3>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className={styles.content}>
                    <p className={styles.description}>
                        Выберите раздел, в который будет помещена эта статья.
                        Это поможет организовать знания в комнате.
                    </p>

                    <div className={styles.sectionsList}>
                        <div
                            className={`${styles.sectionItem} ${selectedId === undefined ? styles.selected : ''}`}
                            onClick={() => setSelectedId(undefined)}
                        >
                            <Folder size={18} />
                            <span>Без раздела (Общее)</span>
                        </div>

                        {sections.map(sec => (
                            <div
                                key={sec.id}
                                className={`${styles.sectionItem} ${selectedId === sec.id ? styles.selected : ''}`}
                                onClick={() => setSelectedId(sec.id)}
                            >
                                <Folder size={18} color="var(--accent-primary)" />
                                <span>{sec.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <footer className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>Отмена</button>
                    <button
                        className={styles.confirmBtn}
                        onClick={() => onConfirm(selectedId)}
                    >
                        Подтвердить
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default SectionSelectModal;
