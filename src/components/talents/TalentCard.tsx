"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TalentProfile } from "@/types";

interface TalentCardProps {
  talent: TalentProfile;
}

export function TalentCard({ talent }: TalentCardProps) {
  // Use sessionDurationMin if available (real API) or fallback to session_duration_sec (mock)
  const durationMinutes = talent.sessionDurationMin || Math.floor((talent.session_duration_sec || 0) / 60);
  const stageName = talent.stageName || talent.stage_name;
  const priceUsd = talent.priceUsd || talent.price_usd;
  const rawAvatar = talent.avatarUrl || talent.avatar_url;
  const [avatarUrl, setAvatarUrl] = useState(rawAvatar || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop");

  const handleError = () => {
    setAvatarUrl("https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop");
  };

  return (
    <Link href={`/talents/${talent.id}`} className="block group">
      <div className="glass card-hover rounded-2xl overflow-hidden h-full flex flex-col">
        {/* Avatar area */}
        <div className="relative h-48 bg-gradient-to-br from-violet-900/30 to-pink-900/20 flex items-center justify-center overflow-hidden">
          <img
            src={avatarUrl}
            alt={stageName}
            onError={handleError}
            className="w-32 h-32 rounded-full border-4 border-white/10 group-hover:scale-105 transition-transform duration-300 object-cover"
          />
          {/* Category badge */}
          {talent.category && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs">
                {talent.category}
              </Badge>
            </div>
          )}
          {/* Rating */}
          {talent.rating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 rounded-full px-2 py-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-semibold text-white">{talent.rating}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="font-bold text-lg text-white group-hover:text-violet-300 transition-colors">
              {stageName}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{talent.bio}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{durationMinutes} min</span>
            </div>
            {talent.total_sessions && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>{talent.total_sessions} sesiones</span>
              </div>
            )}
          </div>

          {/* Price + CTA */}
          <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
            <div>
              <span className="text-2xl font-bold gradient-text">${priceUsd}</span>
              <span className="text-xs text-muted-foreground ml-1">USD</span>
            </div>
            <div
              className={cn(buttonVariants({ size: "sm" }), "btn-gradient text-white border-0 text-xs inline-flex")}
            >
              Reservar
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
