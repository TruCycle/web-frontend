import React from 'react';
import { Modal } from './Modal';

interface ItemDetails {
    title: string;
    image?: string;
    status: string;
    category: string;
    condition?: string;
    location?: string;
}

interface ItemDetailsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    item: ItemDetails | null;
}

export const ItemDetailsDialog: React.FC<ItemDetailsDialogProps> = ({ isOpen, onClose, item }) => {
    if (!item) return null;

    const statusClass = item.status.toLowerCase() === 'claimed'
        ? 'bg-amber-100 text-amber-800'
        : item.status.toLowerCase() === 'completed'
            ? 'bg-tc-brand-soft text-tc-brand-muted'
            : 'bg-tc-brand-deep text-white';

    return (
        <Modal isOpen={isOpen} onClose={onClose} position="right">
            <div className="flex h-full flex-col gap-4 p-6">
                <div className="space-y-1 pr-12">
                    <div>
                        <h2 className="text-xl leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">{item.title}</h2>
                        <p className="mt-1 text-sm leading-5 text-tc-brand-body">View and manage your item details</p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-tc-lg bg-tc-brand-soft">
                    {item.image ? (
                        <img src={item.image} alt={item.title} className="h-56 w-full object-cover" />
                    ) : (
                        <div className="flex h-56 w-full items-center justify-center text-sm text-tc-brand-muted">
                            No image available
                        </div>
                    )}
                    <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}>
                        {item.status}
                    </span>
                </div>

                <div className="rounded-tc-md bg-tc-brand-soft p-4">
                        <h3 className="mb-3 text-xs font-semibold tracking-[0.06em] text-tc-brand-muted">ITEM OVERVIEW</h3>
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-tc-brand-body">Category:</span>
                            <span className="text-right font-semibold text-tc-brand-ink">{item.category}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-tc-brand-body">Condition:</span>
                            <span className="text-right font-semibold text-tc-brand-ink">{item.condition?.trim() || 'Not provided'}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-tc-brand-body">Location:</span>
                            <span className="text-right font-semibold text-tc-brand-ink">{item.location?.trim() || 'Location unavailable'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
