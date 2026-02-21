import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react';
import cautionIcon from '@/assets/icons/caution-icon.svg';
import { Button } from '@/shared/ui/button/Button';
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog';
import { QRCodeDialog } from '@/shared/ui/modal/QRCodeDialog';
import { CollectionSuccessDialog } from '@/shared/ui/modal/CollectionSuccessDialog';
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

// Mock item for the banner
const BANNER_ITEM = {
    id: 'banner-1',
    title: 'iPhone 12Pro',
    category: 'Gadget',
    condition: 'Good',
    donor: 'Sarah M.',
    image: bagShoeImg, // Using placeholder
    status: 'Approved',
    location: 'Fixars Shop 50 Abbey Road',
    hasQR: true
};

export default function CollectedItemsPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<any[]>([]); // Starts empty by default
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [qrItem, setQrItem] = useState<any | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [collectedItemName, setCollectedItemName] = useState('');

    const hasItems = items.length > 0;

    // Trigger to simulate "selecting" or loading items
    const loadMockData = () => {
        setItems(COLLECTED_ITEMS);
    };

    const handleViewDetails = (item: any) => {
        setSelectedItem(item);
    };

    const handleOpenQR = (item: any) => {
        setQrItem(item);
    };

    const handleCollectSuccess = () => {
        if (qrItem) {
            setCollectedItemName(qrItem.title);
        } else {
            setCollectedItemName(BANNER_ITEM.title);
        }
        setQrItem(null); // Close QR Dialog
        setShowSuccessDialog(true); // Open Success Dialog
    };

    return (
        <div className="collected-content-wrapper">
            <div className="welcome-section">
                <div className="welcome-text">
                    <h1 className="welcome-title">Welcome back, Pearl!</h1>
                    <p className="welcome-subtitle">Track your impact and manage your claimed items</p>
                </div>
            </div>

            {hasItems && (
                <div className="approval-banner">
                    <div className="banner-left">
                        <div className="banner-icon-wrapper">
                            <CircleAlert size={20} color="#15A119" strokeWidth={2} />
                        </div>
                        <div className="banner-text">
                            <h4 className="banner-title">Item {BANNER_ITEM.title} Request Has Been Approved</h4>
                            <p className="banner-desc">Open QR code when you get to pickup location to scan to collect</p>
                        </div>
                    </div>
                    <Button
                        className="btn-banner-qr"
                        onClick={() => handleOpenQR(BANNER_ITEM)}
                    >
                        Open QR Code
                    </Button>
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
                                    <Button
                                        className="btn-open-qr"
                                        onClick={() => handleOpenQR(item)}
                                    >
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

            <QRCodeDialog
                isOpen={!!qrItem}
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
