import React, { useState } from 'react';
import { QrCode } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../button/Button';

interface QRCodeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    // item is kept for future integration, but not used in the visual mock per request
    item?: unknown;
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
            <div className="flex flex-col gap-5 p-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Scan to collect</h2>
                    <p className="mt-1 text-sm text-slate-500">Point your camera at the item QR. We'll register your collection automatically</p>
                </div>

                <div className="flex justify-center">
                    <div className="inline-flex h-[190px] w-[190px] items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-500">
                        <QrCode size={75} className="text-white" strokeWidth={1.5} />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">or enter manually</span>
                    <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">QR payload or item id</label>
                    <input
                        type="text"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                        placeholder="Paste QR payload or UUID"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                    />
                    <p className="text-xs leading-5 text-slate-500">
                        We'll attempt a single collection per scan to avoid duplicates. You can scan again if needed.
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <Button className="min-w-[110px]" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button className="min-w-[110px]" onClick={handleCollect}>
                        Collect
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
