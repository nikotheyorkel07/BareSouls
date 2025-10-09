import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// Per guidelines, API key must come from process.env.API_KEY
// DO NOT modify this line.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Simulate a logged-in user. In a real app, this would come from an auth context.
const currentUserId = 'user-self-001';

const initialMessages = [
  {
    id: 1,
    userId: 'user-abc-123',
    text: "Feeling really overwhelmed with work this week. It feels like I can't catch a break.",
    response: "It's completely valid to feel that way. Remember to take small moments for yourself, even a few deep breaths can help.",
    reactions: { heard: 5, hug: 12, support: 8 }
  },
  {
    id: 2,
    userId: 'user-xyz-789',
    text: "I'm nervous about an upcoming presentation. I keep thinking I'll mess it up.",
    response: "It's natural to feel nervous. You've prepared for this, and you are more capable than you think. You've got this.",
    reactions: { heard: 10, hug: 3, support: 15 }
  }
];

const initialBuddyRequests: BuddyRequest[] = [
    { id: 1, from: 'user-jkl-456', to: currentUserId, status: 'pending', postText: "Just feeling a bit lost today and needed to share..." },
    { id: 2, from: currentUserId, to: 'user-mno-012', status: 'pending', postText: "Trying to stay positive but it's hard some days." },
];

const articles = [
  {
    id: 1,
    title: "Understanding Anxiety: A Beginner's Guide",
    summary: "Learn about the common symptoms of anxiety and discover three simple breathing techniques to find calm in stressful moments.",
    tags: ["anxiety", "coping", "beginners"],
  },
  {
    id: 2,
    title: "The Power of Mindfulness",
    summary: "Mindfulness is the practice of being present. Explore how this simple act can reduce stress and improve your overall well-being.",
    tags: ["mindfulness", "stress", "self-care"],
  },
  {
    id: 3,
    title: "Navigating Social Burnout",
    summary: "Feeling drained after social interactions? You're not alone. Learn to recognize the signs of social burnout and how to recharge effectively.",
    tags: ["social-health", "burnout", "boundaries"],
  }
];

type ReactionType = 'heard' | 'hug' | 'support';
type ViewType = 'feed' | 'souls' | 'settings';
type ThemeType = 'light' | 'dark';
type BuddyRequestStatus = 'pending' | 'accepted' | 'declined';
interface BuddyRequest {
    id: number;
    from: string;
    to: string;
    status: BuddyRequestStatus;
    postText: string;
}
interface ChatMessage {
    id: number;
    senderId: string;
    text: string;
    timestamp: Date;
}
interface Conversations {
    [chatId: string]: ChatMessage[];
}

