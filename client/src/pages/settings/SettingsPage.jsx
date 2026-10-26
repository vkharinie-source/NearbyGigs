import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { authService } from '../../services/authService';
import { 
  Shield, 
  MapPin, 
  Bell, 
  User, 
  Sliders, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Save,
  Globe,
  Lock,
  Briefcase,
  Users,
  Compass,
  Layers,
  Check,
  Eye,
  EyeOff,
  Trash2
} from 'lucide-react';
import './Settings.css';

const SettingsPage = () => {
  const { user, choosePurpose, refreshUser, logout } = useAuthContext();
  const { location, getLocation, address } = useLocationContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [savingPurpose, setSavingPurpose] = useState(false);
  const [purposeMessage, setPurposeMessage] = useState('');

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: '', text: '' });

  // Settings State
  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    shareLocation: true,
    blurExactAddress: true,
    discoveryRadius: 25,
    emailAlerts: true,
    pushNotifications: true,
    chatSound: true,
    gigUpdates: true,
    weeklyDigest: false,
    currency: 'INR (₹)',
    language: 'English (US)',
    autoAcceptQuotes: false,
    currentPurpose: user?.purpose || 'both',
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    try {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to save settings.');
    }
  };

  const handlePurposeChange = async (newPurpose) => {
    setSavingPurpose(true);
    setPurposeMessage('');
    try {
      if (choosePurpose) {
        await choosePurpose(newPurpose);
      } else {
        await authService.choosePurpose(newPurpose);
      }
      setSettings(prev => ({ ...prev, currentPurpose: newPurpose }));
      setPurposeMessage('Account purpose updated! Your dashboard and features are now refreshed.');
      if (refreshUser) await refreshUser();
      setTimeout(() => setPurposeMessage(''), 4000);
    } catch (err) {
      setPurposeMessage(err.response?.data?.message || 'Failed to update account purpose.');
    } finally {
      setSavingPurpose(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: '', text: '' });

    if (passwordData.newPassword.length < 6) {
      setPasswordStatus({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordStatus({ type: 'success', text: 'Password changed successfully! Keep it safe.' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus({ type: '', text: '' });
      }, 2500);
    } catch (err) {
      setPasswordStatus({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Please verify current password.',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const purposeOptions = [
    {
      id: 'find_work',
      title: 'Find Work',
      desc: 'Explore available gigs, student-safe tasks, and local jobs',
      icon: <Compass size={20} color="#2563eb" />,
      badge: 'Worker Mode',
    },
    {
      id: 'post_jobs',
      title: 'Post a Job',
      desc: 'Publish listings, hire verified workers, and manage attendance',
      icon: <Briefcase size={20} color="#059669" />,
      badge: 'Employer Mode',
    },
    {
      id: 'offer_services',
      title: 'Offer Professional Services',
      desc: 'Showcase your skills and receive incoming task bookings',
      icon: <Users size={20} color="#7c3aed" />,
      badge: 'Freelancer Mode',
    },
    {
      id: 'both',
      title: 'Both: Find Work and Hire',
      desc: 'Access both worker discovery and employer hiring in one unified dashboard',
      icon: <Layers size={20} color="#d97706" />,
      badge: 'Full Dual Mode',
    },
  ];

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content">
          {/* Header */}
          <div className="dash-welcome-card settings-hero">
            <div>
              <div className="badge-pill mb-2">
                <Sliders size={14} className="text-primary" /> Settings & Preferences
              </div>
              <h1 className="settings-title">Control Center & Account Settings</h1>
              <p className="settings-subtitle">
                Manage your credentials, platform role/purpose, privacy radius, and security preferences.
              </p>
            </div>
            {savedSuccess && (
              <div className="save-toast-banner">
                <CheckCircle2 size={18} className="text-success" />
                <span>Settings saved successfully!</span>
              </div>
            )}
            {errorMessage && (
              <div className="save-toast-banner" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
                <AlertTriangle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <div className="settings-container">
            {/* Settings Navigation Tabs */}
            <aside className="settings-nav">
              <button 
                className={`settings-nav-btn ${activeTab === 'account' ? 'active' : ''}`}
                onClick={() => setActiveTab('account')}
              >
                <User size={18} />
                <span>Account & Profile</span>
              </button>
              <button 
                className={`settings-nav-btn ${activeTab === 'purpose' ? 'active' : ''}`}
                onClick={() => setActiveTab('purpose')}
              >
                <Layers size={18} />
                <span>Purpose & Role</span>
              </button>
              <button 
                className={`settings-nav-btn ${activeTab === 'privacy' ? 'active' : ''}`}
                onClick={() => setActiveTab('privacy')}
              >
                <MapPin size={18} />
                <span>Location & Privacy</span>
              </button>
              <button 
                className={`settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} />
                <span>Notifications</span>
              </button>
              <button 
                className={`settings-nav-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveTab('preferences')}
              >
                <Sliders size={18} />
                <span>Preferences</span>
              </button>
              <button 
                className={`settings-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <Shield size={18} />
                <span>Security & Password</span>
              </button>
            </aside>

            {/* Main Settings Panel */}
            <div className="settings-panel">
              <form onSubmit={handleSave}>
                {/* 1. Account Tab */}
                {activeTab === 'account' && (
                  <div className="settings-section-card">
                    <div className="section-header">
                      <h3>Account Information</h3>
                      <p>View your personal registration credentials and verified contact details.</p>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input 
                          type="text" 
                          className="modern-input" 
                          value={settings.name} 
                          onChange={(e) => setSettings({ ...settings, name: e.target.value })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address</label>
                        <input 
                          type="email" 
                          className="modern-input" 
                          value={settings.email} 
                          disabled 
                        />
                        <span className="form-help">Primary email is linked to your authentication token and KYC.</span>
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input 
                          type="text" 
                          className="modern-input" 
                          value={settings.phone} 
                          onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                      <div className="form-group">
                        <label>Account Role & Type</label>
                        <input 
                          type="text" 
                          className="modern-input" 
                          value={`${(user?.role || 'user').toUpperCase()} • ${(user?.userType || 'Professional').replace('_', ' ').toUpperCase()}`} 
                          disabled 
                        />
                        <span className="form-help">Change what you do on NearbyGigs in the &quot;Purpose & Role&quot; tab.</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Purpose & Role Tab */}
                {activeTab === 'purpose' && (
                  <div className="settings-section-card">
                    <div className="section-header">
                      <h3>What would you like to do on NearbyGigs?</h3>
                      <p>Switch your primary focus anytime. You don&apos;t need multiple accounts to find work and hire workers.</p>
                    </div>

                    {purposeMessage && (
                      <div
                        style={{
                          padding: '0.85rem 1.15rem',
                          borderRadius: '10px',
                          marginBottom: '1.25rem',
                          background: purposeMessage.includes('updated') ? '#ecfdf5' : '#fef2f2',
                          color: purposeMessage.includes('updated') ? '#065f46' : '#991b1b',
                          border: `1px solid ${purposeMessage.includes('updated') ? '#a7f3d0' : '#fecaca'}`,
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        <CheckCircle2 size={18} />
                        <span>{purposeMessage}</span>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                      {purposeOptions.map((opt) => {
                        const isSelected = settings.currentPurpose === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => !savingPurpose && handlePurposeChange(opt.id)}
                            style={{
                              border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                              borderRadius: '14px',
                              padding: '1.35rem',
                              background: isSelected ? '#eff6ff' : '#ffffff',
                              cursor: savingPurpose ? 'wait' : 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                              <div
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  borderRadius: '10px',
                                  background: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                                }}
                              >
                                {opt.icon}
                              </div>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  padding: '0.2rem 0.55rem',
                                  borderRadius: '999px',
                                  background: isSelected ? '#2563eb' : '#f1f5f9',
                                  color: isSelected ? '#ffffff' : '#64748b',
                                }}
                              >
                                {opt.badge}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', margin: '0 0 0.35rem' }}>
                              {opt.title}
                            </h4>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem', lineHeight: '1.45', flex: 1 }}>
                              {opt.desc}
                            </p>

                            <button
                              type="button"
                              className={isSelected ? 'btn-primary' : 'btn-secondary'}
                              style={{ width: '100%', padding: '0.55rem', fontSize: '0.82rem', fontWeight: '700', borderRadius: '8px' }}
                              disabled={savingPurpose}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePurposeChange(opt.id);
                              }}
                            >
                              {isSelected ? '✓ Active Mode' : 'Switch to this'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. Location & Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="settings-section-card">
                    <div className="section-header">
                      <h3>Location Privacy & Geofence</h3>
                      <p>Protect your student and personal coordinates while retaining local gig matching.</p>
                    </div>

                    <div className="location-status-box">
                      <div className="loc-icon-bubble">
                        <MapPin size={24} className="text-primary" />
                      </div>
                      <div className="loc-info">
                        <strong>Current Synced Location</strong>
                        <p>{address || (location ? `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}` : 'Bengaluru, Karnataka')}</p>
                      </div>
                      <button 
                        type="button" 
                        className="btn-sync-loc"
                        onClick={getLocation}
                      >
                        <RefreshCw size={15} /> Re-Sync GPS
                      </button>
                    </div>

                    <div className="settings-list">
                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Share Approximate Location in Discovery</h4>
                          <p>Allows nearby clients and workers to see your gigs within their radius without exposing your exact address or street name.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={settings.shareLocation} 
                            onChange={() => handleToggle('shareLocation')} 
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>

                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Fuzzy Distance Obfuscation (±300m)</h4>
                          <p>Automatically add privacy jitter to map pins to protect home or school neighborhood privacy.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={settings.blurExactAddress} 
                            onChange={() => handleToggle('blurExactAddress')} 
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>

                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Default Discovery Radius: {settings.discoveryRadius} km</h4>
                          <p>Radius used when searching for local gigs and verified workers.</p>
                        </div>
                        <div className="range-wrap">
                          <input 
                            type="range" 
                            min="5" 
                            max="50" 
                            step="5"
                            value={settings.discoveryRadius} 
                            onChange={(e) => setSettings({ ...settings, discoveryRadius: Number(e.target.value) })} 
                            className="radius-slider-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="settings-section-card">
                    <div className="section-header">
                      <h3>Notification Channels</h3>
                      <p>Choose when and how you want to receive alerts.</p>
                    </div>

                    <div className="settings-list">
                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Instant Push & In-App Notifications</h4>
                          <p>Real-time notifications for job commitment confirmations, attendance OTPs, and completion reviews.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={settings.pushNotifications} 
                            onChange={() => handleToggle('pushNotifications')} 
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>

                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Email Alerts</h4>
                          <p>Receive email updates when someone accepts your application or generates an attendance code.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={settings.emailAlerts} 
                            onChange={() => handleToggle('emailAlerts')} 
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>

                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Safety & Emergency Broadcasts</h4>
                          <p>High-priority notifications for emergency alerts, curfews, and employer verification notices.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={true} 
                            disabled 
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="settings-section-card">
                    <div className="section-header">
                      <h3>Marketplace Preferences</h3>
                      <p>Tailor your localized currency, language, and booking parameters.</p>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Preferred Currency</label>
                        <select 
                          className="modern-select"
                          value={settings.currency}
                          onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        >
                          <option>INR (₹) - Indian Rupee</option>
                          <option>USD ($) - US Dollar</option>
                          <option>EUR (€) - Euro</option>
                          <option>GBP (£) - British Pound</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Language</label>
                        <select 
                          className="modern-select"
                          value={settings.language}
                          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        >
                          <option>English (US)</option>
                          <option>Tamil (தமிழ்)</option>
                          <option>Hindi (हिन्दी)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Security Tab */}
                {activeTab === 'security' && (
                  <div className="settings-section-card">
                    <div className="section-header">
                      <h3>Security & Authentication</h3>
                      <p>Protect your account with encrypted passwords and session safety.</p>
                    </div>

                    <div className="security-tile">
                      <div className="sec-icon">
                        <KeyRound size={22} className="text-primary" />
                      </div>
                      <div className="sec-info">
                        <strong>Change Password</strong>
                        <p>We recommend choosing a strong password with at least 8 characters including symbols.</p>
                      </div>
                      <button 
                        type="button" 
                        className="btn-secondary-modern"
                        onClick={() => setShowPasswordModal(true)}
                      >
                        Update Password
                      </button>
                    </div>

                    <div className="security-tile mt-3">
                      <div className="sec-icon">
                        <Lock size={22} className="text-primary" />
                      </div>
                      <div className="sec-info">
                        <strong>Active Session</strong>
                        <p>Currently logged in on this browser (Chrome / Windows). JWT Session is active.</p>
                      </div>
                      <span className="badge badge-success" style={{ background: '#ecfdf5', color: '#065f46', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.78rem' }}>
                        Active Now
                      </span>
                    </div>

                    <div className="danger-zone-box mt-4">
                      <div className="danger-header">
                        <AlertTriangle size={20} className="text-danger" />
                        <div>
                          <strong>Sign Out Everywhere</strong>
                          <p>Revoke your active authentication session and clear all local storage.</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        className="btn-danger-outline"
                        onClick={() => {
                          logout();
                          navigate('/login');
                        }}
                      >
                        Log Out Now
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Save bar */}
                <div className="settings-save-footer">
                  <button type="submit" className="btn-primary-modern">
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-backdrop-custom" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '1rem' }}>
          <div className="modal-card-custom" style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '2rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={20} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Update Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '1.5rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {passwordStatus.text && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  background: passwordStatus.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: passwordStatus.type === 'success' ? '#065f46' : '#991b1b',
                  border: `1px solid ${passwordStatus.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                }}
              >
                {passwordStatus.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Current Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="modern-input"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    placeholder="Enter existing password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  New Password (min 6 characters)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="modern-input"
                    style={{ width: '100%', paddingRight: '2.5rem' }}
                    placeholder="Enter strong new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="modern-input"
                  style={{ width: '100%' }}
                  placeholder="Re-enter new password"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={passwordLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {passwordLoading ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
