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
    gender: 'male' | 'female' | 'ai';
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

interface JournalEntry {
  id: string;
  date: string;
  reflection: string;
  gratitude: string;
}

const mockInitialUser: User = {
    uid: '12345',
    displayName: 'Sarah',
    avatar: 'https://storage.googleapis.com/aai-web-samples/apps/bare-souls/avatars/sarah.png',
    gender: 'female',
};

const AI_USER_ID = 'wellness-guide-ai';
const mockBuddies: Buddy[] = [
    { id: 'buddy-ai', userId: AI_USER_ID, userDisplayName: 'Wellness Guide', avatar: 'https://storage.googleapis.com/aai-web-samples/apps/bare-souls/avatars/wellness-guide.png', gender: 'ai', lastMessage: 'Would you like to try some grounding...', online: true, lastMessageTime: '2:35 PM' },
    { id: 'buddy-2', userId: 'delhi28', userDisplayName: 'delhi28', avatar: getRandomAvatar('female'), gender: 'female', lastMessage: 'That sounds like a great plan.', online: false, lastMessageTime: 'Yesterday' },
];

const mockInitialChatMessages: Record<string, ChatMessage[]> = {
    [AI_USER_ID]: [
        { id: 'msg1', senderId: AI_USER_ID, text: "Hey! How are you feeling today? I've been thinking about our last conversation 💜", timestamp: new Date(Date.now() - 3600000 * 3), time: "2:30 PM" },
        { id: 'msg2', senderId: '12345', text: "I'm doing better today, thanks for checking in! Your support means everything 🌸", timestamp: new Date(Date.now() - 3600000 * 2), time: "2:32 PM" },
        { id: 'msg3', senderId: AI_USER_ID, text: "Would you like to try some grounding exercises together?", timestamp: new Date(Date.now() - 3600000), time: "2:35 PM", special: 'grounding' },
    ],
    'delhi28': [
        { id: 'd-msg1', senderId: 'delhi28', text: "Hey! Just checking in.", timestamp: new Date(Date.now() - 86400000), time: "Yesterday" },
        { id: 'd-msg2', senderId: '12345', text: "Hey, thanks! Doing okay today.", timestamp: new Date(Date.now() - 86300000), time: "Yesterday" }
    ]
};

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel' }) => (
    <div className="modal-backdrop">
        <div className="modal-content confirmation-modal">
            <h2>{title}</h2>
            <p>{message}</p>
            <div className="modal-actions">
                <button className="btn-secondary" onClick={onCancel}>{cancelText}</button>
                <button className="btn-destructive" onClick={onConfirm}>{confirmText}</button>
            </div>
        </div>
    </div>
);

