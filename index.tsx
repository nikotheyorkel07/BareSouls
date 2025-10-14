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

type ViewType = 'home' | 'connections' | 'community' | 'settings' | 'chat';

interface Post {
    id: string;
    userId: string;
    text: string;
    createdAt: Date;
    userDisplayName: string;
    avatar: string;
}

interface InspirePost {
    id: string;
    userId: string;
    userDisplayName: string;
    avatar: string;
    tag: 'Success Stories' | 'Gratitude' | 'Personal Stories';
    text: string;
    likes: number;
}

interface UserProfile {
    displayName: string;
    statusMessage: string;
    avatar: string;
    gender: 'male' | 'female';
}
interface Buddy {
    id: string;
    userId: string;
    userDisplayName: string;
    avatar: string;
    statusMessage: string;
    gender: 'male' | 'female';
    lastMessage?: string;
    lastMessageTime?: string;
}
interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    timestamp: Date;
    time: string;
}

const mockInitialUser: User = {
    uid: '12345',
    displayName: 'Manila',
    avatar: 'https://storage.googleapis.com/aai-web-samples/apps/peer-chat/new-avatars/female/01.png',
    gender: 'female',
};

const mockBuddies: Buddy[] = [
    { id: 'buddy-1', userId: 'kolkata43', userDisplayName: 'kolkata43', avatar: getRandomAvatar('male'), statusMessage: 'Feeling a bit better now.', gender: 'male', lastMessage: 'Yes, sure! Thank you!!', lastMessageTime: '10:48 pm' },
    { id: 'buddy-2', userId: 'delhi28', userDisplayName: 'delhi28', avatar: getRandomAvatar('female'), statusMessage: 'Keep going!', gender: 'female', lastMessage: 'That sounds like a great plan.', lastMessageTime: 'Yesterday' },
];

const mockInitialChatMessages: Record<string, ChatMessage[]> = {
    'kolkata43': [
        { id: 'msg1', senderId: 'kolkata43', text: "Hey there! How are you doing today manila?", timestamp: new Date(Date.now() - 3600000 * 3), time: "10:44 pm" },
        { id: 'msg2', senderId: '12345', text: "Not too good actually.", timestamp: new Date(Date.now() - 3600000 * 2), time: "10:45 pm" },
        { id: 'msg3', senderId: 'kolkata43', text: "Oh, I see. Well don't worry Manila, you can talk to me about it openly here. Tell me, what happened?", timestamp: new Date(Date.now() - 3600000), time: "10:45 pm" },
        { id: 'msg4', senderId: '12345', text: "Well, my life sucks :/", timestamp: new Date(Date.now() - 3500000), time: "10:45 pm" },
        { id: 'msg5', senderId: 'kolkata43', text: "I can understand. We all have had those days. However worry not, I am here for you, this is a safe space. What is bothering you Manila?", timestamp: new Date(Date.now() - 3400000), time: "10:45 pm" },
        { id: 'msg6', senderId: '12345', text: "Yes, sure! Thank you!!", timestamp: new Date(Date.now() - 3300000), time: "10:48 pm" },
    ],
    'delhi28': [
        { id: 'd-msg1', senderId: 'delhi28', text: "Hey! Just checking in.", timestamp: new Date(Date.now() - 86400000), time: "Yesterday" },
        { id: 'd-msg2', senderId: '12345', text: "Hey, thanks! Doing okay today.", timestamp: new Date(Date.now() - 86300000), time: "Yesterday" }
    ]
};

const mockInspirePosts: InspirePost[] = [
    { id: 'inspire-1', userId: 'delhi28', userDisplayName: '@delhi28', avatar: getRandomAvatar('female'), tag: 'Success Stories', text: 'What flowers should I order? said Harry struggling to stand as his legs trembled and the pain in his chest got worse. ‘Well what does she like’ sai.. Read More', likes: 3 },
    { id: 'inspire-2', userId: 'user-gamma', userDisplayName: '@casey22', avatar: getRandomAvatar('male'), tag: 'Success Stories', text: 'What have I become? My sweetest friend, everyone I know goes away in the end. And you cou.. Read More', likes: 6 },
    { id: 'inspire-3', userId: 'user-beta', userDisplayName: '@jamie19', avatar: getRandomAvatar('female'), tag: 'Gratitude', text: 'Today, I am grateful for the quiet moments and the first sip of coffee in the morning. It\'s the small things that bring the most joy.', likes: 12 },
    { id: 'inspire-4', userId: 'user-delta', userDisplayName: '@alex12', avatar: getRandomAvatar('female'), tag: 'Personal Stories', text: 'It took a long time, but I finally learned to set boundaries. It\'s not selfish, it\'s self-preservation. Feeling stronger every day.', likes: 25 },
];
// --- END MOCK DATA ---

const ParticleBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const theme = document.body.className || 'light';

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particlesArray: any[] = [];
        const numberOfParticles = 30;

        const setCanvasSize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        setCanvasSize();

        class Particle {
            x: number;
            y: number;
            size: number;
            speedX: number;
            speedY: number;
            color: string;

            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * 0.4 - 0.2;
                this.color = theme === 'dark' ? 'rgba(173, 189, 255, 0.4)' : 'rgba(101, 117, 225, 0.3)';
            }
            update() {
                if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
                if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
                this.x += this.speedX;
                this.y += this.speedY;
            }
            draw() {
                if (!ctx) return;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const init = () => {
            particlesArray = [];
            for (let i = 0; i < numberOfParticles; i++) {
                particlesArray.push(new Particle());
            }
        };
        init();

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particlesArray.length; i++) {
                particlesArray[i].update();
                particlesArray[i].draw();
            }
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('resize', setCanvasSize);

        return () => {
            window.removeEventListener('resize', setCanvasSize);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme]);

    return <canvas ref={canvasRef} id="particle-canvas"></canvas>;
};


const FindPeerModal = ({ onClose }) => {
    const [step, setStep] = useState(1);

    const handleFind = () => {
        setStep(2);
        setTimeout(() => {
            onClose(true); // Simulate finding a peer and closing
        }, 3000);
    };

    return (
        <div className="modal-backdrop" onClick={() => onClose(false)}>
            <div className="modal-content find-peer-modal" onClick={e => e.stopPropagation()}>
                {step === 1 && (
                    <>
                        <div className="find-peer-illustration step1">
                           <img src="https://storage.googleapis.com/aai-web-samples/apps/peer-chat/find-peer-step1.png" alt="Two cute animals talking" />
                        </div>
                        <h2>What's on your mind?</h2>
                        <div className="topic-grid">
                            <button>Relationships</button>
                            <button>Work & School</button>
                            <button>Personal Growth</button>
                            <button className="just-talk">Just talk</button>
                        </div>
                        <button className="find-soul-btn" onClick={handleFind}>Find a Soul</button>
                    </>
                )}
                {step === 2 && (
                    <>
                        <div className="find-peer-illustration step2">
                           <img src="https://storage.googleapis.com/aai-web-samples/apps/peer-chat/find-peer-step2.png" alt="A person looking thoughtful" />
                        </div>
                        <h2>Finding a Soul</h2>
                        <p className="finding-text">
                            Please be patient, finding the right Soul might take a few minutes.
                            <br/><br/>
                            Start the chat from here once the Soul accepts. They will be available for 30-60 minutes.
                        </p>
                        <button className="cancel-request-btn" onClick={() => onClose(false)}>Cancel Request</button>
                    </>
                )}
            </div>
        </div>
    );
};

