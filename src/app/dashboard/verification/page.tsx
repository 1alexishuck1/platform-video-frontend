"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Upload, User, FileText, Camera, 
  Globe, CheckCircle, AlertCircle, Loader, ChevronRight, ChevronLeft
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/mock-data";

// Custom Clock component if not in lucide
function Clock(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

type Step = 1 | 2 | 3 | 4;

export default function VerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [previews, setPreviews] = useState({
    documentFront: "",
    selfie: ""
  });

  const docInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<{ documentFront: File | null, selfie: File | null }>({
    documentFront: null,
    selfie: null
  });

  const [formData, setFormData] = useState({
    realName: "",
    documentType: "DNI",
    documentNumber: "",
    socialLinks: "",
    category: "General"
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'documentFront' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFiles(prev => ({ ...prev, [field]: file }));
      setPreviews(prev => ({ ...prev, [field]: url }));
      toast.success("Archivo seleccionado correctamente");
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await apiFetch("/verification/status");
      setExistingRequest(data.status);
    } catch (err) {
      console.error("Error fetching verification status", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => setStep((s) => (s + 1) as Step);
  const handleBack = () => setStep((s) => (s - 1) as Step);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("realName", formData.realName);
      data.append("documentType", formData.documentType);
      data.append("documentNumber", formData.documentNumber);
      if (formData.socialLinks) data.append("socialLinks", formData.socialLinks);
      if (formData.category) data.append("category", formData.category);
      
      if (files.documentFront) data.append("documentFront", files.documentFront);
      if (files.selfie) data.append("selfie", files.selfie);

      await apiFetch("/verification/request", {
        method: "POST",
        body: data
      });
      toast.success("Solicitud enviada correctamente");
      setStep(4);
      fetchStatus();
    } catch (err: any) {
      toast.error(err.message || "Error al enviar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  // If already verified or has pending request
  if (existingRequest && existingRequest.status !== "REJECTED" && step !== 4) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6",
            existingRequest.status === "PENDING" ? "bg-yellow-500/10 text-yellow-500" : "bg-green-500/10 text-green-500"
          )}>
            {existingRequest.status === "PENDING" ? <Clock className="w-10 h-10" /> : <ShieldCheck className="w-10 h-10" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            {existingRequest.status === "PENDING" ? "Solicitud en revisión" : "Cuenta verificada"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {existingRequest.status === "PENDING" 
              ? "Estamos revisando tu documentación. Te avisaremos por email apenas tengamos una respuesta."
              : "¡Felicidades! Tu cuenta ya cuenta con el sello de identidad verificada."}
          </p>
          <Button onClick={() => router.push("/")} variant="outline" className="rounded-xl border-white/10">
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      <Navbar />
      
      <div className="max-w-3xl mx-auto px-6 pt-28">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-white tracking-tight mb-4">Verificá tu identidad</h1>
          <p className="text-muted-foreground text-lg">Para ser un talento oficial, necesitamos confirmar que sos vos.</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/5 -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-[2px] bg-violet-500 -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: `${Math.min(((step - 1) / 2) * 100, 100)}%` }}
          />
          
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={cn(
                "relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500",
                step === s ? "bg-violet-500 text-white scale-110 shadow-[0_0_20px_rgba(139,92,246,0.4)]" : 
                step > s ? "bg-green-500 text-white" : "bg-white/5 text-white/40 border border-white/10"
              )}
            >
              {step > s ? <CheckCircle className="w-6 h-6" /> : s}
            </div>
          ))}
        </div>

        <div className="glass rounded-[2.5rem] p-8 md:p-12 shadow-2xl border-white/10 relative overflow-hidden">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Información Personal</h2>
                  <p className="text-sm text-muted-foreground">Tus datos legales para el registro interno.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70 ml-1">Nombre completo (como figura en tu DNI)</label>
                  <Input 
                    value={formData.realName}
                    onChange={(e) => setFormData({...formData, realName: e.target.value})}
                    placeholder="Ej: Juan Pérez"
                    className="h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-violet-500"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70 ml-1">Tipo de documento</label>
                    <select 
                      value={formData.documentType}
                      onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                      className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-4 text-white focus:ring-violet-500 outline-none"
                    >
                      <option value="DNI" className="bg-black">DNI</option>
                      <option value="PASSPORT" className="bg-black">Pasaporte</option>
                      <option value="ID_CARD" className="bg-black">Cédula de Identidad</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70 ml-1">Número de documento</label>
                    <Input 
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                      placeholder="Sin puntos ni guiones"
                      className="h-14 bg-white/5 border-white/10 rounded-2xl"
                    />
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleNext} 
                disabled={!formData.realName || !formData.documentNumber}
                className="w-full h-14 bg-white text-black hover:bg-violet-500 hover:text-white rounded-2xl font-bold text-lg transition-all"
              >
                Continuar <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Documentación</h2>
                  <p className="text-sm text-muted-foreground">Fotos nítidas y legibles para validar tu identidad.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input 
                  type="file" 
                  ref={docInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'documentFront')}
                />
                <input 
                  type="file" 
                  ref={selfieInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(e, 'selfie')}
                />

                <div className="space-y-4">
                  <p className="text-sm font-medium text-white/70">Frente del documento</p>
                  <div 
                    onClick={() => docInputRef.current?.click()}
                    className={cn(
                      "aspect-[3/2] bg-white/5 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 group transition-all cursor-pointer overflow-hidden relative",
                      previews.documentFront ? "border-violet-500/50" : "border-white/10 hover:border-violet-500/50"
                    )}
                  >
                    {previews.documentFront ? (
                      <img src={previews.documentFront} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-white/20 group-hover:text-violet-400 transition-colors" />
                        <span className="text-xs text-white/40">Haz clic para subir foto</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-white/70">Selfie con documento</p>
                  <div 
                    onClick={() => selfieInputRef.current?.click()}
                    className={cn(
                      "aspect-[3/2] bg-white/5 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 group transition-all cursor-pointer overflow-hidden relative",
                      previews.selfie ? "border-violet-500/50" : "border-white/10 hover:border-violet-500/50"
                    )}
                  >
                    {previews.selfie ? (
                      <img src={previews.selfie} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-white/20 group-hover:text-violet-400 transition-colors" />
                        <span className="text-xs text-white/40">Haz clic para capturar/subir</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-2xl flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-500/80 leading-relaxed">
                  Asegúrate de que la foto del documento sea legible y que en la selfie se vea claramente tu cara y los datos del documento.
                </p>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleBack} variant="outline" className="flex-1 h-14 rounded-2xl border-white/10">
                  Volver
                </Button>
                <Button 
                  onClick={handleNext} 
                  disabled={!files.documentFront || !files.selfie}
                  className="flex-[2] h-14 bg-white text-black hover:bg-violet-500 hover:text-white rounded-2xl font-bold text-lg"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Globe className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Presencia Social</h2>
                  <p className="text-sm text-muted-foreground">Ayúdanos a conocer tu alcance y categoría.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70 ml-1">Links de redes sociales (Instagram, TikTok, etc)</label>
                  <Input 
                    value={formData.socialLinks}
                    onChange={(e) => setFormData({...formData, socialLinks: e.target.value})}
                    placeholder="Ej: instagram.com/usuario"
                    className="h-14 bg-white/5 border-white/10 rounded-2xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70 ml-1">Categoría sugerida</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full h-14 bg-white/5 border-white/10 rounded-2xl px-4 text-white focus:ring-violet-500 outline-none"
                  >
                    {CATEGORIES.filter(c => c !== "Todos").map(cat => (
                      <option key={cat} value={cat} className="bg-black">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleBack} variant="outline" className="flex-1 h-14 rounded-2xl border-white/10">
                  Volver
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="flex-[2] h-14 bg-violet-600 text-white hover:bg-violet-500 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                >
                  {isSubmitting ? <Loader className="w-5 h-5 animate-spin" /> : "Finalizar solicitud"}
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-10 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">¡Solicitud Enviada!</h2>
              <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
                Tu documentación está en cola de revisión. Te enviaremos una notificación cuando un administrador valide tu perfil.
              </p>
              <Button 
                onClick={() => router.push("/")} 
                className="h-14 px-10 rounded-2xl bg-white text-black font-bold hover:bg-violet-500 hover:text-white"
              >
                Volver al inicio
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