const PeerChatApp = ({ user, setUser, onLogout, theme, setTheme }: { user: User, setUser: (user: User) => void, onLogout: () => void, theme: string, setTheme: (theme: string) => void }) => {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>(mockInitialChatMessages);
  const chatMessagesEndRef = useRef<null | HTMLDivElement>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [randomizedAvatars, setRandomizedAvatars] = useState<string[]>([]);
  const [mood, setMood] = useState(50);
  const [isQuietMode, setIsQuietMode] = useState(true);
  const [isContentFilterOn, setIsContentFilterOn] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentAffirmation, setCurrentAffirmation] = useState("I am worthy of love, kindness, and all the beautiful things life has to offer. My journey is unique and valuable.");
  const [isAffirmationLoading, setIsAffirmationLoading] = useState(false);
  const [journalEntry, setJournalEntry] = useState({ reflection: '', gratitude: '' });
  const [journalHistory, setJournalHistory] = useState<JournalEntry[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showAllJournals, setShowAllJournals] = useState(false);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatId, isAiTyping]);

  useEffect(() => {
    try {
        const savedHistory = localStorage.getItem('bareSoulsJournalHistory');
        if (savedHistory) {
            setJournalHistory(JSON.parse(savedHistory));
        }
    } catch (error) {
        console.error("Could not load journal history from local storage:", error);
    }
  }, []);

  useEffect(() => {
    try {
        localStorage.setItem('bareSoulsJournalHistory', JSON.stringify(journalHistory));
    } catch (error) {
        console.error("Could not save journal history to local storage:", error);
    }
  }, [journalHistory]);


  const navigateTo = (view: ViewType) => {
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

  const generateAndAddAiResponse = async (chatId: string, currentConversation: ChatMessage[]) => {
      setIsAiTyping(true);
      try {
          const conversationHistory = currentConversation.slice(-5).map(msg => {
            const prefix = msg.senderId === user.uid ? 'User: ' : 'Guide: ';
            return prefix + msg.text;
          }).join('\n');

          const systemInstruction = `You are a compassionate Wellness Guide in an anonymous emotional support app called BareSouls. Your role is to provide gentle, empathetic support. If the user mentions feeling anxious, stressed, or if they've been prompted with a 'grounding exercise', offer a simple, actionable calming technique or a grounding exercise. Otherwise, respond with understanding and kindness. You can also suggest gentle journaling prompts to encourage reflection. Keep your responses concise, warm, and encouraging. Do not replace the role of a therapist, but act as a supportive peer.
          
          Current Conversation:
          ${conversationHistory}`;

          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: systemInstruction
          });

          const aiMessage: ChatMessage = {
              id: `msg-${Date.now()}`,
              senderId: AI_USER_ID,
              text: response.text,
              timestamp: new Date(),
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(' AM', 'AM').replace(' PM', 'PM'),
          };

          setConversations(prev => ({
              ...prev,
              [chatId]: [...(prev[chatId] || []), aiMessage],
          }));

      } catch (error) {
          console.error("Failed to generate AI response:", error);
          const errorMessage: ChatMessage = {
            id: `msg-error-${Date.now()}`,
            senderId: AI_USER_ID,
            text: "I'm having a little trouble connecting right now, but I'm still here for you. 💜",
            timestamp: new Date(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).replace(' AM', 'AM').replace(' PM', 'PM'),
          };
           setConversations(prev => ({
              ...prev,
              [chatId]: [...(prev[chatId] || []), errorMessage],
          }));
      } finally {
          setIsAiTyping(false);
      }
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

    const updatedConversation = [...(conversations[activeChatId] || []), newMessage];
    setConversations(prev => ({
        ...prev,
        [activeChatId]: updatedConversation,
    }));
    
    setChatInput('');

    if (activeChatId === AI_USER_ID) {
        // Use a short timeout to allow the user's message to render first
        setTimeout(() => generateAndAddAiResponse(activeChatId, updatedConversation), 300);
    }
  };

  const handleAvatarSelect = (avatarUrl: string) => {
    setUser({ ...user, avatar: avatarUrl });
    setShowAvatarModal(false);
  };
  
  const handleOpenAvatarModal = () => {
    const sourceAvatars = user.gender === 'male' ? NEW_MALE_AVATARS : NEW_FEMALE_AVATARS;
    const shuffled = [...sourceAvatars].sort(() => 0.5 - Math.random());
    const selectionCount = Math.min(shuffled.length, 12);
    setRandomizedAvatars(shuffled.slice(0, selectionCount));
    setShowAvatarModal(true);
  };

  const handleRefreshAffirmation = async () => {
    setIsAffirmationLoading(true);
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a short, positive, and empowering affirmation for someone focusing on their mental well-being. It should be one or two sentences.",
        });
        setCurrentAffirmation(response.text.replace(/"/g, ''));
    } catch (error) {
        console.error("Failed to generate affirmation:", error);
        // Fallback to a default affirmation in case of an error
        setCurrentAffirmation("Every day is a new opportunity to grow and heal.");
    } finally {
        setIsAffirmationLoading(false);
    }
  };

  const handleShareAffirmation = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'My Daily Affirmation',
                text: currentAffirmation
            });
        } catch (error) {
            // This catches the error when the user cancels the share dialog (AbortError).
            // We can safely ignore it and prevent a console error.
            if (error.name !== 'AbortError') {
              console.error('Share failed:', error);
            }
        }
    } else {
        alert('Web Share API is not supported in your browser.');
    }
  };

  const handleSharePost = async (postText: string) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'A message from the BareSouls community',
                text: postText
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
              console.error('Share failed:', error);
            }
        }
    } else {
        alert('Web Share API is not supported in your browser.');
    }
  };

  const handleDeleteAccount = () => {
      console.log("Account deleted.");
      setShowDeleteConfirm(false);
      onLogout();
  };


  const AvatarSelectionModal = ({ avatars, currentAvatar, onSelect, onClose }) => {
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
                    <button className={`icon-btn-sm ${isAffirmationLoading ? 'loading' : ''}`} onClick={handleRefreshAffirmation} disabled={isAffirmationLoading}>
                        <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg>
                    </button>
                </div>
                <div className="affirmation-content">
                    <div className="affirmation-icon">⭐️</div>
                    <h5>Today's Affirmation</h5>
                    <p>{isAffirmationLoading ? 'Finding a new inspiration for you...' : currentAffirmation}</p>
                </div>
                <div className="card-actions">
                    <button className="btn-secondary" onClick={() => alert('Saved!')}>♡ Save</button>
                    <button className="btn-primary" onClick={handleShareAffirmation}><span>Share</span></button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h4>Guided Meditation</h4>
                    <button className="icon-btn-sm" onClick={() => alert('Bookmarked!')}><svg viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"></path></svg></button>
                </div>
                <div className="meditation-content">
                    <button className="play-button" onClick={() => alert('Playing meditation...') }><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg></button>
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
              {mockBuddies.map(buddy => (
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

    const handleJournalChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setJournalEntry(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveReflection = () => {
        if (!journalEntry.reflection.trim() && !journalEntry.gratitude.trim()) {
            alert("Please write a reflection or gratitude before saving.");
            return;
        }
        const newEntry: JournalEntry = {
            id: `journal-${Date.now()}`,
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            reflection: journalEntry.reflection,
            gratitude: journalEntry.gratitude,
        };
        setJournalHistory(prev => [newEntry, ...prev]);
        setJournalEntry({ reflection: '', gratitude: '' }); // Clear inputs
        setShowAllJournals(false); // Reset to collapsed view
        alert('Reflection saved!');
    };
    
    const displayedJournals = showAllJournals ? journalHistory : journalHistory.slice(0, 2);

    return (
        <section id="reflect-view" className="view-container">
            <header className="view-header">
                <div>
                    <h1>Mood Journal</h1>
                    <p>How are you feeling today?</p>
                </div>
                <button className="icon-btn-lg" onClick={() => alert('Calendar view coming soon!')}><svg viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"></path></svg></button>
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
                <textarea name="reflection" placeholder="Share your thoughts..." value={journalEntry.reflection} onChange={handleJournalChange}></textarea>
                <label>Gratitude for today</label>
                <textarea name="gratitude" placeholder="What are you grateful for?" value={journalEntry.gratitude} onChange={handleJournalChange}></textarea>
                <button className="btn-primary" onClick={handleSaveReflection}><span>Save Reflection</span></button>
            </div>

            <div className="card">
              <h4>Your Past Reflections</h4>
              <div className="journal-history">
                  {journalHistory.length > 0 ? (
                      displayedJournals.map(entry => (
                          <div key={entry.id} className="journal-entry-item">
                              <p className="entry-date">{entry.date}</p>
                              {entry.reflection && (
                                  <>
                                      <strong>A little lighter:</strong>
                                      <p>{entry.reflection}</p>
                                  </>
                              )}
                              {entry.gratitude && (
                                  <>
                                      <strong>Gratitude:</strong>
                                      <p>{entry.gratitude}</p>
                                  </>
                              )}
                          </div>
                      ))
                  ) : (
                      <p className="empty-history-message">Your saved reflections will appear here.</p>
                  )}
              </div>
              {journalHistory.length > 2 && !showAllJournals && (
                <button className="btn-show-more" onClick={() => setShowAllJournals(true)}>
                    Show More
                </button>
              )}
            </div>
        </section>
    )
  };

  const renderCommunity = () => {
    const postBody = "Remember that healing isn't linear. Some days you'll feel like you're moving backwards, but that's just part of the journey. You're stronger than you know. 💜";
    return (
        <section id="community-view" className="view-container">
            <header className="view-header">
                <h1>Souls Around You</h1>
            </header>
            <div className="card">
                <h4>Quick Mood Check</h4>
                <div className="mood-check-grid">
                    <button onClick={() => alert('Sharing that you feel sad.')}>😔 Sad</button>
                    <button onClick={() => alert('Sharing that you feel happy!')}>😊 Happy</button>
                    <button onClick={() => alert('Sharing that you feel anxious.')}>😟 Anxious</button>
                    <button onClick={() => alert('Sharing that you feel calm.')}>🙂 Calm</button>
                </div>
            </div>
            <div className="card">
                <div className="card-header">
                    <h4>Share kindness, find support</h4>
                    <button className="icon-btn-lg primary-fill" onClick={() => alert('New post modal will show here!')}><svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg></button>
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
                    <p className="post-body">{postBody}</p>
                    <div className="post-actions">
                        <div>
                            <button>♡ 24</button>
                            <button>💬 8</button>
                            <button onClick={() => handleSharePost(postBody)}>🔗 Share</button>
                        </div>
                        <button className="support-link">Send support</button>
                    </div>
                </div>
            </div>
        </section>
    );
  }
  
  const renderProfile = () => (
      <section id="profile-view" className="view-container">
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
                <img src={user.avatar} alt="Your avatar" />
                <button onClick={handleOpenAvatarModal}>+</button>
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
                <h4>Appearance</h4>
                <div className="theme-selector">
                    <button className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
                        <svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.64 5.64c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.06 1.06c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L5.64 5.64zm12.73 12.73c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l1.06 1.06c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-1.06-1.06zM5.64 18.36l1.06-1.06c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0zm12.73-12.73l1.06-1.06c.39-.39.39-1.02 0-1.41-.39-.39-1.02-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0z"></path></svg>
                        Light
                    </button>
                    <button className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
                        <svg viewBox="0 0 24 24"><path d="M10 2c-1.82 0-3.53.5-5 1.35C7.99 5.08 10 8.3 10 12s-2.01 6.92-5 8.65C6.47 21.5 8.18 22 10 22c5.52 0 10-4.48 10-10S15.52 2 10 2z"></path></svg>
                        Dark
                    </button>
                </div>
            </div>
          <div className="card">
            <h4>Safe Space Controls</h4>
            <div className="setting-item-toggle">
                <div>🌙 Quiet Mode</div>
                <label className="switch"><input type="checkbox" checked={isQuietMode} onChange={() => setIsQuietMode(!isQuietMode)} /><span className="slider"></span></label>
            </div>
            <div className="setting-item-toggle">
                <div>🛡️ Content Filter</div>
                <label className="switch"><input type="checkbox" checked={isContentFilterOn} onChange={() => setIsContentFilterOn(!isContentFilterOn)} /><span className="slider"></span></label>
            </div>
          </div>
          <div className="card emergency-card">
              <h4>Emergency Support</h4>
              <p>24/7 crisis helpline</p>
              <button className="btn-emergency" onClick={() => window.location.href = 'tel:988'}>Call Crisis Hotline</button>
          </div>
          <div className="card">
              <button className="btn-secondary" onClick={onLogout}>Sign Out</button>
              <button className="btn-destructive" onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
          </div>
      </section>
  );

  const renderChat = () => {
    const buddy = mockBuddies.find(b => b.userId === activeChatId);
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
                {isAiTyping && (
                    <div className="message-bubble-wrapper received">
                        <img src={buddy.avatar} alt="buddy avatar" className="bubble-avatar"/>
                        <div className="message-bubble">
                           <div className="typing-indicator">
                                <span></span><span></span><span></span>
                           </div>
                        </div>
                    </div>
                )}
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
    <div className={`app-shell`}>
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
            avatars={randomizedAvatars} 
            currentAvatar={user.avatar} 
            onSelect={handleAvatarSelect} 
            onClose={() => setShowAvatarModal(false)}
          />
      )}
      {showDeleteConfirm && (
        <ConfirmationModal 
            title="Delete Account"
            message="Are you sure you want to delete your account? This action is permanent and cannot be undone."
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteConfirm(false)}
            confirmText="Yes, Delete"
        />
      )}
    </div>
  );
};

