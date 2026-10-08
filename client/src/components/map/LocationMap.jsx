import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Briefcase, UserCheck, Crosshair, Loader2, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocationContext } from '../../context/LocationContext';

// Fix Leaflet default icon paths in React Vite environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// High-reliability SVG DivIcons (Immune to external CDN blocks, CSP & retina sharp)
const createUserPin = () =>
  L.divIcon({
    className: 'custom-map-pin pin-user',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.45);
        border: 2.5px solid #ffffff;
      ">
        <div style="
          transform: rotate(45deg);
          width: 10px;
          height: 10px;
          background: #ffffff;
          border-radius: 50%;
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const createGigPin = () =>
  L.divIcon({
    className: 'custom-map-pin pin-gig',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.45);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 14px; height: 14px; fill: none; stroke: #ffffff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;" viewBox="0 0 24 24">
          <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const createWorkerPin = () =>
  L.divIcon({
    className: 'custom-map-pin pin-worker',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
        border: 2.5px solid #ffffff;
      ">
        <svg style="transform: rotate(45deg); width: 14px; height: 14px; fill: none; stroke: #ffffff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;" viewBox="0 0 24 24">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <polyline points="16 11 18 13 22 9"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

const userIcon = createUserPin();
const gigIcon = createGigPin();
const workerIcon = createWorkerPin();

function MapController({ center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (center && !isNaN(Number(center[0])) && !isNaN(Number(center[1]))) {
      const lat = Number(center[0]);
      const lng = Number(center[1]);
      map.setView([lat, lng], zoom || map.getZoom());
    }
  }, [center, zoom, map]);

  useEffect(() => {
    // Invalidate size immediately and after layout rendering settles
    map.invalidateSize();
    const timer1 = setTimeout(() => map.invalidateSize(), 150);
    const timer2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);

  return null;
}

const LocationMap = ({
  center = [12.9716, 77.5946],
  zoom = 13,
  gigs = [],
  workers = [],
  height = '450px',
  onSelectGig,
  onSelectWorker,
}) => {
  const navigate = useNavigate();
  const { requestBrowserLocation, isLiveTracking, startLiveTracking } = useLocationContext();
  const [locating, setLocating] = useState(false);

  // Validate center coordinates
  const safeLat = !isNaN(Number(center?.[0])) ? Number(center[0]) : 12.9716;
  const safeLng = !isNaN(Number(center?.[1])) ? Number(center[1]) : 77.5946;
  const safeCenter = [safeLat, safeLng];
  const safeZoom = Number(zoom) || 13;

  const handleLiveLocate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setLocating(true);
      if (startLiveTracking) {
        startLiveTracking();
      }
      await requestBrowserLocation();
    } catch (err) {
      console.warn('Map live track notice:', err);
    } finally {
      setTimeout(() => setLocating(false), 800);
    }
  };

  return (
    <div
      className="nearby-map-container"
      style={{
        height,
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {/* Floating Live GPS Tracking Action Control */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={handleLiveLocate}
          title="Track Live GPS Location"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid #2563eb',
            color: '#2563eb',
            borderRadius: '9999px',
            padding: '6px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            transition: 'all 0.2s ease',
          }}
        >
          {locating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Crosshair size={13} color="#2563eb" />
          )}
          <span>{locating ? 'Locating...' : isLiveTracking ? 'Live GPS Active' : 'Live Track Me'}</span>
        </button>
      </div>

      <MapContainer
        center={safeCenter}
        zoom={safeZoom}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapController center={safeCenter} zoom={safeZoom} />

        {/* Current User Location Marker */}
        <Marker position={safeCenter} icon={userIcon}>
          <Popup>
            <div style={{ textAlign: 'center', padding: '6px 4px' }}>
              <strong style={{ color: '#2563eb', fontSize: '13px', display: 'block', marginBottom: '2px' }}>
                📍 You Are Here
              </strong>
              <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                Current Search Center
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Nearby Gigs Markers */}
        {Array.isArray(gigs) &&
          gigs.map((gig) => {
            if (!gig) return null;
            const coords = gig.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length < 2) return null;
            const lat = Number(coords[1]);
            const lng = Number(coords[0]);
            if (isNaN(lat) || isNaN(lng)) return null;

            const position = [lat, lng];

            return (
              <Marker key={gig._id || Math.random()} position={position} icon={gigIcon}>
                <Popup>
                  <div style={{ width: '210px', padding: '4px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#dc2626',
                        fontWeight: 700,
                        fontSize: '11px',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <Briefcase size={13} /> Gig Opportunity
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {gig.title}
                    </h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#475569' }}>
                      <strong>Budget:</strong> ₹{gig.budgetMin} - ₹{gig.budgetMax}
                    </p>
                    {gig.distanceKm !== undefined && (
                      <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                        📍 {gig.distanceKm} km away
                      </p>
                    )}
                    <button
                      onClick={() => (onSelectGig ? onSelectGig(gig) : navigate(`/find-gigs`))}
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Nearby Workers Markers */}
        {Array.isArray(workers) &&
          workers.map((workerService) => {
            if (!workerService) return null;
            const coords = workerService.location?.coordinates;
            if (!coords || !Array.isArray(coords) || coords.length < 2) return null;
            const lat = Number(coords[1]);
            const lng = Number(coords[0]);
            if (isNaN(lat) || isNaN(lng)) return null;

            const position = [lat, lng];
            const workerName = workerService.worker?.name || 'Local Specialist';
            const rating = workerService.worker?.rating ? Number(workerService.worker.rating).toFixed(1) : '4.9';

            return (
              <Marker key={workerService._id || Math.random()} position={position} icon={workerIcon}>
                <Popup>
                  <div style={{ width: '210px', padding: '4px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#10b981',
                        fontWeight: 700,
                        fontSize: '11px',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      <UserCheck size={13} /> Verified Worker
                    </div>
                    <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                      {workerService.title}
                    </h4>
                    <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b' }}>
                      by {workerName} (⭐ {rating})
                    </p>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#475569' }}>
                      <strong>Starts:</strong> ₹{workerService.startingPrice}
                    </p>
                    {workerService.distanceKm !== undefined && (
                      <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                        📍 {workerService.distanceKm} km away
                      </p>
                    )}
                    <button
                      onClick={() =>
                        onSelectWorker ? onSelectWorker(workerService) : navigate(`/find-workers`)
                      }
                      style={{
                        width: '100%',
                        padding: '6px 12px',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      View Specialist
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>
    </div>
  );
};

export default LocationMap;

