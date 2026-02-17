import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react';
import cautionIcon from '@/assets/icons/caution-icon.svg';
import { Button } from '@/shared/ui/button/Button';
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog';
import './CollectedItemsPage.css';

import bagShoeImg from '@/assets/images/bag-shoe.jpg';
import plannerImg from '@/assets/images/book-planner.jpg';
import candleImg from '@/assets/images/scented-candle.jpg';

// Mock data items matching your reference image
const COLLECTED_ITEMS = [
    {
        id: '1',
        title: 'Vintage Chair',
        category: 'Furniture',
        donor: 'Michael T.',
        image: bagShoeImg,
        status: 'Collected',
        hasQR: false
    },
    {
        id: '2',
        title: 'Coffee Table',
        category: 'Furniture',
        donor: 'Emma R.',
        image: plannerImg,
        status: 'Collected',
        hasQR: false
    },
    {
        id: '3',
        title: 'Desk Organizer Set',
        category: 'Office',
        donor: 'John P.',
        image: candleImg,
        status: 'Claimed',
        hasQR: true
    }
];

export default function CollectedItemsPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]); // Starts empty by default
    const [selectedItem, setSelectedItem] = useState<any | null>(null);

    const hasItems = items.length > 0;

    // Trigger to simulate "selecting" or loading items
    const loadMockData = () => {
        setItems(COLLECTED_ITEMS);
    };

    const handleViewDetails = (item: any) => {
        setSelectedItem(item);
    };

    return (
        <div className="collected-content-wrapper">
            <div className="welcome-section">
                <h1 className="welcome-title">My Selected Items</h1>
                <p className="welcome-subtitle">View and manage items you've successfully claimed</p>
            </div>

            {hasItems && (
                <div className="approval-banner">
                    <div className="banner-left">
                        <div className="banner-icon-wrapper">
                            <CircleAlert size={20} color="#15A119" strokeWidth={2} />
                        </div>
                        <div className="banner-text">
                            <h4 className="banner-title">Item iPhone 12Pro Request Has Been Approved</h4>
                            <p className="banner-desc">Open QR code when you get to pickup location to scan to collect</p>
                        </div>
                    </div>
                    <Button className="btn-banner-qr">Open QR Code</Button>
                </div>
            )}

            {!hasItems ? (
                <div className="empty-collected-card">
                    <div className="empty-state-content">
                        <div className="empty-icon-wrapper">
                            <img src={cautionIcon} alt="Caution" className="caution-svg-icon" />
                        </div>
                        <h2 className="empty-title">No items collected yet</h2>
                        <p className="empty-message">
                            Once you claim an item and it's approved by the donor, it will appear here.
                        </p>
                        <div className="empty-actions">
                            <Button
                                className="btn-browse-empty"
                                onClick={() => navigate('/')}
                            >
                                Browse Items
                            </Button>
                            <Button
                                className="btn-load-demo"
                                onClick={loadMockData}
                                style={{
                                    backgroundColor: '#ffffff',
                                    color: '#1a1a1a',
                                    border: '1px solid #e2e8f0',
                                    marginLeft: '1rem',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Simulate Selection
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="collected-list">
                    {items.map((item) => (
                        <div key={item.id} className="item-list-row">
                            <div className="item-list-content">
                                <div className="item-list-image-container">
                                    <img src={item.image} alt={item.title} className="item-list-image" />
                                </div>
                                <div className="item-list-info">
                                    <div className="item-list-header">
                                        <h3 className="item-list-title">{item.title}</h3>
                                        <span className={`status-pill ${item.status.toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="item-list-meta">
                                        {item.category}  •  From {item.donor}
                                    </p>
                                </div>
                            </div>
                            <div className="item-list-actions">
                                <Button
                                    className="btn-view-details-outline"
                                    onClick={() => handleViewDetails(item)}
                                >
                                    View Details
                                </Button>
                                {item.hasQR && (
                                    <Button className="btn-open-qr">
                                        Open QR Code
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="pagination-nav">
                        <button className="pagination-btn prev-btn">
                            <ChevronLeft size={18} />
                            <span>Previous</span>
                        </button>
                        <div className="pagination-numbers">
                            <button className="page-number active">1</button>
                            <span className="pagination-ellipsis">...</span>
                        </div>
                        <button className="pagination-btn next-btn">
                            <span>Next</span>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <Button
                        onClick={() => setItems([])}
                        style={{ marginTop: '2rem', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                        Reset to Empty
                    </Button>
                </div>
            )}

            <ItemDetailsDialog
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                item={selectedItem}
            />
        </div>
    );
}
