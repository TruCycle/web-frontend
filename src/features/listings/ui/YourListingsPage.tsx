import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog';
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog';
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
    }
];

export default function YourListingsPage() {
    const [listings, setListings] = useState<any[]>([]); // Defaulting to empty to show the premium empty state
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false);

    const handleViewDetails = (item: any) => {
        setSelectedItem(item);
    };

    const hasListings = listings.length > 0;

    const loadMockData = () => {
        setListings(LISTINGS_DATA);
    };

    return (
        <div className="your-listings-wrapper">
            <div className="welcome-section">
                <div className="welcome-text">
                    <h1 className="welcome-title">Welcome back, Pearl!</h1>
                    <p className="welcome-subtitle">Track your impact and manage your listings</p>
                </div>
                <button className="btn-list-item" onClick={() => setIsListItemDialogOpen(true)}>
                    <Plus size={18} />
                    List New Item
                </button>
            </div>

            {!hasListings ? (
                <div className="empty-listings-master-card">
                    <div className="listings-empty-state">
                        <div className="empty-state-icon-circle">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52C41A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <p className="empty-state-message">
                            Your listed items will be<br />displayed here
                        </p>
                        <button className="btn-list-item-premium" onClick={() => setIsListItemDialogOpen(true)}>
                            <Plus size={18} />
                            List New Item
                        </button>

                        {/* Demo data trigger moved to a subtle link at bottom */}
                        <button className="btn-load-demo-link" onClick={loadMockData}>
                            Show Demo Data
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="listings-list">
                        {listings.map((item) => (
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

                    <div className="reset-empty-container">
                        <button
                            onClick={() => setListings([])}
                            className="btn-reset-link"
                        >
                            Reset to Empty View
                        </button>
                    </div>
                </>
            )}

            <ItemDetailsDialog
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />

            <ListItemDialog
                isOpen={isListItemDialogOpen}
                onClose={() => setIsListItemDialogOpen(false)}
            />
        </div>
    );
}
