import { useQuery } from '@tanstack/react-query';
import type { GlobeMarker } from '@/lib/geolocation';

// Tour, Service, Event types from schema
interface Tour {
  id: string;
  title: string;
  meetingPoint: string;
  latitude: number;
  longitude: number;
  category: string;
  price: string | null;
  images: string[];
}

interface Service {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  priceRange: string | null;
  images: string[];
}

interface Event {
  id: string;
  title: string;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  category: string;
  ticketPrice: string | null;
}

export function useGlobeData() {
  // Fetch tours
  const { data: tours = [], isLoading: toursLoading } = useQuery<Tour[]>({
    queryKey: ['/api/tours'],
  });
  
  // Fetch services
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
  });
  
  // Fetch events
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });
  
  // Transform to GlobeMarker format
  const markers: GlobeMarker[] = [
    ...tours
      .filter(t => t.latitude != null && t.longitude != null)
      .map(t => ({
        id: t.id,
        type: 'tour' as const,
        title: t.title,
        location: t.meetingPoint,
        latitude: t.latitude,
        longitude: t.longitude,
        category: t.category,
        price: t.price ? parseFloat(t.price) : undefined,
        images: t.images
      })),
    ...services
      .filter(s => s.latitude != null && s.longitude != null)
      .map(s => ({
        id: s.id,
        type: 'service' as const,
        title: s.name,
        location: s.address,
        latitude: s.latitude,
        longitude: s.longitude,
        category: s.type,
        price: undefined, // priceRange is not numeric
        images: s.images
      })),
    ...events
      .filter(e => e.latitude != null && e.longitude != null)
      .map(e => ({
        id: e.id,
        type: 'event' as const,
        title: e.title,
        location: e.locationName || 'Location TBD',
        latitude: e.latitude!,
        longitude: e.longitude!,
        category: e.category,
        price: e.ticketPrice ? parseFloat(e.ticketPrice) : undefined,
        images: [] // Events don't have images in schema
      }))
  ];
  
  return {
    markers,
    isLoading: toursLoading || servicesLoading || eventsLoading
  };
}
