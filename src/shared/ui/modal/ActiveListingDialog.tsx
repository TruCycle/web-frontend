import React from 'react';
import { X, QrCode, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import './ActiveListingDialog.css';

interface ActiveListingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    item: any | null;
}

export const ActiveListingDialog: React.FC<ActiveListingDialogProps> = ({ isOpen, onClose, item }) => {
    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideCloseButton>
            <div className="ald-dialog">

                {/* Header */}
                <div className="ald-header">
                    <div>
                        <h2 className="ald-title">{item.title}</h2>
                        <p className="ald-subtitle">Review the full listing, manage collector requests, and keep track of hand-offs.</p>
                    </div>
                    <button className="ald-close-btn" onClick={onClose}>
                        <X size={20} color="#64748B" />
                    </button>
                </div>

                {/* Stat Cards */}
                <div className="ald-stat-cards">
                    <div className="ald-stat-card">
                        <span className="ald-stat-label">LISTED</span>
                        <span className="ald-stat-value">JAN 17</span>
                    </div>
                    <div className="ald-stat-card">
                        <span className="ald-stat-label">STATUS</span>
                        <span className="ald-status-pill ald-pill-active">{item.status}</span>
                    </div>
                    <div className="ald-stat-card">
                        <span className="ald-stat-label">REWARD</span>
                        <span className="ald-reward-pill">Pending</span>
                    </div>
                </div>

                {/* Listing Overview */}
                <div className="ald-overview-card">
                    <span className="ald-section-label">LISTING OVERVIEW</span>
                    <div className="ald-overview-body">
                        <div className="ald-overview-details">
                            <p className="ald-overview-name">Used {item.title}</p>
                            <p className="ald-detail-row"><span className="ald-detail-label">Category:</span> <strong>{item.category}</strong></p>
                            <p className="ald-detail-row"><span className="ald-detail-label">Condition:</span> <strong>{item.condition || 'Like New'}</strong></p>
                            <p className="ald-detail-row"><span className="ald-detail-label">Drop-off Location:</span> <strong>Fixars Shop 50 Abbey Road</strong></p>
                            <p className="ald-detail-row"><span className="ald-detail-label">Pick-up Location:</span> <strong>Fixars Shop 50 Abbey Road</strong></p>
                        </div>
                        <div className="ald-photos-col">
                            <p className="ald-photos-label">Photos</p>
                            <div className="ald-photo-thumb">
                                {item.image && <img src={item.image} alt={item.title} className="ald-photo-img" />}
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR + Collector Requests */}
                <div className="ald-bottom-row">
                    <div className="ald-qr-card">
                        <p className="ald-qr-label">QR Delivery</p>
                        <div className="ald-qr-box">
                            <QrCode size={140} color="#ffffff" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="ald-collectors-card">
                        <p className="ald-section-label">COLLECTOR REQUESTS</p>
                        <div className="ald-collectors-empty">
                            <div className="ald-alert-icon">
                                <AlertTriangle size={22} color="#15A119" strokeWidth={1.5} />
                            </div>
                            <p className="ald-collectors-empty-text">No collectors have requested this item yet.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="ald-footer">
                    <button className="ald-btn-back" onClick={onClose}>Back</button>
                    <button className="ald-btn-edit">Edit Listing</button>
                </div>

            </div>
        </Modal>
    );
};
