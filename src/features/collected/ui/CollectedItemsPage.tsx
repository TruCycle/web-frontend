import { useNavigate } from 'react-router-dom';
import cautionIcon from '@/assets/icons/caution-icon.svg';
import { Button } from '@/shared/ui/button/Button';
import ipadImg from '@/assets/images/ipad.jpg';
import './CollectedItemsPage.css';

// Mock data for collected items
const COLLECTED_ITEMS = [
    {
        id: '1',
        title: 'iPad Air - 64GB WiFi',
        category: 'Gadget',
        condition: 'Like New',
        location: 'SW1A 1AA · 0.5 miles',
        image: ipadImg,
        status: 'Collected'
    }
];

export default function CollectedItemsPage() {
    const navigate = useNavigate();
    const hasItems = COLLECTED_ITEMS.length > 0;

    return (
        <div className="collected-content-wrapper">
            <div className="welcome-section">
                <h1 className="welcome-title">My Collected Items</h1>
                <p className="welcome-subtitle">View and manage items you've successfully claimed</p>
            </div>

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
                        <Button
                            className="btn-browse-empty"
                            onClick={() => navigate('/')}
                        >
                            Browse Items
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="collected-grid">
                    {COLLECTED_ITEMS.map((item) => (
                        <div key={item.id} className="item-card">
                            <div className="item-image-wrapper">
                                <img src={item.image} alt={item.title} className="item-image" />
                                <div className="status-badge">{item.status}</div>
                            </div>
                            <div className="item-details">
                                <h3 className="item-title">{item.title}</h3>
                                <div className="item-tags">
                                    <span className="tag tag-category">{item.category}</span>
                                    <span className="tag tag-condition">{item.condition}</span>
                                </div>
                                <p className="item-location">{item.location}</p>
                                <div className="item-actions">
                                    <Button className="btn-view-details">
                                        View Details
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
