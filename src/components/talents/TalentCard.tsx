"use client";

import { useState, useRef, MouseEvent } from "react";
import Link from "next/link";
import { Star, Clock, Zap, CheckCircle2, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TalentProfile } from "@/types";
import { UserAvatar } from "@/components/common/UserAvatar";

interface TalentCardProps {
  talent: TalentProfile;
}

export function TalentCard({ talent }: TalentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const durationMinutes = talent.sessionDurationMin || Math.floor((talent.session_duration_sec || 0) / 60);
  const stageName = talent.stageName || talent.stage_name;
  const priceUsd = talent.priceUsd || talent.price_usd;
  const avatarUrl = talent.avatarUrl || talent.avatar_url;

  const handleMouseMove = (e: MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <Link 
      href={`/talents/${talent.id}`} 
      className="block group"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        ref={cardRef}
        className="glass rounded-[1.5rem] overflow-hidden h-full flex flex-col relative border border-white/5 transition-all duration-500 group-hover:border-violet-500/30 group-hover:shadow-[0_0_40px_rgba(139,92,246,0.1)]"
      >
        {/* Shiny border spotlight effect */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.12), transparent 40%)`,
          }}
        />

        {/* Avatar & Header Area */}
        <div className="relative h-36 sm:h-40 bg-gradient-to-b from-[#0a0a0c] to-[#050505] flex items-center justify-center overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(139,92,246,0.15),transparent_70%)]" />
          
          {/* Main Avatar */}
          <div className="relative z-20 group-hover:scale-110 transition-transform duration-700 ease-out">
            <div className="absolute inset-0 bg-violet-600/20 rounded-full blur-2xl group-hover:bg-violet-600/40 transition-all duration-700" />
            <UserAvatar 
              src={avatarUrl}
              name={stageName}
              size="xl"
              className="relative z-20 shadow-2xl"
            />
          </div>

          {/* Overlays */}
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5">
            {talent.category && (
              <Badge className="bg-white/5 text-white/70 border border-white/10 text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full backdrop-blur-md">
                {talent.category}
              </Badge>
            )}
            {talent.isLive && (
              <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg animate-pulse w-fit">
                <div className="w-1 h-1 bg-white rounded-full" />
                Live
              </div>
            )}
          </div>

          <div className="absolute top-3 right-3 z-30">
            <div className="glass-card border-white/10 px-2.5 py-1 rounded-xl flex items-center gap-1 backdrop-blur-xl">
               <Wallet className="w-3 h-3 text-violet-400" />
               <span className="text-xs font-black text-white">{priceUsd.toLocaleString("es-AR")}</span>
            </div>
          </div>

          {talent.rating && (
            <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1 bg-black/60 rounded-xl px-2 py-1 backdrop-blur-md border border-white/5">
              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
              <span className="text-[10px] font-black text-white">{talent.rating}</span>
            </div>
          )}
        </div>

        {/* Info Area */}
        <div className="p-4 flex flex-col flex-1 gap-2 relative z-20">
          <div>
            <h3 className="text-base font-black text-white group-hover:text-violet-400 transition-colors flex items-center gap-1.5 tracking-tight">
              {stageName}
              {talent.isVerified && (
                <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400/10" />
              )}
            </h3>
            <p className="text-xs text-white/50 mt-1 line-clamp-2 leading-relaxed font-medium">
              {talent.bio || "Sumate a una sesión exclusiva y charlemos en vivo."}
            </p>
          </div>

          <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/30">
              <div className="flex items-center gap-1 group-hover:text-violet-400 transition-colors">
                <Clock className="w-3 h-3" />
                <span>{durationMinutes} Min</span>
              </div>
              <div className="w-1 h-1 bg-white/10 rounded-full" />
              <div className="flex items-center gap-1 group-hover:text-violet-400 transition-colors">
                <Zap className="w-3 h-3" />
                <span>{talent.total_sessions || 0} Vivos</span>
              </div>
            </div>
            
            <div className="text-violet-400 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 hidden sm:block">
               <Clock className="w-4 h-4 rotate-[-45deg]" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
