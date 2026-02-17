
import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import './SettingsPage.css';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [inAppNotifications, setInAppNotifications] = useState(true);

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
                    <div className="security-content">
                        <h2 className="settings-section-title">Security</h2>

                        <div className="security-section">
                            <div className="security-item">
                                <div className="security-item-content">
                                    <h3 className="security-item-title">Password</h3>
                                    <p className="security-item-description">Update your password</p>
                                </div>
                                <button className="security-edit-btn">
                                    <Edit2 size={18} />
                                </button>
                            </div>

                            <div className="security-item">
                                <div className="security-item-content">
                                    <h3 className="security-item-title">2FA</h3>
                                    <p className="security-item-description">Enable or Disable two factor authentication</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={is2FAEnabled}
                                        onChange={(e) => setIs2FAEnabled(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'notifications' && (
                    <div className="security-content">
                        <h2 className="settings-section-title">Notifications</h2>

                        <div className="security-section">
                            <div className="security-item">
                                <div className="security-item-content">
                                    <h3 className="security-item-title">Email Notifications</h3>
                                    <p className="security-item-description">Receive email notifications when articles are generated</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={emailNotifications}
                                        onChange={(e) => setEmailNotifications(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>

                            <div className="security-item">
                                <div className="security-item-content">
                                    <h3 className="security-item-title">In-App Notifications</h3>
                                    <p className="security-item-description">Receive notifications in the dashboard</p>
                                </div>
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={inAppNotifications}
                                        onChange={(e) => setInAppNotifications(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
