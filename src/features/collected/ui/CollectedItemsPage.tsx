import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageOpen } from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import './CollectedItemsPage.css';

export default function CollectedItemsPage() {
    const navigate = useNavigate();

    return (
        <div className="collected-content-wrapper">
            <div className="welcome-section">
                <h1 className="welcome-title">My Collected Items</h1>
                <p className="welcome-subtitle">View and manage items you've successfully claimed</p>
            </div>

            <div className="empty-collected-card">
                <div className="empty-state-content">
                    <div className="empty-icon-wrapper">
                        <PackageOpen size={64} strokeWidth={1.5} />
                    </div>
                    <h2 className="empty-title">No items collected yet</h2>
                    <p className="empty-message">
                        Once you claim an item and it's approved by the donor, it will appear here.
                    </p>
                    <Button
                        className="btn-browse-empty"
                        onClick={() => navigate('/')}
                    >
                        Start Browsing
                    </Button>
                </div>
            </div>
        </div>
    );
}
