import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ShopList } from './components/ShopList';
import { ShopDetails } from './components/ShopDetails';
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog';
import { Button } from '@/shared/ui/button/Button';

export interface Shop {
    id: string;
    name: string;
    postcode: string;
    address: string;
    distance: string;
    openingHours: string;
    acceptedItems: string[];
    amenities: string[];
}

const PARTNER_SHOPS: Shop[] = [
    {
        id: '1',
        name: 'Fixars Shop',
        postcode: 'IG11 7NH',
        address: '50 Abbey Road, Abbey Rd, Barking',
        distance: '1.4 mi',
        openingHours: 'Mon - Wed, Thu: Fri - Sat: 09:00 - 17:00',
        acceptedItems: ['Electronics', 'Furniture', 'Kitchen', 'Sports Equipment', 'Home Decor'],
        amenities: ['Recycling Center', 'Workshop', 'Cafe'],
    },
    {
        id: '2',
        name: 'Green Tech Recycling',
        postcode: 'W1D 1AN',
        address: '123 High Street, Central London',
        distance: '2.1 mi',
        openingHours: 'Mon - Sat: 08:00 - 18:00',
        acceptedItems: ['Electronics', 'Computers', 'Phones'],
        amenities: ['Recycling Center', 'Drop-off Bin'],
    },
    {
        id: '3',
        name: 'Circular Economy Hub',
        postcode: 'SW3 5UZ',
        address: "456 King's Road, Chelsea",
        distance: '3.2 mi',
        openingHours: 'Tue - Sun: 10:00 - 16:00',
        acceptedItems: ['Furniture', 'Clothing', 'Books', 'Home Decor'],
        amenities: ['Workshop', 'Cafe', 'Community Space'],
    },
    {
        id: '4',
        name: 'Tech Revival Centre',
        postcode: 'E1 0BJ',
        address: '789 Commercial Road, Tower Hamlets',
        distance: '2.8 mi',
        openingHours: 'Mon - Fri: 09:00 - 17:00',
        acceptedItems: ['Electronics', 'Computers', 'Batteries'],
        amenities: ['Recycling Center', 'Repair Service'],
    },
];

export default function PartnerShopsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShopId, setSelectedShopId] = useState<string>(PARTNER_SHOPS[0].id);
    const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false);

    const filteredShops = PARTNER_SHOPS.filter(
        (shop) =>
            shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            shop.postcode.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const selectedShop = PARTNER_SHOPS.find((shop) => shop.id === selectedShopId) || PARTNER_SHOPS[0];

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

            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                <div className="grid gap-4 lg:grid-cols-2">
                    <ShopList
                        shops={filteredShops}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedShopId={selectedShopId}
                        onSelectShop={setSelectedShopId}
                    />
                    <ShopDetails shop={selectedShop} />
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d310842.17066896264!2d-0.34757731998522393!3d51.488347895475635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a00baf21de75%3A0x52963a5addd52a99!2sLondon%2C%20UK!5e0!3m2!1sen!2sus!4v1714574921935!5m2!1sen!2sus"
                        width="100%"
                        height="100%"
                        style={{ border: 0, minHeight: '620px' }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Map view of selected shop location"
                    />
                </div>
            </div>

            <ListItemDialog
                isOpen={isListItemDialogOpen}
                onClose={() => setIsListItemDialogOpen(false)}
            />
        </div>
    );
}
