import React from 'react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import successImg from '@/assets/images/success.svg';

interface SuccessDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col items-center gap-3 p-6 pt-8 text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-tc-brand-mintSoft">
                    <img src={successImg} alt="Success" className="h-16 w-16" />
                </div>

                <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">Request Sent!</h2>
                <p className="max-w-[36ch] text-sm leading-6 text-tc-brand-body">
                    The donor will review your request. We'll notify you once approved.
                </p>

                <Button
                    className="mt-2 w-full max-w-[220px] !bg-tc-brand-deep !text-white hover:!bg-tc-brand-hover"
                    onClick={onClose}
                >
                    Browse Other Items
                </Button>
            </div>
        </Modal>
    );
};
