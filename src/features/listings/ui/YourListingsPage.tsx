import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog';
import './YourListingsPage.css';

import ipadImg from '@/assets/images/ipad.jpg';
import candleImg from '@/assets/images/scented-candle.jpg';
import bagShoeImg from '@/assets/images/bag-shoe.jpg';
import plannerImg from '@/assets/images/book-planner.jpg';

const LISTINGS_DATA = [
    {
        id: '1',
        title: 'iPhone 12Pro',
        status: 'Active',
        category: 'Gadget',
        condition: 'Good',
        meta: 'Waiting for collectors',
        image: ipadImg
    },
    {
        id: '2',
        title: 'Desk Lamp',
        status: 'Active',
        category: 'Electronics',
        condition: 'Good',
        meta: 'Waiting for collectors',
        image: candleImg
    },
    {
        id: '3',
        title: 'Winter Coat - Size M',
        status: 'Claimed',
        category: 'Clothing',
        condition: 'Like New',
        meta: 'Claimed by John D.',
        image: bagShoeImg
    },
    {
        id: '4',
        title: 'Kitchen Blender',
        status: 'Collected',
        category: 'Appliances',
        condition: 'Good',
        meta: '8.5kg CO₂ saved',
        image: plannerImg
    },
    {
        id: '5',
        title: 'Winter Coat - Size M',
        status: 'Claimed',
        category: 'Clothing',
        condition: 'Like New',
        meta: 'Claimed by John D.',
        image: bagShoeImg
    },
    {
        id: '6',
        title: 'Kitchen Blender',
        status: 'Collected',
        category: 'Appliances',
        condition: 'Good',
        meta: '8.5kg CO₂ saved',
        image: plannerImg
    }
];

export default function YourListingsPage() {
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const handleViewDetails = (item: any) => {
        setSelectedItem(item);
    };

    return (
        <div className="your-listings-wrapper">
            <h1 className="listings-title">Your Listings</h1>

            <div className="listings-list">
                {LISTINGS_DATA.map((item) => (
                    <div key={item.id} className="listing-row">
                        <div className="listing-content">
                            <div className="listing-image-wrapper">
                                <img src={item.image} alt={item.title} className="listing-image" />
                            </div>
                            <div className="listing-info">
                                <div className="listing-header">
                                    <h3 className="listing-item-title">{item.title}</h3>
                                    <span className={`status-pill pill-${item.status.toLowerCase()}`}>
                                        {item.status}
                                    </span>
                                </div>
                                <div className="listing-meta-row">
                                    <span className="listing-category">{item.category}</span>
                                    <span className="meta-dot">•</span>
                                    <span className="listing-condition">Condition: {item.condition}</span>
                                    <span className="meta-dot">•</span>
                                    <span className="listing-extra">{item.meta}</span>
                                </div>
                            </div>
                        </div>

                        <div className="listing-actions">
                            {item.status === 'Active' ? (
                                <>
                                    <Button className="btn-view-grey">View</Button>
                                    <Button className="btn-remove-red">Remove</Button>
                                </>
                            ) : (
                                <Button
                                    className="btn-view-details-grey"
                                    onClick={() => handleViewDetails(item)}
                                >
                                    View Details
                                </Button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="pagination-nav">
                <button className="pagination-btn prev-btn">
                    <ChevronLeft size={18} />
                    <span>Previous</span>
                </button>
                <div className="pagination-numbers">
                    <button className="page-number active">1</button>
                    <button className="page-number">2</button>
                    <button className="page-number">3</button>
                    <span className="pagination-ellipsis">...</span>
                </div>
                <button className="pagination-btn next-btn">
                    <span>Next</span>
                    <ChevronRight size={18} />
                </button>
            </div>

            <ItemDetailsDialog
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />
        </div>
    );
}
