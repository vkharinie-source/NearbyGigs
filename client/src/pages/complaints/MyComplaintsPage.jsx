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
  PlusCircle,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Paperclip,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import complaintService from '../../services/complaintService';
import RaiseComplaintModal from '../../components/complaint/RaiseComplaintModal';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import './MyComplaintsPage.css';

const STATUS_CONFIG = {
  submitted: { label: 'Submitted', color: '#64748b', bg: '#f1f5f9' },
  acknowledged: { label: 'Acknowledged', color: '#0284c7', bg: '#e0f2fe' },
  assigned: { label: 'Assigned to Manager', color: '#6366f1', bg: '#e0e7ff' },
  under_investigation: { label: 'Under Investigation', color: '#f59e0b', bg: '#fef3c7' },
  awaiting_information: { label: 'Awaiting Information', color: '#d97706', bg: '#ffedd5' },
  resolution_proposed: { label: 'Resolution Proposed', color: '#10b981', bg: '#d1fae5' },
  resolved: { label: 'Resolved', color: '#059669', bg: '#ecfdf5' },
  closed: { label: 'Closed', color: '#475569', bg: '#f8fafc' },
  escalated: { label: 'Escalated', color: '#dc2626', bg: '#fee2e2' },
  reopened: { label: 'Reopened', color: '#b91c1c', bg: '#fef2f2' },
};

const URGENCY_CONFIG = {
  critical_safety: { label: 'Critical Safety', color: '#dc2626' },
  high: { label: 'High Priority', color: '#ea580c' },
  medium: { label: 'Medium', color: '#2563eb' },
  low: { label: 'Low', color: '#64748b' },
};