const OnboardingScreen = ({ onLogin }) => {
    return (
        <div className="onboarding-container light">
            <div className="onboarding-content">
                <h1>Welcome to BareSouls</h1>
                <p>A safe space for anonymous emotional support. Connect with peers, reflect on your journey, and find resources to nurture your well-being.</p>
            </div>
            <div className="onboarding-footer">
                <button className="start-btn" onClick={onLogin}>
                    Begin Your Journey
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

    const [theme, setTheme] = useState<string>(() => {
        try {
            const savedTheme = localStorage.getItem('bareSoulsTheme');
            return savedTheme ? savedTheme : 'light';
        } catch (error) {
            return 'light';
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

    useEffect(() => {
        try {
            localStorage.setItem('bareSoulsTheme', theme);
            document.body.className = theme; // Apply theme to body for global styles
        } catch (error) {
             console.error("Could not access local storage to save theme:", error);
        }
    }, [theme]);


    const handleLogin = () => {
        setUser(mockInitialUser);
    };

    const handleLogout = () => {
        setUser(null);
    };

    if (!user) {
        return <OnboardingScreen onLogin={handleLogin} />;
    }

    return (
      <div className={`container ${theme}`}>
        <PeerChatApp user={user} setUser={setUser} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
      </div>
    );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<React.StrictMode><AppWrapper /></React.StrictMode>);
}