import { useState } from 'react';
import { Bell } from 'lucide-react';
import './NotificationsPage.css';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  isUnread: boolean;
  hasAction?: boolean;
}

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    type: 'claimed',
    title: 'Item Claimed',
    description: 'John D. claimed your Desk Lamp. Generate QR code for drop-off.',
    time: 'Just now',
    isUnread: true,
    hasAction: true
  },
  {
    id: '2',
    type: 'exchange',
    title: 'Exchange Completed',
    description: 'Kitchen Blender verified at Peckham Partner Shop. £10 reward added to your account.',
    time: '1 day ago',
    isUnread: false
  },
  {
    id: '3',
    type: 'listed',
    title: 'Item Listed',
    description: 'You listed Coffee Maker in Electronics category.',
    time: '3 days ago',
    isUnread: false
  }
];

export default function NotificationsPage() {
  const [selectedId, setSelectedId] = useState<string>(NOTIFICATIONS[0].id);

  return (
    <div className="notifications-page-card">
      <h2 className="notifications-title notifications-header">Recent Notifications</h2>

      <div className="notifications-list">
        {NOTIFICATIONS.map((notification) => (
          <div
            key={notification.id}
            className={`notification-item ${selectedId === notification.id ? 'active' : ''}`}
            onClick={() => setSelectedId(notification.id)}
          >
            <div className="notification-icon-wrapper">
              <Bell size={20} color="#64748b" />
            </div>

            <div className="notification-content">
              <div className="notification-main-row">
                <h3 className="notification-title">{notification.title}</h3>
                <span className="notification-time">{notification.time}</span>
              </div>
              <p className="notification-description">{notification.description}</p>

              {notification.hasAction && (
                <div className="notification-action-area">
                  <button className="btn-generate-qr">
                    Generate QR Code
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
