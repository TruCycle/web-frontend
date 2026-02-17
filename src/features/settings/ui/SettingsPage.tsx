
import { useState } from 'react';
import { Button } from '@/shared/ui/button/Button';
import './SettingsPage.css';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');

    return (
        <div className="settings-content-wrapper">
            <div className="settings-header-section">
                <h1 className="settings-welcome-title">Welcome back, Pearl!</h1>
                <p className="settings-subtitle">Track your impact and manage your listings</p>
            </div>

            {/* Tabs */}
            <div className="settings-tabs">
                <button
                    className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
                <button
                    className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                >
                    Security
                </button>
                <button
                    className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                >
                    Notifications
                </button>
            </div>

            {/* Tab Content */}
            <div className="settings-card">
                {activeTab === 'profile' && (
                    <div className="settings-form">
                        <h2 className="settings-section-title">Your Profile</h2>

                        <div className="form-group">
                            <label className="form-label" htmlFor="fullName">Full Name</label>
                            <input
                                className="form-input"
                                type="text"
                                id="fullName"
                                defaultValue="Pearl O"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="username">Username (optional)</label>
                            <input
                                className="form-input"
                                type="text"
                                id="username"
                                placeholder="Enter your username"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email</label>
                            <input
                                className="form-input disabled"
                                type="email"
                                id="email"
                                defaultValue="sarah.j@example.com"
                                disabled
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="postcode">Postcode</label>
                            <input
                                className="form-input"
                                type="text"
                                id="postcode"
                                defaultValue="SW1A 1AA"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Member Since</label>
                            <p className="member-since-text">January 2026</p>
                        </div>

                        <Button className="btn-update-profile">
                            Update Profile
                        </Button>
                    </div>
                )}
                {activeTab === 'security' && (
                    <div className="settings-form">
                        <h2 className="settings-section-title">Security</h2>
                        <p className="settings-subtitle">Manage your password and security settings here.</p>
                    </div>
                )}
                {activeTab === 'notifications' && (
                    <div className="settings-form">
                        <h2 className="settings-section-title">Notification Preferences</h2>
                        <p className="settings-subtitle">Manage how we notify you.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
