'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNotification } from '@/frontend/customer/contexts/NotificationContext';

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  loading: boolean;
  error: string | null;
  permissionDenied: boolean;
}

interface LocationContextType extends LocationData {
  requestLocation: (force?: boolean) => Promise<void>;
  clearLocation: () => void;
}

const defaultState: LocationData = {
  latitude: null,
  longitude: null,
  address: '',
  city: '',
  state: '',
  pincode: '',
  loading: false,
  error: null,
  permissionDenied: false,
};

const LocationContext = createContext<LocationContextType>({
  ...defaultState,
  requestLocation: async () => {},
  clearLocation: () => {},
});

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [locationState, setLocationState] = useState<LocationData>(defaultState);
  const { notify } = useNotification();

  useEffect(() => {
    // Check if we are in browser
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('nimra_location');
    const denied = localStorage.getItem('nimra_location_denied');

    if (stored) {
      try {
        const data = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocationState((prev) => ({ ...prev, ...data, loading: false }));
      } catch (err) {
        // Bad data, request location
        if (!denied) {
          requestLocation();
        }
      }
    } else {
      // First visit: Request automatically if not denied
      if (!denied) {
        requestLocation();
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLocationState((prev) => ({ ...prev, permissionDenied: true }));
      }
    }
  }, []);

  const clearLocation = () => {
    localStorage.removeItem('nimra_location');
    setLocationState(defaultState);
  };

  const requestLocation = async (force: boolean = false) => {
    if (typeof window === 'undefined') return;

    if (!navigator.geolocation) {
      notify.error('Location Error', 'Geolocation is not supported by your browser.');
      setLocationState((prev) => ({ ...prev, error: 'Not supported' }));
      return;
    }

    setLocationState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: force ? 0 : 60000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocoding is proxied through our server to avoid browser CORS failures.
      const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) });
      const res = await fetch(`/api/location/reverse?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch address');
      const data = await res.json();

      const addressDetails = data.address || {};
      
      const city = addressDetails.city || addressDetails.town || addressDetails.village || addressDetails.county || '';
      const state = addressDetails.state || '';
      const pincode = addressDetails.postcode || '';
      const fullAddress = data.display_name || '';

      const newLocationData = {
        latitude,
        longitude,
        address: fullAddress,
        city,
        state,
        pincode,
        loading: false,
        error: null,
        permissionDenied: false,
      };

      setLocationState(newLocationData);
      localStorage.setItem('nimra_location', JSON.stringify(newLocationData));
      localStorage.removeItem('nimra_location_denied');

      if (force) {
        notify.success('Location Updated', 'Location updated successfully.');
      }
    } catch (err: any) {
      let errorMsg = 'Failed to detect location.';
      let denied = false;

      // GeolocationPositionError uses numeric codes
      if (err && typeof err.code === 'number') {
        if (err.code === 1) { // PERMISSION_DENIED
          errorMsg = 'Location permission was denied.';
          denied = true;
          localStorage.setItem('nimra_location_denied', 'true');
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          errorMsg = 'Location information is unavailable.';
          console.warn('Location error: Position unavailable');
        } else if (err.code === 3) { // TIMEOUT
          errorMsg = 'Location request timed out.';
          console.warn('Location error: Timeout');
        }
      } else {
        console.error('Location error:', err);
      }

      setLocationState((prev) => ({
        ...prev,
        loading: false,
        error: errorMsg,
        permissionDenied: denied,
      }));

      if (force) {
        notify.error('Location Error', errorMsg);
      }
    }
  };

  return (
    <LocationContext.Provider value={{ ...locationState, requestLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
