import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import './QRCodeDialog.css';

interface QRCodeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    // item is kept for future integration, but not used in the visual mock per request
    item?: any | null;
    onCollect: () => void;
}

export const QRCodeDialog: React.FC<QRCodeDialogProps> = ({ isOpen, onClose, onCollect }) => {
    const [payload, setPayload] = useState('');

    const handleCollect = () => {
        // Validation logic would go here
        onCollect();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} position="center">
            <div className="qr-code-dialog">
                <div className="qr-header">
                    <h2 className="qr-title">Scan to collect</h2>
                    <p className="qr-subtitle">Point your camera at the item QR. We'll register your collection automatically</p>
                </div>

                <div className="qr-code-wrapper-v2">
                    <div className="qr-gradient-box">
                        <QrCode size={75} color="#ffffff" strokeWidth={1.5} />
                    </div>
                </div>

                <div className="qr-divider-container">
                    <div className="qr-divider-line"></div>
                    <span className="qr-divider-text">or enter manually</span>
                </div>

                <div className="qr-manual-entry">
                    <label className="manual-label">QR payload or item id</label>
                    <input
                        type="text"
                        className="manual-input"
                        placeholder="Paste QR payload or UUID"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                    />
                    <p className="manual-help-text">
                        We'll attempt a single collection per scan to avoid duplicates. You can scan again if needed.
                    </p>
                </div>

                <div className="qr-footer-actions">
                    <Button className="btn-qr-cancel" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="btn-qr-collect" onClick={handleCollect}>
                        Collect
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
