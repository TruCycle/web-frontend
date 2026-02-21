import React from 'react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import { Package } from 'lucide-react';
import './ListItemDialog.css';

interface ListItemDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ListItemDialog: React.FC<ListItemDialogProps> = ({ isOpen, onClose }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="list-item-dialog">
                <div className="list-item-icon-wrapper">
                    <Package size={48} color="#15A119" strokeWidth={1.5} />
                </div>

                <h2 className="list-item-title">List a New Item</h2>
                <p className="list-item-message">
                    This feature is currently under development. Soon you'll be able to upload photos and details for your recyclables!
                </p>

                <div className="list-item-actions">
                    <Button
                        className="btn-close-dialog"
                        onClick={onClose}
                    >
                        Got it!
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
