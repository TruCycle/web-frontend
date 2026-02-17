import { useState } from 'react';
import { Search, Paperclip, Smile, Send, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import './MessagingPage.css';

// Interface for Message
interface Message {
  id: string;
  sender: 'user' | 'other' | 'system';
  text?: string;
  timestamp: string;
  type: 'text' | 'location' | 'system';
  location?: {
    name: string;
    address: string;
  };
}

// Interface for Conversation
interface Conversation {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  active: boolean;
  messages: Message[];
}

const CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    name: 'Sarah Michelle',
    initials: 'SM',
    lastMessage: 'Thanks for the laptop. Works Perfectly!',
    time: '2 hours',
    active: true,
    messages: [
      {
        id: 'm1',
        sender: 'other',
        text: 'Hi! Is the laptop still available?',
        timestamp: '2:30 PM',
        type: 'text'
      },
      {
        id: 'm2',
        sender: 'user',
        text: "Yes, it is! It's in excellent condition, barely used.",
        timestamp: '2:35 PM',
        type: 'text'
      },
      {
        id: 's1',
        sender: 'system',
        text: 'Item claimed by Sarah Mitchell - Hand-off Iocation: Fixars Shop, 50 Abbey Rd, Abbey, Barking',
        timestamp: '',
        type: 'system'
      },
      {
        id: 'm3',
        sender: 'other',
        text: 'Great! When can we arrange pickup?',
        timestamp: '2:40 PM',
        type: 'text'
      },
      {
        id: 'm4',
        sender: 'user',
        text: "I'm free this weekend. Are you available Saturday afternoon?",
        timestamp: '2:42 PM',
        type: 'text'
      },
      {
        id: 'm5',
        sender: 'user',
        text: 'Let me share the exact location of the drop-off point',
        timestamp: '2:43 PM',
        type: 'text'
      },
      {
        id: 'm6',
        sender: 'user',
        timestamp: '2:44 PM',
        type: 'location',
        location: {
          name: 'Fixars Shop',
          address: '50 Abbey Rd, Abbey, Barking, IG11 0WR'
        }
      },
      {
        id: 'm7',
        sender: 'other',
        text: 'Perfect! Saturday works for me. See you then!',
        timestamp: '2:45 PM',
        type: 'text'
      },
      {
        id: 's2',
        sender: 'system',
        text: 'Item collected and exchanged successfully',
        timestamp: '',
        type: 'system'
      },
      {
        id: 'm8',
        sender: 'other',
        text: 'Thanks for the laptop! Works perfectly',
        timestamp: '11:20 AM',
        type: 'text'
      }
    ]
  },
  {
    id: '2',
    name: 'James Chen',
    initials: 'JC',
    lastMessage: 'Is the iPad still available?',
    time: '5 hours ago',
    active: false,
    messages: []
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    initials: 'ER',
    lastMessage: 'Great exchange!',
    time: '1 day ago',
    active: false,
    messages: []
  },
  {
    id: '4',
    name: 'Alex Thompson',
    initials: 'AT',
    lastMessage: 'Can you deliver?',
    time: '3 days ago',
    active: false,
    messages: []
  }
];

export default function MessagingPage() {
  const [activeConversationId, setActiveConversationId] = useState<string>('1');
  const [inputValue, setInputValue] = useState('');

  const activeConversation = CONVERSATIONS.find(c => c.id === activeConversationId) || CONVERSATIONS[0];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    // In a real app, this would add the message to the state/backend
    console.log('Sending:', inputValue);
    setInputValue('');
  };

  return (
    <div className="messaging-page-wrapper">
      <div className="messaging-header">
        <h1 className="messaging-welcome">Welcome back, Pearl!</h1>
        <p className="messaging-subtitle">Track your impact and manage your exchanges</p>
      </div>

      <div className="messaging-layout">
        {/* Sidebar */}
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h2 className="conversations-title">Conversations</h2>
            <div className="search-wrapper">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                className="search-input"
                placeholder="Search conversations"
              />
            </div>
          </div>
          <div className="conversation-list">
            {CONVERSATIONS.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${activeConversationId === conv.id ? 'active' : ''}`}
                onClick={() => setActiveConversationId(conv.id)}
              >
                <div className={`avatar ${conv.initials.toLowerCase()}`}>
                  {conv.initials}
                </div>
                <div className="conv-info">
                  <div className="conv-header">
                    <span className="conv-name">{conv.name}</span>
                    {activeConversationId !== conv.id && (
                      <span className="conv-time">{conv.time}</span>
                    )}
                  </div>
                  <p className="conv-msg-preview">{conv.lastMessage}</p>
                  {activeConversationId === conv.id && (
                    <span className="conv-time" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                      {conv.time}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          <div className="chat-header">
            <div className={`avatar ${activeConversation.initials.toLowerCase()}`} style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
              {activeConversation.initials}
            </div>
            <span className="chat-header-name">{activeConversation.name}</span>
          </div>

          <div className="chat-messages">
            {activeConversation.messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="system-message">
                    {msg.text}
                  </div>
                );
              }

              if (msg.type === 'location' && msg.location) {
                return (
                  <div key={msg.id} className={`message-group ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                    {msg.sender !== 'user' && (
                      <div className="message-avatar">{activeConversation.initials}</div>
                    )}
                    <div className="message-content">
                      <div className="location-card">
                        <div className="location-map-placeholder">
                          <MapPin size={24} color="#ffffff" />
                        </div>
                        <div className="location-info">
                          <h4 className="location-name">{msg.location.name}</h4>
                          <p className="location-address">{msg.location.address}</p>
                        </div>
                        <a href="#" className="btn-open-maps">
                          <ExternalLink size={14} />
                          Open in Maps
                        </a>
                      </div>
                      <span className="message-time">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className={`message-group ${msg.sender === 'user' ? 'sent' : 'received'}`}>
                  {msg.sender !== 'user' && (
                    <div className="message-avatar">
                      {activeConversation.initials}
                    </div>
                  )}
                  <div>
                    <div className="message-bubble">
                      {msg.text}
                    </div>
                    <span className="message-time">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-input-area">
            <button className="input-btn-icon">
              <Paperclip size={20} />
            </button>
            <div className="input-container">
              <input
                type="text"
                className="chat-text-input"
                placeholder="Type your message ..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button className="input-btn-icon" style={{ padding: 0 }}>
                <Smile size={20} />
              </button>
            </div>
            <Button className="btn-send" onClick={handleSendMessage}>
              <Send size={18} color="#ffffff" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
