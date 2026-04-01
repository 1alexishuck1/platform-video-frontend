"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, Users, Settings, Send, MessageSquare, 
  ChevronRight, Loader2, X, Play, Zap, LogOut,
  ChevronDown, ExternalLink, Activity, LayoutGrid, Maximize2, User, UserPlus
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

import { useHydratedAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";

export default function TalentLiveStudio() {
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useHydratedAuth();

  // Local Media
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  
  // Modal/Drawer states
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [sidebarMode, setSidebarMode] = useState<"queue" | "chat" | "settings" | null>(null);
  const [layoutMode, setLayoutMode] = useState<"pip" | "grid">("pip");
  const [pinnedParticipant, setPinnedParticipant] = useState<"local" | "remote">("remote");
  
  // Set default sidebar on desktop
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setSidebarMode("queue");
    }
  }, []);
  
  // Queue & Active Booking
  const [queue, setQueue] = useState<any[]>([]);
  const [activeBooking, setActiveBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  
  // Chat
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // RTC
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<any>(null);
  const videoContainerRef = useRef(null);

  // Sounds
  const playSound = (type: 'joined' | 'queue') => {
    const sounds = {
      joined: 'https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3',
      queue: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-back-light-2516.mp3'
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Browsers may block auto-play without user interaction
      console.log("Audio play blocked or failed");
    });
  };

  // Permanent Studio Socket (for queue updates and notifications)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    const studioSocket = io(socketUrl);
    
    studioSocket.on("connect", () => {
      studioSocket.emit("join-talent-updates", user.id);
    });

    studioSocket.on("new-booking", (booking) => {
      playSound('queue');
      toast.success(`¡Nueva persona en cola: ${booking.fan?.name || 'Alguien'}!`, {
        description: "Se ha agregado una nueva reserva a tu lista de espera."
      });
      // Smart update queue to avoid waiting for next poll
      setQueue(prev => {
        if (prev.find(b => b.id === booking.id)) return prev;
        return [...prev, booking];
      });
    });

    return () => {
      studioSocket.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // Poll queue & check live status
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const init = async () => {
      try {
        const dashData = await apiFetch("/talents/me/dashboard");
        if (!dashData.isLive) {
           router.push("/talent/dashboard");
           return;
        }
        setQueue(dashData.queue || []);
        if (dashData.activeSession) setEarnings(dashData.activeSession.totalRevenue || 0);
        setIsLoading(false);
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setMediaStream(stream);
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) {
          console.warn("Could not get media stream:", e);
          setIsLoading(false);
        }
        
      } catch (err) {
        console.error("Studio init error:", err);
        toast.error("Error al acceder al estudio.");
        setIsLoading(false);
      }
    };

    if (isAuthenticated) init();
    
    const poll = setInterval(async () => {
      if (isAuthenticated) {
        try {
          const dashData = await apiFetch("/talents/me/dashboard");
          setQueue(dashData.queue || []);
          if (dashData.activeSession) {
            setEarnings(dashData.activeSession.totalRevenue || 0);
          }
        } catch (e) {}
      }
    }, 10000);

    return () => {
      clearInterval(poll);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
      }
    };
  }, [isAuthenticated, isHydrated, router, user]);

  // Sync state with media tracks
  useEffect(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach(t => t.enabled = !camOff);
      mediaStream.getAudioTracks().forEach(t => t.enabled = !micMuted);
    }
  }, [mediaStream, camOff, micMuted]);

  // Re-attach srcObject when video element mounts/re-mounts
  useEffect(() => {
    if (mediaStream && videoRef.current && !camOff) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, camOff, activeBooking]);

  // Handle Socket for current active booking
  useEffect(() => {
    if (!activeBooking || !mediaStream) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    const socket = io(socketUrl);
    socketRef.current = socket;

    const initPeer = async () => {
      const module = await import("simple-peer");
      const Peer = (module as any).default || module;

      socket.emit("join-room", activeBooking.id);

      socket.on("user-joined", ({ from }) => {
        playSound('joined');
        toast.info("¡El fan se ha unido!", { description: "La sesión de video está lista para comenzar." });
        const peer = new Peer({
          initiator: true, trickle: false, stream: mediaStream
        });
        peer.on("signal", (data: any) => {
          socket.emit("call-user", { userToCall: from, signalData: data, from: socket.id });
        });
        peer.on("stream", (stream: MediaStream) => {
          setRemoteStream(stream);
        });
        peerRef.current = peer;
      });

      socket.on("call-made", ({ signal, from }) => {
        const peer = new Peer({
          initiator: false, trickle: false, stream: mediaStream
        });
        peer.on("signal", (data: any) => socket.emit("answer-call", { signal: data, to: from }));
        peer.on("stream", (stream: MediaStream) => {
          setRemoteStream(stream);
        });
        peer.signal(signal);
        peerRef.current = peer;
      });

      socket.on("user-left", () => {
        setRemoteStream(null);
        if (peerRef.current) peerRef.current.destroy();
      });

      socket.on("receive-message", (msg: any) => {
        setMessages(prev => [...prev, msg]);
      });
    };

    initPeer();
    return () => {
      socket.disconnect();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [activeBooking, mediaStream]);

  // Sync remote stream with video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Timer logic
  useEffect(() => {
    if (!activeBooking) {
      setTimeLeft(null);
      return;
    }
    
    if (timeLeft === null) {
      const start = new Date(activeBooking.startsAt).getTime();
      const duration = activeBooking.durationSec; 
      const now = Date.now();
      const diff = Math.floor((start + duration * 1000 - now) / 1000);
      setTimeLeft(Math.max(0, diff));
      return;
    }

    if (timeLeft <= 0) {
      handleEndCurrentCall();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBooking, timeLeft]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !activeBooking) return;

    socketRef.current.emit("send-message", {
      bookingId: activeBooking.id,
      message: newMessage,
      senderName: user?.name || "Talento"
    });
    setNewMessage("");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCallNext = async () => {
    if (queue.length === 0) {
      toast.info("No hay personas en espera.");
      return;
    }
    await handleAtender(queue[0].id);
  };

  const handleAtender = async (bookingId: string) => {
    setIsCalling(true);
    try {
      const res = await apiFetch(`/bookings/${bookingId}/start`, { method: "POST" });
      setActiveBooking(res.booking);
      setSidebarMode("chat");
    } catch (err) {
      toast.error("Error al iniciar sesión.");
    } finally {
      setIsCalling(false);
    }
  };

  const handleEndCurrentCall = async () => {
    if (!activeBooking) return;
    try {
      await apiFetch(`/bookings/${activeBooking.id}/complete`, { method: "POST" });
      setActiveBooking(null);
      setRemoteStream(null);
      setMessages([]);
      setSidebarMode("queue");
      
      const dashData = await apiFetch("/talents/me/dashboard");
      setQueue(dashData.queue || []);
      if (dashData.activeSession) setEarnings(dashData.activeSession.totalRevenue || 0);
    } catch (e) {}
  };

  const handleStopLive = () => setShowStopConfirm(true);

  const confirmStopLive = async () => {
    setIsStopping(true);
    try {
      await apiFetch("/talents/me/toggle-live", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: false }) 
      });
      router.push("/talent/dashboard");
    } catch (e) {
      toast.error("Error al finalizar el vivo.");
    } finally {
      setIsStopping(false);
      setShowStopConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white font-black text-2xl uppercase">
        <Activity className="w-12 h-12 mb-4 text-violet-500 animate-pulse" />
        Entrando al estudio...
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
             <span className="text-xs font-black uppercase tracking-widest text-red-500">EN VIVO</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <h1 className="font-bold text-sm hidden md:block">Estudio de {user?.name}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
               <Users className="w-3.5 h-3.5" />
               <span>{queue.length}</span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-green-400">
               <Zap className="w-3.5 h-3.5" />
               <span>${earnings.toFixed(2)}</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleStopLive} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full font-bold px-4 h-9">
            Finalizar vivo
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* VIDEO SECTION */}
        <div ref={videoContainerRef} className="flex-1 min-w-0 relative flex flex-col bg-black overflow-hidden group">
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-2 sm:p-4">
            <AnimatePresence mode="wait">
              {activeBooking ? (
                <div className={cn(
                  "w-full h-full relative transition-all duration-700",
                  layoutMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4 p-2 sm:p-4" : "block"
                )}>
                   {/* REMOTE VIDEO CONTAINER */}
                   <motion.div 
                     layout
                     className={cn(
                       "relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500",
                       layoutMode === "grid" 
                         ? "w-full h-full" 
                         : pinnedParticipant === "remote" ? "w-full h-full" : "absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-24 h-32 sm:w-40 sm:h-56 z-20 cursor-move"
                     )}
                     onClick={() => layoutMode === "pip" && pinnedParticipant === "local" && setPinnedParticipant("remote")}
                   >
                      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                         <div className="glass-card px-3 py-1.5 rounded-xl flex items-center gap-2 border-white/5">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase text-white/60 truncate max-w-[100px]">{activeBooking.fan?.name}</span>
                         </div>
                         <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setPinnedParticipant("remote"); }} className={cn("w-8 h-8 rounded-lg", pinnedParticipant === "remote" ? "bg-violet-600 text-white" : "bg-black/40 text-white/40")}>
                           <Maximize2 className="w-4 h-4" />
                         </Button>
                      </div>
                      {remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#0a0a0c] flex items-center justify-center">
                           <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                        </div>
                      )}
                   </motion.div>

                   {/* LOCAL VIDEO CONTAINER */}
                   <motion.div 
                     layout
                     drag={layoutMode === "pip"}
                     dragConstraints={videoContainerRef}
                     dragElastic={0.1}
                     dragMomentum={false}
                     className={cn(
                       "relative rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl transition-all duration-500",
                       layoutMode === "grid" 
                         ? "w-full h-full" 
                         : pinnedParticipant === "local" ? "w-full h-full" : "absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-24 h-32 sm:w-40 sm:h-56 z-20 cursor-move"
                     )}
                     onClick={() => layoutMode === "pip" && pinnedParticipant === "remote" && setPinnedParticipant("local")}
                   >
                      <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
                         <div className="glass-card px-3 py-1.5 rounded-xl border-white/5">
                            <span className="text-[10px] font-black uppercase text-white/40">Tú (Pro)</span>
                         </div>
                         <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setPinnedParticipant("local"); }} className={cn("w-8 h-8 rounded-lg", pinnedParticipant === "local" ? "bg-violet-600 text-white" : "bg-black/40 text-white/40")}>
                           <Maximize2 className="w-4 h-4" />
                         </Button>
                      </div>
                      <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                   </motion.div>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative flex items-center justify-center overflow-hidden">
                  {camOff ? (
                    <div className="text-center p-12">
                       <VideoOff className="w-16 h-16 sm:w-20 sm:h-20 mb-8 text-white/10 mx-auto" />
                       <h2 className="text-2xl sm:text-3xl font-black text-white/50 uppercase tracking-tighter">Estudio en espera</h2>
                    </div>
                  ) : (
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {activeBooking && (
                <motion.div 
                   drag 
                   dragConstraints={videoContainerRef}
                   dragElastic={0.1}
                   dragMomentum={false}
                   whileDrag={{ scale: 1.05, opacity: 0.9 }}
                   className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-24 h-32 sm:w-40 sm:h-56 bg-black rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl z-20 cursor-move touch-none"
                >
                   <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                </motion.div>
            )}
          </div>

          {/* Mini-Queue for Mobile (Horizontal List) */}
          {!activeBooking && queue.length > 0 && (
            <div className="absolute bottom-28 left-0 right-0 px-6 lg:hidden z-40 animate-in slide-in-from-bottom duration-700">
               <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Próximos en cola</span>
                  <span className="text-[10px] font-bold text-violet-400">{queue.length} personas</span>
               </div>
               <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
                  {queue.map((item, i) => (
                    <div key={item.id} className="relative shrink-0">
                       <img src={item.fan?.avatarUrl} className="w-12 h-12 rounded-xl object-cover border border-white/10" alt="" />
                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-violet-600 rounded-full flex items-center justify-center text-[8px] font-black border border-black shadow-lg">#{i+1}</div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {/* Controls */}
          <div className="h-24 sm:h-28 flex items-center justify-center gap-3 sm:gap-6 px-4 bg-[#08080a] border-t border-white/5 shrink-0 z-50">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button size="icon" variant="ghost" onClick={() => setMicMuted(!micMuted)} className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all", micMuted ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10")}>
                {micMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setCamOff(!camOff)} className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all", camOff ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10")}>
                {camOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
              </Button>
            </div>
            
            <div className="w-[1px] h-10 bg-white/10 mx-1 sm:mx-2" />

            <div className="hidden md:flex items-center gap-2">
               <Button 
                 size="icon" 
                 variant="ghost" 
                 onClick={() => setLayoutMode("pip")} 
                 className={cn("w-12 h-12 rounded-2xl transition-all", layoutMode === "pip" ? "bg-violet-600 text-white" : "bg-white/5 text-white/40")}
               >
                 <Maximize2 className="w-5 h-5" />
               </Button>
               <Button 
                 size="icon" 
                 variant="ghost" 
                 onClick={() => setLayoutMode("grid")} 
                 className={cn("w-12 h-12 rounded-2xl transition-all", layoutMode === "grid" ? "bg-violet-600 text-white" : "bg-white/5 text-white/40")}
               >
                 <LayoutGrid className="w-5 h-5" />
               </Button>
            </div>

            <div className="hidden md:block w-[1px] h-10 bg-white/10 mx-2" />

            {!activeBooking ? (
               <Button 
                 onClick={handleCallNext} 
                 disabled={queue.length === 0 || isCalling} 
                 className="w-14 h-14 sm:w-auto sm:h-16 px-0 sm:px-10 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-base sm:text-xl gap-2 active:scale-95 shadow-lg shadow-violet-600/20"
               >
                 {isCalling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
                 <span className="hidden sm:inline">Siguiente</span>
               </Button>
            ) : (
                <div className="flex items-center justify-center gap-2 text-violet-400 bg-violet-400/10 px-4 sm:px-8 py-3 rounded-2xl border border-violet-400/20 font-black uppercase text-[10px] sm:text-sm tracking-[0.2em] animate-pulse">
                   <Users className="w-4 h-4 sm:w-5 sm:h-5" /> EN CURSO
                </div>
             )}

            <div className="w-[1px] h-10 bg-white/10 mx-1 sm:mx-2" />

            <div className="flex items-center gap-2 sm:gap-3">
              <Button size="icon" variant="ghost" onClick={() => setSidebarMode(prev => prev === "chat" ? null : "chat")} className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all", sidebarMode === "chat" ? "bg-violet-600 text-white shadow-lg scale-110" : "bg-white/5 text-white/60")}>
                 <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setSidebarMode(prev => prev === "queue" ? null : "queue")} className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl lg:hidden transition-all", sidebarMode === "queue" ? "bg-violet-600 text-white shadow-lg scale-110" : "bg-white/5 text-white/60")}>
                 <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className={cn(
          "fixed inset-0 z-[100] bg-[#0a0a0c]/95 backdrop-blur-3xl lg:relative lg:inset-auto lg:w-96 lg:flex lg:border-l lg:border-white/5 flex flex-col shadow-2xl transition-all duration-500 ease-in-out overflow-hidden",
          sidebarMode ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto",
          !sidebarMode && "hidden lg:flex"
        )}>
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/60 shrink-0">
             <h3 className="text-sm font-black uppercase tracking-widest text-white/60">
                {sidebarMode === "queue" && "Cola de espera"}
                {sidebarMode === "chat" && "Chat en vivo"}
             </h3>
             <Button variant="ghost" size="icon" onClick={() => setSidebarMode(null)} className="w-10 h-10 rounded-xl hover:bg-white/10 lg:hidden">
                <X className="w-6 h-6 text-white/50" />
             </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto bg-[#0a0a0c]">
             {sidebarMode === "queue" && (
                <div className="p-6 sm:p-4 space-y-4">
                  {queue.length === 0 ? (
                    <div className="h-60 flex flex-col items-center justify-center text-center opacity-20">
                       <Users className="w-16 h-16 mb-4" />
                       <p className="text-sm font-black">Cola vacía</p>
                    </div>
                  ) : (
                    queue.map((item, i) => (
                      <div key={item.id} className={cn("p-4 rounded-2xl border transition-all", item.id === activeBooking?.id ? "bg-violet-600/20 border-violet-500 shadow-lg" : "bg-white/5 border-white/10 hover:bg-white/10")}>
                        <div className="flex items-center gap-3">
                           <div className="relative shrink-0">
                              <img src={item.fan?.avatarUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center text-[8px] font-black border border-white/20">#{i+1}</div>
                           </div>
                           <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-black truncate">{item.fan?.name}</p>
                              <p className="text-[10px] font-bold text-violet-400">{Math.floor(item.durationSec/60)} min</p>
                           </div>
                        </div>
                        {!activeBooking && i === 0 && (
                          <Button 
                            size="sm" 
                            onClick={() => handleAtender(item.id)} 
                            disabled={isCalling}
                            className="w-full mt-4 bg-violet-600 hover:bg-violet-500 h-10 rounded-xl text-[11px] font-black active:scale-95"
                          >
                            {isCalling ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                            Llamar ahora
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
             )}

             {sidebarMode === "chat" && (
                <div className="h-full flex flex-col p-6 pb-safe">
                  {activeBooking ? (
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                      <div ref={scrollRef} className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
                         {messages.map((msg, i) => (
                           <div key={i} className={cn("flex flex-col", msg.sender === user?.name ? "items-end" : "items-start")}>
                             <div className={cn("p-4 rounded-2xl max-w-[85%] text-sm shadow-lg", msg.sender === user?.name ? "bg-violet-600 text-white rounded-tr-none" : "bg-white/10 text-white/90 rounded-tl-none border border-white/5")}>
                               {msg.sender !== user?.name && <p className="text-[9px] font-black uppercase text-violet-400 mb-1">{msg.sender}</p>}
                               <p>{msg.text}</p>
                             </div>
                           </div>
                         ))}
                      </div>
                      <form onSubmit={handleSendMessage} className="relative group shrink-0 mt-4">
                         <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribí..." className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-6 pr-16 text-base sm:text-sm focus:border-violet-500 shadow-2xl" />
                         <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-violet-600 rounded-xl flex items-center justify-center active:scale-95"><Send className="w-5 h-5 text-white" /></button>
                      </form>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                      <MessageSquare className="w-16 h-16 mb-4" />
                      <p className="text-sm font-black uppercase">Chat inactivo</p>
                    </div>
                  )}
                </div>
             )}
          </div>
          <div className="p-6 bg-black/40 border-t border-white/5 shrink-0 hidden lg:block">
            <div className="flex items-center justify-between text-xs font-bold">
               <span className="text-white/40 uppercase">Siguiente:</span>
               <span className="text-white truncate max-w-[140px] px-1">{queue[0]?.fan?.name || "Nadie"}</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <DialogContent className="glass border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Finalizar vivo</DialogTitle>
            <DialogDescription>¿Estás seguro? Se vaciará tu cola de espera.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex-row gap-3">
            <Button variant="ghost" onClick={() => setShowStopConfirm(false)} className="flex-1 font-bold">Cancelar</Button>
            <Button onClick={confirmStopLive} disabled={isStopping} className="flex-1 bg-red-600 hover:bg-red-500 font-bold">{isStopping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finalizar vivo"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
