import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { locationService } from '../services/locationService';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({
    lat: 12.9716, // Default Bengaluru center
    lng: 77.5946,
    address: 'Bengaluru, Karnataka',
    isLoaded: false,
    permissionStatus: 'prompt', // prompt, granted, denied
  });

  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [trackingError, setTrackingError] = useState(null);
  const watchIdRef = useRef(null);

  // Helper to get friendly location name via reverse geocode
  const fetchAddressName = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(3500) }
      );
      if (response.ok) {
        const data = await response.json();
        const suburb = data.address?.suburb || data.address?.neighbourhood || data.address?.residential || data.address?.city_district;
        const city = data.address?.city || data.address?.town || data.address?.state_district || data.address?.state;
        if (suburb && city) return `${suburb}, ${city}`;
        if (city) return `${city}, India`;
        if (data.display_name) return data.display_name.split(',').slice(0, 2).join(',').trim();
      }
    } catch (e) {
      // Quietly fall back if reverse geocode is blocked or offline
    }
    return `Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
  };

  const requestBrowserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setLocation(prev => ({ ...prev, permissionStatus: 'denied', isLoaded: true }));
        setTrackingError(errorMsg);
        reject(errorMsg);
        return;
      }

      setTrackingError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          let addressName = 'Live GPS Location';

          try {
            addressName = await fetchAddressName(lat, lng);
          } catch (e) {}

          const newLoc = {
            lat,
            lng,
            address: addressName,
            isLoaded: true,
            permissionStatus: 'granted',
          };
          setLocation(newLoc);

          try {
            await locationService.updateUserLocation(lat, lng, addressName);
          } catch (e) {
            console.warn('Location sync notice:', e.message);
          }
          resolve(newLoc);
        },
        (error) => {
          console.warn('Geolocation access denied or failed:', error.message);
          setLocation(prev => ({
            ...prev,
            permissionStatus: 'denied',
            isLoaded: true,
          }));
          setTrackingError(error.message);
          reject(error.message);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
      );
    });
  };

  // Continuous Live GPS Tracking
  const startLiveTracking = () => {
    if (!navigator.geolocation) {
      setTrackingError('Geolocation is not supported by your device.');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLiveTracking(true);
    setTrackingError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newLoc = {
          lat,
          lng,
          address: 'Live Tracking Active',
          isLoaded: true,
          permissionStatus: 'granted',
        };
        setLocation(prev => ({ ...prev, ...newLoc }));
      },
      (err) => {
        console.warn('Live watch position notice:', err.message);
        setTrackingError(err.message);
        setIsLiveTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveTracking(false);
  };

  const setManualLocation = async (lat, lng, address = 'Custom Location') => {
    const newLoc = {
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      address,
      isLoaded: true,
      permissionStatus: 'granted',
    };
    setLocation(newLoc);
    try {
      await locationService.updateUserLocation(lat, lng, address);
    } catch (e) {
      console.warn('Failed to sync manual location:', e.message);
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        address: location.address,
        requestBrowserLocation,
        getLocation: requestBrowserLocation,
        startLiveTracking,
        stopLiveTracking,
        isLiveTracking,
        trackingError,
        setManualLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);

