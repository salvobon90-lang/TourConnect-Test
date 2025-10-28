import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import { PanoramicSphere } from "./PanoramicSphere";
import { POIMarker } from "./POIMarker";
import { ViewerControls } from "./ViewerControls";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { PerspectiveCamera } from "three";

const SAMPLE_POIS = [
  {
    id: "poi-1",
    title: "Historic Monument",
    description: "Built in 1850, this monument commemorates the city's founding.",
    position: [100, 0, 0] as [number, number, number],
    audioUrl: "/audio/monument.mp3"
  },
  {
    id: "poi-2",
    title: "Scenic Viewpoint",
    description: "Best spot to watch the sunset over the valley.",
    position: [0, 50, -100] as [number, number, number]
  },
  {
    id: "poi-3",
    title: "Local Restaurant",
    description: "Famous for traditional cuisine and local wines.",
    position: [-100, -20, 50] as [number, number, number]
  }
];

interface TourViewer3DProps {
  panoramaUrl: string;
  pois?: typeof SAMPLE_POIS;
}

export function TourViewer3D({ 
  panoramaUrl, 
  pois = SAMPLE_POIS 
}: TourViewer3DProps) {
  const controlsRef = useRef<OrbitControlsType>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  
  const handleAudioPlay = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      setAudioPlaying(false);
    }
    
    const audio = new Audio(audioUrl);
    audio.play();
    setCurrentAudio(audio);
    setAudioPlaying(true);
    
    audio.onended = () => {
      setAudioPlaying(false);
      setCurrentAudio(null);
    };
  };
  
  const toggleAudio = () => {
    if (currentAudio) {
      if (audioPlaying) {
        currentAudio.pause();
        setAudioPlaying(false);
      } else {
        currentAudio.play();
        setAudioPlaying(true);
      }
    }
  };
  
  const handleZoomIn = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      if (camera instanceof PerspectiveCamera) {
        camera.fov = Math.max(30, camera.fov - 10);
        camera.updateProjectionMatrix();
      }
    }
  };
  
  const handleZoomOut = () => {
    if (controlsRef.current) {
      const camera = controlsRef.current.object;
      if (camera instanceof PerspectiveCamera) {
        camera.fov = Math.min(90, camera.fov + 10);
        camera.updateProjectionMatrix();
      }
    }
  };
  
  const handleReset = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      const camera = controlsRef.current.object;
      if (camera instanceof PerspectiveCamera) {
        camera.fov = 75;
        camera.updateProjectionMatrix();
      }
    }
  };
  
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
      }
    };
  }, [currentAudio]);
  
  return (
    <div className="relative w-full h-screen bg-black" data-testid="tour-viewer-3d">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <PanoramicSphere imageUrl={panoramaUrl} />
        
        {pois.map((poi) => (
          <POIMarker 
            key={poi.id} 
            poi={poi} 
            onAudioPlay={handleAudioPlay}
          />
        ))}
        
        <OrbitControls 
          ref={controlsRef}
          enableZoom={true}
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          minDistance={1}
          maxDistance={100}
        />
      </Canvas>
      
      <ViewerControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onToggleAuto={() => setAutoRotate(!autoRotate)}
        isAutoRotate={autoRotate}
        audioPlaying={audioPlaying}
        onToggleAudio={toggleAudio}
      />
    </div>
  );
}
