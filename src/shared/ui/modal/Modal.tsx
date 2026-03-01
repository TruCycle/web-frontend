import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { classNames } from '@/shared/utils/classNames';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    position?: 'center' | 'right';
    closeOnOverlayClick?: boolean;
    overlayClassName?: string;
    containerClassName?: string;
    contentClassName?: string;
    hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    position = 'center',
    closeOnOverlayClick = true,
    overlayClassName,
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

    const isRight = position === 'right';
    const overlayClass = classNames(
        'fixed inset-0 z-[200] flex',
        'items-start justify-center p-4 pt-8 sm:pt-10 md:pt-12',
        overlayClassName ?? 'bg-[#22222299] backdrop-blur-[16px]',
    );
    const containerClass = classNames(
        'relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl',
        isRight ? 'max-w-[640px]' : 'max-w-[560px]',
        containerClassName,
    );
    const contentClass = classNames(
        'max-h-[calc(100vh-4.75rem)] overflow-y-auto',
        contentClassName,
    );

    return createPortal(
        <div className={overlayClass} onClick={closeOnOverlayClick ? onClose : undefined}>
            <div className={containerClass} onClick={(e) => e.stopPropagation()}>
                {!hideCloseButton && (
                    <button
                        className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        <X size={24} />
                    </button>
                )}
                <div className={contentClass}>
                    {children}
                </div>
            </div>
        </div>,
        document.body,
    );
};
