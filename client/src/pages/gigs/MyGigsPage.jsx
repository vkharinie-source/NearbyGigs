import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { gigService } from '../../services/gigService';
import {
  Briefcase,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  MapPin,
  Users,
  PlusCircle,
  FileText,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import './Gigs.css';

const MyGigsPage = () => {
  const [gigs, setGigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  const fetchMyGigs = async () => {
    try {
      setLoading(true);
      const data = await gigService.getMyGigs();
      setGigs(data.gigs || []);
    } catch (err) {
      console.error('Error fetching my gigs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyGigs();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this gig posting?')) {
      try {
        await gigService.deleteGig(id);
        fetchMyGigs();
      } catch (err) {
        alert('Failed to delete gig.');
      }
    }
  };

  const filteredGigs = filterStatus === 'ALL'
    ? gigs
    : gigs.filter((g) => g.status?.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content">
          <div className="page-header-container">
            <div className="page-title-group">
              <h1>My Posted Gigs</h1>
              <p>Manage and monitor all jobs you have broadcast on NearbyGig.</p>
            </div>

            <Link to="/create-gig" className="btn-primary">
              <PlusCircle size={16} />
              <span>Post New Gig</span>
            </Link>
          </div>

          {/* Status Filter Tabs */}
          <div className="status-filter-tabs">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <button
                key={st}
                className={`status-tab-btn ${filterStatus === st ? 'active' : ''}`}
                onClick={() => setFilterStatus(st)}
              >
                {st.replace('_', ' ')}
                <span className="tab-count">
                  {st === 'ALL'
                    ? gigs.length
                    : gigs.filter((g) => g.status?.toLowerCase() === st.toLowerCase()).length}
                </span>
              </button>
            ))}
          </div>

          {/* Gigs List */}
          <div className="my-gigs-container">
            {loading ? (
              <div className="cards-stack-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-card">
                    <div className="skeleton-shimmer skeleton-title" />
                    <div className="skeleton-shimmer skeleton-line" />
                  </div>
                ))}
              </div>
            ) : filteredGigs.length > 0 ? (
              <div className="my-gigs-grid">
                {filteredGigs.map((gig) => (
                  <div key={gig._id} className="my-gig-card app-card">
                    <div className="my-gig-card-head">
                      <span className="badge-category">{gig.category}</span>
                      <span className={`status-badge ${gig.status || 'open'}`}>
                        {gig.status || 'OPEN'}
                      </span>
                    </div>

                    <h3 className="my-gig-title">{gig.title}</h3>
                    <p className="my-gig-desc">{gig.description}</p>

                    <div className="my-gig-meta-row">
                      <span>
                        <MapPin size={13} color="#2563eb" /> {gig.address || 'Bengaluru'}
                      </span>
                      <span>
                        <Clock size={13} /> {gig.date || 'Today'}
                      </span>
                      <span className="my-gig-budget">
                        ₹{gig.budgetMin} - ₹{gig.budgetMax}
                      </span>
                    </div>

                    <div className="my-gig-actions-foot">
                      <Link
                        to="/applications/received"
                        className="btn-outline btn-sm-custom"
                      >
                        <Users size={14} />
                        <span>View Proposals</span>
                      </Link>

                      <button
                        onClick={() => handleDelete(gig._id)}
                        className="btn-danger-icon"
                        title="Delete Gig"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card">
                <div className="empty-state-icon-box">
                  <Briefcase size={32} />
                </div>
                <h3>No posted gigs in this category</h3>
                <p>You have not created any job requests matching this filter status.</p>
                <Link to="/create-gig" className="btn-primary">
                  Post Your First Gig
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyGigsPage;
