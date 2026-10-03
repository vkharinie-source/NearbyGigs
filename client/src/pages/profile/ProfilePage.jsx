import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/navbar/Navbar';
import Sidebar from '../../components/sidebar/Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import { useLocationContext } from '../../context/LocationContext';
import { userService } from '../../services/userService';
import { workerService } from '../../services/workerService';
import { gigService } from '../../services/gigService';
import { applicationService } from '../../services/applicationService';
import { requestService } from '../../services/requestService';
import { reviewService } from '../../services/reviewService';
import { notificationService } from '../../services/notificationService';
import {
  User,
  MapPin,
  Mail,
  Phone,
  Award,
  Star,
  Edit3,
  CheckCircle2,
  Clock,
  Briefcase,
  FileText,
  Check,
  Plus,
  X,
  AlertCircle,
  Calendar,
  Layers,
  Activity,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Tag,
  DollarSign,
  Loader2,
} from 'lucide-react';
import './Profile.css';

const ProfilePage = () => {
  const { user, setUser } = useAuthContext();
  const { location: defaultGeoLocation } = useLocationContext();

  // Local state for fetched dynamic data
  const [profileData, setProfileData] = useState(user || {});
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    completedGigs: 0,
    activeApplications: 0,
    totalServices: 0,
    rating: 0,
    totalReviews: 0,
    postedGigs: 0,
    activeGigs: 0,
    serviceRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Edit Profile Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    bio: '',
    address: '',
    experience: 0,
    availability: 'available_today',
    skills: [],
    profileImage: '',
  });
  const [skillInput, setSkillInput] = useState('');

  // Add Service Modal state (inline)
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    title: '',
    category: 'Electrical',
    description: '',
    startingPrice: 500,
    availability: 'available_today',
    serviceAreaKm: 15,
  });

  // Calculate dynamic profile completion percentage
  const completionDetails = useMemo(() => {
    const current = profileData || user || {};
    const isWorker = current.role === 'worker' || current.role === 'both';

    const checks = [
      { label: 'Basic Profile (Name & Email)', done: Boolean(current.name && current.email), weight: 20 },
      { label: 'Bio / Introduction', done: Boolean(current.bio && current.bio.trim().length >= 10), weight: 15 },
      { label: 'Contact Phone Number', done: Boolean(current.phone && current.phone.trim().length > 0), weight: 15 },
      { label: 'Location & Address', done: Boolean(current.address || current.location?.address), weight: 15 },
    ];

    if (isWorker) {
      checks.push(
        { label: 'Skills & Specialties', done: Boolean(current.skills && current.skills.length > 0), weight: 15 },
        { label: 'Experience Level', done: Boolean(current.experience !== undefined && current.experience > 0), weight: 10 },
        { label: 'Availability Status', done: Boolean(current.availability), weight: 10 }
      );
    } else {
      checks.push(
        { label: 'Active Role Preference', done: Boolean(current.role), weight: 20 },
        { label: 'Interests / Categories', done: Boolean(current.skills && current.skills.length > 0), weight: 15 }
      );
    }

    const totalWeight = checks.reduce((acc, c) => acc + c.weight, 0);
    const completedWeight = checks.filter(c => c.done).reduce((acc, c) => acc + c.weight, 0);
    const percentage = Math.min(100, Math.round((completedWeight / totalWeight) * 100));

    return { percentage, checks };
  }, [profileData, user]);

  // Load all real data from backend
  const fetchAllProfileData = async () => {
    if (!user?._id) return;
    setLoading(true);

    try {
      // 1. Fetch fresh user profile
      const freshUser = await userService.getUserProfile(user._id);
      if (freshUser) {
        setProfileData(freshUser);
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      }

      const activeUser = freshUser || user;
      const isWorkerRole = activeUser.role === 'worker' || activeUser.role === 'both';

      // 2. Fetch real reviews for user
      let userReviews = [];
      try {
        userReviews = await reviewService.getUserReviews(user._id);
        setReviews(Array.isArray(userReviews) ? userReviews : []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }

      // 3. Fetch services if worker
      let userServices = [];
      if (isWorkerRole) {
        try {
          const res = await workerService.getMyServices();
          userServices = res?.services || [];
          setServices(userServices);
        } catch (err) {
          console.error('Error fetching services:', err);
        }
      }

      // 4. Fetch applications if worker
      let myApps = [];
      if (isWorkerRole) {
        try {
          const appRes = await applicationService.getMyApplications();
          myApps = appRes?.applications || [];
        } catch (err) {
          console.error('Error fetching applications:', err);
        }
      }

      // 5. Fetch gigs if customer or worker
      let myGigs = [];
      try {
        const gigRes = await gigService.getMyGigs();
        myGigs = gigRes?.gigs || [];
      } catch (err) {
        console.error('Error fetching my gigs:', err);
      }

      // 6. Fetch service requests
      let requests = [];
      try {
        const reqRes = await requestService.getRequests();
        requests = reqRes?.requests || [];
      } catch (err) {
        console.error('Error fetching requests:', err);
      }

      // 7. Calculate real work statistics
      const completedGigsCount = isWorkerRole
        ? myApps.filter(a => a.status === 'completed' || a.status === 'accepted').length
        : myGigs.filter(g => g.status === 'completed').length;

      const activeApplicationsCount = myApps.filter(a => a.status === 'pending' || a.status === 'accepted').length;
      const postedGigsCount = myGigs.length;
      const activeGigsCount = myGigs.filter(g => g.status === 'open' || g.status === 'in_progress').length;

      setStats({
        completedGigs: completedGigsCount,
        activeApplications: activeApplicationsCount,
        totalServices: userServices.length,
        rating: activeUser?.rating || (userReviews.length > 0 ? (userReviews.reduce((a, r) => a + r.rating, 0) / userReviews.length).toFixed(1) : 5.0),
        totalReviews: userReviews.length,
        postedGigs: postedGigsCount,
        activeGigs: activeGigsCount,
        serviceRequests: requests.length,
      });

      // 8. Fetch real recent activities from notifications
      try {
        const notifRes = await notificationService.getNotifications();
        const notifs = notifRes?.notifications || [];
        if (notifs.length > 0) {
          setActivities(notifs.slice(0, 5));
        } else {
          // Construct fallback real events from applications / gigs if notifications are empty
          const fallbackEvents = [];
          myApps.slice(0, 3).forEach(app => {
            fallbackEvents.push({
              _id: app._id,
              title: `Applied to ${app.gig?.title || 'Gig'}`,
              message: `Status: ${app.status.toUpperCase()} - Proposed: ₹${app.proposedRate}`,
              createdAt: app.createdAt,
              type: 'application',
            });
          });
          myGigs.slice(0, 2).forEach(gig => {
            fallbackEvents.push({
              _id: gig._id,
              title: `Posted Gig: ${gig.title}`,
              message: `Status: ${gig.status.toUpperCase()} - Category: ${gig.category}`,
              createdAt: gig.createdAt,
              type: 'gig',
            });
          });
          setActivities(fallbackEvents);
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    } catch (error) {
      console.error('Error loading complete profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllProfileData();
  }, [user?._id]);

  // Open Edit Profile modal with fresh state
  const handleOpenEditModal = () => {
    const current = profileData || user || {};
    setEditFormData({
      name: current.name || '',
      phone: current.phone || '',
      bio: current.bio || '',
      address: current.address || current.location?.address || defaultGeoLocation?.address || '',
      experience: current.experience ?? 0,
      availability: current.availability || 'available_today',
      skills: Array.isArray(current.skills) ? [...current.skills] : [],
      profileImage: current.profileImage || '',
    });
    setSkillInput('');
    setIsEditModalOpen(true);
  };

  // Add skill tag in edit modal
  const handleAddSkill = (e) => {
    e?.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !editFormData.skills.includes(trimmed)) {
      setEditFormData(prev => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
      setSkillInput('');
    }
  };

  // Remove skill tag in edit modal
  const handleRemoveSkill = (skillToRemove) => {
    setEditFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skillToRemove),
    }));
  };

  // Save profile changes to MongoDB via backend API
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    setSavingProfile(true);

    try {
      const payload = {
        name: editFormData.name,
        phone: editFormData.phone,
        bio: editFormData.bio,
        address: editFormData.address,
        experience: Number(editFormData.experience) || 0,
        availability: editFormData.availability,
        skills: editFormData.skills,
        profileImage: editFormData.profileImage,
      };

      const updated = await userService.updateProfile(user._id, payload);

      // Update React context and local storage immediately
      setUser(prev => ({ ...prev, ...updated }));
      setProfileData(prev => ({ ...prev, ...updated }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));

      setIsEditModalOpen(false);
      showToast('Profile updated successfully!');
      // Re-fetch all dynamic metrics to ensure complete sync
      fetchAllProfileData();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Error updating profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingProfile(false);
    }
  };

  // Save new Service directly from single page
  const handleSaveService = async (e) => {
    e.preventDefault();
    setSavingService(true);
    try {
      await workerService.createService({
        ...serviceFormData,
        address: profileData.address || profileData.location?.address || 'Bengaluru, India',
        latitude: profileData.location?.coordinates?.[1] || 12.9716,
        longitude: profileData.location?.coordinates?.[0] || 77.5946,
      });
      setIsAddServiceOpen(false);
      showToast('Service published successfully!');
      fetchAllProfileData();
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service: ' + (error.response?.data?.message || error.message));
    } finally {
      setSavingService(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Format availability text
  const formatAvailability = (val) => {
    switch (val) {
      case 'available_now':
        return { label: 'Available Right Now', color: 'avail-now' };
      case 'available_today':
        return { label: 'Available Today', color: 'avail-today' };
      case 'available_week':
        return { label: 'Available This Week', color: 'avail-week' };
      case 'not_available':
        return { label: 'Currently Unavailable', color: 'avail-none' };
      default:
        return { label: 'Available for Gigs', color: 'avail-today' };
    }
  };

  const currentUser = profileData || user || {};
  const isWorker = currentUser.role === 'worker' || currentUser.role === 'both';
  const availabilityInfo = formatAvailability(currentUser.availability);

  return (
    <div className="dashboard-layout">
      <Navbar />
      <div className="dashboard-body">
        <Sidebar />

        <main className="dashboard-main-content profile-single-page">
          {/* TOAST ALERT */}
          {toastMessage && (
            <div className="profile-toast animate-slide-down">
              <CheckCircle2 size={18} color="#10b981" />
              <span>{toastMessage}</span>
              <button className="toast-close-btn" onClick={() => setToastMessage(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* ==================================================
              1. PROFILE HEADER
              ================================================== */}
          <section className="profile-header-card">
            <div className="profile-header-main">
              {currentUser.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt={currentUser.name}
                  className="profile-avatar-xl img-avatar"
                />
              ) : (
                <div className="profile-avatar-xl">
                  {currentUser.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}

              <div className="profile-details">
                <div className="profile-title-row">
                  <h2>{currentUser.name || 'NearbyGig User'}</h2>
                  <span className={`role-tag role-${currentUser.role || 'customer'}`}>
                    <ShieldCheck size={14} />
                    {(currentUser.role || 'CUSTOMER').toUpperCase()}
                  </span>
                </div>

                <p className="profile-bio">
                  {currentUser.bio || (
                    <span className="empty-text-hint">
                      No bio added yet. Click &quot;Edit Profile&quot; to introduce your skills and services to clients.
                    </span>
                  )}
                </p>

                <div className="profile-meta-row">
                  <span title="Location">
                    <MapPin size={16} className="meta-icon" />
                    {currentUser.address || currentUser.location?.address || defaultGeoLocation?.address || 'Bengaluru, Karnataka'}
                  </span>
                  <span title="Email">
                    <Mail size={16} className="meta-icon" />
                    {currentUser.email}
                  </span>
                  {currentUser.phone && (
                    <span title="Phone">
                      <Phone size={16} className="meta-icon" />
                      {currentUser.phone}
                    </span>
                  )}
                  <span title="Rating" className="rating-pill">
                    <Star size={15} className="star-icon-filled" />
                    <strong>{currentUser.rating ? Number(currentUser.rating).toFixed(1) : '5.0'}</strong>
                    <span className="reviews-subtext">({stats.totalReviews} reviews)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Header Actions */}
            <div className="profile-header-actions">
              <button
                id="edit-profile-btn"
                className="btn-edit-profile"
                onClick={handleOpenEditModal}
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>

              <div className="profile-completion-mini">
                <div className="completion-ring-box">
                  <span className="pct-number">{completionDetails.percentage}%</span>
                  <span className="pct-label">Completed</span>
                </div>
                <div className="completion-bar-track">
                  <div
                    className="completion-bar-fill"
                    style={{ width: `${completionDetails.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              2. PROFILE COMPLETION WIDGET
              ================================================== */}
          <section className="dash-card completion-full-card">
            <div className="completion-header">
              <div className="completion-header-left">
                <div className="icon-badge-round">
                  <TrendingUp size={20} color="#2563eb" />
                </div>
                <div>
                  <h3>Profile Completion Status</h3>
                  <p className="text-muted">
                    Complete your profile to increase trust, get verified badges, and win more local gigs.
                  </p>
                </div>
              </div>
              <div className="completion-badge-pill">
                <span className="completion-score-pct">{completionDetails.percentage}%</span>
                <span>Profile Score</span>
              </div>
            </div>

            <div className="completion-progress-bar-container">
              <div
                className="completion-progress-fill"
                style={{ width: `${completionDetails.percentage}%` }}
              />
            </div>

            <div className="completion-checklist-grid">
              {completionDetails.checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`checklist-item ${check.done ? 'item-done' : 'item-pending'}`}
                >
                  <div className="checklist-icon-box">
                    {check.done ? <Check size={14} color="#10b981" /> : <AlertCircle size={14} color="#f59e0b" />}
                  </div>
                  <span className="checklist-label">{check.label}</span>
                  <span className="checklist-status">
                    {check.done ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* TWO COLUMN CONTENT SECTION: ABOUT ME + SKILLS & BADGES */}
          <div className="profile-two-column-grid">
            {/* ==================================================
                3. ABOUT ME
                ================================================== */}
            <section className="dash-card about-me-card">
              <div className="card-section-header">
                <div className="title-with-icon">
                  <User size={20} color="#2563eb" />
                  <h3>About Me</h3>
                </div>
                <button className="icon-btn-ghost" onClick={handleOpenEditModal} title="Edit About Section">
                  <Edit3 size={15} />
                </button>
              </div>

              <div className="about-details-list">
                <div className="about-item">
                  <span className="about-label">Bio & Overview</span>
                  <p className="about-value bio-text">
                    {currentUser.bio || 'No professional bio provided yet. Add a brief description of your background and services.'}
                  </p>
                </div>

                <div className="about-meta-grid">
                  <div className="about-sub-item">
                    <span className="about-label">
                      <Briefcase size={14} /> Experience
                    </span>
                    <span className="about-value-highlight">
                      {currentUser.experience !== undefined && currentUser.experience > 0
                        ? `${currentUser.experience} Years in field`
                        : 'Beginner / Not specified'}
                    </span>
                  </div>

                  <div className="about-sub-item">
                    <span className="about-label">
                      <Clock size={14} /> Current Availability
                    </span>
                    <span className={`availability-chip ${availabilityInfo.color}`}>
                      <span className="pulse-dot" />
                      {availabilityInfo.label}
                    </span>
                  </div>

                  <div className="about-sub-item">
                    <span className="about-label">
                      <MapPin size={14} /> Primary Service Area
                    </span>
                    <span className="about-value-text">
                      {currentUser.address || currentUser.location?.address || 'Bengaluru City'}
                    </span>
                  </div>

                  <div className="about-sub-item">
                    <span className="about-label">
                      <ShieldCheck size={14} /> Account Status
                    </span>
                    <span className="account-verified-tag">
                      <CheckCircle2 size={14} color="#10b981" /> Verified Member
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================
                4. SKILLS & BADGES
                ================================================== */}
            <section className="dash-card skills-badges-card">
              <div className="card-section-header">
                <div className="title-with-icon">
                  <Award size={20} color="#2563eb" />
                  <h3>Verified Skills & Badges</h3>
                </div>
                <button
                  className="btn-text-action"
                  onClick={handleOpenEditModal}
                >
                  <Plus size={14} /> Edit Skills
                </button>
              </div>

              <div className="skills-container">
                {currentUser.skills && currentUser.skills.length > 0 ? (
                  <div className="skills-badge-wrap">
                    {currentUser.skills.map((skill, idx) => (
                      <div key={idx} className="skill-chip-badge">
                        <Tag size={13} className="chip-tag-icon" />
                        <span className="skill-name">{skill}</span>
                        <span className="skill-check-badge">
                          <Check size={11} />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="skills-empty-box">
                    <AlertCircle size={28} color="#94a3b8" />
                    <p>No skills added to your profile yet.</p>
                    <button className="btn-secondary-sm" onClick={handleOpenEditModal}>
                      <Plus size={14} /> Add Skills Now
                    </button>
                  </div>
                )}
              </div>

              {/* Verified Trust Badges */}
              <div className="trust-badges-row">
                <div className="trust-badge-pill" title="Verified Identity on NearbyGig">
                  <ShieldCheck size={15} color="#2563eb" />
                  <span>ID Verified</span>
                </div>
                <div className="trust-badge-pill" title="Mobile Number Verified">
                  <Phone size={15} color="#10b981" />
                  <span>Phone Verified</span>
                </div>
                <div className="trust-badge-pill" title="Official Location Verified">
                  <MapPin size={15} color="#8b5cf6" />
                  <span>Geo-Located</span>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================================
              5. MY SERVICES
              ================================================== */}
          <section className="dash-card services-section-card">
            <div className="card-section-header">
              <div className="title-with-icon">
                <Layers size={20} color="#2563eb" />
                <div>
                  <h3>My Services</h3>
                  <p className="card-subtitle">
                    {isWorker
                      ? 'Published local services available for nearby booking'
                      : 'Services and offerings tied to your profile'}
                  </p>
                </div>
              </div>
              {isWorker && (
                <button
                  className="btn-primary-sm"
                  onClick={() => setIsAddServiceOpen(true)}
                >
                  <Plus size={15} /> Add Service
                </button>
              )}
            </div>

            <div className="services-grid-wrapper">
              {services && services.length > 0 ? (
                services.map((svc) => (
                  <div key={svc._id} className="service-item-card">
                    <div className="service-card-top">
                      <span className="service-cat-pill">{svc.category || 'General'}</span>
                      <span className="service-price">
                        ₹{svc.startingPrice} <small>/ start</small>
                      </span>
                    </div>

                    <h4 className="service-card-title">{svc.title}</h4>
                    <p className="service-card-desc">{svc.description}</p>

                    <div className="service-card-footer">
                      <div className="svc-meta-item">
                        <MapPin size={13} />
                        <span>Radius: {svc.serviceAreaKm || 10} km</span>
                      </div>
                      <div className="svc-meta-item">
                        <Clock size={13} />
                        <span>{svc.availability?.replace('_', ' ') || 'available'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state-box">
                  <Layers size={36} color="#94a3b8" />
                  <h4>No services added yet</h4>
                  <p>
                    {isWorker
                      ? 'Publish your first service offering to start receiving direct booking requests from nearby clients.'
                      : 'As a customer, you can browse available services in the Find Workers section or post a Gig.'}
                  </p>
                  {isWorker && (
                    <button
                      className="btn-primary-sm"
                      onClick={() => setIsAddServiceOpen(true)}
                    >
                      <Plus size={15} /> Create My First Service
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ==================================================
              6. WORK STATISTICS
              ================================================== */}
          <section className="dash-card statistics-section-card">
            <div className="card-section-header">
              <div className="title-with-icon">
                <Activity size={20} color="#2563eb" />
                <div>
                  <h3>Work Statistics & Activity Metrics</h3>
                  <p className="card-subtitle">Real metrics derived directly from MongoDB records</p>
                </div>
              </div>
            </div>

            <div className="statistics-grid">
              {isWorker ? (
                <>
                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-emerald">
                      <CheckCircle2 size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.completedGigs}</span>
                      <span className="stat-label">Completed Gigs</span>
                    </div>
                  </div>

                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-blue">
                      <FileText size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.activeApplications}</span>
                      <span className="stat-label">Active Applications</span>
                    </div>
                  </div>

                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-indigo">
                      <Layers size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.totalServices}</span>
                      <span className="stat-label">Published Services</span>
                    </div>
                  </div>

                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-amber">
                      <Star size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">
                        {stats.rating ? Number(stats.rating).toFixed(1) : '5.0'}
                      </span>
                      <span className="stat-label">Average Rating</span>
                    </div>
                  </div>

                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-purple">
                      <MessageSquare size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.totalReviews}</span>
                      <span className="stat-label">Client Reviews</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-blue">
                      <Briefcase size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.postedGigs}</span>
                      <span className="stat-label">Posted Gigs</span>
                    </div>
                  </div>

                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-emerald">
                      <CheckCircle2 size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.activeGigs}</span>
                      <span className="stat-label">Active Gigs</span>
                    </div>
                  </div>

                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-indigo">
                      <Clock size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">{stats.serviceRequests}</span>
                      <span className="stat-label">Service Requests</span>
                    </div>
                  </div>

                  <div className="stat-box-card">
                    <div className="stat-icon-wrapper icon-amber">
                      <Star size={22} />
                    </div>
                    <div className="stat-content">
                      <span className="stat-value">
                        {stats.rating ? Number(stats.rating).toFixed(1) : '5.0'}
                      </span>
                      <span className="stat-label">Feedback Rating</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* TWO COLUMN GRID: RATINGS & REVIEWS + RECENT ACTIVITY */}
          <div className="profile-two-column-grid">
            {/* ==================================================
                7. RATINGS & REVIEWS
                ================================================== */}
            <section className="dash-card reviews-section-card">
              <div className="card-section-header">
                <div className="title-with-icon">
                  <Star size={20} color="#eab308" />
                  <div>
                    <h3>Customer Reviews</h3>
                    <p className="card-subtitle">Verified feedback from real gig clients</p>
                  </div>
                </div>
                <div className="rating-pill-sm">
                  <Star size={13} className="star-icon-filled" />
                  <span>{stats.rating ? Number(stats.rating).toFixed(1) : '5.0'}</span>
                </div>
              </div>

              <div className="reviews-list-wrapper">
                {reviews && reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev._id} className="review-card-item">
                      <div className="review-card-header">
                        <div className="reviewer-info-box">
                          <div className="reviewer-avatar">
                            {rev.reviewerName ? rev.reviewerName.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <h5 className="reviewer-name">{rev.reviewerName || 'Client'}</h5>
                            {rev.gigTitle && (
                              <span className="review-gig-tag">{rev.gigTitle}</span>
                            )}
                          </div>
                        </div>

                        <div className="review-stars-box">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <Star
                              key={starVal}
                              size={14}
                              className={
                                starVal <= rev.rating
                                  ? 'star-icon-filled'
                                  : 'star-icon-empty'
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <p className="review-comment-text">&quot;{rev.comment}&quot;</p>

                      <div className="review-card-footer">
                        <span className="review-date">
                          <Calendar size={12} />
                          {rev.createdAt
                            ? new Date(rev.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recently'}
                        </span>
                        <span className="verified-hire-badge">
                          <CheckCircle2 size={12} color="#10b981" /> Verified Hire
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state-box">
                    <Star size={32} color="#94a3b8" />
                    <h4>No reviews yet</h4>
                    <p>Reviews and ratings will appear here once gig clients submit their feedback.</p>
                  </div>
                )}
              </div>
            </section>

            {/* ==================================================
                8. RECENT ACTIVITY
                ================================================== */}
            <section className="dash-card activity-section-card">
              <div className="card-section-header">
                <div className="title-with-icon">
                  <Clock size={20} color="#2563eb" />
                  <div>
                    <h3>Recent Activity</h3>
                    <p className="card-subtitle">Real-time milestones, applications & updates</p>
                  </div>
                </div>
              </div>

              <div className="activity-timeline-wrapper">
                {activities && activities.length > 0 ? (
                  <div className="activity-timeline">
                    {activities.map((act) => (
                      <div key={act._id} className="timeline-item">
                        <div className="timeline-bullet">
                          <div className="bullet-dot" />
                        </div>
                        <div className="timeline-content">
                          <h5 className="timeline-title">{act.title || act.type}</h5>
                          <p className="timeline-desc">{act.message || act.description || ''}</p>
                          <span className="timeline-time">
                            <Clock size={11} />
                            {act.createdAt
                              ? new Date(act.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Just now'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state-box">
                    <Activity size={32} color="#94a3b8" />
                    <h4>No recent activity yet</h4>
                    <p>Your recent gig milestones, job proposals, and status updates will be logged here.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* ==================================================
              9. INLINE EDIT PROFILE MODAL (SAME PAGE)
              ================================================== */}
          {isEditModalOpen && (
            <div className="profile-modal-overlay animate-fade-in" onClick={() => setIsEditModalOpen(false)}>
              <div
                className="profile-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-title">
                    <Edit3 size={20} color="#2563eb" />
                    <h3>Edit Profile</h3>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={() => setIsEditModalOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="modal-form-body">
                  <div className="form-grid-two">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        required
                        className="form-input"
                        value={editFormData.name}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, name: e.target.value })
                        }
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editFormData.phone}
                        onChange={(e) =>
                          setEditFormData({ ...editFormData, phone: e.target.value })
                        }
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Location & Service Address</label>
                    <input
                      type="text"
                      className="form-input"
                      value={editFormData.address}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, address: e.target.value })
                      }
                      placeholder="e.g. Indiranagar, Bengaluru, Karnataka"
                    />
                  </div>

                  <div className="form-group">
                    <label>Professional Bio</label>
                    <textarea
                      rows={3}
                      className="form-textarea"
                      value={editFormData.bio}
                      onChange={(e) =>
                        setEditFormData({ ...editFormData, bio: e.target.value })
                      }
                      placeholder="Describe your skills, experience, and the services you provide..."
                    />
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group">
                      <label>Years of Experience</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        className="form-input"
                        value={editFormData.experience}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            experience: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Current Availability</label>
                      <select
                        className="form-select"
                        value={editFormData.availability}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            availability: e.target.value,
                          })
                        }
                      >
                        <option value="available_now">Available Right Now</option>
                        <option value="available_today">Available Today</option>
                        <option value="available_week">Available This Week</option>
                        <option value="not_available">Currently Unavailable</option>
                      </select>
                    </div>
                  </div>

                  {/* Skills Editor */}
                  <div className="form-group">
                    <label>Skills & Specialties</label>
                    <div className="skill-input-row">
                      <input
                        type="text"
                        className="form-input"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSkill();
                          }
                        }}
                        placeholder="Type skill and press Add (e.g. Electrical Wiring)"
                      />
                      <button
                        type="button"
                        className="btn-primary-sm"
                        onClick={handleAddSkill}
                      >
                        <Plus size={15} /> Add
                      </button>
                    </div>

                    <div className="chips-container-edit">
                      {editFormData.skills.map((sk, idx) => (
                        <span key={idx} className="skill-edit-chip">
                          {sk}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(sk)}
                            className="chip-remove-btn"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setIsEditModalOpen(false)}
                      disabled={savingProfile}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-primary"
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Saving to MongoDB...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* INLINE ADD SERVICE MODAL (SAME PAGE) */}
          {isAddServiceOpen && (
            <div className="profile-modal-overlay animate-fade-in" onClick={() => setIsAddServiceOpen(false)}>
              <div
                className="profile-modal-card animate-scale-up"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="modal-header">
                  <div className="modal-header-title">
                    <Layers size={20} color="#2563eb" />
                    <h3>Add New Worker Service</h3>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={() => setIsAddServiceOpen(false)}
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveService} className="modal-form-body">
                  <div className="form-group">
                    <label>Service Title *</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={serviceFormData.title}
                      onChange={(e) =>
                        setServiceFormData({ ...serviceFormData, title: e.target.value })
                      }
                      placeholder="e.g. Master Electrical Repairs & Wiring"
                    />
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        className="form-select"
                        value={serviceFormData.category}
                        onChange={(e) =>
                          setServiceFormData({ ...serviceFormData, category: e.target.value })
                        }
                      >
                        <option value="Electrical">Electrical</option>
                        <option value="Plumbing">Plumbing</option>
                        <option value="Carpentry">Carpentry</option>
                        <option value="Painting">Painting</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Technology">Technology</option>
                        <option value="Appliance Repair">Appliance Repair</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Starting Price (₹) *</label>
                      <input
                        type="number"
                        required
                        min="50"
                        className="form-input"
                        value={serviceFormData.startingPrice}
                        onChange={(e) =>
                          setServiceFormData({
                            ...serviceFormData,
                            startingPrice: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      rows={3}
                      required
                      className="form-textarea"
                      value={serviceFormData.description}
                      onChange={(e) =>
                        setServiceFormData({
                          ...serviceFormData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Explain what is included in this service..."
                    />
                  </div>

                  <div className="form-grid-two">
                    <div className="form-group">
                      <label>Service Radius (km)</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        className="form-input"
                        value={serviceFormData.serviceAreaKm}
                        onChange={(e) =>
                          setServiceFormData({
                            ...serviceFormData,
                            serviceAreaKm: Number(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="form-group">
                      <label>Availability</label>
                      <select
                        className="form-select"
                        value={serviceFormData.availability}
                        onChange={(e) =>
                          setServiceFormData({
                            ...serviceFormData,
                            availability: e.target.value,
                          })
                        }
                      >
                        <option value="available_today">Available Today</option>
                        <option value="available_now">Available Right Now</option>
                        <option value="available_week">Available This Week</option>
                      </select>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setIsAddServiceOpen(false)}
                      disabled={savingService}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-save-primary"
                      disabled={savingService}
                    >
                      {savingService ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} />
                          <span>Publish Service</span>
                        </>
                      )}
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

export default ProfilePage;
