import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import collectedItemsIcon from '@/assets/icons/collected-items-icon.svg';
import exchangeIcon from '@/assets/icons/exchange-icon.svg';
import sizeIcon from '@/assets/icons/size-icon.svg';
import rewardIcon from '@/assets/icons/reward-icon.svg';
import ipadImg from '@/assets/images/ipad.jpg';
import plannerImg from '@/assets/images/book-planner.jpg';
import bagShoeImg from '@/assets/images/bag-shoe.jpg';
import candleImg from '@/assets/images/scented-candle.jpg';
import { SuccessDialog } from '@/shared/ui/modal/SuccessDialog';
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog';
import { useUserRole } from '@/shared/context/UserRoleContext';
import './Dashboard.css';

// Mock data for items
const AVAILABLE_ITEMS = [
  {
    id: '1',
    title: 'iPad Air - 64GB WiFi',
    category: 'Gadget',
    condition: 'Like New',
    location: 'SW1A 1AA · 0.5 miles',
    image: ipadImg,
  },
  {
    id: '2',
    title: 'Brand New Planner Book',
    category: 'Gadget',
    condition: 'Like New',
    location: 'SW1A 1AA · 0.5 miles',
    image: plannerImg,
  },
  {
    id: '3',
    title: 'Bag and Shoe Wardrobe',
    category: 'Gadget',
    condition: 'Like New',
    location: 'SW1A 1AA · 0.5 miles',
    image: bagShoeImg,
  },
  {
    id: '4',
    title: 'Scented Candle',
    category: 'Gadget',
    condition: 'Like New',
    location: 'SW1A 1AA · 0.5 miles',
    image: candleImg,
  }
];

const CATEGORIES = [
  'All Items', 'Gadgets', 'Electronics', 'Clothing', 'Books',
  'Furniture', 'Spots Equipment', 'Home Decor', 'Others'
];

