import React from 'react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import successImg from '@/assets/images/success.svg';
import './SuccessDialog.css';

interface SuccessDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="success-dialog">
                <div className="success-image-wrapper">
                    <img src={successImg} alt="Success" className="success-svg-img" />
                </div>

                <h2 className="success-title">Request Sent!</h2>
                <p className="success-message">
                    The donor will review your request. We'll notify you once approved.
                </p>

                <Button
                    className="btn-browse-other"
                    onClick={onClose}
                >
                    Browse Other Items
                </Button>
            </div>
        </Modal>
    );
};
