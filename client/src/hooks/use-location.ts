import { useState, useEffect, useCallback } from 'react';
import { getUserLocation, type UserLocation } from '@/lib/geolocation';

export interface GeoContext {
  location: {
    latitude: number;
    longitude: number;
    type: 'gps' | 'destination';
  } | null;
  radius: number;
  hasConsent: boolean;
}

export interface PreferredDestination {
  city: string;
  country: string;
  lat: number;
  lng: number;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoConsent, setGeoConsent] = useState(false);
  const [geoContext, setGeoContext] = useState<GeoContext | null>(null);

  const getGeoContext = useCallback(async (): Promise<GeoContext | null> => {
    try {
      const response = await fetch('/api/geo/context', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return null;
        }
        throw new Error('Failed to fetch geo context');
      }
      
      const data = await response.json();
      setGeoContext(data);
      setGeoConsent(data.hasConsent);
      return data;
    } catch (err: any) {
      console.error('Error fetching geo context:', err);
      return null;
    }
  }, []);

  const persistToDatabase = useCallback(async (data: {
    geoConsent?: boolean;
    lastKnownLocation?: { lat: number; lng: number; accuracy: number };
    preferredDestination?: PreferredDestination;
    radiusKm?: number;
  }) => {
    try {
      const response = await fetch('/api/geo/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update geo settings');
      }
      
      const result = await response.json();
      
      if (data.geoConsent !== undefined) {
        setGeoConsent(data.geoConsent);
      }
      
      await getGeoContext();
      
      return result;
    } catch (err: any) {
      console.error('Error persisting geo data:', err);
      throw err;
    }
  }, [getGeoContext]);

  const requestLocation = useCallback(async (persistToDB = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const loc = await getUserLocation();
      setLocation(loc);
      
      localStorage.setItem('userLocation', JSON.stringify(loc));
      
      if (persistToDB && geoConsent) {
        await persistToDatabase({
          lastKnownLocation: {
            lat: loc.latitude,
            lng: loc.longitude,
            accuracy: 10,
          },
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [geoConsent, persistToDatabase]);

  const updateGeoConsent = useCallback(async (consent: boolean) => {
    try {
      await persistToDatabase({ geoConsent: consent });
      setGeoConsent(consent);
      
      if (consent && location) {
        await persistToDatabase({
          lastKnownLocation: {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: 10,
          },
        });
      }
    } catch (err: any) {
      console.error('Error updating consent:', err);
      throw err;
    }
  }, [location, persistToDatabase]);

  const setPreferredDestination = useCallback(async (destination: PreferredDestination) => {
    try {
      await persistToDatabase({ preferredDestination: destination });
    } catch (err: any) {
      console.error('Error setting preferred destination:', err);
      throw err;
    }
  }, [persistToDatabase]);

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation));
      } catch {
        // Invalid JSON, ignore
      }
    }
    
    getGeoContext();
  }, [getGeoContext]);

  return {
    location,
    loading,
    error,
    geoConsent,
    geoContext,
    requestLocation,
    persistToDatabase,
    getGeoContext,
    updateGeoConsent,
    setPreferredDestination,
    hasLocation: location !== null,
  };
}
