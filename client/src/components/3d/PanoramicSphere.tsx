import { useTexture } from "@react-three/drei";
import { BackSide } from "three";

interface PanoramicSphereProps {
  imageUrl: string;
  radius?: number;
}

export function PanoramicSphere({ imageUrl, radius = 500 }: PanoramicSphereProps) {
  const texture = useTexture(imageUrl);
  
  return (
    <mesh>
      <sphereGeometry args={[radius, 60, 40]} />
      <meshBasicMaterial 
        map={texture} 
        side={BackSide} 
        toneMapped={false}
      />
    </mesh>
  );
}
