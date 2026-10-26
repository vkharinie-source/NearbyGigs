import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Users,
} from 'lucide-react';
import './Messages.css';

const MessagesPage = () => {
  const { user } = useAuthContext();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');
  const targetUserName = searchParams.get('name');

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  // Fallback demo contacts
  const defaultContacts = [
    { _id: '674500000000000000000002', name: 'Arun Kumar', role: 'Electrician & Pro Worker', email: 'arun@example.com' },
    { _id: '674500000000000000000003', name: 'Priya Sharma', role: 'Shop Owner & Employer', email: 'priya@example.com' },
    { _id: '674500000000000000000004', name: 'Rahul Verma', role: 'Student Worker', email: 'rahul@example.com' },
    { _id: '674500000000000000000005', name: 'Meera Nair', role: 'Cleaning Specialist', email: 'meera@example.com' },
  ].filter((c) => c._id !== user?._id && c.email !== user?.email);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const [convRes, contactsRes] = await Promise.allSettled([
        messageService.getConversations(),
        messageService.getContacts(),
      ]);

      const convList = convRes.status === 'fulfilled' ? (convRes.value.conversations || []) : [];
      setConversations(convList);

      const realContacts = contactsRes.status === 'fulfilled' ? (contactsRes.value.contacts || []) : [];
      const filteredRealContacts = realContacts.filter(
        (c) => c._id !== user?._id && c._id !== user?.id && c.email !== user?.email
      );
      setContacts(filteredRealContacts);

      if (targetUserId) {
        // User came from "Chat" button with specific recipient
        setActiveUser({
          _id: targetUserId,
          name: targetUserName ? decodeURIComponent(targetUserName) : 'Specialist',
          role: 'worker',
        });
      } else if (convList.length > 0) {
        setActiveUser(convList[0].user);
      } else if (filteredRealContacts.length > 0) {
        setActiveUser(filteredRealContacts[0]);
      } else if (defaultContacts.length > 0) {
        setActiveUser(defaultContacts[0]);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      if (defaultContacts.length > 0) {
        setActiveUser(defaultContacts[0]);
      }
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
    if (activeUser && activeUser._id) {
      fetchChatMessages(activeUser._id);
    }
  }, [activeUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const textToSend = inputMsg.trim();
    if (!textToSend || !activeUser) return;

    setSending(true);
    try {
      const data = await messageService.sendMessage({
        recipientId: activeUser._id,
        recipientEmail: activeUser.email,
        content: textToSend,
      });

      setInputMsg('');

      // Add message immediately to the UI thread
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        const finalRecipientId = data.message.recipient || activeUser._id;
        if (data.message.recipient && data.message.recipient !== activeUser._id) {
          setActiveUser((prev) => ({ ...prev, _id: data.message.recipient }));
        }
        fetchChatMessages(finalRecipientId);
      } else if (activeUser._id) {
        fetchChatMessages(activeUser._id);
      }
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const displayedContacts = (contacts.length > 0 ? contacts : defaultContacts).filter(
    (c) =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.role && c.role.toLowerCase().includes(searchTerm.toLowerCase()))
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
                  <div className="empty-convs-box" style={{ padding: '0.75rem 0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.65rem', paddingLeft: '0.5rem' }}>
                      Start Chat with Active Members:
                    </div>
                    {displayedContacts.map((contact) => (
                      <div
                        key={contact._id}
                        className={`conv-item-card ${activeUser?._id === contact._id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveUser(contact);
                          fetchChatMessages(contact._id);
                        }}
                        style={{ cursor: 'pointer', marginBottom: '0.5rem' }}
                      >
                        <div className="conv-user-avatar">
                          {contact.name ? contact.name.charAt(0).toUpperCase() : 'U'}
                          <span className="online-indicator-dot" />
                        </div>
                        <div className="conv-item-body">
                          <div className="conv-name-row">
                            <span className="conv-user-name">{contact.name}</span>
                          </div>
                          <p className="conv-preview-text" style={{ color: '#2563eb', fontWeight: 500 }}>
                            {contact.role || contact.userType || 'Verified Member'}
                          </p>
                        </div>
                      </div>
                    ))}
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
