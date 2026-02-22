import React from 'react';
import { Modal } from './Modal';
import './ItemDetailsDialog.css';

interface ItemDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    item: any | null;
}

export const ItemDetailsDialog: React.FC<ItemDetailsDialogProps> = ({ isOpen, onClose, item }) => {
    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} position="right">
            <div className="item-details-dialog">
                <div className="details-header-row">
                    <div>
                        <h2 className="details-title">{item.title}</h2>
                        <p className="details-subtitle">View and manage your item details</p>
                    </div>
                </div>

                <div className="details-image-container">
                    <img src={item.image} alt={item.title} className="details-image" />
                    <span className={`status-pill-overlay ${item.status.toLowerCase()}`}>
                        {item.status}
                    </span>
                </div>

                <div className="details-section">
                    <h4 className="section-label">ITEM OVERVIEW</h4>
                    <div className="details-list">
                        <div className="detail-row">
                            <span className="detail-label">Category:</span>
                            <span className="detail-value">{item.category}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Condition:</span>
                            <span className="detail-value">{item.condition || 'Excellent'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Drop-off Location:</span>
                            <span className="detail-value">{item.location || 'Fixars Shop 50 Abbey Road'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="detail-label">Pick-up Location:</span>
                            <span className="detail-value">{item.location || 'Fixars Shop 50 Abbey Road'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
