import React, { useState } from 'react';
import { X, Upload, ChevronDown, Search, Plus, Clock, MapPin, QrCode } from 'lucide-react';
import { useRef } from 'react';
import { Modal } from './Modal';
import { Button } from '../button/Button';
import './ListItemDialog.css';
import successIcon from '@/assets/images/success.svg';

interface ListItemDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = ['Laptops', 'Smartphones', 'Accessories', 'Tablets', 'Monitors', 'Other Electronics'];
const CONDITIONS = ['Like New', 'Gently Used', 'Minor Defects', 'Broken/For Parts'];

export const ListItemDialog: React.FC<ListItemDialogProps> = ({ isOpen, onClose }) => {
    const [locationType, setLocationType] = useState<'address' | 'shop'>('shop');
    const [photos, setPhotos] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedCondition, setSelectedCondition] = useState<string>('');
    const [itemName, setItemName] = useState('');
    const [itemDescription, setItemDescription] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isConditionOpen, setIsConditionOpen] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleListAction = () => {
        // Simulate successful listing
        setIsSuccess(true);
    };

    const handleClose = () => {
        setIsSuccess(false);
        onClose();
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
        setPhotos(prev => {
            const combined = [...prev, ...newPhotos];
            return combined.slice(0, 4);
        });

        // Reset input value to allow uploading the same file again if removed
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    if (isSuccess) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} hideCloseButton>
                <div className="list-item-dialog success-view compact-padding">
                    <header className="list-item-header border-none">
                        <div className="celebration-icon-container">
                            <img src={successIcon} alt="Success" className="success-icon-svg" />
                        </div>
                        <button className="btn-close-x absolute-top-right" onClick={handleClose}>
                            <X size={20} color="#64748B" />
                        </button>
                    </header>

                    <div className="list-item-scroll-content text-center py-0">
                        <h2 className="success-title">Congratulations!</h2>
                        <p className="success-subtitle">Your listing is live</p>

                        <div className="listing-summary-card">
                            <div className="summary-item">
                                <h4 className="summary-title">{itemName || 'iPhone 12Pro'}</h4>
                                <div className="summary-details">
                                    <span className="summary-label">Category: <span className="summary-value">{selectedCategory || 'Gadget'}</span></span>
                                    <span className="summary-label">Condition: <span className="summary-value">{selectedCondition || 'Like New'}</span></span>
                                </div>
                            </div>
                        </div>

                        <div className="qr-code-section">
                            <div className="qr-code-container-compact">
                                <QrCode size={55} color="#ffffff" strokeWidth={1.5} />
                            </div>
                            <p className="qr-caption">
                                Share this QR code with potential collectors or show it when dropping off at Fixars Shop
                            </p>
                        </div>

                        <div className="pickup-location-card">
                            <div className="location-icon-wrapper">
                                <MapPin size={18} color="#15A119" />
                            </div>
                            <div className="location-info">
                                <h4 className="location-name">Pickup Location</h4>
                                <p className="location-address">Fixars Shop</p>
                                <p className="location-address">50 Abbey Road, Abbey Rd, Barking</p>
                            </div>
                        </div>

                        <div className="expiry-warning-card">
                            <div className="warning-icon-wrapper">
                                <Clock size={18} color="#EA580C" />
                            </div>
                            <div className="warning-info">
                                <h4 className="warning-title">Expires in 71h</h4>
                                <p className="warning-text">Listing expires if not claimed within 3 days.</p>
                            </div>
                        </div>
                    </div>

                    <footer className="list-item-footer footer-success">
                        <Button variant="secondary" onClick={handleClose}>Done</Button>
                        <Button variant="primary">Save QR Code</Button>
                    </footer>
                </div>
            </Modal>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} hideCloseButton>
            <div className="list-item-dialog">
                <header className="list-item-header">
                    <div>
                        <h2 className="list-item-title">List an Item</h2>
                        <p className="list-item-subtitle">Share items you no longer need with your community</p>
                    </div>
                    <button className="btn-close-x" onClick={handleClose}>
                        <X size={20} color="#64748B" />
                    </button>
                </header>

                <div className="list-item-scroll-content">
                    {/* Photos Section */}
                    <div className="form-group">
                        <label className="field-label">Photos</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                        />
                        <div className="photo-upload-grid">
                            {photos.map((photo, index) => (
                                <div key={index} className="photo-preview-box">
                                    <img src={photo} alt={`Upload ${index + 1}`} className="photo-preview-img" />
                                    <button
                                        className="btn-remove-photo"
                                        onClick={() => removePhoto(index)}
                                        title="Remove photo"
                                    >
                                        <X size={14} color="#EF4444" />
                                    </button>
                                </div>
                            ))}
                            {photos.length < 4 && (
                                <div className="photo-upload-box" onClick={triggerFileInput}>
                                    <Upload size={24} color="#94A3B8" />
                                    <span className="upload-text">Add photo</span>
                                </div>
                            )}
                        </div>
                        <p className="field-help-text">You can upload up to 4 photos. First photo will be the cover image.</p>
                    </div>

                    {/* Item Name */}
                    <div className="form-group">
                        <label className="field-label">Item Name</label>
                        <input
                            type="text"
                            className="field-input"
                            placeholder="e.g., iPhone 12Pro - 128GB"
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                        />
                    </div>

                    {/* Category */}
                    <div className="form-group">
                        <label className="field-label">Category</label>
                        <div className="custom-select-wrapper">
                            <div
                                className={`custom-select ${isCategoryOpen ? 'open' : ''}`}
                                onClick={() => {
                                    setIsCategoryOpen(!isCategoryOpen);
                                    setIsConditionOpen(false);
                                }}
                            >
                                <span className={selectedCategory ? 'select-value' : 'select-placeholder'}>
                                    {selectedCategory || 'Select'}
                                </span>
                                <ChevronDown size={18} color="#64748B" className={isCategoryOpen ? 'rotate-180' : ''} />
                            </div>
                            {isCategoryOpen && (
                                <div className="select-dropdown">
                                    {CATEGORIES.map(cat => (
                                        <div
                                            key={cat}
                                            className={`select-item ${selectedCategory === cat ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedCategory(cat);
                                                setIsCategoryOpen(false);
                                            }}
                                        >
                                            {cat}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Condition */}
                    <div className="form-group">
                        <label className="field-label">Condition</label>
                        <div className="custom-select-wrapper">
                            <div
                                className={`custom-select ${isConditionOpen ? 'open' : ''}`}
                                onClick={() => {
                                    setIsConditionOpen(!isConditionOpen);
                                    setIsCategoryOpen(false);
                                }}
                            >
                                <span className={selectedCondition ? 'select-value' : 'select-placeholder'}>
                                    {selectedCondition || 'Select'}
                                </span>
                                <ChevronDown size={18} color="#64748B" className={isConditionOpen ? 'rotate-180' : ''} />
                            </div>
                            {isConditionOpen && (
                                <div className="select-dropdown">
                                    {CONDITIONS.map(cond => (
                                        <div
                                            key={cond}
                                            className={`select-item ${selectedCondition === cond ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedCondition(cond);
                                                setIsConditionOpen(false);
                                            }}
                                        >
                                            {cond}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="form-group">
                        <label className="field-label">Description (optional)</label>
                        <textarea
                            className="field-textarea"
                            placeholder="Describe the items condition, any accessories included, etc..."
                            value={itemDescription}
                            onChange={(e) => setItemDescription(e.target.value)}
                        />
                    </div>

                    {/* Pickup Location Type */}
                    <div className="form-group">
                        <label className="field-label">Pickup Location Type</label>
                        <div className="location-toggle">
                            <div
                                className={`location-option ${locationType === 'address' ? 'active' : ''}`}
                                onClick={() => setLocationType('address')}
                            >
                                <span>My Address</span>
                                <span className="badge-small white">Exchange</span>
                            </div>
                            <div
                                className={`location-option ${locationType === 'shop' ? 'active' : ''}`}
                                onClick={() => setLocationType('shop')}
                            >
                                <span>Partner Shop</span>
                                <span className="badge-small">Donor</span>
                            </div>
                        </div>
                        <p className="field-help-text">Collector will pick up from a partner shop. Select one below.</p>
                    </div>

                    {/* Partner Drop-off Shop */}
                    <div className="form-group">
                        <label className="field-label">Partner Drop-off Shop</label>
                        <div className="search-field-wrapper">
                            <Search className="search-icon-form" size={18} color="#94A3B8" />
                            <input
                                type="text"
                                className="field-input search-padding"
                                placeholder="Fixars Shop"
                            />
                        </div>
                        <p className="field-help-text">Search and select a partner shop where the collector can pick up your item</p>
                    </div>

                    {/* Environmental Impact Card */}
                    <div className="impact-card-dialog">
                        <h3 className="impact-card-title">Environmental Impact</h3>
                        <p className="impact-card-text">
                            By listing this item, you're helping reduce electronic waste and saving approximately <span className="impact-highlight">12kg of CO₂</span> from entering the atmosphere.
                        </p>
                    </div>
                </div>

                <footer className="list-item-footer">
                    <button className="btn-cancel-dialog" onClick={handleClose}>Cancel</button>
                    <button className="btn-list-action" onClick={handleListAction}>
                        <Plus size={18} />
                        List Item
                    </button>
                </footer>
            </div>
        </Modal>
    );
};
