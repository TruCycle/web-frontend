import { Search } from 'lucide-react';
import type { Shop } from '../PartnerShopsPage';
import './ShopList.css';

interface ShopListProps {
    shops: Shop[];
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedShopId: string;
    onSelectShop: (id: string) => void;
}

export function ShopList({
    shops,
    searchQuery,
    onSearchChange,
    selectedShopId,
    onSelectShop
}: ShopListProps) {
    return (
        <div className="shop-list-container">
            <div className="shop-list-instructions-wrapper">
                <p className="shop-list-instructions">
                    Select a shop to preview details and confirm your preferred shop
                </p>
                <hr className="shop-list-divider" />
            </div>
            <div className="shop-search-wrapper">
                <Search className="shop-search-icon" size={18} />
                <input
                    type="text"
                    className="shop-search-input"
                    placeholder="Search shops by name, location, or postcode"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="shop-cards-list">
                {shops.map(shop => (
                    <div
                        key={shop.id}
                        className={`shop-card ${selectedShopId === shop.id ? 'selected' : ''}`}
                        onClick={() => onSelectShop(shop.id)}
                    >
                        <div className="shop-card-content">
                            <div className="shop-card-info">
                                <h3 className="shop-card-name">{shop.name}</h3>
                                <p className="shop-card-address">{shop.address}</p>
                            </div>
                            <div className="shop-card-distance">
                                {shop.distance}
                            </div>
                        </div>
                    </div>
                ))}
                {shops.length === 0 && (
                    <div className="no-shops-found">
                        No shops found matching your search.
                    </div>
                )}
            </div>
        </div>
    );
}
