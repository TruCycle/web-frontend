import { useState } from 'react';
import { Search, Paperclip, Smile, Send, MapPin, Share2 } from 'lucide-react';
import { Button } from '@/shared/ui/button/Button';
import { classNames } from '@/shared/utils/classNames';

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
    lastMessage: 'Thanks for the laptop. Works perfectly!',
    time: '2 hours',
    active: true,
    messages: [
      { id: 'm1', sender: 'other', text: 'Hi! Is the laptop still available?', timestamp: '2:30 PM', type: 'text' },
      { id: 'm2', sender: 'user', text: "Yes, it is! It's in excellent condition, barely used.", timestamp: '2:35 PM', type: 'text' },
      { id: 's1', sender: 'system', text: 'Item claimed by Sarah Mitchell - Hand-off location: Fixars Shop, 50 Abbey Rd, Barking', timestamp: '', type: 'system' },
      { id: 'm3', sender: 'other', text: 'Great! When can we arrange pickup?', timestamp: '2:40 PM', type: 'text' },
      { id: 'm4', sender: 'user', text: "I'm free this weekend. Are you available Saturday afternoon?", timestamp: '2:42 PM', type: 'text' },
      { id: 'm5', sender: 'user', text: 'Let me share the exact location of the drop-off point', timestamp: '2:43 PM', type: 'text' },
      {
        id: 'm6',
        sender: 'user',
        timestamp: '2:44 PM',
        type: 'location',
        location: { name: 'Fixars Shop', address: '50 Abbey Rd, Abbey, Barking, IG11 0WR' },
      },
      { id: 'm7', sender: 'other', text: 'Perfect! Saturday works for me. See you then!', timestamp: '2:45 PM', type: 'text' },
      { id: 's2', sender: 'system', text: 'Item collected and exchanged successfully', timestamp: '', type: 'system' },
      { id: 'm8', sender: 'other', text: 'Thanks for the laptop! Works perfectly', timestamp: '11:20 AM', type: 'text' },
    ],
  },
  {
    id: '2',
    name: 'James Chen',
    initials: 'JC',
    lastMessage: 'Is the iPad still available?',
    time: '5 hours ago',
    active: false,
    messages: [
      { id: 'jc1', sender: 'other', text: 'Is the iPad still available?', timestamp: '9:00 AM', type: 'text' },
      { id: 'jc2', sender: 'user', text: 'Yes, it is. Are you interested?', timestamp: '9:05 AM', type: 'text' },
      { id: 'jc3', sender: 'other', text: 'Can you do GBP200?', timestamp: '9:10 AM', type: 'text' },
    ],
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    initials: 'ER',
    lastMessage: 'Great exchange!',
    time: '1 day ago',
    active: false,
    messages: [
      { id: 'er1', sender: 'user', text: 'Here is the bike.', timestamp: 'Yesterday', type: 'text' },
      { id: 'er2', sender: 'other', text: 'Looks great! Thanks for the smooth exchange.', timestamp: 'Yesterday', type: 'text' },
      { id: 'er3', sender: 'user', text: 'Enjoy!', timestamp: 'Yesterday', type: 'text' },
    ],
  },
];

function avatarClass(initials: string): string {
  if (initials === 'SM') return 'bg-lime-100 text-lime-800';
  if (initials === 'JC') return 'bg-sky-100 text-sky-800';
  if (initials === 'ER') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-700';
}

export default function MessagingPage() {
  const [activeConversationId, setActiveConversationId] = useState<string>('1');
  const [inputValue, setInputValue] = useState('');

  const activeConversation =
    CONVERSATIONS.find((conversation) => conversation.id === activeConversationId) ||
    CONVERSATIONS[0];

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    setInputValue('');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Welcome back, Pearl!</h1>
        <p className="text-slate-500">Track your impact and manage your exchanges</p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-3">
            <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                placeholder="Search conversations"
              />
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto p-2">
            {CONVERSATIONS.map((conversation) => (
              <button
                key={conversation.id}
                className={classNames(
                  'mb-2 flex w-full items-start gap-3 rounded-xl p-3 text-left transition',
                  activeConversationId === conversation.id
                    ? 'bg-lime-50 ring-1 ring-lime-200'
                    : 'hover:bg-slate-50',
                )}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <span className={classNames('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold', avatarClass(conversation.initials))}>
                  {conversation.initials}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">{conversation.name}</span>
                    <span className="text-xs text-slate-400">{conversation.time}</span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-500">{conversation.lastMessage}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-[620px] flex-col rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <span className={classNames('inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold', avatarClass(activeConversation.initials))}>
              {activeConversation.initials}
            </span>
            <span className="font-semibold text-slate-900">{activeConversation.name}</span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {activeConversation.messages.map((message) => {
              if (message.type === 'system') {
                return (
                  <div key={message.id} className="mx-auto max-w-[70ch] rounded-lg bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
                    {message.text}
                  </div>
                );
              }

              if (message.type === 'location' && message.location) {
                return (
                  <div
                    key={message.id}
                    className={classNames(
                      'flex',
                      message.sender === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div className="max-w-[360px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex h-28 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <MapPin size={32} strokeWidth={2.5} />
                      </div>
                      <h4 className="font-semibold text-slate-900">{message.location.name}</h4>
                      <p className="text-sm text-slate-500">{message.location.address}</p>
                      <button className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-tc-auth-link hover:underline">
                        <Share2 size={16} />
                        Open in Maps
                      </button>
                      <div className="mt-2 text-right text-[11px] text-slate-400">{message.timestamp}</div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={classNames(
                    'flex',
                    message.sender === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={classNames(
                      'max-w-[360px] rounded-xl px-3 py-2 text-sm',
                      message.sender === 'user'
                        ? 'bg-lime-500 text-white'
                        : 'border border-slate-200 bg-white text-slate-800',
                    )}
                  >
                    {message.text}
                    <div
                      className={classNames(
                        'mt-1 text-right text-[11px]',
                        message.sender === 'user' ? 'text-white/80' : 'text-slate-400',
                      )}
                    >
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <Paperclip size={20} />
            </button>
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
              <input
                type="text"
                className="h-11 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <button className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
                <Smile size={18} />
              </button>
            </div>
            <Button className="h-11 w-11 rounded-xl p-0" onClick={handleSendMessage}>
              <Send className="text-white" size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
