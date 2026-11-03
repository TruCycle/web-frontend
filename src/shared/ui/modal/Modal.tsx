import React, { useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { classNames } from '@/shared/utils/classNames';
import { manageModal } from './modalFocus';

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
    ariaLabel?: string;
    ariaLabelledBy?: string;
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
    ariaLabel,
    ariaLabelledBy,
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef(onClose);
    const headingId = useId();
    useLayoutEffect(() => { closeRef.current = onClose; });
    useLayoutEffect(() => {
        if (!isOpen || !overlayRef.current || !dialogRef.current) return;
        const dialog = dialogRef.current;
        if (!ariaLabelledBy && !ariaLabel) {
            const heading = dialog.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6');
            if (heading) {
                if (!heading.id) heading.id = headingId;
                dialog.setAttribute('aria-labelledby', heading.id);
                dialog.removeAttribute('aria-label');
            }
        }
        return manageModal({ overlay: overlayRef.current, dialog, close: () => closeRef.current() });
    }, [isOpen, ariaLabel, ariaLabelledBy, headingId]);

    if (!isOpen) return null;

    const isRight = position === 'right';
    const overlayClass = classNames(
        'fixed inset-0 z-[1200] flex',
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
        <div ref={overlayRef} className={overlayClass} onClick={closeOnOverlayClick ? onClose : undefined}>
            <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : 'Dialog')} aria-labelledby={ariaLabelledBy} tabIndex={-1} className={containerClass} onClick={(e) => e.stopPropagation()}>
                {!hideCloseButton && (
                    <button
                        type="button"
                        className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
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
