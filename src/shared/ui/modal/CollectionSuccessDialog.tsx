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
            <div className="flex flex-col items-center gap-3 p-6 pt-8 text-center">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-tc-brand-mintSoft">
                    <img src={successIcon} alt="Success" className="h-16 w-16" />
                </div>

                <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">Congratulations!</h2>

                <p className="text-sm leading-6 text-tc-brand-body">
                    You have successfully collected <br />
                    the {itemName} item
                </p>

                <Button className="mt-2 w-full max-w-[220px] !bg-tc-brand-deep !text-white hover:!bg-tc-brand-hover" onClick={onClose}>
                    Leave a Review
                </Button>
            </div>
        </Modal>
    );
};
