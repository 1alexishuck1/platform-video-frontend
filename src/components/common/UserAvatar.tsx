"use client";

import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  isLive?: boolean;
}

export function UserAvatar({ src, name, className, size = "md", isLive }: UserAvatarProps) {
  // Use a professional placeholder service if no image is provided
  // ui-avatars is great because it uses the name initials
  const initials = name ? encodeURIComponent(name) : "U";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${initials}&background=4f46e5&color=fff&bold=true`;
  
  const finalSrc = src || defaultAvatar;

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
    "2xl": "w-32 h-32",
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <div className={cn(
        "rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-inner flex items-center justify-center",
        sizeClasses[size]
      )}>
        <img
          src={finalSrc}
          alt={name || "User"}
          className="w-full h-full object-cover transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultAvatar;
          }}
        />
      </div>

      {isLive && (
        <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-xl uppercase border-2 border-[#050505] z-10 animate-pulse">
          LIVE
        </div>
      )}
    </div>
  );
}
