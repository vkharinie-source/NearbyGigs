import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { messageService } from '../../services/messageService';
import { useAuthContext } from '../../context/AuthContext';
import {
  Send,
  MessageSquare,
  User,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Phone,
  Sparkles,
  Loader2,
} from 'lucide-react';
import './Messages.css';

const MessagesPage = () => {
  const { user } = useAuthContext();
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      const convList = data.conversations || [];
      setConversations(convList);
      if (convList.length > 0 && !activeUser) {
        setActiveUser(convList[0].user);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChatMessages = async (userId) => {
    if (!userId) return;
    try {
      const data = await messageService.getMessagesWithUser(userId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching chat messages:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeUser) {
      fetchChatMessages(activeUser._id);
    }
  }, [activeUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeUser) return;

    setSending(true);
    try {
      await messageService.sendMessage({
        recipientId: activeUser._id,
        content: inputMsg.trim(),
      });
      setInputMsg('');
      fetchChatMessages(activeUser._id);
      fetchConversations();
    } catch (err) {
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content messages-main-shell">
          <div className="messages-layout-card app-card">
            {/* LEFT: CONVERSATION LIST */}
            <div className="conversations-sidebar-panel">
              <div className="conv-panel-header">
                <div className="conv-title-row">
                  <MessageSquare size={20} color="#2563eb" />
                  <h3>Messages</h3>
                </div>
                <div className="conv-search-box">
                  <Search size={16} className="conv-search-icon" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="conversations-list-scroll">
                {loading ? (
                  <div className="conv-skeleton-box">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="conv-skeleton-item">
                        <div className="skeleton-shimmer skeleton-avatar" />
                        <div style={{ flex: 1 }}>
                          <div className="skeleton-shimmer skeleton-title" style={{ height: '14px' }} />
                          <div className="skeleton-shimmer skeleton-line" style={{ height: '10px', marginTop: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length > 0 ? (
                  filteredConversations.map((conv) => {
                    const isSelected = activeUser?._id === conv.user?._id;
                    return (
                      <div
                        key={conv.user?._id || Math.random()}
                        className={`conv-item-card ${isSelected ? 'active' : ''}`}
                        onClick={() => setActiveUser(conv.user)}
                      >
                        <div className="conv-user-avatar">
                          {conv.user?.name ? conv.user.name.charAt(0).toUpperCase() : 'U'}
                          <span className="online-indicator-dot" />
                        </div>

                        <div className="conv-item-body">
                          <div className="conv-name-row">
                            <span className="conv-user-name">{conv.user?.name || 'User'}</span>
                            <span className="conv-time-text">
                              {conv.lastMessage?.createdAt
                                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                          <p className="conv-preview-text">
                            {conv.lastMessage?.content || 'Started a conversation'}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-convs-box">
                    <MessageSquare size={32} color="#94a3b8" />
                    <h4>No conversations yet</h4>
                    <p>Connect with a nearby customer or worker to start chatting.</p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: CHAT THREAD WINDOW */}
            <div className="chat-thread-panel">
              {activeUser ? (
                <>
                  {/* Chat Active User Header */}
                  <div className="chat-header-bar">
                    <div className="chat-active-profile">
                      <div className="chat-header-avatar">
                        {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="chat-header-name-row">
                          <h4>{activeUser.name || 'User'}</h4>
                          <span className="role-tag role-worker">
                            {(activeUser.role || 'USER').toUpperCase()}
                          </span>
                        </div>
                        <span className="chat-header-meta">
                          {activeUser.email || 'Verified Nearby Member'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Messages Bubble Scroll Area */}
                  <div className="chat-messages-body">
                    {messages.length > 0 ? (
                      messages.map((m) => {
                        const isMine = m.sender === user?._id || m.sender?._id === user?._id;
                        return (
                          <div
                            key={m._id}
                            className={`message-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                          >
                            <div className="message-bubble">
                              <p className="message-text">{m.content}</p>
                              <span className="message-time">
                                {m.createdAt
                                  ? new Date(m.createdAt).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'Now'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="chat-empty-thread">
                        <Sparkles size={32} color="#2563eb" />
                        <h4>Direct Messaging Channel</h4>
                        <p>Say hello to {activeUser.name} to discuss gig details, scope, or timeline.</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Form */}
                  <form onSubmit={handleSendMessage} className="chat-input-bar">
                    <input
                      type="text"
                      className="chat-input-field"
                      placeholder={`Message ${activeUser.name || 'user'}...`}
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="btn-send-message"
                      disabled={sending || !inputMsg.trim()}
                    >
                      {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </>
              ) : (
                <div className="chat-no-selection">
                  <MessageSquare size={48} color="#94a3b8" />
                  <h3>Select a conversation</h3>
                  <p>Choose a participant from the left sidebar to view message history and reply.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MessagesPage;
