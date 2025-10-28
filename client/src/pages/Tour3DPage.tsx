import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TourViewer3D } from "@/components/3d/TourViewer3D";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { Tour } from "@shared/schema";

export default function Tour3DPage() {
  const [, params] = useRoute("/tours/:id/3d");
  const tourId = params?.id;
  
  const { data: tour, isLoading, error } = useQuery<Tour>({
    queryKey: ["/api/tours", tourId],
    queryFn: () => fetch(`/api/tours/${tourId}`).then(r => r.json()),
    enabled: !!tourId
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }
  
  if (error || !tour) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground" data-testid="text-error">Tour not found</p>
        <Link href="/explore">
          <Button variant="outline" data-testid="button-back-explore">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </Button>
        </Link>
      </div>
    );
  }
  
  const panoramaUrl = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2048&q=80";
  
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10">
        <Link href={`/tours/${tourId}`}>
          <Button variant="secondary" size="sm" data-testid="button-back-tour">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tour
          </Button>
        </Link>
      </div>
      
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <h1 
          className="text-xl font-bold text-white bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm"
          data-testid="text-tour-title"
        >
          {tour.title} - 3D View
        </h1>
      </div>
      
      <TourViewer3D panoramaUrl={panoramaUrl} />
    </div>
  );
}