export default function Dashboard() {
  const location = useLocation();
  const { role } = useUserRole();
  const isDonorMode = role === 'donor';
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const showStats = location.pathname === '/dashboard';

  const handleRequestClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSuccessOpen(true);
  };

  return (
    <div className="dashboard-content-wrapper">
      <div className="welcome-section">
        <div className="welcome-text">
          <h1 className="welcome-title">Welcome back, Pearl!</h1>
          <p className="welcome-subtitle">Track your impact and manage your listings</p>
        </div>
        {isDonorMode && (
          <button className="btn-list-item" onClick={() => setIsListItemDialogOpen(true)}>
            <Plus size={18} />
            List New Item
          </button>
        )}
      </div>

      {showStats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper bg-green-soft">
              <img src={collectedItemsIcon} alt="" aria-hidden className="stat-icon" width="24" height="24" />
            </div>
            <div className="stat-info">
              <span className="stat-value">8</span>
              <span className="stat-label">{isDonorMode ? 'Items Listed' : 'Items Collected'}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-blue-soft">
              <img src={exchangeIcon} alt="" aria-hidden className="stat-icon" width="24" height="24" />
            </div>
            <div className="stat-info">
              <span className="stat-value">5</span>
              <span className="stat-label">Exchanged</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-leaf-soft">
              <img src={sizeIcon} alt="" aria-hidden className="stat-icon" width="24" height="24" />
            </div>
            <div className="stat-info">
              <span className="stat-value">47.5kg</span>
              <span className="stat-label">CO₂ Saved</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper bg-gold-soft">
              <img src={rewardIcon} alt="" aria-hidden className="stat-icon" width="24" height="24" />
            </div>
            <div className="stat-info">
              <span className="stat-value">£50</span>
              <span className="stat-label">Rewards Earned</span>
            </div>
          </div>
        </div>
      )}

      {isDonorMode && showStats && (
        <>
          <section className="impact-section">
            <div className="impact-card">
              <div className="impact-card-header">
                <h2 className="impact-title">Your Environmental Impact</h2>
                <button className="more-options-btn">•••</button>
              </div>
              <div className="impact-chart-container">
                <div className="chart-y-axis">
                  <span>100</span>
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>
                <div className="chart-wrapper">
                  <svg className="impact-svg" viewBox="0 0 800 200" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#15A119" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#15A119" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,80 C100,120 150,50 200,80 C250,110 300,140 350,80 C400,20 500,150 600,80 C700,10 750,50 800,30 L800,200 L0,200 Z"
                      fill="url(#chartGradient)"
                    />
                    <path
                      d="M0,80 C100,120 150,50 200,80 C250,110 300,140 350,80 C400,20 500,150 600,80 C700,10 750,50 800,30"
                      fill="none"
                      stroke="#15A119"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx="200" cy="80" r="4" fill="#ffffff" stroke="#15A119" strokeWidth="2" />
                    <circle cx="350" cy="80" r="4" fill="#ffffff" stroke="#15A119" strokeWidth="2" />
                    <circle cx="600" cy="80" r="4" fill="#ffffff" stroke="#15A119" strokeWidth="2" />
                  </svg>
                  <div className="chart-x-axis">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                    <span>Jul</span>
                    <span>Aug</span>
                    <span>Sep</span>
                    <span>Oct</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="listings-section">
            <div className="listings-master-card">
              <div className="listings-master-header">
                <h2 className="listings-master-title">Your Listings</h2>
                <button className="view-all-link-internal">
                  View All <ChevronRight size={16} />
                </button>
              </div>

              <div className="listings-master-list">
                {[
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
                  }
                ].map((item, index, array) => (
                  <div key={item.id} className={`listing-master-row ${index === array.length - 1 ? 'last-row' : ''}`}>
                    <div className="listing-row-left">
                      <img src={item.image} alt={item.title} className="listing-row-img" />
                      <div className="listing-row-info">
                        <div className="listing-row-top">
                          <h3 className="listing-row-name">{item.title}</h3>
                          <span className={`listing-card-pill ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="listing-card-metadata">
                          <span>{item.category}</span>
                          <span className="metadata-dot">·</span>
                          <span>Condition: {item.condition}</span>
                          <span className="metadata-dot">·</span>
                          <span>{item.meta}</span>
                        </div>
                      </div>
                    </div>
                    <div className="listing-card-actions">
                      {item.status === 'Active' ? (
                        <>
                          <button className="btn-action-view">View</button>
                          <button className="btn-action-remove">Remove</button>
                        </>
                      ) : (
                        <button className="btn-action-details">View Details</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {!isDonorMode && (
        <section className="browse-section">
          <div className="section-header">
            <h2 className="section-title">Browse Available Items</h2>
            <button className="view-all-btn">
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div className="search-filter-bar">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by category, location or keyword"
                className="search-input"
              />
            </div>
            {!isFilterOpen ? (
              <button className="filters-btn" onClick={() => setIsFilterOpen(true)}>
                <SlidersHorizontal size={20} />
                <span>Filters</span>
              </button>
            ) : (
              <button className="clear-filters-btn" onClick={() => setIsFilterOpen(false)}>
                <span>Clear Filters</span>
                <X size={18} />
              </button>
            )}
          </div>

          {isFilterOpen && (
            <div className="filters-container">
              <h3 className="filters-title">Filters</h3>
              <div className="filters-grid">
                <div className="filter-item">
                  <label className="filter-label">Category</label>
                  <div className="select-wrapper">
                    <select className="filter-select">
                      <option>All categories</option>
                      <option>Gadgets</option>
                      <option>Electronics</option>
                    </select>
                  </div>
                </div>
                <div className="filter-item">
                  <label className="filter-label">Condition</label>
                  <div className="select-wrapper">
                    <select className="filter-select">
                      <option>All condition</option>
                      <option>Like New</option>
                      <option>Used</option>
                    </select>
                  </div>
                </div>
                <div className="filter-item">
                  <label className="filter-label">Location</label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Enter location or postal code"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="categories-scroll">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-item ${cat === activeCategory ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="items-grid">
            {AVAILABLE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="item-card"
                onClick={() => console.log(`Item clicked: ${item.title}`)}
              >
                <div className="item-image-wrapper">
                  <img src={item.image} alt={item.title} className="item-image" />
                </div>
                <div className="item-details">
                  <h3 className="item-title">{item.title}</h3>
                  <div className="item-tags">
                    <span className="tag tag-category">{item.category}</span>
                    <span className="tag tag-condition">{item.condition}</span>
                  </div>
                  <p className="item-location">{item.location}</p>
                  <div className="item-actions">
                    <Button
                      className="btn-claim"
                      onClick={handleRequestClaim}
                    >
                      Request a Claim
                    </Button>
                    <button className="btn-view">View Item</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <SuccessDialog
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
      />

      <ListItemDialog
        isOpen={isListItemDialogOpen}
        onClose={() => setIsListItemDialogOpen(false)}
      />
    </div>
  );
}