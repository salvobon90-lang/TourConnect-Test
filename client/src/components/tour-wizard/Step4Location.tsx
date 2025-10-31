import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useTourWizard } from './TourWizardContext';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function LocationMarker({ position, setPosition }: { 
  position: [number, number]; 
  setPosition: (pos: [number, number]) => void 
}) {
  const markerRef = useRef<L.Marker>(null);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  useEffect(() => {
    const marker = markerRef.current;
    if (marker) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setPosition([pos.lat, pos.lng]);
      });
    }
  }, [setPosition]);

  return <Marker position={position} draggable ref={markerRef} />;
}

export default function Step4Location() {
  const { t } = useTranslation();
  const { form } = useTourWizard();

  if (!form) return null;

  const latitude = form.watch('latitude') || 41.9028;
  const longitude = form.watch('longitude') || 12.4964;
  const radius = form.watch('radius') || 0.5;

  const setPosition = (pos: [number, number]) => {
    form.setValue('latitude', pos[0]);
    form.setValue('longitude', pos[1]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Location & Meeting Point</h2>
        <p className="text-muted-foreground">Set the tour location and meeting point</p>
      </div>

      <FormField
        control={form.control}
        name="meetingPoint"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Meeting Point Address *</FormLabel>
            <FormControl>
              <Input 
                placeholder="e.g., Piazza Navona, Rome"
                {...field}
                data-testid="input-meeting-point"
              />
            </FormControl>
            <FormDescription>
              Provide a clear, easy-to-find meeting location
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude *</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="any"
                  placeholder="41.9028"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  data-testid="input-latitude"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude *</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="any"
                  placeholder="12.4964"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                  data-testid="input-longitude"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="radius"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tour Coverage Radius: {radius.toFixed(1)} km</FormLabel>
            <FormControl>
              <Slider
                min={0.1}
                max={10}
                step={0.1}
                value={[field.value || 0.5]}
                onValueChange={(vals) => field.onChange(vals[0])}
                data-testid="slider-radius"
              />
            </FormControl>
            <FormDescription>
              Approximate area covered by the tour
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
        <MapContainer
          center={[latitude, longitude]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          data-testid="location-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={[latitude, longitude]} setPosition={setPosition} />
          <Circle
            center={[latitude, longitude]}
            radius={radius * 1000}
            pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
          />
        </MapContainer>
      </div>

      <p className="text-sm text-muted-foreground">
        💡 Click on the map or drag the marker to set the exact meeting point
      </p>
    </div>
  );
}