const MyComplaintsPage = () => {
  const { user } = useAuthContext();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('filed_by_me'); // 'filed_by_me' | 'filed_against_me'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isRaiseModalOpen, setIsRaiseModalOpen] = useState(false);

  // Evidence upload modal state
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('');
  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [submittingEvidence, setSubmittingEvidence] = useState(false);

  // Reopen modal state
  const [reopenReason, setReopenReason] = useState('');
  const [submittingReopen, setSubmittingReopen] = useState(false);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await complaintService.getMyComplaints();
      setComplaints(data.complaints || []);
      if (selectedComplaint) {
        const updated = (data.complaints || []).find((c) => c._id === selectedComplaint._id);
        if (updated) setSelectedComplaint(updated);
      }
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Unable to load complaints. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleAddEvidence = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !newEvidenceTitle.trim()) return;

    try {
      setSubmittingEvidence(true);
      const res = await complaintService.addEvidence(selectedComplaint._id, {
        title: newEvidenceTitle.trim(),
        fileUrl: newEvidenceUrl.trim() || undefined,
        fileType: newEvidenceUrl ? 'link' : 'note',
      });
      setSelectedComplaint(res.complaint);
      setNewEvidenceTitle('');
      setNewEvidenceUrl('');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to attach evidence.');
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !reopenReason.trim()) return;

    try {
      setSubmittingReopen(true);
      const res = await complaintService.reopenComplaint(selectedComplaint._id, {
        reopenReason: reopenReason.trim(),
      });
      setSelectedComplaint(res.complaint);
      setReopenReason('');
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request review.');
    } finally {
      setSubmittingReopen(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    // Tab filter
    const isComplainant =
      c.complainant?._id === user?.id ||
      c.complainant === user?.id ||
      c.complainant?._id === user?._id;
    if (tab === 'filed_by_me' && !isComplainant) return false;
    if (tab === 'filed_against_me' && isComplainant) return false;

    // Status filter
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const refMatch = c.referenceNumber?.toLowerCase().includes(q);
      const catMatch = c.category?.toLowerCase().includes(q);
      const descMatch = c.description?.toLowerCase().includes(q);
      const gigMatch = c.relatedGig?.title?.toLowerCase().includes(q);
      if (!refMatch && !catMatch && !descMatch && !gigMatch) return false;
    }

    return true;
  });

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content">
          {/* Header Banner */}
          <div className="dash-welcome-card animate-fade-in complaints-header-light" style={{ borderLeft: '4px solid #0F766E' }}>
            <div className="header-info">
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#E6FFFA',
                  color: '#0F766E',
                  border: '1px solid #99F6E4',
                  borderRadius: '9999px',
                  padding: '3px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  marginBottom: '0.4rem',
                }}
              >
                <Sparkles size={13} />
                <span>RESOLUTION CENTER &amp; TRUST GUARD</span>
              </div>
              <h2>Complaints &amp; Dispute Tracking</h2>
              <p>
                Track transparent investigations, review official resolution timelines, submit
                supplementary evidence, and stay informed on platform accountability.
              </p>
            </div>
            <button
              className="btn btn-primary raise-action-btn"
              onClick={() => setIsRaiseModalOpen(true)}
              style={{ background: '#0F766E', borderColor: '#0F766E' }}
            >
              <PlusCircle size={18} />
              <span>Raise a Complaint</span>
            </button>
          </div>

      {/* Tabs & Controls */}
      <div className="complaints-control-bar">
        <div className="tab-pill-group">
          <button
            className={`tab-btn ${tab === 'filed_by_me' ? 'active' : ''}`}
            onClick={() => setTab('filed_by_me')}
          >
            Filed by Me (
            {complaints.filter(
              (c) =>
                c.complainant?._id === user?.id ||
                c.complainant === user?.id ||
                c.complainant?._id === user?._id
            ).length}
            )
          </button>
          <button
            className={`tab-btn ${tab === 'filed_against_me' ? 'active' : ''}`}
            onClick={() => setTab('filed_against_me')}
          >
            Filed Against Me (
            {complaints.filter(
              (c) =>
                !(
                  c.complainant?._id === user?.id ||
                  c.complainant === user?.id ||
                  c.complainant?._id === user?._id
                )
            ).length}
            )
          </button>
        </div>

        <div className="filter-input-row">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search reference #, job or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="select-box">
            <Filter size={15} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="resolution_proposed">Resolution Proposed</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <button className="btn btn-icon-refresh" onClick={fetchComplaints} title="Refresh Data">
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="complaints-error-banner">{error}</div>}

      {/* Main Content Layout */}
      <div className="complaints-layout">
        {/* Left Side: Complaints List */}
        <div className="complaints-list-pane">
          {loading ? (
            <div className="complaints-loading-state">
              <RefreshCw size={28} className="spinning" />
              <p>Loading complaints from database...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="complaints-empty-state">
              <CheckCircle size={44} color="#10b981" />
              <h4>No complaints found</h4>
              <p>
                {tab === 'filed_by_me'
                  ? "You have not submitted any complaints matching this filter. If you encounter an issue on a job, click 'Raise a Complaint'."
                  : 'You have no complaints or disputes reported against your account.'}
              </p>
            </div>
          ) : (
            <div className="complaint-cards-stack">
              {filteredComplaints.map((item) => {
                const isSelected = selectedComplaint?._id === item._id;
                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
                const urgencyCfg = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.medium;
                const isOverdue =
                  item.sla?.isOverdue ||
                  (!['resolved', 'closed'].includes(item.status) &&
                    item.sla?.resolutionTarget &&
                    new Date(item.sla.resolutionTarget) < new Date());

                return (
                  <div
                    key={item._id}
                    className={`complaint-card-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedComplaint(item)}
                  >
                    <div className="card-top-row">
                      <span className="reference-code">{item.referenceNumber}</span>
                      <span
                        className="status-pill"
                        style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
                      >
                        {statusCfg.label}
                      </span>
                    </div>

                    <div className="card-title">
                      {item.relatedGig?.title ? (
                        <strong>{item.relatedGig.title}</strong>
                      ) : (
                        <span>Category: {item.category.replace(/_/g, ' ')}</span>
                      )}
                    </div>

                    <p className="card-desc-snippet">{item.description}</p>

                    <div className="card-bottom-row">
                      <span
                        className="urgency-indicator"
                        style={{ borderColor: urgencyCfg.color, color: urgencyCfg.color }}
                      >
                        {urgencyCfg.label}
                      </span>

                      {isOverdue && (
                        <span className="overdue-tag">
                          <AlertTriangle size={12} /> Overdue
                        </span>
                      )}

                      <span className="date-hint">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Selected Complaint Detail View */}
        <div className="complaint-detail-pane">
          {selectedComplaint ? (
            <div className="detail-card">
              {/* Detail Header */}
              <div className="detail-header">
                <div>
                  <div className="detail-meta-row">
                    <span className="detail-ref">{selectedComplaint.referenceNumber}</span>
                    <span
                      className="status-pill"
                      style={{
                        color:
                          STATUS_CONFIG[selectedComplaint.status]?.color ||
                          STATUS_CONFIG.submitted.color,
                        backgroundColor:
                          STATUS_CONFIG[selectedComplaint.status]?.bg || STATUS_CONFIG.submitted.bg,
                      }}
                    >
                      {STATUS_CONFIG[selectedComplaint.status]?.label}
                    </span>
                  </div>
                  <h3 className="detail-gig-title">
                    {selectedComplaint.relatedGig?.title ||
                      `Category: ${selectedComplaint.category.replace(/_/g, ' ')}`}
                  </h3>
                </div>

                <div className="detail-urgency-box">
                  <span
                    className="urgency-badge"
                    style={{
                      backgroundColor:
                        URGENCY_CONFIG[selectedComplaint.urgency]?.color ||
                        URGENCY_CONFIG.medium.color,
                    }}
                  >
                    {URGENCY_CONFIG[selectedComplaint.urgency]?.label}
                  </span>
                </div>
              </div>

              {/* SLA Target Monitor Box */}
              <div className="detail-sla-box">
                <div className="sla-monitor-card">
                  <Clock size={16} />
                  <div>
                    <span className="sla-monitor-title">Acknowledgement Target:</span>
                    <span className="sla-monitor-value">
                      {selectedComplaint.sla?.acknowledgedAt ? (
                        <strong style={{ color: '#059669' }}>
                          Acknowledged on{' '}
                          {new Date(selectedComplaint.sla.acknowledgedAt).toLocaleDateString()}
                        </strong>
                      ) : (
                        new Date(selectedComplaint.sla?.acknowledgementTarget).toLocaleString()
                      )}
                    </span>
                  </div>
                </div>

                <div className="sla-monitor-card">
                  <Clock size={16} />
                  <div>
                    <span className="sla-monitor-title">Target Resolution Date:</span>
                    <span className="sla-monitor-value">
                      {selectedComplaint.sla?.resolvedAt ? (
                        <strong style={{ color: '#059669' }}>
                          Resolved on{' '}
                          {new Date(selectedComplaint.sla.resolvedAt).toLocaleDateString()}
                        </strong>
                      ) : (
                        new Date(selectedComplaint.sla?.resolutionTarget).toLocaleString()
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="detail-section">
                <h4>Description of Issue</h4>
                <div className="detail-text-block">{selectedComplaint.description}</div>
              </div>

              {/* Desired Resolution */}
              <div className="detail-section">
                <h4>Desired Resolution</h4>
                <div className="desired-resolution-tag">
                  {selectedComplaint.desiredResolution?.replace(/_/g, ' ').toUpperCase()}
                </div>
                {selectedComplaint.desiredResolutionNotes && (
                  <p className="resolution-notes">{selectedComplaint.desiredResolutionNotes}</p>
                )}
              </div>

              {/* Official Reviewer Outcome & Corrective Action */}
              {selectedComplaint.resolutionSummary && (
                <div className="detail-section resolution-outcome-box">
                  <div className="section-title-with-icon">
                    <CheckCircle size={18} color="#059669" />
                    <h4>Official Resolution Outcome</h4>
                  </div>
                  <p className="resolution-summary-text">{selectedComplaint.resolutionSummary}</p>
                  {selectedComplaint.correctiveAction && (
                    <div className="corrective-action-badge">
                      Action Taken:{' '}
                      <strong>
                        {selectedComplaint.correctiveAction.replace(/_/g, ' ').toUpperCase()}
                      </strong>
                    </div>
                  )}
                  {selectedComplaint.resolutionDate && (
                    <span className="resolved-date">
                      Resolved on {new Date(selectedComplaint.resolutionDate).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {/* Investigation History / Timeline */}
              <div className="detail-section">
                <h4>Investigation Audit Trail</h4>
                <div className="audit-timeline">
                  {(selectedComplaint.statusHistory || []).map((step, idx) => (
                    <div key={idx} className="timeline-node">
                      <div className="node-marker" />
                      <div className="node-content">
                        <span className="node-status">
                          {STATUS_CONFIG[step.status]?.label || step.status}
                        </span>
                        <span className="node-timestamp">
                          {new Date(step.changedAt).toLocaleString()}
                        </span>
                        {step.note && <p className="node-note">{step.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Section */}
              <div className="detail-section">
                <h4>Evidence &amp; Documentation</h4>
                {selectedComplaint.evidence?.length > 0 ? (
                  <ul className="evidence-items-list">
                    {selectedComplaint.evidence.map((ev, i) => (
                      <li key={i} className="evidence-pill">
                        <Paperclip size={14} />
                        <span>{ev.title}</span>
                        {ev.fileUrl && (
                          <a
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="evidence-anchor"
                          >
                            Open Link
                          </a>
                        )}
                        <span className="evidence-time">
                          ({new Date(ev.uploadedAt).toLocaleDateString()})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-evidence-hint">No files or evidence submitted yet.</p>
                )}

                {/* Form to attach supplementary evidence */}
                {!['resolved', 'closed'].includes(selectedComplaint.status) && (
                  <form onSubmit={handleAddEvidence} className="add-evidence-subform">
                    <h5>Attach Supplementary Proof</h5>
                    <div className="evidence-subform-inputs">
                      <input
                        type="text"
                        placeholder="Description (e.g. Chat Screenshot, Work photo)"
                        value={newEvidenceTitle}
                        onChange={(e) => setNewEvidenceTitle(e.target.value)}
                        required
                      />
                      <input
                        type="url"
                        placeholder="File or Image URL (optional)"
                        value={newEvidenceUrl}
                        onChange={(e) => setNewEvidenceUrl(e.target.value)}
                      />
                      <button
                        type="submit"
                        className="btn btn-secondary btn-sm"
                        disabled={submittingEvidence || !newEvidenceTitle.trim()}
                      >
                        {submittingEvidence ? 'Uploading...' : 'Submit Proof'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Reopen Action (if resolved/closed) */}
              {['resolved', 'closed'].includes(selectedComplaint.status) && (
                <div className="detail-section reopen-section">
                  <h4>Request Re-Investigation / Dispute Resolution</h4>
                  <p className="reopen-hint">
                    If the issue was not resolved satisfactorily or new facts arose, you can request
                    a secondary managerial review.
                  </p>
                  <form onSubmit={handleReopen} className="reopen-form">
                    <textarea
                      rows={2}
                      placeholder="Explain why the resolution was insufficient or what remains unresolved..."
                      value={reopenReason}
                      onChange={(e) => setReopenReason(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn-outline-danger btn-sm"
                      disabled={submittingReopen || !reopenReason.trim()}
                    >
                      <RotateCcw size={14} />
                      {submittingReopen ? 'Submitting Review...' : 'Reopen Complaint for Review'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection-placeholder">
              <ShieldAlert size={48} color="#94a3b8" />
              <h4>Select a complaint from the list</h4>
              <p>
                View full investigation history, reviewer updates, service targets, and attached
                evidence.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  </div>

  {/* Raise Complaint Modal */}
  <RaiseComplaintModal
    isOpen={isRaiseModalOpen}
    onClose={() => setIsRaiseModalOpen(false)}
    onSuccess={() => {
      setIsRaiseModalOpen(false);
      fetchComplaints();
    }}
  />
</div>
  );
};

export default MyComplaintsPage;
