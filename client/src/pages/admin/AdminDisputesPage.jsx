import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Send,
  Eye,
  CheckSquare,
  ArrowUpRight,
  UserCheck,
  Building2,
  Users,
  Paperclip,
  Activity,
  RotateCcw,
  DollarSign,
  Briefcase,
  X,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { adminService } from '../../services/adminService';
import { useAuthContext } from '../../context/AuthContext';
import WorkStatusTimeline from '../../components/work/WorkStatusTimeline';
import '../../components/work/WorkCompletion.css';

const AdminDisputesPage = () => {
  const { user } = useAuthContext();
  const [disputes, setDisputes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    awaitingInfo: 0,
    resolved: 0,
    escalated: 0,
    reopened: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Resolution modal state
  const [resolutionDecision, setResolutionDecision] = useState('approve_completion'); // 'approve_completion' | 'order_correction' | 'refund_employer' | 'mutual_settlement'
  const [reasonRationale, setReasonRationale] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');

  // Request info modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoTarget, setInfoTarget] = useState('both'); // 'worker' | 'employer' | 'both'
  const [infoInstructions, setInfoInstructions] = useState('');

  // Reopen modal state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenJustification, setReopenJustification] = useState('');

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getDisputes({
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setDisputes(data.disputes || []);
      setStats(data.stats || {});
      if (selectedDispute) {
        // Refresh selected dispute if open
        const updated = (data.disputes || []).find((d) => d._id === selectedDispute._id);
        if (updated) setSelectedDispute(updated);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve dispute records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDisputes();
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute || !reasonRationale.trim()) {
      alert('Please provide a documented rationale for this decision.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.resolveDispute(selectedDispute._id, {
        resolutionDecision,
        reason: reasonRationale.trim(),
        correctiveAction: correctiveAction.trim(),
      });
      showToast('✓ Dispute resolved and binding determination recorded!');
      setReasonRationale('');
      fetchDisputes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record dispute resolution.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestInfoSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute || !infoInstructions.trim()) return;

    setActionLoading(true);
    try {
      await adminService.requestDisputeInfo(selectedDispute._id, {
        targetParty: infoTarget,
        instructions: infoInstructions.trim(),
      });
      showToast('✓ Information request dispatched to target party.');
      setShowInfoModal(false);
      setInfoInstructions('');
      fetchDisputes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request information.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute || !reopenJustification.trim()) return;

    setActionLoading(true);
    try {
      await adminService.reopenDispute(selectedDispute._id, {
        reason: reopenJustification.trim(),
      });
      showToast('✓ Case has been reopened for further investigation.');
      setShowReopenModal(false);
      setReopenJustification('');
      fetchDisputes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reopen case.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main" style={{ padding: '2rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                <span className="work-status-badge status-approved">Role: Platform Administrator</span>
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                ⚖️ Work Dispute Resolution & Arbitration Dashboard
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                Independent administrative tribunal for two-way work verification, quality discrepancies, and escrow settlements.
              </p>
            </div>

            <button
              onClick={fetchDisputes}
              className="btn-work-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Dossiers
            </button>
          </div>

          {toastMessage && (
            <div
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                padding: '0.85rem 1.25rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontWeight: 600,
              }}
            >
              {toastMessage}
            </div>
          )}

          {/* Stats Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Disputes</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{stats.total || 0}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#be123c', textTransform: 'uppercase' }}>Active / Open</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#e11d48', marginTop: '4px' }}>{stats.open || 0}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#a16207', textTransform: 'uppercase' }}>Awaiting Info</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{stats.awaitingInfo || 0}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#15803d', textTransform: 'uppercase' }}>Resolved</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{stats.resolved || 0}</div>
            </div>
            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#4338ca', textTransform: 'uppercase' }}>Reopened</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>{stats.reopened || 0}</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div
            style={{
              background: '#ffffff',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search dispute reference, title, description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.55rem 0.75rem 0.55rem 2rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
              </div>
              <button type="submit" className="btn-work-primary" style={{ padding: '0.55rem 1rem' }}>
                Search
              </button>
            </form>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '0.55rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', background: '#fff' }}
              >
                <option value="">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="under_investigation">Under Investigation</option>
                <option value="awaiting_information">Awaiting Information</option>
                <option value="resolved">Resolved</option>
                <option value="reopened">Reopened</option>
              </select>
            </div>
          </div>

          {/* Main Content Layout: List + Detail Dossier */}
          <div style={{ display: 'grid', gridTemplateColumns: selectedDispute ? '1fr 1.3fr' : '1fr', gap: '1.5rem' }}>
            {/* Disputes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {loading ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                  Loading arbitration cases...
                </div>
              ) : disputes.length === 0 ? (
                <div style={{ background: '#ffffff', padding: '3rem', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                  <CheckCircle size={40} color="#16a34a" style={{ margin: '0 auto 0.75rem' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    No Open Work Disputes Found
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                    All work completion submissions are currently verified or resolved.
                  </p>
                </div>
              ) : (
                disputes.map((disp) => {
                  const isSelected = selectedDispute?._id === disp._id;
                  return (
                    <div
                      key={disp._id}
                      onClick={() => setSelectedDispute(disp)}
                      style={{
                        background: '#ffffff',
                        border: '1px solid',
                        borderColor: isSelected ? '#0f766e' : '#e2e8f0',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        cursor: 'pointer',
                        boxShadow: isSelected
                          ? '0 4px 12px rgba(15, 118, 110, 0.12)'
                          : '0 1px 3px rgba(0,0,0,0.04)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f766e' }}>
                            {disp.complaintId}
                          </span>
                          <span className={`work-status-badge status-${disp.status}`}>
                            {disp.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {disp.createdAt ? new Date(disp.createdAt).toLocaleDateString('en-IN') : ''}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.35rem 0' }}>
                        {disp.title}
                      </h4>

                      <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#475569', lineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        "{disp.description}"
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', fontSize: '0.78rem', color: '#64748b' }}>
                        <span>Complainant: <strong>{disp.complainant?.name || 'Party'} ({disp.complainantRole})</strong></span>
                        <span>Respondent: <strong>{disp.reportedParty?.name || 'Opposing Party'}</strong></span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Dispute Dossier View */}
            {selectedDispute && (
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.25rem',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  height: 'fit-content',
                }}
              >
                {/* Dossier Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                      Arbitration Case Dossier
                    </span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                      {selectedDispute.complaintId}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedDispute(null)}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Parties Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Complainant ({selectedDispute.complainantRole?.toUpperCase()})
                    </span>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {selectedDispute.complainant?.name || 'Complainant'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {selectedDispute.complainant?.email} • {selectedDispute.complainant?.phone || 'No phone'}
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Respondent Party
                    </span>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {selectedDispute.reportedParty?.name || 'Respondent'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {selectedDispute.reportedParty?.email} • {selectedDispute.reportedParty?.phone || 'No phone'}
                    </div>
                  </div>
                </div>

                {/* Original Job Agreement & Escrow Terms */}
                <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', padding: '0.85rem', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                    Job Agreement & Escrow Terms
                  </span>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginTop: '2px' }}>
                    "{selectedDispute.gig?.title || 'Gig Job'}"
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#334155' }}>
                    Agreed Budget: ₹{selectedDispute.gig?.budgetMin || 0} • Duration: {selectedDispute.gig?.duration || 'Standard'} • Location: {selectedDispute.gig?.location?.address || 'On-site'}
                  </p>
                </div>

                {/* Complainant Grievance & Statements */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#be123c', textTransform: 'uppercase' }}>
                    Employer's Grievance & Evidence
                  </span>
                  <p style={{ margin: '4px 0 0.5rem 0', fontSize: '0.88rem', color: '#1e293b' }}>
                    {selectedDispute.employerStatement?.text || selectedDispute.description}
                  </p>
                  {selectedDispute.employerStatement?.evidence?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedDispute.employerStatement.evidence.map((ev, i) => (
                        <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#0f766e', textDecoration: 'underline' }}>
                          Proof Document #{i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Worker's Statement & Defense */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase' }}>
                    Worker's Statement & Rebuttal
                  </span>
                  <p style={{ margin: '4px 0 0.5rem 0', fontSize: '0.88rem', color: '#1e293b' }}>
                    {selectedDispute.workerStatement?.text || 'No defense statement submitted yet.'}
                  </p>
                  {selectedDispute.workerStatement?.evidence?.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {selectedDispute.workerStatement.evidence.map((ev, i) => (
                        <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#0f766e', textDecoration: 'underline' }}>
                          Worker Proof #{i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons for Admin */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(true)}
                    className="btn-work-secondary"
                    style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem' }}
                  >
                    Request More Info
                  </button>

                  {selectedDispute.status === 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => setShowReopenModal(true)}
                      className="btn-work-secondary"
                      style={{ flex: 1, fontSize: '0.82rem', padding: '0.5rem', color: '#4f46e5' }}
                    >
                      Reopen Dispute Case
                    </button>
                  ) : null}
                </div>

                {/* Admin Final Determination Form (if open/unresolved) */}
                {selectedDispute.status !== 'resolved' && (
                  <form onSubmit={handleResolveSubmit} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                      ⚖️ Record Administrative Determination & Close Case
                    </span>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                        Resolution Decision:
                      </label>
                      <select
                        value={resolutionDecision}
                        onChange={(e) => setResolutionDecision(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                      >
                        <option value="approve_completion">Approve Work & Release Escrow to Worker</option>
                        <option value="order_correction">Order Specific Corrections to be Made by Worker</option>
                        <option value="refund_employer">Cancel Assignment & Refund Escrow to Employer</option>
                        <option value="mutual_settlement">Approve Mutually Agreed Settlement Terms</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
                        Reasoned Determination & Rationale <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reasonRationale}
                        onChange={(e) => setReasonRationale(e.target.value)}
                        placeholder="Document the analysis of evidence from both sides, terms evaluation, and rationale for this binding ruling..."
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn-work-primary"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {actionLoading ? 'Recording Resolution...' : 'Finalize Determination & Notify Both Parties'}
                    </button>
                  </form>
                )}

                {/* If already resolved, display determination summary */}
                {selectedDispute.status === 'resolved' && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#15803d', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <CheckCircle size={16} /> Resolved by Platform Admin
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#14532d' }}>
                      "{selectedDispute.resolutionSummary || 'Case concluded.'}"
                    </p>
                    <span style={{ fontSize: '0.75rem', color: '#166534', display: 'block', marginTop: '4px' }}>
                      Resolved at {selectedDispute.resolvedAt ? new Date(selectedDispute.resolvedAt).toLocaleString('en-IN') : 'Recent'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Request Info Modal */}
          {showInfoModal && (
            <div className="work-modal-backdrop" onClick={() => setShowInfoModal(false)}>
              <div className="work-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
                <div className="work-modal-header">
                  <h3 className="work-modal-title">Request Additional Evidence / Statement</h3>
                  <button className="work-modal-close" onClick={() => setShowInfoModal(false)}>
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleRequestInfoSubmit}>
                  <div className="work-modal-body">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                        Target Party:
                      </label>
                      <select
                        value={infoTarget}
                        onChange={(e) => setInfoTarget(e.target.value)}
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="both">Both Worker and Employer</option>
                        <option value="worker">Worker Only</option>
                        <option value="employer">Employer Only</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                        Specific Information Required:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={infoInstructions}
                        onChange={(e) => setInfoInstructions(e.target.value)}
                        placeholder="Detail the photos, measurement proofs, receipts, or timestamps needed..."
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                  <div className="work-modal-footer">
                    <button type="button" className="btn-work-secondary" onClick={() => setShowInfoModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-work-primary" disabled={actionLoading}>
                      Dispatch Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Reopen Case Modal */}
          {showReopenModal && (
            <div className="work-modal-backdrop" onClick={() => setShowReopenModal(false)}>
              <div className="work-modal" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
                <div className="work-modal-header">
                  <h3 className="work-modal-title">Reopen Dispute Case</h3>
                  <button className="work-modal-close" onClick={() => setShowReopenModal(false)}>
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleReopenSubmit}>
                  <div className="work-modal-body">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem' }}>
                        Justification for Reopening Case:
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={reopenJustification}
                        onChange={(e) => setReopenJustification(e.target.value)}
                        placeholder="State new evidence, missed communication, or compliance justification..."
                        style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                  <div className="work-modal-footer">
                    <button type="button" className="btn-work-secondary" onClick={() => setShowReopenModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-work-primary" disabled={actionLoading}>
                      Confirm Reopen
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDisputesPage;
