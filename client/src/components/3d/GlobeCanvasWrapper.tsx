import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { GlobeMarker } from '@/lib/geolocation';

// Import the actual Globe components (named exports)
import { Globe, Markers } from './GlobeScene';

interface GlobeCanvasWrapperProps {
  markers: GlobeMarker[];
  onMarkerClick?: (marker: GlobeMarker) => void;
  selectedMarkerId?: string;
  visibleTypes: Set<'tour' | 'service' | 'event'>;
}

export default function GlobeCanvasWrapper({
  markers,
  onMarkerClick,
  selectedMarkerId,
  visibleTypes,
}: GlobeCanvasWrapperProps) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <Globe />
      <Markers 
        markers={markers}
        onMarkerClick={onMarkerClick}
        selectedMarkerId={selectedMarkerId}
        visibleTypes={visibleTypes}
      />
      <OrbitControls 
        enablePan={false}
        minDistance={3}
        maxDistance={10}
        autoRotate={false}
      />
    </Canvas>
  );
}
