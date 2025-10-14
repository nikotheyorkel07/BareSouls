
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

// Per guidelines, API key must come from process.env.API_KEY
// DO NOT modify this line.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- MOCK DATA, AVATARS & TYPES ---

// New, diverse avatar sets
const NEW_MALE_AVATARS = [
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/01.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/02.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/03.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/04.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/05.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/06.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/07.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/08.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/09.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/10.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/11.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/12.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/13.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/14.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/male/15.png'
];
const NEW_FEMALE_AVATARS = [
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/01.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/02.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/03.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/04.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/05.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/06.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/07.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/08.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/09.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/10.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/11.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/12.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/13.png', 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/14.png',
    'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/15.png'
];

const getRandomAvatar = (gender: 'male' | 'female') => {
    const avatars = gender === 'male' ? NEW_MALE_AVATARS : NEW_FEMALE_AVATARS;
    return avatars[Math.floor(Math.random() * avatars.length)];
};

interface User {
  uid: string;
  displayName: string | null;
  avatar: string;
  gender: 'male' | 'female';
}

type ViewType = 'home' | 'chatList' | 'reflect' | 'community' | 'profile' | 'chat';

interface Buddy {
    id: string;
    userId: string;
    userDisplayName: string;
    avatar: string;
    gender: 'male' | 'female';
    lastMessage?: string;
    lastMessageTime?: string;
    online: boolean;
}
interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    time: string;
    special?: 'grounding';
}

const mockInitialUser: User = {
    uid: '12345',
    displayName: 'Sarah',
    avatar: 'https://storage.googleapis.com/aai-web-samples/apps/bare-souls/avatars/sarah.png',
    gender: 'female',
};

const mockBuddies: Buddy[] = [
    { id: 'buddy-1', userId: 'sarah_convo', userDisplayName: 'Sarah', avatar: 'https://storage.googleapis.com/aai-web-samples/apps/bare-souls/avatars/sarah-friend.png', gender: 'female', lastMessage: 'Would you like to try some grounding...', online: true, lastMessageTime: '2:35 PM' },
    { id: 'buddy-2', userId: 'delhi28', userDisplayName: 'delhi28', avatar: getRandomAvatar('female'), gender: 'female', lastMessage: 'That sounds like a great plan.', online: false, lastMessageTime: 'Yesterday' },
];

const mockInitialChatMessages: Record<string, ChatMessage[]> = {
    'sarah_convo': [
        { id: 'msg1', senderId: 'sarah_convo', text: "Hey! How are you feeling today? I've been thinking about our last conversation 💜", timestamp: new Date(Date.now() - 3600000 * 3), time: "2:30 PM" },
        { id: 'msg2', senderId: '12345', text: "I'm doing better today, thanks for checking in! Your support means everything 🌸", timestamp: new Date(Date.now() - 3600000 * 2), time: "2:32 PM" },
        { id: 'msg3', senderId: 'sarah_convo', text: "Would you like to try some grounding exercises together?", timestamp: new Date(Date.now() - 3600000), time: "2:35 PM", special: 'grounding' },
    ],
    'delhi28': [
        { id: 'd-msg1', senderId: 'delhi28', text: "Hey! Just checking in.", timestamp: new Date(Date.now() - 86400000), time: "Yesterday" },
        { id: 'd-msg2', senderId: '12345', text: "Hey, thanks! Doing okay today.", timestamp: new Date(Date.now() - 86300000), time: "Yesterday" }
    ]
};

