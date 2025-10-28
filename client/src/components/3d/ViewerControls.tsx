import { Button } from "@/components/ui/button";
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RefreshCw,
  Volume2,
  VolumeX
} from "lucide-react";
import { VRButton } from "./VRButton";

interface ViewerControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleAuto: () => void;
  isAutoRotate: boolean;
  audioPlaying: boolean;
  onToggleAudio: () => void;
  isVRAvailable: boolean;
  isInVR: boolean;
  onEnterVR: () => void;
  onExitVR: () => void;
}

export function ViewerControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleAuto,
  isAutoRotate,
  audioPlaying,
  onToggleAudio,
  isVRAvailable,
  isInVR,
  onEnterVR,
  onExitVR
}: ViewerControlsProps) {
  return (
    <div 
      className="absolute bottom-4 right-4 flex flex-col gap-2"
      data-testid="viewer-controls"
    >
      <VRButton 
        isVRAvailable={isVRAvailable}
        isInVR={isInVR}
        onEnterVR={onEnterVR}
        onExitVR={onExitVR}
      />
      
      <Button 
        size="icon" 
        variant="secondary"
        onClick={onZoomIn}
        data-testid="button-zoom-in"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant="secondary"
        onClick={onZoomOut}
        data-testid="button-zoom-out"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant={isAutoRotate ? "default" : "secondary"}
        onClick={onToggleAuto}
        data-testid="button-toggle-rotation"
      >
        <RotateCw className="w-4 h-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant="secondary"
        onClick={onReset}
        data-testid="button-reset-view"
      >
        <RefreshCw className="w-4 h-4" />
      </Button>
      
      <Button 
        size="icon" 
        variant={audioPlaying ? "default" : "secondary"}
        onClick={onToggleAudio}
        data-testid="button-toggle-audio"
      >
        {audioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </Button>
    </div>
  );
}
