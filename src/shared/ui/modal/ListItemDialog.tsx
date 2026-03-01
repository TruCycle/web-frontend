import React, { useRef, useState } from 'react';
import {
    X,
    Upload,
    Search,
    Plus,
    Clock,
    MapPin,
    QrCode,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import { CustomSelect } from '@/shared/ui/select';
import successIcon from '@/assets/images/success.svg';
import { classNames } from '@/shared/utils/classNames';

interface ListItemDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = [
    'Laptops',
    'Smartphones',
    'Accessories',
    'Tablets',
    'Monitors',
    'Other Electronics',
];
const CONDITIONS = [
    'Like New',
    'Gently Used',
    'Minor Defects',
    'Broken/For Parts',
];

const inputClassName =
    'h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-100';

export const ListItemDialog: React.FC<ListItemDialogProps> = ({ isOpen, onClose }) => {
    const [locationType, setLocationType] = useState<'address' | 'shop'>('shop');
    const [photos, setPhotos] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedCondition, setSelectedCondition] = useState<string>('');
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleListAction = () => {
        setIsSuccess(true);
    };

    const handleClose = () => {
        setIsSuccess(false);
        onClose();
    };

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;

        const newPhotos = Array.from(files).map((file) => URL.createObjectURL(file));
        setPhotos((prev) => [...prev, ...newPhotos].slice(0, 4));

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setPhotos((prev) => prev.filter((_, i) => i !== index));
    };

    if (isSuccess) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} hideCloseButton containerClassName="max-w-[520px]">
                <div className="relative flex flex-col gap-4 p-6">
                    <button
                        className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                        onClick={handleClose}
                    >
                        <X size={20} />
                    </button>

                    <div className="flex justify-center">
                        <img src={successIcon} alt="Success" className="h-[70px] w-[70px]" />
                    </div>

                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-900">Congratulations!</h2>
                        <p className="mt-1 text-sm text-slate-500">Your listing is live</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <h4 className="text-sm font-semibold text-slate-900">{itemName || 'iPhone 12Pro'}</h4>
                        <p className="mt-2 text-xs text-slate-600">
                            Category: <span className="font-semibold text-slate-800">{selectedCategory || 'Gadget'}</span>
                        </p>
                        <p className="text-xs text-slate-600">
                            Condition: <span className="font-semibold text-slate-800">{selectedCondition || 'Like New'}</span>
                        </p>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                        <div className="mx-auto mb-2 inline-flex h-24 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-300 to-emerald-500">
                            <QrCode size={52} className="text-white" strokeWidth={1.5} />
                        </div>
                        <p className="text-xs text-slate-600">
                            Share this QR code with potential collectors or show it when dropping off at Fixars Shop
                        </p>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <div className="flex items-start gap-2">
                            <MapPin size={18} className="mt-0.5 text-emerald-700" />
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">Pickup Location</h4>
                                <p className="text-xs text-slate-600">Fixars Shop</p>
                                <p className="text-xs text-slate-600">50 Abbey Road, Abbey Rd, Barking</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-orange-100 bg-orange-50 p-3">
                        <div className="flex items-start gap-2">
                            <Clock size={18} className="mt-0.5 text-orange-600" />
                            <div>
                                <h4 className="text-sm font-semibold text-slate-900">Expires in 71h</h4>
                                <p className="text-xs text-slate-600">Listing expires if not claimed within 3 days.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="secondary" onClick={handleClose}>Done</Button>
                        <Button>Save QR Code</Button>
                    </div>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} hideCloseButton containerClassName="max-w-[560px]">
            <div className="flex max-h-[90vh] flex-col">
                <header className="flex items-start justify-between border-b border-slate-100 px-6 pb-4 pt-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">List an Item</h2>
                        <p className="text-sm text-slate-500">Share items you no longer need with your community</p>
                    </div>
                    <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100" onClick={handleClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Photos</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            multiple
                            accept="image/*"
                            className="hidden"
                        />
                        <div className="flex flex-wrap gap-3">
                            {photos.map((photo, index) => (
                                <div key={index} className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200">
                                    <img src={photo} alt={`Upload ${index + 1}`} className="h-full w-full object-cover" />
                                    <button
                                        className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm"
                                        onClick={() => removePhoto(index)}
                                        title="Remove photo"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {photos.length < 4 ? (
                                <button
                                    className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-slate-500 transition hover:border-lime-300 hover:text-slate-700"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload size={20} />
                                    <span className="text-[11px] font-medium">Add photo</span>
                                </button>
                            ) : null}
                        </div>
                        <p className="text-xs text-slate-400">You can upload up to 4 photos. First photo will be the cover image.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Item Name</label>
                        <input
                            type="text"
                            className={inputClassName}
                            placeholder="e.g., iPhone 12Pro - 128GB"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Category</label>
                        <CustomSelect
                            value={selectedCategory}
                            options={CATEGORIES.map((category) => ({ value: category, label: category }))}
                            placeholder="Select"
                            onChange={setSelectedCategory}
                            buttonClassName={inputClassName}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Condition</label>
                        <CustomSelect
                            value={selectedCondition}
                            options={CONDITIONS.map((condition) => ({ value: condition, label: condition }))}
                            placeholder="Select"
                            onChange={setSelectedCondition}
                            buttonClassName={inputClassName}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Description (optional)</label>
                        <textarea
                            className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                            placeholder="Describe the items condition, any accessories included, etc..."
                            value={itemDescription}
                            onChange={(e) => setItemDescription(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Pickup Location Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                className={classNames(
                                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold',
                                    locationType === 'address'
                                        ? 'border-lime-500 bg-lime-500 text-white'
                                        : 'border-slate-200 bg-white text-slate-700',
                                )}
                                onClick={() => setLocationType('address')}
                            >
                                <span>My Address</span>
                                <span className={classNames(
                                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                    locationType === 'address' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600',
                                )}>
                                    Exchange
                                </span>
                            </button>
                            <button
                                className={classNames(
                                    'flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold',
                                    locationType === 'shop'
                                        ? 'border-lime-500 bg-lime-500 text-white'
                                        : 'border-slate-200 bg-white text-slate-700',
                                )}
                                onClick={() => setLocationType('shop')}
                            >
                                <span>Partner Shop</span>
                                <span className={classNames(
                                    'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                    locationType === 'shop' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-600',
                                )}>
                                    Donor
                                </span>
                            </button>
                        </div>
                        <p className="text-xs text-slate-400">Collector will pick up from a partner shop. Select one below.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Partner Drop-off Shop</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                className={classNames(inputClassName, 'pl-10')}
                                placeholder="Fixars Shop"
                            />
                        </div>
                        <p className="text-xs text-slate-400">Search and select a partner shop where the collector can pick up your item</p>
                    </div>

                    <div className="rounded-xl border border-lime-200 bg-lime-50 p-4">
                        <h3 className="text-sm font-bold text-slate-900">Environmental Impact</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            By listing this item, you're helping reduce electronic waste and saving approximately{' '}
                            <span className="font-extrabold text-lime-700">12kg of CO2</span> from entering the atmosphere.
                        </p>
                    </div>
                </div>

                <footer className="flex justify-end gap-3 border-t border-slate-100 px-6 pb-6 pt-4">
                    <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleListAction}>
                        <Plus size={18} />
                        List Item
                    </Button>
                </footer>
            </div>
        </Modal>
    );
};
