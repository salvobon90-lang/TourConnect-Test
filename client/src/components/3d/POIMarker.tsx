import { Html } from "@react-three/drei";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface POI {
  id: string;
  title: string;
  description: string;
  position: [number, number, number];
  audioUrl?: string;
}

interface POIMarkerProps {
  poi: POI;
  onAudioPlay?: (audioUrl: string) => void;
}

export function POIMarker({ poi, onAudioPlay }: POIMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  
  return (
    <group position={poi.position}>
      <mesh
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onClick={() => setClicked(!clicked)}
      >
        <sphereGeometry args={[2, 16, 16]} />
        <meshStandardMaterial 
          color={hovered ? "#FF6600" : "#ffffff"}
          emissive={hovered ? "#FF6600" : "#000000"}
          emissiveIntensity={hovered ? 0.5 : 0}
        />
      </mesh>
      
      {clicked && (
        <Html position={[5, 0, 0]} style={{ pointerEvents: 'none' }}>
          <Card className="w-64 shadow-lg" data-testid={`poi-card-${poi.id}`}>
            <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
              <Info className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-medium">{poi.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{poi.description}</p>
              {poi.audioUrl && (
                <button
                  className="mt-2 text-xs text-primary hover:underline"
                  style={{ pointerEvents: 'auto' }}
                  onClick={() => onAudioPlay?.(poi.audioUrl!)}
                  data-testid={`button-play-audio-${poi.id}`}
                >
                  Play Audio Description
                </button>
              )}
            </CardContent>
          </Card>
        </Html>
      )}
    </group>
  );
}
