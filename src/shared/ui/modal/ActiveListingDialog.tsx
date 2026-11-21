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
        <Modal isOpen={isOpen} onClose={onClose} hideCloseButton containerClassName="max-w-[780px]">
            <div className="flex flex-col gap-5 p-6">

                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">{item.title}</h2>
                        <p className="mt-1 text-sm leading-5 text-tc-brand-body">
                            Review the full listing, manage collector requests, and keep track of hand-offs.
                        </p>
                    </div>
                    <button
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tc-brand-soft text-tc-brand-ink transition hover:bg-tc-brand-line"
                        onClick={onClose}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-tc-md bg-tc-brand-mintSoft p-3">
                        <span className="text-[11px] font-semibold tracking-[0.06em] text-tc-brand-body">LISTED</span>
                        <p className="mt-1 text-sm font-semibold text-tc-brand-ink">JAN 17</p>
                    </div>
                    <div className="rounded-tc-md bg-tc-brand-mintSoft p-3">
                        <span className="block text-[11px] font-semibold tracking-[0.06em] text-tc-brand-body">STATUS</span>
                        <p className="mt-1 inline-flex rounded-full bg-tc-brand-deep px-2.5 py-1 text-xs font-semibold text-white">
                            {item.status}
                        </p>
                    </div>
                    <div className="rounded-tc-md bg-tc-brand-mintSoft p-3">
                        <span className="block text-[11px] font-semibold tracking-[0.06em] text-tc-brand-body">REWARD</span>
                        <p className="mt-1 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-tc-brand-body">
                            Pending
                        </p>
                    </div>
                </div>

                <div className="rounded-tc-md bg-tc-brand-soft p-4">
                    <span className="text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">LISTING OVERVIEW</span>
                    <div className="mt-3 grid gap-4 md:grid-cols-[1fr_160px]">
                        <div className="space-y-2">
                            <p className="font-semibold text-tc-brand-ink">Used {item.title}</p>
                            <p className="text-sm text-tc-brand-ink [&>strong]:font-semibold">
                                <span className="text-tc-brand-body">Category:</span> <strong>{item.category}</strong>
                            </p>
                            <p className="text-sm text-tc-brand-ink [&>strong]:font-semibold">
                                <span className="text-tc-brand-body">Condition:</span> <strong>{item.condition || 'Like New'}</strong>
                            </p>
                            <p className="text-sm text-tc-brand-ink [&>strong]:font-semibold">
                                <span className="text-tc-brand-body">Drop-off Location:</span> <strong>Fixars Shop 50 Abbey Road</strong>
                            </p>
                            <p className="text-sm text-tc-brand-ink [&>strong]:font-semibold">
                                <span className="text-tc-brand-body">Pick-up Location:</span> <strong>Fixars Shop 50 Abbey Road</strong>
                            </p>
                        </div>
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">Photos</p>
                            <div className="overflow-hidden rounded-tc-md border border-tc-brand-line bg-white">
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
                    <div className="rounded-tc-md bg-tc-brand-soft p-4">
                        <p className="mb-3 text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">QR DELIVERY</p>
                        <div className="flex h-44 items-center justify-center rounded-tc-md bg-tc-brand-deep">
                            <QrCode size={140} className="text-tc-brand-mint" strokeWidth={1.5} />
                        </div>
                    </div>
                    <div className="rounded-tc-md bg-tc-brand-soft p-4">
                        <p className="mb-3 text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">COLLECTOR REQUESTS</p>
                        <div className="flex h-44 flex-col items-center justify-center gap-3 rounded-tc-md border border-dashed border-tc-brand-control bg-white px-3 text-center">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
                                <AlertTriangle size={22} strokeWidth={1.5} />
                            </div>
                            <p className="max-w-[26ch] text-sm text-tc-brand-body">No collectors have requested this item yet.</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-tc-brand-line pt-4">
                    <Button variant="secondary" onClick={onClose}>Back</Button>
                    <Button>Edit Listing</Button>
                </div>
            </div>
        </Modal>
    );
};
