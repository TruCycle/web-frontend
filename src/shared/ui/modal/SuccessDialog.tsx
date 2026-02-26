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
            <div className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-lime-50">
                    <img src={successImg} alt="Success" className="h-16 w-16" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">Request Sent!</h2>
                <p className="max-w-[36ch] text-sm leading-6 text-slate-600">
                    The donor will review your request. We'll notify you once approved.
                </p>

                <Button
                    className="w-full max-w-[220px]"
                    onClick={onClose}
                >
                    Browse Other Items
                </Button>
            </div>
        </Modal>
    );
};
