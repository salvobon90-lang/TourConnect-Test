import { useState } from "react";
import { Users, Share2, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

interface GroupBooking {
  id: string;
  tourId: string;
  tourDate: string;
  maxParticipants: number;
  minParticipants: number;
  currentParticipants: number;
  basePricePerPerson: number;
  currentPricePerPerson: number;
  discountStep: number;
  priceFloor: number;
  status: "open" | "confirmed" | "full" | "closed" | "cancelled";
  groupCode: string;
}

interface GroupBookingCardProps {
  tourId: string;
  tourDate: Date;
  tourName?: string;
  showJoinButton?: boolean;
  compact?: boolean;
}

export function GroupBookingCard({ 
  tourId, 
  tourDate,
  tourName,
  showJoinButton = true,
  compact = false
}: GroupBookingCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [participants, setParticipants] = useState(1);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const dateString = tourDate.toISOString().split('T')[0];

  const { data: group, isLoading } = useQuery<GroupBooking>({
    queryKey: [`group-booking-${tourId}-${dateString}`],
    queryFn: async () => {
      const res = await fetch(`/api/group-bookings/tour/${tourId}/${dateString}`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch group booking");
      }
      return res.json();
    },
  });

  const { data: participantsList } = useQuery({
    queryKey: [`group-participants-${group?.id}`],
    queryFn: async () => {
      if (!group) return [];
      const res = await fetch(`/api/group-bookings/${group.id}/participants`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch participants");
      return res.json();
    },
    enabled: !!group,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!group) throw new Error("No group found");
      const res = await fetch(`/api/group-bookings/${group.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ participants }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to join group");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`group-booking-${tourId}-${dateString}`] });
      queryClient.invalidateQueries({ queryKey: [`group-participants-${group?.id}`] });
      toast({
        title: t("groupBooking.joinSuccess"),
        description: t("groupBooking.joinSuccessDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoin = () => {
    if (!user) {
      toast({
        title: t("loginRequired"),
        description: t("groupBooking.loginToJoin"),
        variant: "destructive",
      });
      return;
    }

    if (user.role !== "tourist") {
      toast({
        title: t("notAllowed"),
        description: t("groupBooking.touristsOnly"),
        variant: "destructive",
      });
      return;
    }

    joinMutation.mutate();
  };

  const handleShare = async () => {
    if (!group) return;
    
    const shareUrl = `${window.location.origin}/group/${group.groupCode}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: tourName || t("groupBooking.shareTitle"),
          text: t("groupBooking.shareText", { 
            price: group.currentPricePerPerson.toFixed(2),
            participants: group.currentParticipants,
            max: group.maxParticipants
          }),
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: t("success"),
          description: t("groupBooking.linkCopied"),
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className={compact ? "p-4" : ""}>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!group || group.status === "cancelled" || group.status === "closed") {
    return null;
  }

  const progress = (group.currentParticipants / group.maxParticipants) * 100;
  const discount = ((group.basePricePerPerson - group.currentPricePerPerson) / group.basePricePerPerson) * 100;
  const spotsLeft = group.maxParticipants - group.currentParticipants;
  const isAlmostFull = spotsLeft <= 3 && spotsLeft > 0;

  const statusColors = {
    open: "bg-green-500",
    confirmed: "bg-blue-500",
    full: "bg-orange-600",
    closed: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-orange-500/20 bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-900 dark:to-orange-950/10">
        <CardHeader className={compact ? "pb-3" : ""}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-orange-600" />
                {t("groupBooking.title")}
                <Badge className={statusColors[group.status]}>
                  {t(`groupBooking.status.${group.status}`)}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {t("groupBooking.saveWithGroup")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {t("groupBooking.participants")}
              </span>
              <span className="font-semibold">
                {group.currentParticipants} / {group.maxParticipants}
                {isAlmostFull && (
                  <span className="ml-2 text-orange-600 text-xs">
                    {t("groupBooking.almostFull")}
                  </span>
                )}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>{t("groupBooking.minRequired", { min: group.minParticipants })}</span>
              <span>{spotsLeft} {t("groupBooking.spotsLeft")}</span>
            </div>
          </div>

          <div className="bg-orange-100 dark:bg-orange-950/30 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t("groupBooking.currentPrice")}
              </span>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-600">
                  €{group.currentPricePerPerson.toFixed(2)}
                </div>
                {discount > 0 && (
                  <div className="text-xs text-gray-500 line-through">
                    €{group.basePricePerPerson.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            
            {discount > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-medium">
                <Check className="h-4 w-4" />
                {t("groupBooking.saving", { percent: discount.toFixed(0) })}
              </div>
            )}
            
            {group.currentParticipants < group.maxParticipants && (
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                {t("groupBooking.priceDrops")}
              </div>
            )}
          </div>

          {participantsList && participantsList.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {participantsList.slice(0, 5).map((p: any, i: number) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full bg-orange-200 dark:bg-orange-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium text-orange-900 dark:text-orange-100"
                  >
                    {p.name?.[0]?.toUpperCase() || "?"}
                  </div>
                ))}
                {participantsList.length > 5 && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium">
                    +{participantsList.length - 5}
                  </div>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {participantsList.length} {t("groupBooking.joined")}
              </span>
            </div>
          )}
        </CardContent>

        {showJoinButton && (
          <CardFooter className="flex gap-2">
            <Button
              onClick={handleJoin}
              disabled={joinMutation.isPending || group.status === "full" || spotsLeft === 0}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {joinMutation.isPending ? (
                t("groupBooking.joining")
              ) : group.status === "full" ? (
                t("groupBooking.groupFull")
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  {t("groupBooking.joinGroup")}
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              className="border-orange-200 hover:bg-orange-50 dark:border-orange-900 dark:hover:bg-orange-950"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>
    </motion.div>
  );
}
