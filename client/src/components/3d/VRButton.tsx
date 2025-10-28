import { Button } from "@/components/ui/button";
import { Glasses, Eye } from "lucide-react";

interface VRButtonProps {
  onEnterVR: () => void;
  onExitVR: () => void;
  isVRAvailable: boolean;
  isInVR: boolean;
}

export function VRButton({ onEnterVR, onExitVR, isVRAvailable, isInVR }: VRButtonProps) {
  
  if (!isVRAvailable) {
    return (
      <Button 
        size="icon" 
        variant="secondary"
        disabled
        title="VR not supported on this device"
        data-testid="button-vr-disabled"
      >
        <Eye className="w-4 h-4 opacity-50" />
      </Button>
    );
  }
  
  return (
    <Button 
      size="icon" 
      variant={isInVR ? "default" : "secondary"}
      onClick={isInVR ? onExitVR : onEnterVR}
      title={isInVR ? "Exit VR" : "Enter VR"}
      data-testid="button-vr-toggle"
    >
      <Glasses className="w-4 h-4" />
    </Button>
  );
}
