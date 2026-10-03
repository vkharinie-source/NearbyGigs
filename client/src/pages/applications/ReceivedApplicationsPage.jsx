import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { applicationService } from '../../services/applicationService';
import {
  Users,
  Check,
  X,
  Clock,
  Briefcase,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
  Loader2,
  PlusCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import './Applications.css';

// Sample fallback proposals for testing & demonstration
const DEMO_PROPOSALS = [
  {
    _id: 'demo-app-1',
    applicant: {
      name: 'Rajesh Verma',
      rating: 4.8,
      experience: 8,
    },
    gig: {
      title: 'Bathroom Leakage & Tap Replacement',
      category: 'Plumbing',
    },
    proposedRate: 650,
    proposal:
      'I am an experienced plumber located 3.5 km away in Koramangala. I carry replacement brass valves, sealants, and precision wrench sets. Can arrive within 30 minutes to fix the shower and taps.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isDemo: true,
  },
  {
    _id: 'demo-app-2',
    applicant: {
      name: 'Arun Kumar',
      rating: 4.9,
      experience: 6,
    },
    gig: {
      title: '2-BHK Living Room Switchboard & Lighting Wiring',
      category: 'Electrical',
    },
    proposedRate: 900,
    proposal:
      'Licensed residential electrician. I can test circuit voltage, replace standard switches with modular plates, and properly ground all wall outlets with a 6-month work warranty.',
    status: 'pending',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isDemo: true,
  },
];

const ReceivedApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [showDemo, setShowDemo] = useState(false);

  const fetchReceived = async () => {
    try {
      setLoading(true);
      const data = await applicationService.getReceivedApplications();
      const list = data.applications || [];
      setApplications(list);
      // If user has 0 real proposals, enable demo mode so the UI is immediately functional
      if (list.length === 0) {
        setShowDemo(true);
      }
    } catch (err) {
      console.error('Error loading received applications:', err);
      setShowDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceived();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setUpdatingId(id);
    try {
      if (id.startsWith('demo-')) {
        // Demo update
        setApplications((prev) =>
          prev.map((app) => (app._id === id ? { ...app, status } : app))
        );
      } else {
        await applicationService.updateApplicationStatus(id, status);
        fetchReceived();
      }
    } catch (err) {
      alert('Failed to update application status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const displayedList = applications.length > 0 ? applications : (showDemo ? DEMO_PROPOSALS : []);

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content">
          <div className="page-header-container">
            <div className="page-title-group">
              <div className="welcome-badge-pill" style={{ marginBottom: '0.4rem', width: 'fit-content' }}>
                <Sparkles size={13} />
                <span>INCOMING APPLICANT PITCHES</span>
              </div>
              <h1>Received Gig Proposals</h1>
              <p>Review rates, evaluate worker profiles, and accept proposals submitted for your posted gigs.</p>
            </div>

            <div className="header-action-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link to="/create-gig" className="btn-primary" style={{ padding: '0.65rem 1.15rem' }}>
                <PlusCircle size={16} /> Post a New Gig
              </Link>
            </div>
          </div>

          {/* Demo Mode Notice Pill */}
          {applications.length === 0 && showDemo && (
            <div className="app-card" style={{ padding: '0.85rem 1.25rem', marginBottom: '1.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sparkles size={16} color="#2563eb" />
                <span style={{ fontSize: '0.88rem', color: '#1e40af' }}>
                  <strong>Demo Mode Active:</strong> Showing sample proposals so you can preview and test accepting / rejecting pitches.
                </span>
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setShowDemo(!showDemo)}
              >
                {showDemo ? 'Hide Demo Data' : 'Show Demo Data'}
              </button>
            </div>
          )}

          <div className="applications-container">
            {loading ? (
              <div className="cards-stack-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-shimmer skeleton-title" />
                    <div className="skeleton-shimmer skeleton-line" />
                  </div>
                ))}
              </div>
            ) : displayedList.length > 0 ? (
              <div className="applications-grid-stack">
                {displayedList.map((app) => (
                  <div key={app._id} className="app-card received-proposal-card">
                    <div className="proposal-card-top">
                      <div className="applicant-user-block">
                        <div className="applicant-avatar">
                          {app.applicant?.name ? app.applicant.name.charAt(0).toUpperCase() : 'W'}
                        </div>
                        <div>
                          <div className="applicant-name-row">
                            <h4>{app.applicant?.name || 'Local Worker'}</h4>
                            <span className="badge-tag badge-category">
                              {app.gig?.category || 'Gig'}
                            </span>
                            {app.isDemo && (
                              <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#3730a3', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: '700' }}>
                                SAMPLE
                              </span>
                            )}
                          </div>
                          <span className="proposal-for-gig">
                            Applied for: <strong>{app.gig?.title || 'Your Gig'}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="proposal-price-status">
                        <span className="proposed-amount-pill">
                          ₹{app.proposedRate}
                        </span>
                        <span className={`status-badge ${app.status || 'pending'}`}>
                          {(app.status || 'PENDING').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="proposal-content-box">
                      <span className="quote-label">Worker&apos;s Pitch:</span>
                      <p>&quot;{app.proposal}&quot;</p>
                    </div>

                    <div className="proposal-card-footer">
                      <span className="proposal-time-meta">
                        <Clock size={13} />
                        Submitted{' '}
                        {app.createdAt
                          ? new Date(app.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recently'}
                      </span>

                      <div className="proposal-action-btns">
                        {app.status === 'pending' ? (
                          <>
                            <button
                              className="btn-reject-action"
                              onClick={() => handleStatusUpdate(app._id, 'rejected')}
                              disabled={updatingId === app._id}
                            >
                              <X size={15} /> Decline
                            </button>
                            <button
                              className="btn-accept-action"
                              onClick={() => handleStatusUpdate(app._id, 'accepted')}
                              disabled={updatingId === app._id}
                            >
                              <Check size={15} /> Accept Proposal
                            </button>
                          </>
                        ) : (
                          <span className="action-resolved-label" style={{ color: app.status === 'accepted' ? '#10b981' : '#ef4444', fontWeight: '700' }}>
                            {app.status === 'accepted' ? '✓ Accepted Proposal' : '✗ Declined Proposal'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <div className="empty-state-icon-box" style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <Users size={32} />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.5rem' }}>No Received Proposals Yet</h3>
                <p style={{ color: '#64748b', maxWidth: '480px', margin: '0 auto 1.5rem', lineHeight: '1.6' }}>
                  When nearby workers discover your posted gigs and submit their proposals, you will be able to review their bids, ratings, and time estimates here.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  <Link to="/create-gig" className="btn-primary">
                    <PlusCircle size={16} /> Post a Gig Now
                  </Link>
                  <button type="button" className="btn-secondary" onClick={() => setShowDemo(true)}>
                    <Sparkles size={16} /> Load Sample Proposals
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReceivedApplicationsPage;
