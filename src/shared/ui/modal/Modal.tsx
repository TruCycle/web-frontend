import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    position?: 'center' | 'right';
    containerClassName?: string;
    contentClassName?: string;
    hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    position = 'center',
    containerClassName,
    contentClassName,
    hideCloseButton,
}) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const overlayClass = `modal-overlay modal-${position}`;
    const containerClass = `modal-container modal-container-${position} ${containerClassName ?? ''}`.trim();
    const contentClass = `modal-content ${contentClassName ?? ''}`.trim();

    return (
        <div className={overlayClass} onClick={onClose}>
            <div className={containerClass} onClick={(e) => e.stopPropagation()}>
                {!hideCloseButton && (
                    <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={24} />
                    </button>
                )}
                <div className={contentClass}>
                    {children}
                </div>
            </div>
        </div>
    );
};
