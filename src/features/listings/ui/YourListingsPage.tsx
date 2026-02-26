import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog';
import { ActiveListingDialog } from '@/shared/ui/modal/ActiveListingDialog';
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog';
import ipadImg from '@/assets/images/ipad.jpg';
import candleImg from '@/assets/images/scented-candle.jpg';
import bagShoeImg from '@/assets/images/bag-shoe.jpg';
import plannerImg from '@/assets/images/book-planner.jpg';

type ListingStatus = 'Active' | 'Claimed' | 'Completed';

interface ListingItem {
    id: string;
    title: string;
    status: ListingStatus;
    category: string;
    condition: string;
    meta: string;
    image: string;
}

const LISTINGS_DATA: ListingItem[] = [
    {
        id: '1',
        title: 'iPhone 12Pro',
        status: 'Active',
        category: 'Gadget',
        condition: 'Good',
        meta: 'Waiting for collectors',
        image: ipadImg,
    },
    {
        id: '2',
        title: 'Desk Lamp',
        status: 'Active',
        category: 'Electronics',
        condition: 'Good',
        meta: 'Waiting for collectors',
        image: candleImg,
    },
    {
        id: '3',
        title: 'Winter Coat - Size M',
        status: 'Claimed',
        category: 'Clothing',
        condition: 'Like New',
        meta: 'Claimed by John D.',
        image: bagShoeImg,
    },
    {
        id: '4',
        title: 'Kitchen Blender',
        status: 'Completed',
        category: 'Appliances',
        condition: 'Good',
        meta: '8.5kg CO2 saved',
        image: plannerImg,
    },
];

export default function YourListingsPage() {
    const [listings, setListings] = useState<ListingItem[]>([]);
    const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
    const [selectedActiveItem, setSelectedActiveItem] = useState<ListingItem | null>(null);
    const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false);

    const hasListings = listings.length > 0;

    const statusClass = (status: ListingStatus): string => {
        if (status === 'Active') return 'bg-lime-100 text-lime-700';
        if (status === 'Claimed') return 'bg-amber-100 text-amber-700';
        return 'bg-sky-100 text-sky-700';
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Welcome back, Pearl!</h1>
                    <p className="text-slate-500">Track your impact and manage your listings</p>
                </div>
                <Button className="inline-flex items-center gap-2" onClick={() => setIsListItemDialogOpen(true)}>
                    <Plus size={18} />
                    List New Item
                </Button>
            </div>

            {!hasListings ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-lime-100 text-lime-700">
                        <Plus size={24} />
                    </div>
                    <p className="mt-4 text-lg font-semibold text-slate-900">Your listed items will be displayed here</p>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        <Button className="inline-flex items-center gap-2" onClick={() => setIsListItemDialogOpen(true)}>
                            <Plus size={18} />
                            List New Item
                        </Button>
                        <Button variant="secondary" onClick={() => setListings(LISTINGS_DATA)}>
                            Show Demo Data
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Your Listings</h2>
                    {listings.map((item) => (
                        <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                            <div className="flex items-center gap-3">
                                <img src={item.image} alt={item.title} className="h-16 w-16 rounded-lg object-cover" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(item.status)}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {item.category} • Condition: {item.condition} • {item.meta}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {item.status === 'Active' ? (
                                    <>
                                        <Button variant="secondary" onClick={() => setSelectedActiveItem(item)}>
                                            View
                                        </Button>
                                        <Button variant="secondary" className="text-rose-600 ring-rose-200 hover:bg-rose-50 hover:text-rose-700">
                                            Remove
                                        </Button>
                                    </>
                                ) : item.status === 'Claimed' ? (
                                    <Button>Open QR Code</Button>
                                ) : (
                                    <Button variant="secondary" onClick={() => setSelectedItem(item)}>
                                        View Details
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between pt-2">
                        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        <div className="flex items-center gap-1">
                            <span className="rounded-md bg-lime-100 px-3 py-1 text-sm font-semibold text-slate-800">1</span>
                            <span className="rounded-md px-3 py-1 text-sm text-slate-500">2</span>
                            <span className="rounded-md px-3 py-1 text-sm text-slate-500">3</span>
                        </div>
                        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="pt-1 text-center">
                        <button
                            onClick={() => setListings([])}
                            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
                        >
                            Reset to Empty View
                        </button>
                    </div>
                </div>
            )}

            <ItemDetailsDialog
                isOpen={Boolean(selectedItem)}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />

            <ActiveListingDialog
                isOpen={Boolean(selectedActiveItem)}
                onClose={() => setSelectedActiveItem(null)}
                item={selectedActiveItem}
            />

            <ListItemDialog
                isOpen={isListItemDialogOpen}
                onClose={() => setIsListItemDialogOpen(false)}
            />
        </div>
    );
}