const PeerChatApp = ({ user, setUser, onLogout }: { user: User, setUser: (user: User) => void, onLogout: () => void }) => {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [previousView, setPreviousView] = useState<ViewType>('home');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(mockInitialChatMessages);
  const chatMessagesEndRef = useRef<null | HTMLDivElement>(null);

  const [displayBuddies] = useState<Buddy[]>(mockBuddies);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  // FIX: Moved state to top level of component to adhere to Rules of Hooks.
  const [mood, setMood] = useState(50);
  
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatId]);


  const navigateTo = (view: ViewType) => {
    setPreviousView(activeView);
    setActiveView(view);
  }

  const handleOpenChat = (buddyId: string) => {
    setActiveChatId(buddyId);
    navigateTo('chat');
  };
  
  const handleCloseChat = () => {
    navigateTo('chatList');
    setActiveChatId(null);
  };
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChatId) return;

    const getTimeString = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(' AM', 'AM').replace(' PM', 'PM');

    const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: user.uid,
        text: chatInput,
        timestamp: new Date(),
        time: getTimeString(new Date())
    };
    setConversations(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), newMessage]
    }));
    setChatInput('');
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setUser({ ...user, avatar: avatarUrl });
    setShowAvatarModal(false);
  };
  
  const AvatarSelectionModal = ({ gender, currentAvatar, onSelect, onClose }) => {
    const avatars = gender === 'male' ? NEW_MALE_AVATARS : NEW_FEMALE_AVATARS;
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content avatar-selection-modal" onClick={e => e.stopPropagation()}>
                <h2>Choose your Avatar</h2>
                <div className="avatar-grid">
                    {avatars.map(avatarUrl => (
                        <button key={avatarUrl} className={`avatar-grid-item ${currentAvatar === avatarUrl ? 'selected' : ''}`} onClick={() => onSelect(avatarUrl)}>
                            <img src={avatarUrl} alt="Avatar option" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
  };

  const renderHome = () => (
      <section id="home-view" className="view-container">
            <div className="card">
                <div className="card-header">
                    <h4>Daily Affirmations</h4>
                    <button className="icon-btn-sm"><svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></button>
                </div>
                <div className="affirmation-content">
                    <div className="affirmation-icon">⭐️</div>
                    <h5>Today's Affirmation</h5>
                    <p>"I am worthy of love, kindness, and all the beautiful things life has to offer. My journey is unique and valuable."</p>
                </div>
                <div className="card-actions">
                    <button className="btn-secondary">♡ Save</button>
                    <button className="btn-primary"><span>Share</span></button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h4>Guided Meditation</h4>
                    <button className="icon-btn-sm"><svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"></path></svg></button>
                </div>
                <div className="meditation-content">
                    <button className="play-button"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg></button>
                    <h4>Mindful Breathing</h4>
                    <p>A gentle 10-minute session to center yourself</p>
                    <div className="progress-bar">
                        <div className="progress" style={{width: '25%'}}></div>
                    </div>
                    <div className="time-labels">
                        <span>2:30</span>
                        <span>10:00</span>
                    </div>
                </div>
            </div>
      </section>
  );

  const renderChatList = () => (
      <section id="chat-list-view" className="view-container">
          <header className="view-header">
              <h1>Chat</h1>
          </header>
          <div className="chats-list">
              {displayBuddies.map(buddy => (
                  <div key={buddy.id} className="chat-list-item" onClick={() => handleOpenChat(buddy.userId)}>
                      <div className="avatar-wrapper">
                        <img src={buddy.avatar} alt={buddy.userDisplayName} className="avatar" />
                        {buddy.online && <div className="online-indicator"></div>}
                      </div>
                      <div className="chat-list-details">
                          <div className="chat-list-header">
                              <span className="display-name">{buddy.userDisplayName}</span>
                              <span className="timestamp">{buddy.lastMessageTime}</span>
                          </div>
                          <p className="last-message">{buddy.lastMessage}</p>
                      </div>
                  </div>
              ))}
          </div>
      </section>
  );
  
  const renderReflect = () => {
    const getMoodEmoji = (value) => {
        if (value < 20) return '😔';
        if (value < 40) return '😟';
        if (value < 60) return '😐';
        if (value < 80) return '🙂';
        return '😊';
    }

    return (
        <section id="reflect-view" className="view-container">
            <header className="view-header">
                <div>
                    <h1>Mood Journal</h1>
                    <p>How are you feeling today?</p>
                </div>
                <button className="icon-btn-lg"><svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"></path></svg></button>
            </header>

            <div className="card">
                <h4>Select Your Current Mood</h4>
                <div className="mood-selector">
                    <div className="mood-emoji-bg"><div className="mood-emoji">{getMoodEmoji(mood)}</div></div>
                    <input type="range" min="0" max="100" value={mood} onChange={(e) => setMood(parseInt(e.target.value, 10))} />
                    <div className="mood-labels">
                        <span>Low</span>
                        <span>Balanced</span>
                        <span>High</span>
                    </div>
                </div>
            </div>

            <div className="card">
                <h4>Daily Reflection</h4>
                <label>What made today a little lighter?</label>
                <textarea placeholder="Share your thoughts..."></textarea>
                <label>Gratitude for today</label>
                <textarea placeholder="What are you grateful for?"></textarea>
                <button className="btn-primary"><span>Save Reflection</span></button>
            </div>
        </section>
    )
  };

  const renderCommunity = () => (
    <section id="community-view" className="view-container">
        <header className="view-header">
            <h1>Souls Around You</h1>
        </header>
        <div className="card">
             <h4>Quick Mood Check</h4>
             <div className="mood-check-grid">
                <button>😔 Sad</button>
                <button>😊 Happy</button>
                <button>😟 Anxious</button>
                <button>🙂 Calm</button>
             </div>
        </div>
        <div className="card">
            <div className="card-header">
                <h4>Share kindness, find support</h4>
                <button className="icon-btn-lg primary-fill"><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg></button>
            </div>
             <div className="community-filters">
                 <button className="active">All</button>
                 <button>Encouragement</button>
                 <button>Healing</button>
                 <button>Mindful</button>
             </div>
             <div className="community-post">
                 <div className="post-header">
                     <div className="post-avatar">🌸</div>
                     <div className="post-user-info">
                         <span>Anonymous Soul</span>
                         <span className="post-tag">Encouragement</span>
                     </div>
                 </div>
                 <p className="post-body">Remember that healing isn't linear. Some days you'll feel like you're moving backwards, but that's just part of the journey. You're stronger than you know. 💜</p>
                 <div className="post-actions">
                     <div>
                         <button>♡ 24</button>
                         <button>💬 8</button>
                         <button>🔗 Share</button>
                     </div>
                     <button className="support-link">Send support</button>
                 </div>
             </div>
        </div>
    </section>
  );
  
  const renderProfile = () => (
      <section id="profile-view" className="view-container">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
                <img src={user.avatar} alt="Your avatar" />
                <button onClick={() => setShowAvatarModal(true)}>+</button>
            </div>
            <h2>Your Safe Space</h2>
            <p>Manage your wellness journey</p>
          </div>
          <div className="card">
              <h4>Your Journey</h4>
              <div className="journey-stats">
                  <div>
                    <div className="stat-icon calendar">🗓️</div>
                    <span className="stat-value">28</span>
                    <span className="stat-label">Days Active</span>
                  </div>
                  <div>
                    <div className="stat-icon heart">💙</div>
                    <span className="stat-value">156</span>
                    <span className="stat-label">Support Given</span>
                  </div>
                   <div>
                    <div className="stat-icon leaf">🌿</div>
                    <span className="stat-value">42</span>
                    <span className="stat-label">Reflections</span>
                  </div>
              </div>
          </div>
          <div className="card">
            <h4>Safe Space Controls</h4>
            <div className="setting-item-toggle">
                <div>🌙 Quiet Mode</div>
                <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
            </div>
            <div className="setting-item-toggle">
                <div>🛡️ Content Filter</div>
                <label className="switch"><input type="checkbox" /><span className="slider"></span></label>
            </div>
          </div>
          <div className="card emergency-card">
              <h4>Emergency Support</h4>
              <p>24/7 crisis helpline</p>
              <button className="btn-emergency">Call Crisis Hotline</button>
          </div>
          <div className="card">
              <button className="btn-secondary" onClick={onLogout}>Sign Out</button>
              <button className="btn-destructive">Delete Account</button>
          </div>
      </section>
  );

  const renderChat = () => {
    const buddy = displayBuddies.find(b => b.userId === activeChatId);
    const messages = (activeChatId ? conversations[activeChatId] : []) || [];

    return (
        <section id="chat-view">
            <header className="chat-view-header">
                <button onClick={handleCloseChat} className="chat-back-btn">
                    <svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
                </button>
                <div className="avatar-wrapper">
                    <img src={buddy?.avatar} alt={buddy?.userDisplayName} className="avatar" />
                    {buddy?.online && <div className="online-indicator"></div>}
                </div>
                <div className="chat-user-info">
                    <h3>{buddy?.userDisplayName || 'Chat'}</h3>
                    <span>Online</span>
                </div>
                <div className="chat-header-actions">
                    <button className="icon-btn-lg"><svg viewBox="0 0 24 24"><path d="M6 14h2v2H6zm0-4h2v2H6zm0-4h2v2H6zm4 8h8v2h-8zm0-4h8v2h-8zm0-4h8v2h-8z"></path></svg></button>
                    <button className="icon-btn-lg"><svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg></button>
                </div>
            </header>
            <div className="chat-messages">
                {messages.map(msg => (
                    <div key={msg.id} className={`message-bubble-wrapper ${msg.senderId === user.uid ? 'sent' : 'received'}`}>
                        {msg.senderId !== user.uid && <img src={buddy.avatar} alt="buddy avatar" className="bubble-avatar"/> }
                        <div className="message-bubble">
                            <p>{msg.text}</p>
                             {msg.special === 'grounding' && (
                                <div className="grounding-actions">
                                    <button>🌸 Send Affirmation</button>
                                    <button>🎧 Calm Audio</button>
                                </div>
                             )}
                            <span>{msg.time}</span>
                        </div>
                    </div>
                ))}
                <div ref={chatMessagesEndRef} />
            </div>
            <footer className="chat-form">
                <div className="chat-input-area">
                    <button className="icon-btn-lg primary-fill"><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg></button>
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Type your message..." />
                    <button className="send-btn" onClick={handleSendMessage}>
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                    </button>
                </div>
                <div className="chat-suggestions">
                    <button>🌸 Affirmation</button>
                    <button>🕯️ Mood</button>
                    <button>🧘 Breathe</button>
                </div>
            </footer>
        </section>
    );
  };


  return (
    <div className={`container`}>
      <main>
        {activeView === 'home' && renderHome()}
        {activeView === 'chatList' && renderChatList()}
        {activeView === 'reflect' && renderReflect()}
        {activeView === 'community' && renderCommunity()}
        {activeView === 'profile' && renderProfile()}
        {activeView === 'chat' && renderChat()}
      </main>
      
      {activeView !== 'chat' && (
        <nav className="app-bottom-nav">
          <button className={activeView === 'home' ? 'active' : ''} onClick={() => navigateTo('home')}>
            <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h4z"></path></svg>
            <span>Home</span>
          </button>
          {/* FIX: The `activeView === 'chat'` condition was unreachable because the navigation bar is hidden when `activeView` is 'chat'. Also made className syntax consistent. */}
          <button className={activeView === 'chatList' ? 'active' : ''} onClick={() => navigateTo('chatList')}>
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path></svg>
             <span>Chat</span>
          </button>
          <button className={activeView === 'reflect' ? 'active' : ''} onClick={() => navigateTo('reflect')}>
             <svg viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.31 0-6-2.69-6-6 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"></path></svg>
              <span>Reflect</span>
          </button>
          <button className={activeView === 'community' ? 'active' : ''} onClick={() => navigateTo('community')}>
            <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"></path></svg>
              <span>Community</span>
          </button>
           <button className={activeView === 'profile' ? 'active' : ''} onClick={() => navigateTo('profile')}>
             <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
              <span>Profile</span>
          </button>
        </nav>
      )}

      {showAvatarModal && (
          <AvatarSelectionModal 
            gender={user.gender} 
            currentAvatar={user.avatar} 
            onSelect={handleAvatarSelect} 
            onClose={() => setShowAvatarModal(false)}
          />
      )}
    </div>
  );
};

const OnboardingScreen = ({ onLogin }) => {
    const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

    const handleThemeToggle = (theme: string) => {
        setSelectedThemes(prev =>
            prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
        );
    };

    const themes = [
        { id: 'calming', label: 'Calming Themes' },
        { id: 'wellness', label: 'Emotional Wellness' },
        { id: 'practices', label: 'Mindful Practices' },
    ];
    
    // Light theme version of the original onboarding to match new app style
    return (
        <div className="onboarding-container light">
            <div className="onboarding-content">
                <h1>What inspires your journey?</h1>
                <p>Select themes, emotions, and practices that resonate with you. Explore a variety of calming resources to nurture your well-being and foster connection.</p>
                <div className="themes-list">
                    {themes.map(theme => (
                        <div key={theme.id} className="theme-item">
                            <input
                                type="checkbox"
                                id={theme.id}
                                checked={selectedThemes.includes(theme.id)}
                                onChange={() => handleThemeToggle(theme.id)}
                            />
                            <label htmlFor={theme.id}>{theme.label}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="onboarding-footer">
                <button className="start-btn" onClick={onLogin}>
                    Get Started
                </button>
            </div>
        </div>
    );
};


const AppWrapper = () => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedUser = localStorage.getItem('bareSoulsUser');
            return savedUser ? JSON.parse(savedUser) : null;
        } catch (error) {
            console.error("Could not access local storage to retrieve user:", error);
            return null;
        }
    });

    useEffect(() => {
        try {
            if (user) {
                localStorage.setItem('bareSoulsUser', JSON.stringify(user));
            } else {
                localStorage.removeItem('bareSoulsUser');
            }
        } catch (error) {
            console.error("Could not access local storage to save user:", error);
        }
    }, [user]);

    const handleLogin = () => {
        setUser(mockInitialUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (!user) {
        return <OnboardingScreen onLogin={handleLogin} />;
    }

    return <PeerChatApp user={user} setUser={setUser} onLogout={handleLogout} />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<React.StrictMode><AppWrapper /></React.StrictMode>);
}
