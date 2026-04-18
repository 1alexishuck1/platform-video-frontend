"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, 
  MessageSquare, Settings, Users, Loader2, Send, X, AlertTriangle, CheckCircle2 
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useHydratedAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Toaster, toast } from "sonner";
import { UserAvatar } from "@/components/common/UserAvatar";
import { AnimatePresence, motion } from "framer-motion";

export default function VideoCallRoom() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Media State
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isEnded, setIsEnded] = useState(false);

  // UI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCam, setSelectedCam] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");

  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const callVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const peerRef = useRef<any>(null);

  const { user: authUser, isAuthenticated, isHydrated: authHydrated } = useHydratedAuth();

  useEffect(() => {
    if (authHydrated) {
      setIsHydrated(true);
      if (authUser) {
        setUser(authUser);
      } else {
        router.push("/login");
      }
    }
    
    // Load devices
    navigator.mediaDevices.enumerateDevices().then(d => {
      const videoDevices = d.filter(device => device.kind === 'videoinput');
      const audioDevices = d.filter(device => device.kind === 'audioinput');
      setDevices(d);
      if (videoDevices.length > 0) setSelectedCam(videoDevices[0].deviceId);
      if (audioDevices.length > 0) setSelectedMic(audioDevices[0].deviceId);
    });

    if (isAuthenticated) {
      loadBooking();
    }
  }, [id, router, authHydrated, authUser, isAuthenticated]);

  const loadBooking = async () => {
    try {
      console.log("Loading booking for ID:", id);
      const data = await apiFetch(`/bookings/${id}`);
      console.log("Booking data received:", data);
      if (data.booking) {
        setBooking(data.booking);
        const duration = data.booking.durationSec || 0;
        if (data.booking.status === "LIVE" || data.booking.status === "IN_PROGRESS") {
            const start = new Date(data.booking.startsAt).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - start) / 1000);
            setTimeLeft(Math.max(0, duration - elapsed));
        } else {
            setTimeLeft(duration);
        }
      } else {
        console.warn("No booking found in response");
        toast.error("Reserva no encontrada");
      }
    } catch (error) {
      console.error("Failed to load booking:", error);
      toast.error("Error al cargar la reserva");
    }
  };

  // Device switcher
  const changeDevice = async (type: 'video' | 'audio', deviceId: string) => {
    if (type === 'video') setSelectedCam(deviceId);
    else setSelectedMic(deviceId);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video' ? { deviceId } : (selectedCam ? { deviceId: selectedCam } : true),
        audio: type === 'audio' ? { deviceId } : (selectedMic ? { deviceId: selectedMic } : true)
      });

      // Update tracks in existing stream
      if (mediaStream) {
        if (type === 'video') {
            const oldTracks = mediaStream.getVideoTracks();
            oldTracks.forEach(t => t.stop());
            const newTrack = stream.getVideoTracks()[0];
            mediaStream.addTrack(newTrack);
            if (peerRef.current) {
                const senders = peerRef.current._pc.getSenders();
                const videoSender = senders.find((s: any) => s.track?.kind === 'video');
                if (videoSender) videoSender.replaceTrack(newTrack);
            }
        } else {
            const oldTracks = mediaStream.getAudioTracks();
            oldTracks.forEach(t => t.stop());
            const newTrack = stream.getAudioTracks()[0];
            mediaStream.addTrack(newTrack);
            if (peerRef.current) {
                const senders = peerRef.current._pc.getSenders();
                const audioSender = senders.find((s: any) => s.track?.kind === 'audio');
                if (audioSender) audioSender.replaceTrack(newTrack);
            }
        }
      }
      setMediaStream(stream);
      toast.success((type === 'video' ? 'Cámara' : 'Micrófono') + " actualizado");
    } catch (e) {
      toast.error("Error al cambiar dispositivo");
    }
  };

  const mediaStreamRef = useRef<MediaStream | null>(null);
  useEffect(() => { mediaStreamRef.current = mediaStream; }, [mediaStream]);

  useEffect(() => {
    if (!user || !id) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    const socket = io(socketUrl, {
      query: { bookingId: id, userId: user.id, role: "fan" }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnecting(false);
      socket.emit("join-room", { bookingId: id, userId: user.id });
    });

    socket.on("participant-count", (count: number) => setParticipantCount(count));
    socket.on("receive-message", (msg: any) => setMessages(prev => [...prev, msg]));
    socket.on("time-update", (seconds: number) => setTimeLeft(seconds));
    
    socket.on("your-turn", () => {
      loadBooking();
      toast.success("¡Es tu turno! La sesión ha comenzado.");
    });

    socket.on("booking-started", () => {
      loadBooking();
      toast.success("¡La sesión ha comenzado!");
    });

    socket.on("session-ended", () => {
       setIsEnded(true);
       if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    });

    // Client-side timer decrement
    const timerInterval = setInterval(() => {
        setTimeLeft(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);

    socket.on("user-joined", ({ from }: { from: string }) => {
      if (booking?.status === "LIVE") {
        console.log("Talent joined:", from);
      }
    });

    socket.on("call-made", async ({ signal, from }: { signal: any, from: string }) => {
      console.log("Received call-made from:", from);
      const module = await import("simple-peer");
      const Peer = (module as any).default || module;

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: mediaStreamRef.current || undefined
      });

      peer.on("signal", (data: any) => {
        socket.emit("answer-call", { signal: data, to: from });
      });

      peer.on("stream", (stream: MediaStream) => {
        setRemoteStream(stream);
      });

      peer.signal(signal);
      peerRef.current = peer;
    });

    socket.on("call-accepted", (signal: any) => {
      console.log("Call accepted, signaling peer...");
      peerRef.current?.signal(signal);
    });

    // WebRTC Signaling
    socket.on("signal", (data) => {
      if (peerRef.current) {
        peerRef.current.signal(data);
      }
    });

    return () => {
      socket.disconnect();
      clearInterval(timerInterval);
    };
  }, [user, id]);


  // Initial Camera Start
  useEffect(() => {
    if (booking?.status === "WAITING_IN_QUEUE" || (booking?.status === "LIVE" && !mediaStream)) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setMediaStream(stream);
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => toast.error("Error al acceder a la cámara"));
    }
  }, [booking?.status]);

  // Sync streams with refs
  useEffect(() => {
    const sync = () => {
      if (mediaStream) {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
        if (callVideoRef.current) callVideoRef.current.srcObject = mediaStream;
      }
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };
    sync();
    const t = setTimeout(sync, 200);
    return () => clearTimeout(t);
  }, [mediaStream, remoteStream, booking?.status, camOff]);

  // Mute/Unmute Toggles
  useEffect(() => {
    if (mediaStream) {
      mediaStream.getAudioTracks().forEach(t => t.enabled = !micMuted);
      mediaStream.getVideoTracks().forEach(t => t.enabled = !camOff);
    }
  }, [micMuted, camOff, mediaStream]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;
    
    socketRef.current.emit("send-message", {
      bookingId: id,
      message: newMessage,
      senderName: user?.name,
    });
    
    setNewMessage("");
  };

  const handleEndCall = () => {
    setShowEndConfirm(true);
  };

  const confirmEndCall = async () => {
    try {
      if (booking?.status === "IN_PROGRESS" || booking?.status === "LIVE") {
        await apiFetch(`/bookings/${id}/complete`, { method: "POST" });
      }
    } catch (err) {
      console.error("Error completing call from fan side:", err);
    }
    
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    setIsEnded(true);
  };

  if (!isHydrated || !booking || !user) {
     return (
       <div className="min-h-screen bg-black flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
       </div>
     );
  }

  if (isEnded) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <UserAvatar 
            src={booking.talent?.avatarUrl || booking.talent?.avatar_url}
            name={booking.talent?.stageName}
            size="2xl"
          />
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-[#050505] shadow-xl">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white uppercase mb-2">¡Llamada finalizada!</h2>
        <p className="text-white/40 mb-8">Gracias por participar en esta experiencia con {booking.talent?.stageName}</p>
        <Button onClick={() => router.push("/dashboard")} className="bg-white text-black hover:bg-white/90 rounded-2xl px-8 h-12 font-bold">Volver al inicio</Button>
      </div>
    );
  }

  const seconds = timeLeft || 0;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const timeString = min + ":" + sec.toString().padStart(2, "0");
  const isUrgent = seconds < 30;

  return (
    <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden">
      <Toaster position="top-center" expand={true} richColors />
      
      {/* Top Bar Overlay */}
      <div className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
             <div className={"w-3 h-3 rounded-full animate-pulse " + (isConnecting ? "bg-yellow-500" : (participantCount === 2 ? "bg-green-500" : "bg-red-500"))} />
             <span className="text-xs font-black uppercase tracking-widest text-white/40">
               {isConnecting ? "Conectando" : (participantCount === 2 ? "Live" : "Solo tú")}
             </span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <h1 className="font-bold text-sm hidden md:block text-white/70">Sesión con {booking.talent?.stageName}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-3">
            <div className={"text-xs font-mono font-bold " + (isUrgent ? "text-red-400" : "text-white")}>
               {timeString}
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
               <Users className="w-3.5 h-3.5" />
               <span>{participantCount}/2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* MAIN WORK AREA */}
        <div className="flex-1 flex flex-col bg-[#050505] relative overflow-hidden">
          
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="wait">
              {booking.status === "WAITING_IN_QUEUE" ? (
                <motion.div 
                  key="queue"
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#050505]"
                >
                    <div className="max-w-xl w-full space-y-12 text-center">
                      <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                           <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Sala de espera</span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                           Estás en <br/> la cola
                        </h2>
                      </div>
                      
                      <div className="relative aspect-square w-full max-w-[320px] sm:max-w-[480px] mx-auto rounded-[3.5rem] border-4 border-white/10 overflow-hidden shadow-2xl bg-black">
                         <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                         <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/5">Vista previa</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] font-black uppercase text-white/30 mb-1">Tu lugar</p>
                            <p className="text-3xl font-black text-white">#{booking.queuePosition || "1"}</p>
                         </div>
                         <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                            <p className="text-[10px] font-black uppercase text-white/30 mb-1">Tiempo</p>
                            <p className="text-3xl font-black text-white">{Math.floor(booking.durationSec / 60)}<span className="text-sm opacity-40 ml-1">min</span></p>
                         </div>
                      </div>
                    </div>
                </motion.div>
              ) : (
                 <div key="call" className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 bg-black overflow-hidden pointer-events-auto">
                   {/* LOCAL (FAN) */}
                   <div className="relative bg-[#0a0a0c] border-b md:border-b-0 md:border-r border-white/5 overflow-hidden">
                      <div className="absolute top-6 left-6 z-30">
                         <div className="glass-card px-4 py-2 rounded-2xl border-white/5 bg-black/40 backdrop-blur-md">
                            <span className="text-[11px] font-black uppercase text-white/50 tracking-widest">Tú (Fan)</span>
                         </div>
                      </div>
                      <video ref={callVideoRef} autoPlay muted playsInline className={cn("w-full h-full object-cover scale-x-[-1]", camOff && "hidden")} />
                      {camOff && (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950">
                          <VideoOff className="w-10 h-10 text-white/10 mb-2" />
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Cámara apagada</p>
                        </div>
                      )}
                   </div>

                   {/* REMOTE (TALENT) */}
                   <div className="relative bg-[#0a0a0c] overflow-hidden">
                      <div className="absolute top-6 left-6 z-30">
                         <div className="glass-card px-4 py-2 rounded-2xl flex items-center gap-3 border-white/5 bg-black/40 backdrop-blur-md">
                            <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[11px] font-black uppercase text-white/90 tracking-widest">{booking.talent?.stageName}</span>
                         </div>
                      </div>
                      <video ref={remoteVideoRef} autoPlay playsInline className={cn("w-full h-full object-cover", !remoteStream && "hidden")} />
                      {!remoteStream && (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-gray-950">
                           <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                           <p className="text-[11px] font-black uppercase text-white/20 tracking-[0.2em] text-center">Conectando con<br/>{booking.talent?.stageName}</p>
                        </div>
                      )}
                   </div>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* SIDE PANELS */}
        {(isChatOpen || isSettingsOpen) && (
          <div className="fixed inset-0 z-[100] bg-[#0a0a0c]/98 backdrop-blur-3xl lg:relative lg:inset-auto lg:w-[400px] h-full flex flex-col border-l border-white/5 shadow-2xl transition-all duration-300">
            {isChatOpen && (
              <>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Chat</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}><X className="w-5 h-5" /></Button>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((m: any, i: number) => (
                    <div key={i} className={cn("flex flex-col animate-in fade-in slide-in-from-bottom-2", m.sender === user?.name ? "items-end" : "items-start")}>
                      <div className={cn("max-w-[85%] p-4 rounded-2xl text-sm shadow-xl", m.sender === user?.name ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white/10 text-white rounded-tl-none border border-white/5")}>
                        {m.sender !== user?.name && <p className="text-[9px] font-black uppercase text-indigo-400 mb-1">{m.sender}</p>}
                        <p>{m.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="p-6 flex gap-2">
                  <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Mensaje..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-indigo-500 transition-colors" />
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 transition-colors"><Send className="w-4 h-4" /></Button>
                </form>
              </>
            )}
            {isSettingsOpen && (
              <>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-white/40">Configuración</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(false)}><X className="w-5 h-5" /></Button>
                </div>
                <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Cámara</label>
                      <div className="grid gap-2">
                        {devices.filter(d => d.kind === 'videoinput').map(d => (
                          <button key={d.deviceId} onClick={() => changeDevice('video', d.deviceId)} className={cn("w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center justify-between", selectedCam === d.deviceId ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10")}>
                            <span className="truncate flex-1">{d.label || "Cámara"}</span>
                            {selectedCam === d.deviceId && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 ml-3" />}
                          </button>
                        ))}
                      </div>
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Micrófono</label>
                      <div className="grid gap-2">
                        {devices.filter(d => d.kind === 'audioinput').map(d => (
                          <button key={d.deviceId} onClick={() => changeDevice('audio', d.deviceId)} className={cn("w-full text-left p-4 rounded-2xl border text-sm transition-all flex items-center justify-between", selectedMic === d.deviceId ? "bg-indigo-600/20 border-indigo-500 text-white shadow-lg" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10")}>
                            <span className="truncate flex-1">{d.label || "Micrófono"}</span>
                            {selectedMic === d.deviceId && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 ml-3" />}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* CONTROLS BAR - NOW DIRECT CHILD TO REMAIN CENTERED REGARDLESS OF SIDEBAR */}
      <div className="h-24 sm:h-28 flex items-center justify-center gap-4 sm:gap-6 px-6 bg-[#08080a] border-t border-white/5 shrink-0 z-[110] relative">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setMicMuted(!micMuted)} className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all", micMuted ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/5 text-white/60 hover:bg-white/10")}>
            {micMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setCamOff(!camOff)} className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all", camOff ? "bg-red-500/20 text-red-500 border border-red-500/30" : "bg-white/5 text-white/60 hover:bg-white/10")}>
            {camOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
        </div>
        
        <div className="w-[1px] h-10 bg-white/10 mx-1 sm:mx-2" />

        <button onClick={handleEndCall} className="px-8 h-14 sm:h-16 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-600/20 flex items-center justify-center gap-3 transition-all active:scale-95 group">
          <PhoneOff className="w-5 h-5 group-hover:rotate-12 transition-transform" /><span className="font-black text-sm uppercase tracking-widest hidden sm:inline">Finalizar</span>
        </button>

        <div className="w-[1px] h-10 bg-white/10 mx-1 sm:mx-2" />

        <div className="flex items-center gap-3">
          <Button 
            size="icon" 
            variant="ghost" 
            disabled={booking.status === "WAITING_IN_QUEUE"}
            onClick={() => { setIsChatOpen(!isChatOpen); setIsSettingsOpen(false); }} 
            className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all relative", isChatOpen ? "bg-indigo-600 text-white" : "bg-white/5 text-white/60")}
          >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
              {messages.length > 0 && !isChatOpen && <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-[#08080a]">!</div>}
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsChatOpen(false); }} 
            className={cn("w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all", isSettingsOpen ? "bg-white text-black" : "bg-white/5 text-white/60")}
          >
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showEndConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm shadow-2xl"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f0f12] border border-white/10 rounded-[2.5rem] p-10 max-w-md w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4 italic">¿Terminar llamada?</h3>
              <p className="text-white/60 mb-8 leading-relaxed text-sm">
                Si finalizas ahora, perderás los minutos restantes. <br/>
                <span className="text-red-400 font-bold uppercase text-xs">No se realizarán reintegros</span> por sesiones terminadas antes de tiempo.
              </p>
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={confirmEndCall}
                  className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 active:scale-95 transition-all"
                >
                  Sí, finalizar y salir
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowEndConfirm(false)}
                  className="w-full h-14 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 font-bold text-sm"
                >
                  Continuar llamada
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}