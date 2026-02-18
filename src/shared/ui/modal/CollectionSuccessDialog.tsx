import React from 'react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import successIcon from '@/assets/images/success.svg';
import './CollectionSuccessDialog.css';

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
            <div className="success-dialog-content">
                <div className="success-icon-wrapper">
                    <img src={successIcon} alt="Success" className="success-dialog-icon" />
                </div>

                <h2 className="success-dialog-title">Congratulations!</h2>

                <p className="success-dialog-message">
                    You have successfully collected <br />
                    the {itemName} item
                </p>

                <Button className="btn-leave-review" onClick={onClose}>
                    Leave a Review
                </Button>
            </div>
        </Modal>
    );
};
