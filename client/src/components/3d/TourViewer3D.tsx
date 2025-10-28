import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useState, useRef, useEffect } from "react";
import { PanoramicSphere } from "./PanoramicSphere";
import { POIMarker } from "./POIMarker";
import { ViewerControls } from "./ViewerControls";
import type { OrbitControls as OrbitControlsType } from "three-stdlib";
import { PerspectiveCamera } from "three";

function VRManager({ 
  onVRAvailabilityChange,
  onVRSessionStart,
  onVRSessionEnd,
  onVREnter,
  onVRError,
  onSessionRef
}: { 
  onVRAvailabilityChange: (available: boolean) => void;
  onVRSessionStart: () => void;
  onVRSessionEnd: () => void;
  onVREnter: (enterFn: () => Promise<void>) => void;
  onVRError: (error: string) => void;
  onSessionRef: (getSession: () => XRSession | null) => void;
}) {
  const { gl } = useThree();
  
  useEffect(() => {
    gl.xr.enabled = true;
    
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
        onVRAvailabilityChange(supported);
      }).catch(() => {
        onVRAvailabilityChange(false);
      });
    } else {
      onVRAvailabilityChange(false);
    }
    
    const handleSessionStart = () => {
      console.log('[VR] Session started');
      onVRSessionStart();
    };
    
    const handleSessionEnd = () => {
      console.log('[VR] Session ended');
      onVRSessionEnd();
    };
    
    gl.xr.addEventListener('sessionstart', handleSessionStart);
    gl.xr.addEventListener('sessionend', handleSessionEnd);
    
    onSessionRef(() => gl.xr.getSession());
    
    onVREnter(async () => {
      try {
        const session = await navigator.xr?.requestSession('immersive-vr');
        if (session) {
          await gl.xr.setSession(session);
        }
      } catch (error: any) {
        console.error('[VR] Error entering VR:', error);
        onVRError(error.message || 'Failed to enter VR');
      }
    });
    
    return () => {
      gl.xr.removeEventListener('sessionstart', handleSessionStart);
      gl.xr.removeEventListener('sessionend', handleSessionEnd);
    };
  }, [gl, onVRAvailabilityChange, onVRSessionStart, onVRSessionEnd, onVREnter, onVRError, onSessionRef]);
  
  return null;
}

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
  
  const [isVRAvailable, setIsVRAvailable] = useState(false);
  const [isInVR, setIsInVR] = useState(false);
  const [vrError, setVRError] = useState<string | null>(null);
  const vrEnterFnRef = useRef<(() => Promise<void>) | null>(null);
  const vrSessionGetterRef = useRef<(() => XRSession | null) | null>(null);
  
  const autoRotateBeforeVRRef = useRef(false);
  
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
  
  const handleEnterVR = async () => {
    if (vrEnterFnRef.current) {
      autoRotateBeforeVRRef.current = autoRotate;
      setAutoRotate(false);
      
      try {
        await vrEnterFnRef.current();
      } catch (error: any) {
        setVRError(error.message || 'Failed to enter VR');
        setAutoRotate(autoRotateBeforeVRRef.current);
      }
    }
  };
  
  const handleExitVR = async () => {
    if (!vrSessionGetterRef.current) return;
    
    try {
      const session = vrSessionGetterRef.current();
      if (session) {
        console.log('[VR] Exiting VR session...');
        await session.end();
      }
    } catch (error: any) {
      console.error('[VR] Error exiting VR:', error);
      setVRError(error.message || 'Failed to exit VR');
    }
  };
  
  const handleVRSessionStart = () => {
    setIsInVR(true);
    setVRError(null);
  };
  
  const handleVRSessionEnd = () => {
    setIsInVR(false);
    setAutoRotate(autoRotateBeforeVRRef.current);
    setVRError(null);
  };
  
  const handleVREnter = (enterFn: () => Promise<void>) => {
    vrEnterFnRef.current = enterFn;
  };
  
  const handleVRError = (error: string) => {
    setVRError(error);
  };
  
  const handleSessionRef = (getSession: () => XRSession | null) => {
    vrSessionGetterRef.current = getSession;
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
      <Canvas 
        camera={{ position: [0, 0, 0.1], fov: 75 }}
      >
        <VRManager 
          onVRAvailabilityChange={setIsVRAvailable}
          onVRSessionStart={handleVRSessionStart}
          onVRSessionEnd={handleVRSessionEnd}
          onVREnter={handleVREnter}
          onVRError={handleVRError}
          onSessionRef={handleSessionRef}
        />
        
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
      
      {vrError && (
        <div 
          className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg"
          data-testid="text-vr-error"
        >
          {vrError}
        </div>
      )}
      
      <ViewerControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onToggleAuto={() => setAutoRotate(!autoRotate)}
        isAutoRotate={autoRotate}
        audioPlaying={audioPlaying}
        onToggleAudio={toggleAudio}
        isVRAvailable={isVRAvailable}
        isInVR={isInVR}
        onEnterVR={handleEnterVR}
        onExitVR={handleExitVR}
      />
    </div>
  );
}
