import { CheckCircle2 } from 'lucide-react';
import type { Shop } from '../PartnerShopsPage';
import { Button } from '@/shared/ui/button/Button';
import './ShopDetails.css';

interface ShopDetailsProps {
    shop: Shop;
}

export function ShopDetails({ shop }: ShopDetailsProps) {
    return (
        <div className="shop-details-container">
            <div className="shop-details-header">
                <h2 className="shop-name-title">{shop.name}</h2>
                <p className="shop-postcode">{shop.postcode}</p>
            </div>

            <div className="shop-detail-section">
                <h4 className="detail-section-title">Location</h4>
                <p className="detail-section-text">{shop.address}</p>
                <p className="detail-section-subtext">{shop.distance}</p>
            </div>

            <div className="shop-detail-section">
                <h4 className="detail-section-title">Opening Hours</h4>
                <p className="detail-section-text">{shop.openingHours}</p>
            </div>

            <div className="shop-detail-section">
                <h4 className="detail-section-title accepted-items-title">ACCEPTED ITEMS</h4>
                <div className="tags-container">
                    {shop.acceptedItems.map(item => (
                        <span key={item} className="tag-pill">
                            {item}
                        </span>
                    ))}
                </div>
            </div>

            <div className="shop-detail-section">
                <h4 className="detail-section-title">AMENITIES</h4>
                <div className="amenities-list">
                    {shop.amenities.map(amenity => (
                        <div key={amenity} className="amenity-item">
                            <CheckCircle2 className="amenity-icon" size={16} />
                            <span className="amenity-text">{amenity}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="shop-actions">
                <Button variant="secondary" className="btn-get-direction">
                    Get Direction
                </Button>
                <Button className="btn-plan-handoff">
                    Plan Handoff Here
                </Button>
            </div>
        </div>
    );
}
