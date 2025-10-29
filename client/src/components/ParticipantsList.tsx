import { Users, Share2, UserPlus, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { motion } from "framer-motion";

interface Participant {
  userId: string;
  name: string;
  profileImageUrl?: string;
  participants: number;
  joinedAt: string;
}

interface ParticipantsListProps {
  groupId: string;
  groupCode: string;
  maxParticipants: number;
  currentParticipants: number;
  tourName?: string;
}

export function ParticipantsList({ 
  groupId, 
  groupCode,
  maxParticipants,
  currentParticipants,
  tourName
}: ParticipantsListProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [copiedCode, setCopiedCode] = useState(false);

  const { data: participants, isLoading } = useQuery<Participant[]>({
    queryKey: [`group-participants-${groupId}`],
    queryFn: async () => {
      const res = await fetch(`/api/group-bookings/${groupId}/participants`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch participants");
      return res.json();
    },
  });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(groupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      toast({
        title: t("success"),
        description: t("groupBooking.codeCopied"),
      });
    } catch (error) {
      toast({
        title: t("error"),
        description: t("groupBooking.copyFailed"),
        variant: "destructive",
      });
    }
  };

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}/group/${groupCode}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: tourName || t("groupBooking.shareTitle"),
          text: t("groupBooking.inviteText"),
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

  const spotsLeft = maxParticipants - currentParticipants;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-600" />
          {t("groupBooking.participants")} ({currentParticipants}/{maxParticipants})
        </CardTitle>
        <CardDescription>
          {spotsLeft > 0 
            ? t("groupBooking.inviteFriends", { spots: spotsLeft })
            : t("groupBooking.groupComplete")
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : participants && participants.length > 0 ? (
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <motion.div
                key={participant.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <Avatar className="h-10 w-10 border-2 border-orange-200 dark:border-orange-800">
                  <AvatarImage src={participant.profileImageUrl} />
                  <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100">
                    {participant.name?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {participant.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("groupBooking.joinedDate", {
                      date: new Date(participant.joinedAt).toLocaleDateString()
                    })}
                  </p>
                </div>
                
                {participant.participants > 1 && (
                  <Badge variant="secondary" className="ml-auto">
                    +{participant.participants - 1}
                  </Badge>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("groupBooking.noParticipants")}</p>
          </div>
        )}

        {spotsLeft > 0 && (
          <div className="pt-4 border-t space-y-3">
            <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t("groupBooking.inviteCode")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("groupBooking.shareCode")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded font-mono text-lg tracking-wider text-orange-600 font-bold">
                    {groupCode}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyCode}
                    className="hover:bg-orange-100 dark:hover:bg-orange-900/50"
                  >
                    {copiedCode ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleShareLink}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Share2 className="mr-2 h-4 w-4" />
                {t("groupBooking.shareLink")}
              </Button>
              
              <Button
                variant="outline"
                className="w-full border-orange-200 hover:bg-orange-50 dark:border-orange-900 dark:hover:bg-orange-950"
                onClick={() => {
                  toast({
                    title: t("groupBooking.inviteSent"),
                    description: t("groupBooking.inviteDescription"),
                  });
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {t("groupBooking.inviteFriend")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