const PeerChatApp = ({ user, setUser, onLogout }: { user: User, setUser: (user: User) => void, onLogout: () => void }) => {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [previousView, setPreviousView] = useState<ViewType>('home');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(mockInitialChatMessages);
  const chatMessagesEndRef = useRef<null | HTMLDivElement>(null);

  const [displayBuddies, setDisplayBuddies] = useState<Buddy[]>(mockBuddies);

  const [showFindPeerModal, setShowFindPeerModal] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [theme, setTheme] = useState('light');

  const randomizeBuddiesAvatars = () => {
      const newBuddies = mockBuddies.map(buddy => ({
          ...buddy,
          avatar: getRandomAvatar(buddy.gender)
      }));
      setDisplayBuddies(newBuddies);
  };

  useEffect(() => {
    document.body.className = theme;
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatId, theme]);

  useEffect(() => {
      if (activeView === 'connections') {
          randomizeBuddiesAvatars();
      }
  }, [activeView]);

  const handleOpenChat = (buddyId: string) => {
    setPreviousView(activeView);
    setActiveChatId(buddyId);
    setActiveView('chat');
  };
  
  const handleCloseChat = () => {
    setActiveView(previousView);
    setActiveChatId(null);
  };
  
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChatId) return;

    const getTimeString = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();

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

  const navigateTo = (view: ViewType) => {
    setPreviousView(activeView);
    setActiveView(view);
  }

  const handleAvatarSelect = (avatarUrl: string) => {
    setUser({ ...user, avatar: avatarUrl });
    setShowAvatarModal(false);
  };

  const MainHeader = ({ title }: { title: string }) => (
    <header className="view-header">
        <h2>{title}</h2>
        <button className="settings-btn" onClick={() => navigateTo('settings')}>
            <img src={user.avatar} alt="Your avatar" className="header-avatar" />
        </button>
    </header>
  );

  const EmptyState = ({ illustration, title, message }: { illustration: string, title: string, message: string }) => (
    <div className="empty-state-container">
        <img src={illustration} alt="" className="empty-state-illustration" />
        <h2 className="empty-state-title">{title}</h2>
        <p className="empty-state-message">{message}</p>
    </div>
  );
  
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
      <section id="home-view">
          <MainHeader title="Home" />
           <EmptyState 
            illustration="https://storage.googleapis.com/aai-web-samples/apps/peer-chat/empty-states/home-empty.png"
            title="Welcome to the Community"
            message="The Home feed is coming soon. For now, find inspiration in the Community or chat with a Soul."
           />
      </section>
  );

  const renderConnectionsList = () => (
      <section id="connections-list-view">
          <ParticleBackground />
          <MainHeader title="Connections" />
          {displayBuddies.length > 0 ? (
            <div className="chats-list">
                {displayBuddies.map(buddy => (
                    <div key={buddy.id} className="chat-list-item" onClick={() => handleOpenChat(buddy.userId)}>
                        <img src={buddy.avatar} alt={buddy.userDisplayName} className="avatar" />
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
          ) : (
            <EmptyState 
                illustration="https://storage.googleapis.com/aai-web-samples/apps/peer-chat/empty-states/connections-empty.png"
                title="No Connections Yet"
                message="Tap the '+' button to find a Soul to talk to. Your recent chats will appear here."
            />
          )}
      </section>
  );
  
  const renderCommunity = () => {
    const [filter, setFilter] = useState('All');
    const filteredPosts = mockInspirePosts.filter(p => filter === 'All' || p.tag === filter);

    return (
        <section id="community-view">
             <header className="view-header with-nav">
                <h2>Community</h2>
                <button className="edit-icon">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.7,4.3c-0.4-0.4-1-0.4-1.4,0L14.5,6.1l3.4,3.4l1.8-1.8c0.4-0.4,0.4-1,0-1.4L17.7,4.3z M13.1,7.5L5.4,15.2V18.6h3.4l7.7-7.7L13.1,7.5z M3,21h18v-2H3V21z"></path></svg>
                </button>
            </header>
            <nav className="community-filters">
                <button className={filter === 'All' ? 'active' : ''} onClick={() => setFilter('All')}>All</button>
                <button className={filter === 'Gratitude' ? 'active' : ''} onClick={() => setFilter('Gratitude')}>Gratitude</button>
                <button className={filter === 'Personal Stories' ? 'active' : ''} onClick={() => setFilter('Personal Stories')}>Personal Stories</button>
                <button className={filter === 'Success Stories' ? 'active' : ''} onClick={() => setFilter('Success Stories')}>Success Stories</button>
            </nav>
            {filteredPosts.length > 0 ? (
                <div className="inspire-posts">
                    {filteredPosts.map(post => (
                        <article key={post.id} className="inspire-card">
                            <header className="inspire-card-header">
                                <img src={post.avatar} alt={post.userDisplayName} className="avatar small" />
                                <div>
                                    <span className="display-name">{post.userDisplayName}</span>
                                    <span className="tag">{post.tag}</span>
                                </div>
                            </header>
                            <p className="inspire-text">{post.text}</p>
                            <footer className="inspire-card-footer">
                                <button><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12,21.4L10.6,20C5.4,15.4,2,12.3,2,8.5C2,5.4,4.4,3,7.5,3c1.7,0,3.4,0.8,4.5,2.1C13.1,3.8,14.8,3,16.5,3C19.6,3,22,5.4,22,8.5c0,3.8-3.4,6.9-8.6,11.5L12,21.4z"></path></svg> {post.likes}</button>
                                <button><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20,2H4C2.9,2,2,2.9,2,4v18l4-4h14c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M18,12H6v-2h12V12z M18,9H6V7h12V9z M18,6H6V4h12V6z"></path></svg> Chat</button>
                            </footer>
                        </article>
                    ))}
                </div>
            ) : (
                 <EmptyState 
                    illustration="https://storage.googleapis.com/aai-web-samples/apps/peer-chat/empty-states/community-empty.png"
                    title="It's a bit quiet here"
                    message="No posts match your filter. Why not be the first to share a story?"
                />
            )}
        </section>
    );
  };
  
  const renderSettings = () => (
      <section id="settings-view">
           <header className="chat-view-header">
                <button onClick={() => setActiveView(previousView)} className="chat-back-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
                </button>
                <h3>Settings</h3>
            </header>
            <div className="settings-profile-section">
                <img src={user.avatar} alt="Your avatar" className="settings-avatar" />
                <h3>{user.displayName}</h3>
                <button onClick={() => setShowAvatarModal(true)}>Edit Avatar</button>
            </div>
            <div className="settings-list">
                <div className="settings-item">
                    <span>Theme</span>
                     <label className="theme-switch">
                        <input type="checkbox" checked={theme === 'dark'} onChange={() => setTheme(theme === 'light' ? 'dark' : 'light')} />
                        <span className="slider"></span>
                    </label>
                </div>
                 <div className="settings-item">
                    <span>Account Settings</span>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                </div>
                 <div className="settings-item">
                    <span>Security & Privacy</span>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                </div>
                 <div className="settings-item">
                    <span>Privacy Policy</span>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                </div>
                 <div className="settings-item">
                    <span>Report Harm</span>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                </div>
                 <div className="settings-item">
                    <span>Help</span>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>
                </div>
            </div>
            <div className="settings-logout-section">
                <button className="logout-btn" onClick={onLogout}>Logout</button>
            </div>
      </section>
  );

  const renderChat = () => {
    const buddy = displayBuddies.find(b => b.userId === activeChatId);
    const messages = (activeChatId ? conversations[activeChatId] : []) || [];

    return (
        <section id="chat-view">
            <ParticleBackground />
            <header className="chat-view-header">
                <button onClick={handleCloseChat} className="chat-back-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
                </button>
                <img src={buddy?.avatar} alt={buddy?.userDisplayName} className="avatar" />
                <div className="chat-user-info">
                    <h3>{buddy?.userDisplayName || 'Chat'}</h3>
                    <div className="mood-indicator">😊 Calm</div>
                </div>
                <div className="chat-header-actions">
                    <button className="sos-btn" onClick={() => setShowSOS(true)}>SOS</button>
                    <button className="more-btn" onClick={() => setShowChatOptions(!showChatOptions)}>
                        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                    </button>
                    {showChatOptions && (
                        <div className="chat-options-menu">
                            <button>Help & Resources</button>
                            <button>FAQs</button>
                            <button>End Chat</button>
                            <button>Report User</button>
                            <button>Delete Chat</button>
                        </div>
                    )}
                </div>
            </header>
            <div className="chat-messages">
                <div className="system-message">
                    <p>🔒 BareSouls is completely anonymous & secure. No judgement or inappropriate behavior.</p>
                    <p>Refer to SOS section in crisis (top-right) and Support Tools for quick tips (bottom-left).</p>
                </div>
                {messages.map(msg => (
                    <div key={msg.id} className={`message-bubble-wrapper ${msg.senderId === user.uid ? 'sent' : 'received'}`}>
                        <div className="message-bubble">
                            <p>{msg.text}</p>
                            <span>{msg.time}</span>
                        </div>
                    </div>
                ))}
                <div ref={chatMessagesEndRef} />
            </div>
            <footer className="chat-form">
                <button className="support-tools-btn" aria-label="Support Tools">
                    🌿
                </button>
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Share your thoughts gently…" />
                <button className="send-btn" onClick={handleSendMessage}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
                </button>
            </footer>
        </section>
    );
  };
  
  const handleFindPeerClose = (found: boolean) => {
    setShowFindPeerModal(false);
    if(found) {
        handleOpenChat(mockBuddies[0].userId);
    }
  }

  return (
    <div className={`container`}>
      <main>
        {activeView === 'home' && renderHome()}
        {activeView === 'connections' && renderConnectionsList()}
        {activeView === 'community' && renderCommunity()}
        {activeView === 'settings' && renderSettings()}
        {activeView === 'chat' && renderChat()}
      </main>
      
      {activeView !== 'chat' && activeView !== 'settings' &&(
        <nav className="app-bottom-nav">
          <button className={activeView === 'home' ? 'active' : ''} onClick={() => setActiveView('home')}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"></path></svg>
            <span>Home</span>
          </button>
          <button className={activeView === 'connections' ? 'active' : ''} onClick={() => setActiveView('connections')}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.49 10.01C19.82 8.19 18.42 6.5 16.5 6.5H16.03C15.54 4.54 13.7 3 11.5 3C9.12 3 7.17 4.79 6.88 7.1C4.33 7.21 2.5 9.42 2.5 12c0 2.65 2.07 4.83 4.67 4.98h9.83c2.21 0 4-1.79 4-4 .01-2.05-1.53-3.79-3.51-3.97Z"></path></svg>
             <span>Connections</span>
          </button>
          <button className="nav-add-btn" onClick={() => setShowFindPeerModal(true)}>
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
          </button>
          <button className={activeView === 'community' ? 'active' : ''} onClick={() => setActiveView('community')}>
             <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5.5A3.5 3.5 0 0 1 15.5 9a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8c0-3.87 3.13-7 7-7s7 3.13 7 7c0 3.47-2.52 6.34-5.78 6.89l-1.22-2.14h-1.22l-1.22 2.14C7.52 14.34 5 11.47 5 8m5 10a2 2 0 0 0-2 2v1h6v-1c0-1.11-.89-2-2-2H10Z"></path></svg>
              <span>Community</span>
          </button>
        </nav>
      )}

      {showFindPeerModal && <FindPeerModal onClose={handleFindPeerClose} />}
      
      {showAvatarModal && (
          <AvatarSelectionModal 
            gender={user.gender} 
            currentAvatar={user.avatar} 
            onSelect={handleAvatarSelect} 
            onClose={() => setShowAvatarModal(false)}
          />
      )}

      {showSOS && (
        <div className="modal-backdrop" onClick={() => setShowSOS(false)}>
            <div className="modal-content sos-modal" onClick={e => e.stopPropagation()}>
                <h2>Emergency Resources</h2>
                <p>If you are in a crisis or any other person may be in danger, please contact a healthcare provider or use these resources.</p>
                <ul>
                    <li>National Suicide Prevention Lifeline: <strong>988</strong></li>
                    <li>Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong></li>
                    <li>The Trevor Project: <strong>1-866-488-7386</strong></li>
                </ul>
                <button onClick={() => setShowSOS(false)}>Close</button>
            </div>
        </div>
      )}
    </div>
  );
};

const AppWrapper = () => {
    const [user, setUser] = useState<User | null>(null);

    const handleLogin = () => {
        setUser(mockInitialUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (!user) {
        // A simplified login for this version
        return (
            <div className="login-container">
                <h1>BareSouls</h1>
                <p>Welcome to Soul land. Vent, unload and talk freely without judgment here!</p>
                <button className="login-btn" onClick={handleLogin}>
                    Start Healing
                </button>
            </div>
        );
    }

    return <PeerChatApp user={user} setUser={setUser} onLogout={handleLogout} />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<React.StrictMode><AppWrapper /></React.StrictMode>);
}
