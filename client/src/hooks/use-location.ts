import { useState, useEffect } from 'react';
import { getUserLocation, type UserLocation } from '@/lib/geolocation';

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loc = await getUserLocation();
      setLocation(loc);
      localStorage.setItem('userLocation', JSON.stringify(loc));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to load location from localStorage on mount
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setLocation(JSON.parse(savedLocation));
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  return {
    location,
    loading,
    error,
    requestLocation,
    hasLocation: location !== null,
  };
}
