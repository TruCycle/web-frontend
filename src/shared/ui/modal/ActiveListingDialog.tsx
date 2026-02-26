import React from 'react';
import { X, QrCode, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../button/Button';

interface ActiveListingItem {
    title: string;
    status: string;
    category: string;
    condition?: string;
    image?: string;
}

interface ActiveListingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    item: ActiveListingItem | null;
}

export const ActiveListingDialog: React.FC<ActiveListingDialogProps> = ({ isOpen, onClose, item }) => {
    if (!item) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} hideCloseButton>
            <div className="flex flex-col gap-5 p-6">

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
                        <p className="text-sm text-slate-500">Review the full listing, manage collector requests, and keep track of hand-offs.</p>
                    </div>
                    <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="text-xs font-semibold tracking-wide text-slate-500">LISTED</span>
                        <p className="mt-1 text-sm font-bold text-slate-800">JAN 17</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="text-xs font-semibold tracking-wide text-slate-500">STATUS</span>
                        <p className="mt-1 inline-flex rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-700">{item.status}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="text-xs font-semibold tracking-wide text-slate-500">REWARD</span>
                        <p className="mt-1 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <span className="text-xs font-semibold tracking-wide text-slate-500">LISTING OVERVIEW</span>
                    <div className="mt-3 grid gap-4 md:grid-cols-[1fr_140px]">
                        <div className="space-y-2">
                            <p className="font-semibold text-slate-900">Used {item.title}</p>
                            <p className="text-sm text-slate-600"><span className="text-slate-500">Category:</span> <strong>{item.category}</strong></p>
                            <p className="text-sm text-slate-600"><span className="text-slate-500">Condition:</span> <strong>{item.condition || 'Like New'}</strong></p>
                            <p className="text-sm text-slate-600"><span className="text-slate-500">Drop-off Location:</span> <strong>Fixars Shop 50 Abbey Road</strong></p>
                            <p className="text-sm text-slate-600"><span className="text-slate-500">Pick-up Location:</span> <strong>Fixars Shop 50 Abbey Road</strong></p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500">PHOTOS</p>
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                {item.image ? (
                                    <img src={item.image} alt={item.title} className="h-28 w-full object-cover" />
                                ) : (
                                    <div className="h-28" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500">QR DELIVERY</p>
                        <div className="flex h-44 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500">
                            <QrCode size={140} className="text-white" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <p className="mb-3 text-xs font-semibold tracking-wide text-slate-500">COLLECTOR REQUESTS</p>
                        <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-lime-100 text-lime-700">
                                <AlertTriangle size={22} strokeWidth={1.5} />
                            </div>
                            <p className="max-w-[26ch] text-sm text-slate-600">No collectors have requested this item yet.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="secondary" onClick={onClose}>Back</Button>
                    <Button>Edit Listing</Button>
                </div>
            </div>
        </Modal>
    );
};
