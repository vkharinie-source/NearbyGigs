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
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import complaintService from '../../services/complaintService';
import './ManagerComplaintsPage.css';

const CORRECTIVE_ACTIONS = [
  { value: 'work_correction_ordered', label: 'Order Agreed Work to be Corrected' },
  { value: 'replacement_worker_arranged', label: 'Schedule Replacement Specialist' },
  { value: 'revised_appointment_scheduled', label: 'Arrange Revised Work Schedule' },
  { value: 'clarification_provided', label: 'Issue Clarification on Scope & Rules' },
  { value: 'attendance_discrepancy_resolved', label: 'Resolve Attendance / Check-In Record' },
  { value: 'payment_adjusted', label: 'Payment Dispute Settlement / Adjustment' },
  { value: 'warning_issued', label: 'Official Platform Conduct Warning' },
  { value: 'temporary_account_restriction', label: 'Temporary Account Restriction' },
  { value: 'dismissed_unsubstantiated', label: 'Dismissed as Unsubstantiated / Inaccurate' },
  { value: 'other', label: 'Other Proportionate Resolution' },
];

const ManagerComplaintsPage = () => {
  const { user } = useAuthContext();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    newCount: 0,
    underInvestigation: 0,
    approachingDeadline: 0,
    overdue: 0,
    resolved: 0,
    escalated: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Resolution modal / action states
  const [actionLoading, setActionLoading] = useState(false);
  const [investigationNote, setInvestigationNote] = useState('');
  const [investigationStatus, setInvestigationStatus] = useState('under_investigation');

  // Resolve form
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('work_correction_ordered');
  const [resolutionNote, setResolutionNote] = useState('');

  // Escalate form
  const [escalationReason, setEscalationReason] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (urgencyFilter) params.urgency = urgencyFilter;
      if (categoryFilter) params.category = categoryFilter;

      const data = await complaintService.getManagerComplaints(params);
      setComplaints(data.complaints || []);
      setStats(
        data.stats || {
          total: 0,
          newCount: 0,
          underInvestigation: 0,
          approachingDeadline: 0,
          overdue: 0,
          resolved: 0,
          escalated: 0,
        }
      );

      if (selectedComplaint) {
        const updated = (data.complaints || []).find((c) => c._id === selectedComplaint._id);
        if (updated) setSelectedComplaint(updated);
      }
    } catch (err) {
      console.error('Error fetching manager complaints:', err);
      setError('Unable to load complaint queue. Please check server permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, urgencyFilter, categoryFilter]);

  // Manager Actions
  const handleAcknowledge = async () => {
    if (!selectedComplaint) return;
    try {
      setActionLoading(true);
      const res = await complaintService.acknowledgeComplaint(selectedComplaint._id);
      setSelectedComplaint(res.complaint);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to acknowledge complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateInvestigation = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !investigationNote.trim()) return;
    try {
      setActionLoading(true);
      const res = await complaintService.updateInvestigation(selectedComplaint._id, {
        status: investigationStatus,
        investigationNote: investigationNote.trim(),
      });
      setSelectedComplaint(res.complaint);
      setInvestigationNote('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update investigation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !resolutionSummary.trim() || resolutionSummary.trim().length < 10) {
      alert('Please provide a substantive resolution summary (at least 10 characters).');
      return;
    }
    try {
      setActionLoading(true);
      const res = await complaintService.resolveComplaint(selectedComplaint._id, {
        resolutionSummary: resolutionSummary.trim(),
        correctiveAction,
        note: resolutionNote.trim(),
      });
      setSelectedComplaint(res.complaint);
      setResolutionSummary('');
      setResolutionNote('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint || !escalationReason.trim()) return;
    try {
      setActionLoading(true);
      const res = await complaintService.escalateComplaint(selectedComplaint._id, {
        escalationReason: escalationReason.trim(),
      });
      setSelectedComplaint(res.complaint);
      setEscationReason('');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to escalate complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const refMatch = c.referenceNumber?.toLowerCase().includes(q);
      const catMatch = c.category?.toLowerCase().includes(q);
      const compNameMatch = c.complainant?.name?.toLowerCase().includes(q);
      const gigMatch = c.relatedGig?.title?.toLowerCase().includes(q);
      if (!refMatch && !catMatch && !compNameMatch && !gigMatch) return false;
    }
    return true;
  });

  return (
    <div className="manager-complaints-container">
      {/* Top Banner */}
      <div className="mgr-header-banner">
        <div>
          <div className="mgr-badge">Authorized Management &amp; Dispute Resolution</div>
          <h2>Resolution Center — Manager Case Queue</h2>
          <p>
            Review customer &amp; worker grievances, enforce lawful platform SLA targets, record
            impartial investigation findings, and implement recorded corrective actions.
          </p>
        </div>
        <button className="btn btn-outline-light" onClick={fetchDashboardData}>
          <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="mgr-kpi-grid">
        <div
          className={`kpi-card ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => setStatusFilter('')}
        >
          <span className="kpi-label">Total Assigned</span>
          <span className="kpi-value">{stats.total}</span>
          <span className="kpi-hint">Across all statuses</span>
        </div>

        <div
          className={`kpi-card ${statusFilter === 'submitted' ? 'active' : ''}`}
          onClick={() => setStatusFilter('submitted')}
        >
          <span className="kpi-label">New / Unacknowledged</span>
          <span className="kpi-value" style={{ color: '#0284c7' }}>
            {stats.newCount}
          </span>
          <span className="kpi-hint">Requires immediate ack</span>
        </div>

        <div
          className={`kpi-card ${statusFilter === 'under_investigation' ? 'active' : ''}`}
          onClick={() => setStatusFilter('under_investigation')}
        >
          <span className="kpi-label">Under Investigation</span>
          <span className="kpi-value" style={{ color: '#f59e0b' }}>
            {stats.underInvestigation}
          </span>
          <span className="kpi-hint">Active discovery</span>
        </div>

        <div className="kpi-card danger-kpi">
          <span className="kpi-label">Overdue SLA Breaches</span>
          <span className="kpi-value" style={{ color: '#dc2626' }}>
            {stats.overdue}
          </span>
          <span className="kpi-hint">Auto-escalation active</span>
        </div>

        <div
          className={`kpi-card ${statusFilter === 'escalated' ? 'active' : ''}`}
          onClick={() => setStatusFilter('escalated')}
        >
          <span className="kpi-label">Escalated</span>
          <span className="kpi-value" style={{ color: '#9333ea' }}>
            {stats.escalated}
          </span>
          <span className="kpi-hint">Supervisor level</span>
        </div>

        <div
          className={`kpi-card ${statusFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('resolved')}
        >
          <span className="kpi-label">Resolved &amp; Closed</span>
          <span className="kpi-value" style={{ color: '#059669' }}>
            {stats.resolved}
          </span>
          <span className="kpi-hint">Documented outcomes</span>
        </div>
      </div>

      {/* Control / Filters Bar */}
      <div className="mgr-filters-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Filter by reference #, complainant, or job..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="select-box">
          <Filter size={15} />
          <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="critical_safety">Critical Safety (2h/24h)</option>
            <option value="high">High Priority (4h/48h)</option>
            <option value="medium">Medium Priority (12h/72h)</option>
            <option value="low">Low Priority (24h/5d)</option>
          </select>
        </div>

        <div className="select-box">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="worker_no_show">No Show</option>
            <option value="unexpected_cancellation">Unexpected Cancellation</option>
            <option value="work_quality_mismatch">Work Quality Mismatch</option>
            <option value="inaccurate_skills_qualifications">Inaccurate Qualifications</option>
            <option value="unprofessional_behavior">Unprofessional Behaviour</option>
            <option value="harassment_inappropriate">Harassment / Safety</option>
            <option value="payment_dispute">Payment Dispute</option>
          </select>
        </div>
      </div>

      {error && <div className="complaints-error-banner">{error}</div>}

      {/* Main 2-Pane Work Area */}
      <div className="mgr-work-layout">
        {/* Left Side: Case Queue Table/List */}
        <div className="mgr-queue-pane">
          {loading ? (
            <div className="complaints-loading-state">
              <RefreshCw size={28} className="spinning" />
              <p>Fetching active cases from MongoDB...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="complaints-empty-state">
              <CheckCircle size={44} color="#10b981" />
              <h4>No matching cases in this queue</h4>
              <p>All grievances under this filter are current or have been resolved.</p>
            </div>
          ) : (
            <div className="mgr-case-cards">
              {filteredComplaints.map((item) => {
                const isSelected = selectedComplaint?._id === item._id;
                const isOverdue =
                  item.sla?.isOverdue ||
                  (!['resolved', 'closed'].includes(item.status) &&
                    item.sla?.resolutionTarget &&
                    new Date(item.sla.resolutionTarget) < new Date());

                return (
                  <div
                    key={item._id}
                    className={`mgr-case-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedComplaint(item)}
                  >
                    <div className="case-item-header">
                      <span className="case-ref">{item.referenceNumber}</span>
                      <span className={`case-urgency-tag ${item.urgency}`}>{item.urgency}</span>
                      {isOverdue && <span className="case-overdue-tag">OVERDUE</span>}
                    </div>

                    <div className="case-item-title">
                      <strong>{item.relatedGig?.title || item.category.replace(/_/g, ' ')}</strong>
                    </div>

                    <div className="case-parties-row">
                      <span>By: {item.complainant?.name || 'Customer'}</span>
                      {item.isIndependentReview && (
                        <span className="ind-badge" title="Independent Review Safeguard Active">
                          Independent
                        </span>
                      )}
                    </div>

                    <div className="case-item-footer">
                      <span className={`case-status-badge ${item.status}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                      <span className="case-date">
                        Target: {new Date(item.sla?.resolutionTarget).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Investigation & Resolution Workbench */}
        <div className="mgr-workbench-pane">
          {selectedComplaint ? (
            <div className="workbench-card">
              {/* Workbench Header */}
              <div className="workbench-header">
                <div>
                  <div className="wb-meta">
                    <span className="wb-ref">{selectedComplaint.referenceNumber}</span>
                    <span className={`wb-status ${selectedComplaint.status}`}>
                      {selectedComplaint.status.toUpperCase()}
                    </span>
                    {selectedComplaint.isIndependentReview && (
                      <span className="independent-safeguard-badge">
                        Independent Review Safeguard (Employer Reported)
                      </span>
                    )}
                  </div>
                  <h3 className="wb-title">
                    {selectedComplaint.relatedGig?.title ||
                      `Category: ${selectedComplaint.category}`}
                  </h3>
                </div>

                {/* Quick Action: Acknowledge */}
                {!selectedComplaint.sla?.acknowledgedAt && (
                  <button
                    className="btn btn-primary btn-sm ack-btn"
                    onClick={handleAcknowledge}
                    disabled={actionLoading}
                  >
                    <CheckSquare size={16} />
                    {actionLoading ? 'Recording...' : 'Acknowledge Case Now'}
                  </button>
                )}
              </div>

              {/* SLA Monitor Bar */}
              <div className="wb-sla-bar">
                <div>
                  <span className="wb-sla-label">Acknowledgement SLA:</span>
                  <span className="wb-sla-val">
                    {selectedComplaint.sla?.acknowledgedAt ? (
                      <span style={{ color: '#059669' }}>
                        Acked ({new Date(selectedComplaint.sla.acknowledgedAt).toLocaleTimeString()}
                        )
                      </span>
                    ) : (
                      <span>
                        Target:{' '}
                        {new Date(selectedComplaint.sla?.acknowledgementTarget).toLocaleTimeString()}
                      </span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="wb-sla-label">Resolution SLA Target:</span>
                  <span className="wb-sla-val">
                    {new Date(selectedComplaint.sla?.resolutionTarget).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Case Context Details */}
              <div className="wb-section">
                <h4>Complainant &amp; Reported Parties</h4>
                <div className="parties-card">
                  <div>
                    <span className="p-role">Filed By:</span>
                    <strong>{selectedComplaint.complainant?.name || 'User'}</strong> (
                    {selectedComplaint.complainant?.email || 'N/A'})
                  </div>
                  {selectedComplaint.reportedUser && (
                    <div>
                      <span className="p-role">Reported Party:</span>
                      <strong>{selectedComplaint.reportedUser?.name || 'Party'}</strong> (
                      {selectedComplaint.reportedUser?.email || 'N/A'})
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="wb-section">
                <h4>Factual Statement of Complaint</h4>
                <div className="statement-box">{selectedComplaint.description}</div>
              </div>

              {/* Submitted Proof / Evidence */}
              <div className="wb-section">
                <h4>Evidence &amp; Artifacts</h4>
                {selectedComplaint.evidence?.length > 0 ? (
                  <ul className="wb-evidence-list">
                    {selectedComplaint.evidence.map((ev, i) => (
                      <li key={i} className="wb-evidence-item">
                        <Paperclip size={14} />
                        <span>
                          <strong>{ev.title}</strong>
                        </span>
                        {ev.fileUrl && (
                          <a
                            href={ev.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="evidence-link"
                          >
                            View Evidence
                          </a>
                        )}
                        <span className="ev-time">
                          ({new Date(ev.uploadedAt).toLocaleDateString()})
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="hint-text">No evidence uploaded by complainant.</p>
                )}
              </div>

              {/* Manager Step 1: Investigation Update & Information Request */}
              {!['resolved', 'closed'].includes(selectedComplaint.status) && (
                <div className="wb-section action-panel">
                  <h4>Investigation Progress &amp; Information Requests</h4>
                  <form onSubmit={handleUpdateInvestigation} className="mgr-form">
                    <div className="form-row-2">
                      <div className="form-group">
                        <label>Update Investigation Status</label>
                        <select
                          value={investigationStatus}
                          onChange={(e) => setInvestigationStatus(e.target.value)}
                        >
                          <option value="under_investigation">Under Investigation</option>
                          <option value="awaiting_information">
                            Awaiting Information from Customer/Worker
                          </option>
                          <option value="resolution_proposed">Resolution Proposed</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Investigation Notes / Request Query</label>
                      <textarea
                        rows={3}
                        placeholder="Log interview findings, contact verification, or specific questions asked to the parties..."
                        value={investigationNote}
                        onChange={(e) => setInvestigationNote(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-secondary btn-sm"
                      disabled={actionLoading || !investigationNote.trim()}
                    >
                      <Send size={14} /> Save Investigation Note
                    </button>
                  </form>
                </div>
              )}

              {/* Manager Step 2: Formal Resolution & Corrective Action */}
              {!['resolved', 'closed'].includes(selectedComplaint.status) && (
                <div className="wb-section action-panel resolve-panel">
                  <h4>Official Case Resolution &amp; Corrective Action</h4>
                  <form onSubmit={handleResolve} className="mgr-form">
                    <div className="form-group">
                      <label>Select Proportionate Corrective Action *</label>
                      <select
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                        required
                      >
                        {CORRECTIVE_ACTIONS.map((act) => (
                          <option key={act.value} value={act.value}>
                            {act.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Resolution Summary (Recorded in official record) *</label>
                      <textarea
                        rows={3}
                        placeholder="State clearly the documented outcome, agreed remediation, and terms of resolution (minimum 10 characters)..."
                        value={resolutionSummary}
                        onChange={(e) => setResolutionSummary(e.target.value)}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={actionLoading || !resolutionSummary.trim()}
                    >
                      <CheckCircle size={16} /> Document &amp; Close as Resolved
                    </button>
                  </form>
                </div>
              )}

              {/* Manager Step 3: Escalate Case to Safety / Supervisor */}
              {!['resolved', 'closed', 'escalated'].includes(selectedComplaint.status) && (
                <div className="wb-section action-panel escalate-panel">
                  <h4>Escalate to Safety Board or Supervisor</h4>
                  <form onSubmit={handleEscalate} className="mgr-form">
                    <div className="form-group">
                      <input
                        type="text"
                        placeholder="Reason for escalation (e.g. Critical Safety Breach, Legal/Threat, Uncooperative party)..."
                        value={escalationReason}
                        onChange={(e) => setEscalationReason(e.target.value)}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-outline-danger btn-sm"
                      disabled={actionLoading || !escalationReason.trim()}
                    >
                      <ArrowUpRight size={14} /> Escalate Case
                    </button>
                  </form>
                </div>
              )}

              {/* History Audit Trail */}
              <div className="wb-section">
                <h4>Complete Chronological Audit Trail</h4>
                <div className="wb-timeline">
                  {(selectedComplaint.statusHistory || []).map((step, idx) => (
                    <div key={idx} className="timeline-node">
                      <div className="node-marker" />
                      <div className="node-content">
                        <span className="node-status">{step.status.toUpperCase()}</span>
                        <span className="node-timestamp">
                          {new Date(step.changedAt).toLocaleString()}
                        </span>
                        {step.note && <p className="node-note">{step.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="no-selection-placeholder">
              <ShieldAlert size={48} color="#94a3b8" />
              <h4>Select a case from the queue</h4>
              <p>
                Click any case on the left to inspect evidence, record investigation notes, and
                enforce resolution SLA targets.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerComplaintsPage;
