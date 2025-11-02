import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { MapPin, Star, User, Map, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

interface SearchResultsProps {
  results: {
    guides: any[];
    tours: any[];
    services: any[];
    totalCount: number;
  };
  query: string;
  onClose: () => void;
}

export function SearchResults({ results, query, onClose }: SearchResultsProps) {
  const [, navigate] = useLocation();

  const handleClick = (type: string, id: string) => {
    navigate(`/${type}/${id}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
    >
      <Card className="p-4 space-y-4">
        {results.guides.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Guides ({results.guides.length})
            </h3>
            <div className="space-y-2">
              {results.guides.slice(0, 3).map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => handleClick('guide', guide.id)}
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={guide.profileImage} alt={guide.name} />
                      <AvatarFallback>{guide.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate hover:text-orange-600 transition-colors">{guide.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {guide.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {guide.city}
                          </span>
                        )}
                        {guide.profile?.averageRating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                            {guide.profile.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {results.tours.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Map className="h-4 w-4" />
              Tours ({results.tours.length})
            </h3>
            <div className="space-y-2">
              {results.tours.slice(0, 3).map((tour) => (
                <button
                  key={tour.id}
                  onClick={() => handleClick('tours', tour.id)}
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {tour.images?.[0] && (
                      <img 
                        src={tour.images[0]} 
                        alt={tour.title}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tour.title}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-orange-600 font-semibold">€{tour.price}</span>
                        {tour.averageRating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                            {tour.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {results.services.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Services ({results.services.length})
            </h3>
            <div className="space-y-2">
              {results.services.slice(0, 3).map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleClick('services', service.id)}
                  className="w-full text-left p-2 rounded hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {service.images?.[0] && (
                      <img 
                        src={service.images[0]} 
                        alt={service.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{service.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-orange-600 font-semibold">€{service.price}</span>
                        {service.averageRating && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-orange-500 text-orange-500" />
                            {service.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {results.totalCount > 6 && (
          <button
            onClick={() => {
              navigate(`/search?q=${encodeURIComponent(query)}`);
              onClose();
            }}
            className="w-full text-center py-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            View all {results.totalCount} results
          </button>
        )}
      </Card>
    </motion.div>
  );
}
