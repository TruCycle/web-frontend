import React from 'react';
import { Modal } from './Modal';

interface ItemDetails {
    title: string;
    image: string;
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
        ? 'bg-amber-100 text-amber-700'
        : item.status.toLowerCase() === 'completed'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-sky-100 text-sky-700';

    return (
        <Modal isOpen={isOpen} onClose={onClose} position="right">
            <div className="flex h-full flex-col gap-4 p-6">
                <div className="space-y-1">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
                        <p className="text-sm text-slate-500">View and manage your item details</p>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img src={item.image} alt={item.title} className="h-56 w-full object-cover" />
                    <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                        {item.status}
                    </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-500">ITEM OVERVIEW</h4>
                    <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">Category:</span>
                            <span className="text-right font-semibold text-slate-800">{item.category}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">Condition:</span>
                            <span className="text-right font-semibold text-slate-800">{item.condition || 'Excellent'}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">Drop-off Location:</span>
                            <span className="text-right font-semibold text-slate-800">{item.location || 'Fixars Shop 50 Abbey Road'}</span>
                        </div>
                        <div className="flex items-start justify-between gap-4 text-sm">
                            <span className="text-slate-500">Pick-up Location:</span>
                            <span className="text-right font-semibold text-slate-800">{item.location || 'Fixars Shop 50 Abbey Road'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
