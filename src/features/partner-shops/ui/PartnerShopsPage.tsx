import { useState } from 'react';
import { ShopList } from './components/ShopList';
import { ShopDetails } from './components/ShopDetails';
import './PartnerShopsPage.css';

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
        amenities: ['Recycling Center', 'Workshop', 'Cafe']
    },
    {
        id: '2',
        name: 'Green Tech Recycling',
        postcode: 'W1D 1AN',
        address: '123 High Street, Central London',
        distance: '2.1 mi',
        openingHours: 'Mon - Sat: 08:00 - 18:00',
        acceptedItems: ['Electronics', 'Computers', 'Phones'],
        amenities: ['Recycling Center', 'Drop-off Bin']
    },
    {
        id: '3',
        name: 'Circular Economy Hub',
        postcode: 'SW3 5UZ',
        address: "456 King's Road, Chelsea",
        distance: '3.2 mi',
        openingHours: 'Tue - Sun: 10:00 - 16:00',
        acceptedItems: ['Furniture', 'Clothing', 'Books', 'Home Decor'],
        amenities: ['Workshop', 'Cafe', 'Community Space']
    },
    {
        id: '4',
        name: 'Tech Revival Centre',
        postcode: 'E1 0BJ',
        address: '789 Commercial Road, Tower Hamlets',
        distance: '2.8 mi',
        openingHours: 'Mon - Fri: 09:00 - 17:00',
        acceptedItems: ['Electronics', 'Computers', 'Batteries'],
        amenities: ['Recycling Center', 'Repair Service']
    }
];

export default function PartnerShopsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedShopId, setSelectedShopId] = useState<string>(PARTNER_SHOPS[0].id);

    const filteredShops = PARTNER_SHOPS.filter(shop =>
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.postcode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedShop = PARTNER_SHOPS.find(s => s.id === selectedShopId) || PARTNER_SHOPS[0];

    return (
        <div className="partner-shops-page">
            <div className="partner-shops-header">
                <h1 className="welcome-title">Welcome back, Pearl!</h1>
                <p className="welcome-subtitle">Track your impact and manage your listings</p>
            </div>

            <div className="partner-shops-content">
                <div className="shops-container">
                    <ShopList
                        shops={filteredShops}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        selectedShopId={selectedShopId}
                        onSelectShop={setSelectedShopId}
                    />
                    <ShopDetails shop={selectedShop} />
                </div>

                <div className="map-container">
                    {/* Placeholder for Map. Can be replaced with Google Maps embed or similar. */}
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d310842.17066896264!2d-0.34757731998522393!3d51.488347895475635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47d8a00baf21de75%3A0x52963a5addd52a99!2sLondon%2C%20UK!5e0!3m2!1sen!2sus!4v1714574921935!5m2!1sen!2sus"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen={false}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Map view of selected shop location"
                    ></iframe>
                </div>
            </div>
        </div>
    );
}
