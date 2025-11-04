import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  price?: number;
  category?: string;
  rating?: number;
}

interface Props {
  results: SearchResult[];
}

export function SearchResultMap({ results }: Props) {
  const defaultCenter: [number, number] = [37.0755, 15.2866]; // Siracusa
  
  // Calculate center from results with valid coordinates
  const validResults = results.filter(r => r.latitude && r.longitude);
  const center: [number, number] = validResults.length > 0
    ? [validResults[0].latitude!, validResults[0].longitude!]
    : defaultCenter;
  
  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validResults.map((result) => (
          <Marker
            key={`${result.type}-${result.id}`}
            position={[result.latitude!, result.longitude!]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-base mb-1">{result.title}</h3>
                {result.category && (
                  <p className="text-sm text-muted-foreground mb-1">{result.category}</p>
                )}
                {result.price && (
                  <p className="text-sm font-medium text-primary">€{result.price}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
