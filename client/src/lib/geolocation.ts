import * as THREE from 'three';

// Haversine formula to calculate distance between two coordinates
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export interface UserLocation {
  latitude: number;
  longitude: number;
}

// Get user's current location using browser geolocation API
export function getUserLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

// Format distance for display
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  } else {
    return `${km.toFixed(1)}km`;
  }
}

// ===== Globe-specific types and functions =====

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GlobeMarker {
  id: string;
  type: 'tour' | 'service' | 'event';
  title: string;
  location: string;
  latitude: number;
  longitude: number;
  category?: string;
  price?: number;
  images?: string[];
}

/**
 * Convert lat/lon coordinates to 3D Vector3 position on sphere
 * @param lat Latitude in degrees (-90 to 90)
 * @param lon Longitude in degrees (-180 to 180)
 * @param radius Sphere radius (default 2)
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius: number = 2
): THREE.Vector3 {
  // Convert to radians
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  
  // Spherical to Cartesian conversion
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
}

/**
 * Get marker color based on type
 */
export function getMarkerColor(type: 'tour' | 'service' | 'event'): string {
  switch (type) {
    case 'tour':
      return '#FF6600'; // Primary orange
    case 'service':
      return '#3b82f6'; // Blue
    case 'event':
      return '#10b981'; // Green
    default:
      return '#FF6600';
  }
}
