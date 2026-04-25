"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  ShieldCheck, RefreshCw, ChevronLeft, ChevronRight, CheckCheck, 
  X, Loader2, Eye, ExternalLink, User, FileText, Camera
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: "Pendiente", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  APPROVED: { label: "Aprobada",  color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20" },
  REJECTED: { label: "Rechazada", color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20" },
};

interface VerificationRequest {
  id: string;
  realName: string;
  documentType: string;
  documentNumber: string;
  documentFrontUrl: string;
  selfieUrl: string;
  socialLinks?: string;
  category?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
  createdAt: string;
  user: { id: string; name: string; email: string; avatarUrl?: string };
}

function ReviewModal({
  request, onConfirm, onClose, loading
}: {
  request: VerificationRequest;
  onConfirm: (status: "APPROVED" | "REJECTED", note: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [note, setNote] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4 py-6">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0a0a0f] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 space-y-8 overflow-y-auto flex-1 w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
              <ShieldCheck className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <h3 className="font-black text-2xl text-white">Revisar Verificación</h3>
              <p className="text-sm text-white/40">Solicitud de {request.user.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Info */}
          <div className="space-y-6">
            <div className="glass rounded-3xl p-6 border-white/5 space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-400">Datos Legales</h4>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <p className="text-[10px] text-white/30 uppercase">Nombre Real</p>
                   <p className="text-white font-medium">{request.realName}</p>
                 </div>
                 <div>
                   <p className="text-[10px] text-white/30 uppercase">Documento ({request.documentType})</p>
                   <p className="text-white font-medium">{request.documentNumber}</p>
                 </div>
               </div>
               <div>
                  <p className="text-[10px] text-white/30 uppercase">Redes Sociales</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-white text-sm truncate flex-1">{request.socialLinks || "No provisto"}</p>
                    {request.socialLinks && (
                      <a href={request.socialLinks.startsWith('http') ? request.socialLinks : `https://${request.socialLinks}`} target="_blank" className="text-violet-400 hover:text-violet-300">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
               </div>
               <div>
                  <p className="text-[10px] text-white/30 uppercase">Categoría Sugerida</p>
                  <p className="text-white text-sm">{request.category || "General"}</p>
               </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-2">Nota administrativa (opcional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explicá el motivo de aprobación o rechazo..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-all resize-none"
              />
            </div>
          </div>

          {/* Media Review */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-400 ml-2">Documentación Adjunta</h4>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-white/50">Frente del Documento</p>
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 group relative">
                  <img src={`${request.documentFrontUrl}?token=${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <a href={`${request.documentFrontUrl}?token=${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}`} target="_blank" className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 text-white" />
                  </a>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/50">Selfie de Validación</p>
                <div className="aspect-video rounded-2xl overflow-hidden border border-white/10 group relative">
                  <img src={`${request.selfieUrl}?token=${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <a href={`${request.selfieUrl}?token=${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}`} target="_blank" className="absolute top-2 right-2 p-2 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 text-white" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={() => onConfirm("REJECTED", note)}
            disabled={loading}
            className="flex-1 h-14 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold border border-red-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
            Rechazar Solicitud
          </button>
          <button
            onClick={() => onConfirm("APPROVED", note)}
            disabled={loading}
            className="flex-[2] h-14 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-bold transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCheck className="w-5 h-5" />}
            Aprobar Verificación
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const adminToken = localStorage.getItem("admin_token");
    const url = status === "ALL" ? `${API}/verification/admin/list` : `${API}/verification/admin/list?status=${status}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      toast.error("Error al cargar solicitudes");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcess = async (targetStatus: "APPROVED" | "REJECTED", note: string) => {
    if (!selectedRequest) return;
    setProcessing(true);
    const adminToken = localStorage.getItem("admin_token");

    try {
      const res = await fetch(`${API}/verification/admin/process/${selectedRequest.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${adminToken}` 
        },
        body: JSON.stringify({ status: targetStatus, adminNote: note }),
      });

      if (!res.ok) throw new Error("Error al procesar");

      toast.success(`Solicitud ${targetStatus === 'APPROVED' ? 'aprobada' : 'rechazada'} con éxito`);
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setSelectedRequest(null);
    } catch (err) {
      toast.error("Error al procesar la solicitud");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8">
      {selectedRequest && (
        <ReviewModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onConfirm={handleProcess}
          loading={processing}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Verificaciones</h1>
          <p className="text-white/40 text-sm mt-1">Revisa y valida la identidad de los nuevos talentos.</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-sm transition-all border border-white/5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refrescar
        </button>
      </div>

      <div className="flex gap-3">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
              status === s
                ? "bg-violet-600/20 text-violet-400 border border-violet-500/30"
                : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5"
            )}
          >
            {s === "ALL" ? "Todos" : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-white/3 border border-white/5 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="py-32 text-center glass rounded-[3rem] border-white/5">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <p className="text-white/30 font-medium text-lg">No hay solicitudes pendientes en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((r) => (
            <div 
              key={r.id} 
              className="glass rounded-[2rem] border-white/5 p-6 hover:border-white/20 transition-all group cursor-pointer"
              onClick={() => setSelectedRequest(r)}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                  {r.user.avatarUrl ? (
                    <img src={r.user.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{r.user.name}</h3>
                  <p className="text-xs text-white/40 truncate">{r.user.email}</p>
                </div>
                <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase", STATUS_CONFIG[r.status].bg, STATUS_CONFIG[r.status].color)}>
                  {STATUS_CONFIG[r.status].label}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                   <div className="flex-1 aspect-[4/3] rounded-xl bg-white/5 overflow-hidden border border-white/5">
                      <img src={r.documentFrontUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                   </div>
                   <div className="flex-1 aspect-[4/3] rounded-xl bg-white/5 overflow-hidden border border-white/5">
                      <img src={r.selfieUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                   </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                   <span className="text-[10px] text-white/20 font-mono">
                     {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: es })}
                   </span>
                   <button className="text-[10px] font-black uppercase text-violet-400 group-hover:text-violet-300 transition-colors flex items-center gap-1">
                     Revisar ahora <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
