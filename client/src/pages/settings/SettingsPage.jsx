import React, { useState } from 'react';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
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
  Lock
} from 'lucide-react';
import './Settings.css';

const SettingsPage = () => {
  const { user } = useAuthContext();
  const { location, getLocation, address } = useLocationContext();

  const [activeTab, setActiveTab] = useState('account');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '+91 98765 43210',
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
    autoAcceptQuotes: false
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

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
              <h1 className="settings-title">Control Center & Privacy</h1>
              <p className="settings-subtitle">
                Manage your account credentials, real-time location discovery bounds, notification alerts, and platform behavior.
              </p>
            </div>
            {savedSuccess && (
              <div className="save-toast-banner">
                <CheckCircle2 size={18} className="text-success" />
                <span>Settings saved successfully!</span>
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
                <span>Security & Login</span>
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
                      <p>Update your personal details and contact preferences.</p>
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
                        <span className="form-help">Primary email is linked to your authentication token.</span>
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input 
                          type="text" 
                          className="modern-input" 
                          value={settings.phone} 
                          onChange={(e) => setSettings({ ...settings, phone: e.target.value })} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Account Role</label>
                        <input 
                          type="text" 
                          className="modern-input" 
                          value={user?.role?.toUpperCase() || 'BOTH'} 
                          disabled 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Location & Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="settings-section-card">
                    <div className="section-header">
                      <h3>Location Privacy & Geofence</h3>
                      <p>Control how your coordinates are shared for local gig matching.</p>
                    </div>

                    <div className="location-status-box">
                      <div className="loc-icon-bubble">
                        <MapPin size={24} className="text-primary" />
                      </div>
                      <div className="loc-info">
                        <strong>Current Synced Location</strong>
                        <p>{address || (location ? `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}` : 'Chennai, Tamil Nadu')}</p>
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
                          <p>Allows nearby clients and workers to see your gigs within their radius without exposing your exact address.</p>
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
                          <p>Automatically add jitter to map pins to protect your neighborhood privacy.</p>
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

                {/* 3. Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="settings-section-card">
                    <div className="section-header">
                      <h3>Notification Channels</h3>
                      <p>Choose when and how you want to be notified.</p>
                    </div>

                    <div className="settings-list">
                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Instant Push Notifications</h4>
                          <p>Real-time browser notifications for incoming messages and direct service requests.</p>
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
                          <p>Receive email updates when someone applies to your gig or accepts your proposal.</p>
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
                          <h4>Message Sound Effects</h4>
                          <p>Play a soft chime when a new chat message arrives.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={settings.chatSound} 
                            onChange={() => handleToggle('chatSound')} 
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>

                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Weekly Nearby Digest</h4>
                          <p>Summary of high-paying local gigs posted in your neighborhood every Monday.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={settings.weeklyDigest} 
                            onChange={() => handleToggle('weeklyDigest')} 
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Preferences Tab */}
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

                    <div className="settings-list mt-4">
                      <div className="setting-item">
                        <div className="setting-text">
                          <h4>Auto-Accept Instant Booking Requests</h4>
                          <p>Automatically accept bookings if client budget meets your minimum hourly rate.</p>
                        </div>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={settings.autoAcceptQuotes} 
                            onChange={() => handleToggle('autoAcceptQuotes')} 
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Security Tab */}
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
                        <p>We recommend choosing a strong password with at least 8 characters.</p>
                      </div>
                      <button type="button" className="btn-secondary-modern">Update Password</button>
                    </div>

                    <div className="security-tile mt-3">
                      <div className="sec-icon">
                        <Lock size={22} className="text-primary" />
                      </div>
                      <div className="sec-info">
                        <strong>Active Sessions</strong>
                        <p>Currently logged in on this browser (Chrome / Windows).</p>
                      </div>
                      <span className="badge badge-success">Active Now</span>
                    </div>

                    <div className="danger-zone-box mt-4">
                      <div className="danger-header">
                        <AlertTriangle size={20} className="text-danger" />
                        <div>
                          <strong>Danger Zone</strong>
                          <p>Permanently delete your NearbyGig profile and gig history.</p>
                        </div>
                      </div>
                      <button type="button" className="btn-danger-outline">Delete Account</button>
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
    </div>
  );
};

export default SettingsPage;
