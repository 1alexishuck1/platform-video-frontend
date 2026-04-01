"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, Users, Settings, Send, MessageSquare, 
  ChevronRight, Loader2, X 
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";
import { toast } from "sonner";

import { useHydratedAuth } from "@/store/auth";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function VideoCallRoom() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isHydrated } = useHydratedAuth();

  const [booking, setBooking] = useState<any>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  
  // Chat state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCam, setSelectedCam] = useState<string>("");
  const [selectedMic, setSelectedMic] = useState<string>("");
  const socketRef = useRef<Socket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.push("/login");

    const loadBooking = async () => {
      try {
        const data = await apiFetch(`/bookings/${id}`);
        const status = data.booking.status;
        setBooking(data.booking);
        
        if (status === "COMPLETED" || status === "CANCELLED") {
          handleEndCall();
          return;
        }

        // Calculate real time left (startsAt + duration - now)
        const start = new Date(data.booking.startsAt).getTime();
        const durationSec = data.booking.durationSec;
        const endTime = start + durationSec * 1000;
        const now = Date.now();
        const diff = Math.floor((endTime - now) / 1000);
        
        // Only auto-end if session is in progress and time spent is beyond duration
        if (status === "IN_PROGRESS" && diff <= 0) {
          handleEndCall();
          return;
        }

        setTimeLeft(status === "IN_PROGRESS" ? Math.max(0, diff) : durationSec);
        setIsConnecting(false);
        
        // Find if there are multiple cameras to simulate a "real call" on 1 machine
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const cams = allDevices.filter(d => d.kind === 'videoinput');
        setDevices(allDevices);

        if (cams.length >= 1) {
          requestMediaPermissions(cams[0].deviceId, undefined, true); 
        } else {
          requestMediaPermissions();
        }
      } catch (err) {
        console.error(err);
        router.push("/dashboard");
      }
    };

    const requestMediaPermissions = async (camId?: string, micId?: string, isLocal = true) => {
      try {
        const constraints = {
          video: camId ? { deviceId: { exact: camId } } : true,
          audio: micId ? { deviceId: { exact: micId } } : true
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (isLocal) {
          if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
          setMediaStream(stream);
        } else {
          if (remoteStream) remoteStream.getTracks().forEach(t => t.stop());
          setRemoteStream(stream);
        }

        // Pre-select current if not set and is local
        if (isLocal && (!selectedCam || !selectedMic)) {
          const videoTrack = stream.getVideoTracks()[0];
          const audioTrack = stream.getAudioTracks()[0];
          if (videoTrack) setSelectedCam(videoTrack.getSettings().deviceId || "");
          if (audioTrack) setSelectedMic(audioTrack.getSettings().deviceId || "");
        }

      } catch (err) {
        console.error("Error accessing media devices", err);
      }
    };

    if (isAuthenticated) loadBooking();
  }, [id, isAuthenticated, isHydrated, router]);

  const [participantCount, setParticipantCount] = useState(1);
  const [isEstablishingConnection, setIsEstablishingConnection] = useState(false);
  const peerRef = useRef<any>(null);

  // Socket.io & WebRTC Integration
  useEffect(() => {
    if (!id || !user || !mediaStream) return;

    let Peer: any;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
    const socket = io(socketUrl);
    socketRef.current = socket;

    const playJoinSound = () => {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      oscillator.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    };

    const initPeer = async () => {
      const module = await import("simple-peer");
      Peer = module.default;

      socket.emit("join-room", id);

      // 1. Someone joined -> I start the call
      socket.on("user-joined", ({ from }) => {
        console.log("User joined, initiating call to:", from);
        playJoinSound();
        setParticipantCount(2);
        setIsEstablishingConnection(true);

        // CLEANUP: If there was a previous peer, destroy it to avoid leaks and errors on refresh
        if (peerRef.current) {
          console.log("Cleaning up stale peer before new connection");
          peerRef.current.destroy();
          peerRef.current = null;
        }

        const peer = new Peer({
          initiator: true, 
          trickle: false,
          stream: mediaStream,
        });

        peer.on("signal", (data: any) => {
          socket.emit("call-user", { userToCall: from, signalData: data, from: socket.id });
        });

        peer.on("stream", (stream: MediaStream) => {
          setRemoteStream(stream);
          setIsEstablishingConnection(false);
        });

        socket.on("call-accepted", (signal: any) => {
          if (peer && !peer.destroyed) peer.signal(signal);
        });

        peerRef.current = peer;
      });

      // 2. Receiving a call
      socket.on("call-made", ({ signal, from }) => {
        console.log("Receiving call from:", from);
        setParticipantCount(2);
        setIsEstablishingConnection(true);

        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }

        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: mediaStream,
        });

        peer.on("signal", (data: any) => {
          socket.emit("answer-call", { signal: data, to: from });
        });

        peer.on("stream", (stream: MediaStream) => {
          setRemoteStream(stream);
          setIsEstablishingConnection(false);
        });

        peer.signal(signal);
        peerRef.current = peer;
      });

      socket.on("user-left", () => {
        console.log("Other user left/refreshed");
        setParticipantCount(1);
        setRemoteStream(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
      });
    };

    initPeer();

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("your-turn", async () => {
      try {
        const data = await apiFetch(`/bookings/${id}`);
        setBooking(data.booking);
        // Recalculate timeLeft based on the new startsAt
        const start = new Date(data.booking.startsAt).getTime();
        const endTime = start + data.booking.durationSec * 1000;
        const diff = Math.floor((endTime - Date.now()) / 1000);
        setTimeLeft(Math.max(0, diff));
        
        toast.success("¡Es tu turno! El talento se está conectando...");
      } catch (err) {}
    });

    socket.on("session-ended", () => {
      handleEndCall();
    });

    return () => {
      socket.disconnect();
      if (peerRef.current) peerRef.current.destroy();
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    };
  }, [id, user, mediaStream]);

  // Sync remote stream with video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Persistent Local Video Sync
  useEffect(() => {
    if (mediaStream && videoRef.current && !camOff) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, camOff, booking?.status]);

  // Persistent Remote Video Sync
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, booking?.status]);

  // Timer countdown
  useEffect(() => {
    if (isConnecting || timeLeft === null || booking?.status !== "IN_PROGRESS") return;
    if (timeLeft <= 0) {
      handleEndCall();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isConnecting, booking?.status]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit("send-message", {
      bookingId: id,
      message: newMessage,
      senderName: user?.name || "Usuario"
    });
    setNewMessage("");
  };

  const changeDevice = async (type: 'video' | 'audio', id: string) => {
    if (type === 'video') {
      setSelectedCam(id);
      // Re-run permission/stream logic with explicit ID
      const constraints = {
        video: { deviceId: { exact: id } },
        audio: selectedMic ? { deviceId: { exact: selectedMic } } : true
      };
      updateStream(constraints);
    } else {
      setSelectedMic(id);
      const constraints = {
        video: selectedCam ? { deviceId: { exact: selectedCam } } : true,
        audio: { deviceId: { exact: id } }
      };
      updateStream(constraints);
    }
  };

  const updateStream = async (constraints: any) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
      setMediaStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndCall = () => {
    if (mediaStream) mediaStream.getTracks().forEach(t => t.stop());
    setIsEnded(true);
  };

  if (!isHydrated || !booking || !user) {
     return (
       <div className="min-h-screen bg-black flex items-center justify-center">
         <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
       </div>
     );
  }

  const seconds = timeLeft || 0;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  const timeString = `${min}:${sec.toString().padStart(2, "0")}`;
  const isUrgent = seconds < 30; // Last 30s glow red

  return (
    <div className="h-screen bg-black flex overflow-hidden">
      
      {/* Container - Flexible Layout */}
      <div className="flex-1 flex flex-row relative overflow-hidden transition-all duration-300">
        
        {/* Main Work Area (Video + Controls) */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 z-50 p-4 sm:p-6 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            {/* Info */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 pointer-events-auto">
                <div className={`w-2 h-2 rounded-full ${isConnecting ? "bg-yellow-400" : (participantCount === 1 ? "bg-orange-400" : "bg-green-400")} animate-pulse`} />
                <span className="text-white font-medium text-sm">
                  {isConnecting ? "Conectando..." : (participantCount === 1 ? "Esperando..." : "Live")}
                </span>
              </div>
              <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/10 pointer-events-auto">
                <Users className="w-4 h-4 text-white/70" />
                <span className="text-white/70 text-sm font-medium">{participantCount}/2</span>
              </div>
            </div>

            {/* Timer */}
            <div 
              className={`px-6 py-3 rounded-full font-mono text-xl sm:text-2xl font-bold border pointer-events-auto transition-colors ${
                isUrgent 
                  ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.4)]" 
                  : "glass border-violet-500/30 text-white shadow-[0_0_30px_rgba(168,85,247,0.2)]"
              }`}
            >
              {timeString}
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 relative flex items-center justify-center bg-[#050505]">
            {/* Main Stage */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isConnecting ? (
                <div className="flex flex-col items-center gap-6 text-white animate-pulse">
                   <div className="w-20 h-20 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
                   </div>
                   <p className="text-sm font-black uppercase tracking-[0.2em] opacity-40">Estableciendo conexión...</p>
                </div>
              ) : booking.status === "WAITING_IN_QUEUE" ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center px-6">
                   <div className="absolute inset-0 bg-gradient-to-b from-violet-900/5 to-black pointer-events-none" />
                   
                   <div className="z-10 w-full max-w-lg space-y-12">
                      <div className="text-center space-y-4">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-[0.2em]">
                           Sala de espera virtual
                        </div>
                        <h2 className="text-5xl sm:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                           Estás en <br/> la cola
                        </h2>
                        <p className="text-violet-300/60 font-bold text-lg">Esperando a {booking.talent?.stageName || booking.talent?.name}</p>
                      </div>

                      {/* Main Self Preview - Much larger and centered */}
                      <div className="relative aspect-video sm:aspect-square sm:w-80 mx-auto rounded-[2.5rem] border-4 border-white/10 overflow-hidden shadow-[0_0_80px_rgba(139,92,246,0.15)] bg-black group">
                         <video 
                           ref={videoRef}
                           autoPlay 
                           muted 
                           playsInline 
                           className="w-full h-full object-cover scale-x-[-1]"
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                         <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Vista previa</span>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="glass p-6 rounded-[2rem] border-white/10 text-center space-y-1">
                            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Tu lugar</p>
                            <p className="text-4xl font-black text-white">#{booking.queuePosition || "1"}</p>
                         </div>
                         <div className="glass p-6 rounded-[2rem] border-white/10 text-center space-y-1">
                            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Sesión de</p>
                            <p className="text-4xl font-black text-white">{Math.floor(booking.durationSec / 60)}<span className="text-xl opacity-40">min</span></p>
                         </div>
                      </div>

                      <div className="p-5 bg-white/5 rounded-3xl border border-white/10 flex items-center gap-4 text-left">
                         <div className="shrink-0 w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                            <Users className="w-5 h-5 text-violet-400" />
                         </div>
                         <p className="text-xs text-white/50 font-bold leading-relaxed">No cierres esta pestaña. El encuentro comenzará automáticamente en cuanto el talento te llame.</p>
                      </div>
                   </div>
                </div>
              ) : (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  {remoteStream ? (
                    <video 
                      ref={remoteVideoRef}
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover max-h-screen"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-8 text-white text-center px-8">
                        <div className="relative">
                          <div className="absolute inset-0 bg-violet-600/20 rounded-full animate-ping scale-150" />
                          {booking.talent?.avatarUrl ? (
                            <img 
                              src={booking.talent?.avatarUrl} 
                              className="relative w-40 h-40 rounded-full border-4 border-violet-500/30 object-cover shadow-2xl"
                              alt="Talent"
                            />
                          ) : (
                            <div className="relative w-40 h-40 rounded-full bg-violet-900/40 border-4 border-violet-500/30 flex items-center justify-center text-6xl font-black">
                              {(booking.talent?.stageName || booking.talent?.name || "T").slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-3xl font-black uppercase tracking-tighter">Estableciendo Llamada</h3>
                          <p className="text-violet-300/40 font-bold text-sm">El talento se está uniendo. Preparate para comenzar.</p>
                        </div>
                    </div>
                  )}
                  
                  {/* Remote identity tag */}
                  <div className="absolute bottom-32 left-8 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 border border-white/10 shadow-2xl">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {booking.talent?.stageName || booking.talent?.name}
                  </div>
                </div>
              )}
            </div>

            {/* PiP (Local user view) - Only visible when NOT in waiting queue */}
            {booking.status === "IN_PROGRESS" && (
              <motion.div 
                drag
                dragConstraints={{ left: -300, right: 300, top: -500, bottom: 300 }}
                dragElastic={0.1}
                whileDrag={{ scale: 1.05, cursor: "grabbing" }}
                className="absolute bottom-32 right-6 sm:bottom-28 sm:right-8 w-32 h-44 sm:w-44 sm:h-64 bg-gray-900 rounded-[2rem] overflow-hidden shadow-2xl border-2 border-white/10 z-10 group touch-none"
              >
                {camOff || !mediaStream ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950">
                    <div className="bg-white/10 p-3 rounded-full mb-2">
                      <VideoOff className="w-6 h-6 text-white/50" />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/30 text-center px-4">
                      Cámara apagada
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-full bg-black relative pointer-events-none">
                    <video 
                      ref={videoRef}
                      autoPlay 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">Tú</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Controls - Fixed height at bottom */}
          <div className="h-24 bg-black/40 backdrop-blur-xl flex items-center justify-center gap-4 px-4 pb-safe border-t border-white/5 shrink-0 z-50">
            <button 
              onClick={() => {
                const nextState = !micMuted;
                setMicMuted(nextState);
                if (mediaStream) {
                  mediaStream.getAudioTracks().forEach(track => {
                    track.enabled = !nextState;
                  });
                }
              }} 
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                micMuted ? "bg-red-500/20 text-red-500 border border-red-500/50" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => {
                setCamOff(!camOff);
                if (mediaStream) {
                  mediaStream.getVideoTracks().forEach(track => track.enabled = camOff);
                }
              }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                camOff ? "bg-red-500/20 text-red-500 border border-red-500/50" : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {camOff ? <VideoOff className="w-5 h-5" /> : <VideoIcon className="w-5 h-5" />}
            </button>
            <button 
              onClick={handleEndCall}
              className="w-16 h-12 rounded-2xl bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center transition-colors mx-2"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button 
              onClick={() => {
                setIsChatOpen(!isChatOpen);
                setIsSettingsOpen(false);
              }}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all relative",
                isChatOpen ? "bg-violet-600 text-white shadow-lg" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
            >
              <MessageSquare className="w-5 h-5" />
              {messages.length > 0 && !isChatOpen && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce shadow-lg">
                  {messages.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                setIsChatOpen(false);
              }}
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                isSettingsOpen ? "bg-white text-black shadow-lg" : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Sidebar - Google Meet Style (No overlap on desktop, full screen on mobile) */}
        {(isChatOpen || isSettingsOpen) && (
          <div className={cn(
            "fixed inset-0 z-[100] bg-black sm:relative sm:inset-auto sm:w-80 h-full sm:bg-[#0a0a0c] sm:border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right sm:slide-in-from-right duration-300",
            isChatOpen || isSettingsOpen ? "flex" : "hidden"
          )}>
            {/* Chat Pane */}
            {isChatOpen && (
              <>
                <div className="p-4 sm:p-4 border-b border-white/10 flex items-center justify-between bg-black/60 shrink-0">
                  <h3 className="font-bold flex items-center gap-2 text-white">
                    <MessageSquare className="w-5 h-5 sm:w-4 sm:h-4 text-violet-400" /> Chat de la sesión
                  </h3>
                  <button onClick={() => setIsChatOpen(false)} className="p-3 sm:p-2 hover:bg-white/5 rounded-full">
                    <X className="w-6 h-6 sm:w-5 sm:h-5 text-white/50" />
                  </button>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 sm:p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40 text-white">
                      <MessageSquare className="w-16 h-16 mb-4" />
                      <p className="text-lg sm:text-sm italic">¡Saludá al talento!</p>
                    </div>
                  ) : (
                    messages.map((m: any, i: number) => (
                      <div key={i} className={cn("flex flex-col", m.sender === user?.name ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[85%] p-4 sm:p-3 rounded-2xl text-base sm:text-sm",
                          m.sender === user?.name ? "bg-violet-600/30 text-white border border-violet-500/20" : "bg-white/5 text-white/90"
                        )}>
                          <p className="text-[10px] font-bold uppercase opacity-50 mb-1">{m.sender}</p>
                          <p>{m.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="p-6 sm:p-4 bg-black/60 border-t border-white/10 flex gap-3 pb-safe">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribí un mensaje..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 sm:py-2 text-base sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <button type="submit" className="p-4 sm:p-2 bg-violet-600 rounded-2xl text-white shadow-lg shadow-violet-600/20 active:scale-95 transition-transform">
                    <Send className="w-6 h-6 sm:w-5 sm:h-5" />
                  </button>
                </form>
              </>
            )}

            {/* Settings Pane */}
            {isSettingsOpen && !isChatOpen && (
              <>
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60 shrink-0">
                  <h3 className="font-bold flex items-center gap-2 text-white">
                    <Settings className="w-5 h-5 sm:w-4 sm:h-4 text-violet-400" /> Configuración
                  </h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-3 sm:p-2 hover:bg-white/10 rounded-full">
                    <X className="w-6 h-6 sm:w-5 sm:h-5 text-white/50" />
                  </button>
                </div>
                <div className="p-6 sm:p-5 space-y-8 overflow-y-auto">
                    <div className="space-y-4">
                      <label className="text-xs font-black uppercase text-violet-400 tracking-widest px-1">Cámara</label>
                      <div className="grid gap-2">
                        {devices.filter(d => d.kind === 'videoinput').map(d => (
                          <button 
                            key={d.deviceId} 
                            onClick={() => changeDevice('video', d.deviceId)} 
                            className={cn(
                              "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between", 
                              selectedCam === d.deviceId 
                                ? "bg-violet-600/20 border-violet-500 text-white shadow-lg" 
                                : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                            )}
                          >
                            <span className="text-sm font-medium truncate pr-4">{d.label || `Cámara ${d.deviceId.slice(0,4)}`}</span>
                            {selectedCam === d.deviceId && <div className="w-2 h-2 rounded-full bg-violet-400" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-violet-600/10 border border-violet-500/20">
                       <p className="text-sm text-violet-200 font-medium">Recomendación</p>
                       <p className="text-xs text-violet-300/60 mt-1">Aseguráte de tener buena iluminación y que tu micrófono no esté obstruido.</p>
                    </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Session Ended Overlay */}
      {isEnded && (
        <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="max-w-md w-full glass p-10 rounded-[3rem] border-violet-500/30 text-center shadow-[0_0_80px_rgba(139,92,246,0.25)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-violet-600 via-pink-600 to-violet-600" />
            <div className="w-24 h-24 bg-violet-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(139,92,246,0.4)]">
              <PhoneOff className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">¡Llamada terminada!</h2>
            <p className="text-violet-200/60 mb-10 text-lg leading-relaxed">
              La sesión con {booking.talent?.stageName} ha concluido. Esperamos que la hayas disfrutado al máximo.
            </p>
            <Button 
              onClick={() => router.push(user?.role?.toUpperCase() === "TALENT" ? "/talent/dashboard" : "/dashboard")}
              className="btn-gradient w-full h-16 rounded-[1.5rem] text-xl font-black shadow-2xl border-0 active:scale-95 transition-transform"
            >
              Cerrar y volver
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
