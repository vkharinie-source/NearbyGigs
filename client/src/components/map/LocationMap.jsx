import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, UserCheck, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fix Leaflet default icon paths in React Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Pins
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const gigIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const workerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
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

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterMap center={center} />

        {/* Current User Location Marker */}
        {center && center[0] && center[1] && (
          <Marker position={center} icon={userIcon}>
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px' }}>
                <strong style={{ color: '#2563eb', fontSize: '14px' }}>📍 You Are Here</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Current Location Center</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Nearby Gigs Markers */}
        {gigs.map((gig) => {
          const coords = gig.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const position = [coords[1], coords[0]]; // [lat, lng]

          return (
            <Marker key={gig._id} position={position} icon={gigIcon}>
              <Popup>
                <div style={{ width: '200px', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    <Briefcase size={14} /> GIG NEARBY
                  </div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'bold' }}>{gig.title}</h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#475569' }}>
                    <strong>Budget:</strong> ₹{gig.budgetMin} - ₹{gig.budgetMax}
                  </p>
                  {gig.distanceKm !== undefined && (
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                      📍 {gig.distanceKm} km away
                    </p>
                  )}
                  <button
                    onClick={() => onSelectGig ? onSelectGig(gig) : navigate(`/gigs/${gig._id}`)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
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
        {workers.map((workerService) => {
          const coords = workerService.location?.coordinates;
          if (!coords || coords.length < 2) return null;
          const position = [coords[1], coords[0]];

          const workerName = workerService.worker?.name || 'Local Worker';
          const rating = workerService.worker?.rating || 4.8;

          return (
            <Marker key={workerService._id} position={position} icon={workerIcon}>
              <Popup>
                <div style={{ width: '200px', padding: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}>
                    <UserCheck size={14} /> WORKER AVAILABLE
                  </div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 'bold' }}>{workerService.title}</h4>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#64748b' }}>by {workerName} (⭐ {rating})</p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#475569' }}>
                    <strong>Starting:</strong> ₹{workerService.startingPrice}
                  </p>
                  {workerService.distanceKm !== undefined && (
                    <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                      📍 {workerService.distanceKm} km away
                    </p>
                  )}
                  <button
                    onClick={() => onSelectWorker ? onSelectWorker(workerService) : navigate(`/workers/${workerService._id}`)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      backgroundColor: '#16a34a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                  >
                    View Worker
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
