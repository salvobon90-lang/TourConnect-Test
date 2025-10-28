import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { GlobeMarker } from '@/lib/geolocation';
import { latLonToVector3, getMarkerColor } from '@/lib/geolocation';

interface GlobeProps {
  markers: GlobeMarker[];
  onMarkerClick?: (marker: GlobeMarker) => void;
  selectedMarkerId?: string;
  visibleTypes: Set<'tour' | 'service' | 'event'>;
}

function Globe() {
  const globeRef = useRef<THREE.Mesh>(null);
  
  // Auto-rotate
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.001;
    }
  });
  
  // Simple blue sphere (replace with texture later)
  return (
    <mesh ref={globeRef}>
      <sphereGeometry args={[2, 64, 64]} />
      <meshStandardMaterial color="#1e40af" />
    </mesh>
  );
}

function Markers({ markers, onMarkerClick, selectedMarkerId, visibleTypes }: GlobeProps) {
  const markerRefs = useRef<THREE.Mesh[]>([]);
  
  // Filter markers by visible types
  const visibleMarkers = useMemo(
    () => markers.filter(m => visibleTypes.has(m.type)),
    [markers, visibleTypes]
  );
  
  return (
    <>
      {visibleMarkers.map((marker, idx) => {
        const position = latLonToVector3(marker.latitude, marker.longitude, 2.05);
        const color = getMarkerColor(marker.type);
        const isSelected = marker.id === selectedMarkerId;
        
        return (
          <mesh
            key={marker.id}
            position={[position.x, position.y, position.z]}
            onClick={() => onMarkerClick?.(marker)}
            ref={(el) => {
              if (el) markerRefs.current[idx] = el;
            }}
            scale={isSelected ? 1.5 : 1}
          >
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color}
              emissiveIntensity={isSelected ? 0.8 : 0.3}
            />
            
            {/* Tooltip on hover */}
            <Html distanceFactor={10}>
              <div className="bg-card p-2 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none">
                <div className="font-semibold">{marker.title}</div>
                <div className="text-muted-foreground">{marker.location}</div>
              </div>
            </Html>
          </mesh>
        );
      })}
    </>
  );
}

export { Globe, Markers };
