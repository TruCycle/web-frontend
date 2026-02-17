import { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronRight
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
  const [activeCategory, setActiveCategory] = useState('All Items');

  return (
    <div className="dashboard-content-wrapper">
      <div className="welcome-section">
        <h1 className="welcome-title">Welcome back, Pearl!</h1>
        <p className="welcome-subtitle">Track your impact and manage your exchanges</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper bg-green-soft">
            <img src={collectedItemsIcon} alt="" aria-hidden className="stat-icon" width="24" height="24" />
          </div>
          <div className="stat-info">
            <span className="stat-value">0</span>
            <span className="stat-label">Items Collected</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-blue-soft">
            <img src={exchangeIcon} alt="" aria-hidden className="stat-icon" width="24" height="24" />
          </div>
          <div className="stat-info">
            <span className="stat-value">0</span>
            <span className="stat-label">Exchanged</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-leaf-soft">
            <img src={sizeIcon} alt="" aria-hidden className="stat-icon" width="24" height="24" />
          </div>
          <div className="stat-info">
            <span className="stat-value">0kg</span>
            <span className="stat-label">CO₂ Saved</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper bg-gold-soft">
            <img src={rewardIcon} alt="" aria-hidden className="stat-icon" width="24" height="24" />
          </div>
          <div className="stat-info">
            <span className="stat-value">£0</span>
            <span className="stat-label">Rewards Earned</span>
          </div>
        </div>
      </div>

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
          <button className="filters-btn">
            <SlidersHorizontal size={20} />
            <span>Filters</span>
          </button>
        </div>

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
                  <Button className="btn-claim">Request a Claim</Button>
                  <button className="btn-view">View Item</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}