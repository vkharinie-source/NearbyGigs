import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const requestBrowserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setLocation(prev => ({ ...prev, permissionStatus: 'denied', isLoaded: true }));
        reject(errorMsg);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newLoc = {
            lat,
            lng,
            address: 'My Current Location',
            isLoaded: true,
            permissionStatus: 'granted',
          };
          setLocation(newLoc);
          try {
            await locationService.updateUserLocation(lat, lng, 'My Current Location');
          } catch (e) {
            console.error('Failed to sync location to backend:', e);
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
          reject(error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
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
      console.error('Failed to sync manual location to backend:', e);
    }
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, requestBrowserLocation, setManualLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = () => useContext(LocationContext);
