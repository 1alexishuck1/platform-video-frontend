"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Mic, MicOff, Video as VideoIcon, VideoOff, 
  PhoneOff, Users, Settings, Send, MessageSquare, 
  ChevronRight, Loader2, X 
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import { format } from "date-fns";

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
        setBooking(data.booking);
        
        // Calculate real time left (startsAt + duration - now)
        const start = new Date(data.booking.startsAt).getTime();
        const durationSec = data.booking.durationSec;
        const endTime = start + durationSec * 1000;
        const now = Date.now();
        const diff = Math.floor((endTime - now) / 1000);
        
        // Only end if the session has actually finished
        if (diff <= 0) {
          handleEndCall();
          return;
        }

        setTimeLeft(diff);
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
          if (videoRef.current) videoRef.current.srcObject = stream;
        } else {
          if (remoteStream) remoteStream.getTracks().forEach(t => t.stop());
          setRemoteStream(stream);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
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

        if (peerRef.current) {
          console.log("Cleaning up stale peer before new connection");
          peerRef.current.destroy();
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
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        });

        socket.on("call-accepted", (signal: any) => {
          if (!peer.destroyed) peer.signal(signal);
        });

        peerRef.current = peer;
      });

      // 2. Receiving a call
      socket.on("call-made", ({ signal, from }) => {
        console.log("Receiving call from:", from);
        setParticipantCount(2);
        setIsEstablishingConnection(true);

        if (peerRef.current) peerRef.current.destroy();

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
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        });

        peer.signal(signal);
        peerRef.current = peer;
      });
    };

    initPeer();

    socket.on("receive-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
      if (peerRef.current) peerRef.current.destroy();
    };
  }, [id, user, mediaStream]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Timer countdown
  useEffect(() => {
    if (isConnecting || timeLeft === null) return;
    if (timeLeft <= 0) {
      handleEndCall();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev !== null ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isConnecting]);

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
          <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0c]">
            {/* Remote / Main View */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isConnecting ? (
                <div className="flex flex-col items-center gap-4 text-white animate-pulse">
                  {booking.talent?.avatarUrl || booking.talent?.avatar_url ? (
                    <img src={booking.talent?.avatarUrl || booking.talent?.avatar_url} className="w-24 h-24 rounded-full border-4 border-white/10" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-violet-600/30 border-4 border-white/10 flex items-center justify-center text-3xl font-bold">
                      {(booking.talent?.stageName || booking.talent?.name || "T").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <p className="text-lg font-medium opacity-80">Cargando sesión...</p>
                </div>
              ) : (
                <div className="relative w-full h-full bg-black flex items-center justify-center shadow-inner">
                  {remoteStream ? (
                    <video 
                      ref={remoteVideoRef}
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover max-h-screen"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                      {isEstablishingConnection ? (
                        <div className="flex flex-col items-center gap-4 text-white">
                          <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
                          <p className="text-lg font-medium">Finalizando conexión...</p>
                        </div>
                      ) : (
                        user?.role?.toUpperCase() === "TALENT" ? (
                          <div className="flex flex-col items-center gap-6 text-white text-center">
                              <div className="relative">
                                <div className="absolute inset-0 bg-violet-600/20 rounded-full animate-ping scale-150" />
                                <div className="relative bg-violet-600/30 p-8 rounded-full border border-violet-500/30">
                                  <Users className="w-16 h-16 text-violet-400" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Esperando al usuario...</h3>
                                <p className="text-white/40 italic text-sm">La sesión comenzará automáticamente cuando el fan se conecte.</p>
                              </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-6 text-white text-center">
                              <div className="relative">
                                <div className="absolute inset-0 bg-violet-600/20 rounded-full animate-ping scale-150" />
                                {booking.talent?.avatarUrl || booking.talent?.avatar_url ? (
                                  <img 
                                    src={booking.talent?.avatarUrl || booking.talent?.avatar_url} 
                                    className="relative w-32 h-32 rounded-full border-4 border-violet-500/30 object-cover"
                                    alt="Remote talent"
                                  />
                                ) : (
                                  <div className="relative w-32 h-32 rounded-full bg-violet-900/40 border-4 border-violet-500/30 flex items-center justify-center text-5xl font-black">
                                    {(booking.talent?.stageName || booking.talent?.name || "T").slice(0, 2)}
                                  </div>
                                )}
                              </div>
                              <div className="space-y-2">
                                <h3 className="text-2xl font-bold">Esperando a {booking.talent?.stageName || booking.talent?.name}...</h3>
                                <p className="text-white/40 italic text-sm">El talento se unirá en breve. Mantené esta pestaña abierta.</p>
                              </div>
                          </div>
                        )
                      )}
                    </>
                  )}
                  <div className="absolute bottom-32 left-8 bg-black/50 backdrop-blur px-3 py-1 rounded-lg text-white/90 text-sm flex items-center gap-2 border border-white/10">
                    <Mic className="w-3 h-3 text-green-400" />
                    {user?.role?.toUpperCase() === "TALENT" ? "Fan" : (booking.talent?.stageName || booking.talent?.stage_name)}
                  </div>
                </div>
              )}
            </div>

            {/* PiP (Local user view) */}
            <div className="absolute bottom-32 right-6 sm:bottom-28 sm:right-8 w-32 h-44 sm:w-44 sm:h-64 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 transition-all hover:scale-105 z-10 group">
              {camOff || !mediaStream ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950">
                  <div className="bg-white/10 p-3 rounded-full mb-2">
                    <VideoOff className="w-6 h-6 text-white/50" />
                  </div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest text-center px-2">
                    {!mediaStream ? "Sin cámara" : "Cámara apagada"}
                  </p>
                </div>
              ) : (
                <div className="w-full h-full bg-black relative">
                  <video 
                    ref={videoRef}
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-medium">Tú ({user?.role?.toUpperCase() === "TALENT" ? "Talento" : "Fan"})</p>
                  </div>
                </div>
              )}
            </div>
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

        {/* Dynamic Sidebar - Google Meet Style (No overlap, pushes content width) */}
        {(isChatOpen || isSettingsOpen) && (
          <div className="w-full sm:w-80 h-full bg-[#0a0a0c] border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            {/* Chat Pane */}
            {isChatOpen && (
              <>
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60 shrink-0">
                  <h3 className="font-bold flex items-center gap-2 text-white">
                    <MessageSquare className="w-4 h-4 text-violet-400" /> Chat
                  </h3>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40 text-white">
                      <MessageSquare className="w-12 h-12 mb-4" />
                      <p className="text-sm italic">¡Saludá!</p>
                    </div>
                  ) : (
                    messages.map((m: any, i: number) => (
                      <div key={i} className={cn("flex flex-col", m.sender === user?.name ? "items-end" : "items-start")}>
                        <div className={cn(
                          "max-w-[85%] p-3 rounded-2xl text-sm",
                          m.sender === user?.name ? "bg-violet-600/20 text-white" : "bg-white/5 text-white/90"
                        )}>
                          <p className="text-[10px] font-bold uppercase opacity-50 mb-1">{m.sender}</p>
                          <p>{m.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 bg-black/60 border-t border-white/10 flex gap-2">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribí..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none"
                  />
                  <button type="submit" className="p-2 bg-violet-600 rounded-xl text-white">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </>
            )}

            {/* Settings Pane */}
            {isSettingsOpen && !isChatOpen && (
              <>
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/60 shrink-0">
                  <h3 className="font-bold flex items-center gap-2 text-white">
                    <Settings className="w-4 h-4 text-violet-400" /> Audio/Video
                  </h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                    <X className="w-5 h-5 text-white/50" />
                  </button>
                </div>
                <div className="p-5 space-y-6 overflow-y-auto">
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Cámara</label>
                      {devices.filter(d => d.kind === 'videoinput').map(d => (
                        <button key={d.deviceId} onClick={() => changeDevice('video', d.deviceId)} className={cn("w-full text-left p-3 rounded-xl border", selectedCam === d.deviceId ? "bg-violet-600/20 border-violet-500 text-white" : "bg-white/5 border-white/10 text-white/60")}>
                          <span className="text-xs truncate block">{d.label}</span>
                        </button>
                      ))}
                    </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Session Ended Overlay */}
      {isEnded && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="max-w-md w-full glass p-10 rounded-[2.5rem] border-violet-500/30 text-center shadow-[0_0_50px_rgba(139,92,246,0.2)]">
            <div className="w-20 h-20 bg-violet-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/20">
              <PhoneOff className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">Sesión finalizada</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Gracias por usar PlatfomLive. Esperamos que hayas tenido una gran experiencia.
            </p>
            <Button 
              onClick={() => router.push(user?.role?.toUpperCase() === "TALENT" ? "/talent/dashboard" : "/dashboard")}
              className="btn-gradient w-full h-14 rounded-2xl text-lg font-bold shadow-xl border-0"
            >
              Volver al Dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