const BareSoulsApp = () => {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('feed');
  const [theme, setTheme] = useState<ThemeType>('light');
  const [buddyRequests, setBuddyRequests] = useState<BuddyRequest[]>(initialBuddyRequests);
  const [postConfirmation, setPostConfirmation] = useState('');
  
  // Messaging State
  const [conversations, setConversations] = useState<Conversations>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const chatMessagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to the latest message in chat
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeChatId]);


  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const postMessage = async () => {
    if (!newMessage.trim()) {
      alert('Please write a message to post.');
      return;
    }
    setIsLoading(true);
    let supportiveResponse = "Your feelings are valid, and you've taken a brave step by sharing them.";
    try {
      const prompt = `A person shared this feeling anonymously: "${newMessage}". Write a short, comforting, and supportive one-sentence response.`;
      const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      supportiveResponse = result.text;
    } catch (error) {
      console.error("Error generating supportive response:", error);
    } finally {
      const newPost = {
          id: Date.now(),
          userId: currentUserId,
          text: newMessage,
          response: supportiveResponse,
          reactions: { heard: 0, hug: 0, support: 0 },
      };
      // Delay showing the post to make the feedback more noticeable
      setTimeout(() => {
        setMessages([newPost, ...messages]);
        setIsLoading(false);
      }, 500);

      setNewMessage('');
      setPostConfirmation('Post Shared!');
      setTimeout(() => setPostConfirmation(''), 3000); // Hide toast after 3 seconds
    }
  };
  
  const handleReaction = (messageId: number, reaction: ReactionType) => {
    setMessages(messages.map(msg => 
      msg.id === messageId
        ? { ...msg, reactions: { ...msg.reactions, [reaction]: msg.reactions[reaction] + 1 } }
        : msg
    ));
  };

  const handleSendRequest = (targetUserId: string, postText: string) => {
    const newRequest: BuddyRequest = {
        id: Date.now(),
        from: currentUserId,
        to: targetUserId,
        status: 'pending',
        postText: postText,
    };
    setBuddyRequests([...buddyRequests, newRequest]);
  };

  const handleRequestResponse = (requestId: number, newStatus: 'accepted' | 'declined') => {
    setBuddyRequests(buddyRequests.map(req => 
        req.id === requestId ? { ...req, status: newStatus } : req
    ).filter(req => req.status !== 'declined')); // Remove declined requests from view
  };

  const getConnectButtonState = (targetUserId: string): { state: string; text: string; disabled: boolean; } | null => {
    if (targetUserId === currentUserId) {
      return null; // Don't render a button for your own posts
    }
    const existingRequest = buddyRequests.find(req => 
        (req.from === currentUserId && req.to === targetUserId) ||
        (req.from === targetUserId && req.to === currentUserId)
    );
    if (existingRequest) {
      switch (existingRequest.status) {
        case 'accepted':
          return { state: 'buddies', text: 'Buddies ✅', disabled: true };
        case 'pending':
          return { state: 'pending', text: 'Request Sent', disabled: true };
      }
    }
    return { state: 'connect', text: 'Connect', disabled: false };
  };

  // --- Messaging Functions ---
  const handleOpenChat = (buddyId: string) => {
    const chatId = [currentUserId, buddyId].sort().join('--');
    if (!conversations[chatId]) {
        // Initialize conversation if it doesn't exist
        setConversations(prev => ({ ...prev, [chatId]: [] }));
    }
    setActiveChatId(chatId);
  };
  
  const handleCloseChat = () => setActiveChatId(null);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeChatId) return;
    
    const newMessage: ChatMessage = {
      id: Date.now(),
      senderId: currentUserId,
      text: chatInput,
      timestamp: new Date(),
    };

    const updatedConversations = {
      ...conversations,
      [activeChatId]: [...conversations[activeChatId], newMessage]
    };
    setConversations(updatedConversations);
    setChatInput('');

    // Simulate a reply
    setTimeout(() => {
        const buddyId = activeChatId.replace(currentUserId, '').replace('--', '');
        const replyMessage: ChatMessage = {
            id: Date.now() + 1,
            senderId: buddyId,
            text: "Thanks for sharing that with me.",
            timestamp: new Date(),
        };
        setConversations(prev => ({
            ...prev,
            [activeChatId]: [...prev[activeChatId], replyMessage]
        }));
    }, 1500);
  };

  const incomingRequests = buddyRequests.filter(req => req.to === currentUserId && req.status === 'pending');
  const pendingRequests = buddyRequests.filter(req => req.from === currentUserId && req.status === 'pending');
  const myBuddies = buddyRequests.filter(req => req.status === 'accepted' && (req.from === currentUserId || req.to === currentUserId));

  return (
    <div className={`container ${theme}`}>
      <header className="app-header">
        <div>
          <h1>BareSouls</h1>
          <p>Share your thoughts. Find support.</p>
        </div>
      </header>
      
      <main>
        {activeView === 'feed' && (
          <section id="feed-view">
            <div className="post-form">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={5}
                aria-label="New anonymous message"
              />
              <button onClick={postMessage} disabled={isLoading}>
                {isLoading ? 'Posting...' : 'Post Anonymously'}
              </button>
            </div>
            <div className="messages-list">
              {messages.map(msg => {
                  const connectState = getConnectButtonState(msg.userId);
                  return (
                    <article key={msg.id} className="message-card">
                      <div className="message-header">
                        <p className="message-text">"{msg.text}"</p>
                        {connectState && (
                            <button 
                                className={`connect-btn ${connectState.state}`}
                                onClick={() => handleSendRequest(msg.userId, msg.text)}
                                disabled={connectState.disabled}>
                                {connectState.text}
                            </button>
                        )}
                      </div>
                      <blockquote className="message-response">
                        <p><strong>A supportive thought:</strong> {msg.response}</p>
                      </blockquote>
                      <div className="message-reactions">
                         <button className="reaction-btn" onClick={() => handleReaction(msg.id, 'heard')} aria-label={`React with Heard, current count ${msg.reactions.heard}`}>
                            <span role="img" aria-hidden="true">👂</span> <span className="reaction-count">{msg.reactions.heard}</span>
                        </button>
                        <button className="reaction-btn" onClick={() => handleReaction(msg.id, 'hug')} aria-label={`React with Hug, current count ${msg.reactions.hug}`}>
                            <span role="img" aria-hidden="true">🤗</span> <span className="reaction-count">{msg.reactions.hug}</span>
                        </button>
                        <button className="reaction-btn" onClick={() => handleReaction(msg.id, 'support')} aria-label={`React with Support, current count ${msg.reactions.support}`}>
                            <span role="img" aria-hidden="true">💜</span> <span className="reaction-count">{msg.reactions.support}</span>
                        </button>
                      </div>
                    </article>
                  )
                })}
            </div>
          </section>
        )}

        {activeView === 'souls' && (
            <section id="souls-view">
                <div id="buddies-content">
                    <div className="buddies-section">
                        <h3>Incoming Requests</h3>
                        {incomingRequests.length > 0 ? (
                            <div className="requests-list">
                                {incomingRequests.map(req => (
                                    <div key={req.id} className="request-card">
                                        <p>Someone connected with your post: <em>"{req.postText.substring(0, 50)}..."</em></p>
                                        <div className="request-actions">
                                            <button className="accept-btn" onClick={() => handleRequestResponse(req.id, 'accepted')}>Accept</button>
                                            <button className="decline-btn" onClick={() => handleRequestResponse(req.id, 'declined')}>Decline</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="empty-state">No new requests.</p>}
                    </div>

                    <div className="buddies-section">
                        <h3>My Buddies</h3>
                        {myBuddies.length > 0 ? (
                           <div className="buddies-list">
                               {myBuddies.map(buddy => {
                                   const buddyId = buddy.from === currentUserId ? buddy.to : buddy.from;
                                   return (
                                       <div key={buddy.id} className="buddy-card" onClick={() => handleOpenChat(buddyId)}>
                                           <div className="buddy-info">
                                              <div className="buddy-avatar">🫂</div>
                                              <span>Anonymous Buddy</span>
                                           </div>
                                           <button className="message-btn">Message</button>
                                       </div>
                                   );
                               })}
                           </div>
                        ) : <p className="empty-state">You haven't connected with anyone yet.</p>}
                    </div>
                    
                    <div className="buddies-section">
                        <h3>Pending Requests</h3>
                        {pendingRequests.length > 0 ? (
                            <div className="requests-list">
                               {pendingRequests.map(req => (
                                   <div key={req.id} className="request-card pending">
                                       <p>Request sent to the author of: <em>"{req.postText.substring(0, 50)}..."</em></p>
                                       <span className="pending-status">Waiting...</span>
                                   </div>
                               ))}
                            </div>
                        ) : <p className="empty-state">No pending outgoing requests.</p>}
                    </div>
                </div>

                <div id="articles-content">
                    <h2>Curated Resources</h2>
                    <p className="section-description">A collection of articles to help you navigate your feelings and find support.</p>
                    <div className="articles-list">
                      {articles.map(article => (
                        <article key={article.id} className="article-card">
                          <h3>{article.title}</h3>
                          <p>{article.summary}</p>
                          <div className="tags">
                            {article.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                          </div>
                        </article>
                      ))}
                    </div>
                </div>
            </section>
        )}
        
        {activeView === 'settings' && (
            <section id="settings-view">
                <h2>Settings</h2>
                <div className="settings-list">
                    <div className="setting-item">
                        <label htmlFor="theme-toggle-btn">Appearance</label>
                        <button id="theme-toggle-btn" onClick={toggleTheme} className="setting-action-btn">
                            Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode {theme === 'light' ? '🌙' : '☀️'}
                        </button>
                    </div>
                    <div className="setting-item">
                        <label>Account</label>
                        <button className="setting-action-btn" disabled>Manage Account</button>
                    </div>
                    <div className="setting-item">
                        <label>Privacy</label>
                        <button className="setting-action-btn" disabled>Privacy Settings</button>
                    </div>
                </div>
            </section>
        )}
      </main>
      
      <nav className="app-bottom-nav">
        <button className={activeView === 'feed' ? 'active' : ''} onClick={() => setActiveView('feed')}>Feed</button>
        <button className={activeView === 'souls' ? 'active' : ''} onClick={() => setActiveView('souls')}>Souls</button>
        <button className={`settings-btn ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')} aria-label="Settings">
            <span role="img" aria-hidden="true">⚙️</span>
        </button>
      </nav>

      {/* Post Confirmation Toast */}
      {postConfirmation && (
          <div className="post-confirmation-toast">
              {postConfirmation}
          </div>
      )}

      {/* Chat Modal */}
      {activeChatId && (
        <div className="chat-overlay">
          <div className="chat-window">
            <header className="chat-header">
              <h3>Anonymous Buddy</h3>
              <button onClick={handleCloseChat} className="chat-close-btn">&times;</button>
            </header>
            <div className="chat-messages">
                {conversations[activeChatId]?.length > 0 ? (
                    conversations[activeChatId].map(msg => (
                        <div key={msg.id} className={`message-bubble-wrapper ${msg.senderId === currentUserId ? 'sent' : 'received'}`}>
                            <div className="message-bubble">{msg.text}</div>
                        </div>
                    ))
                ) : (
                    <div className="chat-empty-state">
                        <p>You are now connected.</p>
                        <span>Messages sent here are private between you and this buddy.</span>
                    </div>
                )}
              <div ref={chatMessagesEndRef} />
            </div>
            <footer className="chat-form">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BareSoulsApp />
    </React.StrictMode>
  );
}
