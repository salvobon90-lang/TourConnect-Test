import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { MapPin, Star, Heart, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "@/components/LikeButton";
import { TrustLevelBadge } from "@/components/TrustLevelBadge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { motion } from "framer-motion";

interface Tour {
  id: string;
  title: string;
  description: string;
  price: string;
  images: string[];
  latitude: number;
  longitude: number;
  guideId: string;
  guide: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Service {
  id: string;
  name: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  providerId: string;
  provider: {
    id: string;
    businessName: string;
  };
}

export default function DiscoverPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<"granted" | "denied" | "pending">("pending");

  // Request geolocation
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission("granted");
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationPermission("denied");
          toast({
            title: t("discover.locationError"),
            description: t("discover.locationErrorDesc"),
            variant: "destructive",
          });
        }
      );
    }
  }, [t, toast]);

  // Fetch tours
  const { data: tours = [] } = useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const res = await fetch("/api/tours");
      if (!res.ok) throw new Error("Failed to fetch tours");
      return res.json() as Promise<Tour[]>;
    },
  });

  // Fetch services
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      return res.json() as Promise<Service[]>;
    },
  });

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Filter by distance (50km radius)
  const nearbyTours = userLocation
    ? tours.filter(tour => 
        calculateDistance(userLocation.lat, userLocation.lng, tour.latitude, tour.longitude) <= 50
      ).map(tour => ({
        ...tour,
        distance: calculateDistance(userLocation.lat, userLocation.lng, tour.latitude, tour.longitude)
      }))
    : [];

  const nearbyServices = userLocation
    ? services.filter(service =>
        calculateDistance(userLocation.lat, userLocation.lng, service.latitude, service.longitude) <= 50
      ).map(service => ({
        ...service,
        distance: calculateDistance(userLocation.lat, userLocation.lng, service.latitude, service.longitude)
      }))
    : [];

  if (locationPermission === "pending") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Navigation className="h-12 w-12 animate-pulse text-orange-600" />
          <p className="text-lg text-gray-600 dark:text-gray-400">{t("discover.requestingLocation")}</p>
        </div>
      </div>
    );
  }

  if (locationPermission === "denied") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <MapPin className="h-12 w-12 text-gray-400" />
          <p className="text-lg font-semibold">{t("discover.locationDenied")}</p>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
            {t("discover.locationDeniedDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
          {t("discover.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t("discover.subtitle")}
        </p>
      </div>

      {/* Nearby Tours */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <MapPin className="h-6 w-6 text-orange-600" />
          {t("discover.nearYou")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nearbyTours.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">
              {t("discover.noNearbyTours")}
            </p>
          ) : (
            nearbyTours.slice(0, 6).map((tour, index) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow border-2">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={tour.images[0] || "https://via.placeholder.com/400x300?text=Tour"}
                      alt={tour.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <LikeButton targetId={tour.id} targetType="tour" />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{tour.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{tour.distance?.toFixed(1)} km {t("discover.away")}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {tour.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <TrustLevelBadge userId={tour.guideId} size="sm" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-xl font-bold text-orange-600">
                      €{tour.price}
                    </span>
                    <Link href={`/tours/${tour.id}`}>
                      <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                        {t("discover.viewDetails")}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Nearby Services */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Star className="h-6 w-6 text-orange-600" />
          {t("discover.nearbyServices")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nearbyServices.length === 0 ? (
            <p className="col-span-full text-center text-gray-500 py-8">
              {t("discover.noNearbyServices")}
            </p>
          ) : (
            nearbyServices.slice(0, 6).map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow border-2">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={service.images[0] || "https://via.placeholder.com/400x300?text=Service"}
                      alt={service.name}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <LikeButton targetId={service.id} targetType="service" />
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{service.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>{service.distance?.toFixed(1)} km {t("discover.away")}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <TrustLevelBadge userId={service.providerId} size="sm" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/services/${service.id}`} className="w-full">
                      <Button size="sm" className="w-full bg-orange-600 hover:bg-orange-700">
                        {t("discover.viewDetails")}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
