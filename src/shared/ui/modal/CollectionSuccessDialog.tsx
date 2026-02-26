import React from 'react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import successIcon from '@/assets/images/success.svg';

interface CollectionSuccessDialogProps {
    isOpen: boolean;
    onClose: () => void;
    itemName?: string;
}

export const CollectionSuccessDialog: React.FC<CollectionSuccessDialogProps> = ({
    isOpen,
    onClose,
    itemName = 'iPhone12 Pro'
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} position="center">
            <div className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-lime-50">
                    <img src={successIcon} alt="Success" className="h-16 w-16" />
                </div>

                <h2 className="text-2xl font-bold text-slate-900">Congratulations!</h2>

                <p className="text-sm leading-6 text-slate-600">
                    You have successfully collected <br />
                    the {itemName} item
                </p>

                <Button className="w-full max-w-[220px]" onClick={onClose}>
                    Leave a Review
                </Button>
            </div>
        </Modal>
    );
};
