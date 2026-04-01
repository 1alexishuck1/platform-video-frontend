"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, Users, Settings, Send, MessageSquare, 
  ChevronRight, Loader2, X, Play, Zap, LogOut,
  ChevronDown, ExternalLink, Activity
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
  const [sidebarMode, setSidebarMode] = useState<"queue" | "chat" | "settings">("queue");
  
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

  // Poll queue & check live status
  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push("/login");
      return;
    }
    
    const isTalent = (user?.role || "").toLowerCase() === "talent";
    if (isAuthenticated && !isTalent) {
      router.push("/dashboard");
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
        <div className="flex-1 min-w-0 relative flex flex-col bg-black overflow-hidden group">
          <div className="flex-1 min-h-0 relative flex items-center justify-center p-2 sm:p-4">
            <AnimatePresence mode="wait">
              {activeBooking ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="w-full h-full relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-white/5">
                   {remoteStream ? (
                     <div className="w-full h-full relative group">
                        {timeLeft !== null && (
                          <div className={cn("absolute top-4 right-4 sm:top-6 sm:right-6 z-30 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl font-black text-xl sm:text-2xl font-mono border backdrop-blur-xl", timeLeft < 30 ? "bg-red-500 text-white border-red-400 animate-pulse" : "bg-black/60 text-white border-white/10")}>
                            {formatTime(timeLeft)}
                          </div>
                        )}
                        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 p-2 sm:p-2.5 glass-card border-white/10 rounded-2xl flex items-center gap-3">
                           <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center font-black text-xs sm:text-sm">{activeBooking.fan?.name?.slice(0, 2).toUpperCase()}</div>
                           <div className="pr-3">
                              <p className="text-[8px] sm:text-[9px] font-black uppercase text-white/40">Fan en línea</p>
                              <p className="text-sm sm:text-[15px] font-black text-white">{activeBooking.fan?.name}</p>
                           </div>
                        </div>
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                     </div>
                   ) : (
                    <div className="w-full h-full bg-[#0a0a0c] flex flex-col items-center justify-center gap-6 p-6">
                       <div className="relative">
                          <div className="absolute inset-0 bg-violet-600/30 rounded-full animate-ping" />
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-violet-500/30 overflow-hidden flex items-center justify-center bg-violet-900/40">
                             <span className="text-3xl sm:text-4xl font-black">{activeBooking.fan?.name?.slice(0, 2).toUpperCase()}</span>
                          </div>
                       </div>
                       <h2 className="text-xl sm:text-2xl font-black animate-pulse">Conectando...</h2>
                    </div>
                  )}
                </motion.div>
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
                <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 w-32 h-44 sm:w-40 sm:h-56 bg-black rounded-2xl border-2 border-white/10 overflow-hidden shadow-2xl z-20">
                   <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                </div>
            )}
          </div>

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

            {!activeBooking ? (
               <Button onClick={handleCallNext} disabled={queue.length === 0 || isCalling} className="flex-1 sm:flex-none h-14 sm:h-16 px-6 sm:px-10 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black text-base sm:text-xl gap-2 active:scale-95">
                 {isCalling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-white" />}
                 <span className="truncate">Siguiente</span>
               </Button>
            ) : (
                <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-violet-400 bg-violet-400/10 px-4 sm:px-8 py-3 rounded-2xl border border-violet-400/20 font-black uppercase text-[10px] sm:text-sm tracking-[0.2em] animate-pulse">
                   <Users className="w-4 h-4 sm:w-5 sm:h-5" /> EN CURSO
                </div>
             )}

            <div className="w-[1px] h-10 bg-white/10 mx-1 sm:mx-2" />

            <div className="flex items-center gap-2 sm:gap-3">
              <Button size="icon" variant="ghost" onClick={() => setSidebarMode("chat")} className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl", sidebarMode === "chat" ? "bg-violet-600 text-white shadow-lg" : "bg-white/5 text-white/60")}>
                 <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setSidebarMode("queue")} className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl lg:hidden", sidebarMode === "queue" ? "bg-violet-600 text-white shadow-lg" : "bg-white/5 text-white/60")}>
                 <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className={cn(
          "fixed inset-0 z-[100] bg-[#0a0a0c] lg:relative lg:inset-auto lg:w-80 lg:flex lg:border-l lg:border-white/5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden",
          sidebarMode === "queue" || sidebarMode === "chat" ? "flex" : "hidden lg:flex"
        )}>
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/60 shrink-0">
             <h3 className="text-sm font-black uppercase tracking-widest text-white/60">
                {sidebarMode === "queue" && "Cola de espera"}
                {sidebarMode === "chat" && "Chat en vivo"}
             </h3>
             <Button variant="ghost" size="icon" onClick={() => setSidebarMode("queue")} className="w-10 h-10 rounded-xl hover:bg-white/10 lg:hidden">
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
                          <Button size="sm" onClick={() => handleAtender(item.id)} className="w-full mt-4 bg-violet-600 hover:bg-violet-500 h-10 rounded-xl text-[11px] font-black active:scale-95">Llamar ahora</Button>
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
