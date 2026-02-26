import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react';
import cautionIcon from '@/assets/icons/caution-icon.svg';
import { Button } from '@/shared/ui/button/Button';
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog';
import { QRCodeDialog } from '@/shared/ui/modal/QRCodeDialog';
import { CollectionSuccessDialog } from '@/shared/ui/modal/CollectionSuccessDialog';
import bagShoeImg from '@/assets/images/bag-shoe.jpg';
import plannerImg from '@/assets/images/book-planner.jpg';
import candleImg from '@/assets/images/scented-candle.jpg';

interface CollectedItem {
    id: string;
    title: string;
    category: string;
    donor: string;
    image: string;
    status: 'Collected' | 'Claimed';
    hasQR: boolean;
}

const COLLECTED_ITEMS: CollectedItem[] = [
    {
        id: '1',
        title: 'Vintage Chair',
        category: 'Furniture',
        donor: 'Michael T.',
        image: bagShoeImg,
        status: 'Collected',
        hasQR: false,
    },
    {
        id: '2',
        title: 'Coffee Table',
        category: 'Furniture',
        donor: 'Emma R.',
        image: plannerImg,
        status: 'Collected',
        hasQR: false,
    },
    {
        id: '3',
        title: 'Desk Organizer Set',
        category: 'Office',
        donor: 'John P.',
        image: candleImg,
        status: 'Claimed',
        hasQR: true,
    },
];

const BANNER_ITEM: CollectedItem & { location: string } = {
    id: 'banner-1',
    title: 'iPhone 12Pro',
    category: 'Gadget',
    donor: 'Sarah M.',
    image: bagShoeImg,
    status: 'Claimed',
    location: 'Fixars Shop 50 Abbey Road',
    hasQR: true,
};

export default function CollectedItemsPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<CollectedItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<CollectedItem | null>(null);
    const [qrItem, setQrItem] = useState<CollectedItem | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [collectedItemName, setCollectedItemName] = useState('');

    const hasItems = items.length > 0;

    const loadMockData = () => {
        setItems(COLLECTED_ITEMS);
    };

    const handleCollectSuccess = () => {
        setCollectedItemName(qrItem ? qrItem.title : BANNER_ITEM.title);
        setQrItem(null);
        setShowSuccessDialog(true);
    };

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Welcome back, Pearl!</h1>
                <p className="text-slate-500">Track your impact and manage your claimed items</p>
            </div>

            {hasItems ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-lime-200 bg-lime-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-lime-700">
                            <CircleAlert size={20} strokeWidth={2} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900">Item {BANNER_ITEM.title} request has been approved</h4>
                            <p className="text-sm text-slate-600">Open QR code when you get to pickup location to scan to collect</p>
                        </div>
                    </div>
                    <Button onClick={() => setQrItem(BANNER_ITEM)}>Open QR Code</Button>
                </div>
            ) : null}

            {!hasItems ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-lime-100">
                        <img src={cautionIcon} alt="Caution" className="h-7 w-7" />
                    </div>
                    <h2 className="mt-4 text-xl font-bold text-slate-900">No items collected yet</h2>
                    <p className="mx-auto mt-2 max-w-[45ch] text-sm text-slate-500">
                        Once you claim an item and it's approved by the donor, it will appear here.
                    </p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Button onClick={() => navigate('/')}>Browse Items</Button>
                        <Button variant="secondary" onClick={loadMockData}>Simulate Selection</Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    {items.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center gap-3">
                                <img src={item.image} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === 'Claimed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">{item.category} • From {item.donor}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="secondary" onClick={() => setSelectedItem(item)}>
                                    View Details
                                </Button>
                                {item.hasQR ? (
                                    <Button onClick={() => setQrItem(item)}>Open QR Code</Button>
                                ) : null}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-2">
                        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        <span className="rounded-md bg-lime-100 px-3 py-1 text-sm font-semibold text-slate-800">1</span>
                        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="pt-1 text-center">
                        <button
                            onClick={() => setItems([])}
                            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
                        >
                            Reset to Empty
                        </button>
                    </div>
                </div>
            )}

            <ItemDetailsDialog
                isOpen={Boolean(selectedItem)}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />

            <QRCodeDialog
                isOpen={Boolean(qrItem)}
                onClose={() => setQrItem(null)}
                item={qrItem}
                onCollect={handleCollectSuccess}
            />

            <CollectionSuccessDialog
                isOpen={showSuccessDialog}
                onClose={() => setShowSuccessDialog(false)}
                itemName={collectedItemName}
            />
        </div>
    );
}
