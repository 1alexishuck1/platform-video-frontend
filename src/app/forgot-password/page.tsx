"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Video, Loader2, Mail, Lock, CheckCircle2, ChevronLeft, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import { toast } from "sonner";

const forgotSchema = z.object({
  email: z.string().email("Email inválido"),
});

const resetSchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
  newPassword: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string().min(6, "Mínimo 6 caracteres"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const forgotForm = useForm<{ email: string }>({ 
    resolver: zodResolver(forgotSchema) 
  });

  const resetForm = useForm<z.infer<typeof resetSchema>>({ 
    resolver: zodResolver(resetSchema) 
  });

  const onForgotSubmit = async (data: { email: string }) => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setEmail(data.email);
      setStep(2);
      toast.success("Código enviado a tu email");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el código");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: z.infer<typeof resetSchema>) => {
    setIsLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email,
          code: data.code,
          newPassword: data.newPassword,
        }),
      });
      toast.success("Contraseña actualizada con éxito");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message || "Error al restablecer la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Navbar />
      
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shadow-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl gradient-text">PlatfomLive</span>
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-1">
            {step === 1 ? "Recuperar contraseña" : "Nueva contraseña"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 1 
              ? "Te enviaremos un código de seguridad" 
              : `Ingresá el código enviado a ${email}`}
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-[2rem] p-8 md:p-10 border border-white/8 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl" />
          
          {step === 1 ? (
            <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-6 relative">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium ml-1">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="input-dark h-12 pl-10 rounded-2xl"
                    {...forgotForm.register("email")}
                  />
                </div>
                {forgotForm.formState.errors.email && (
                  <p className="text-xs text-red-400 ml-1">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient text-white border-0 h-12 rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.02]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enviar código"}
              </Button>

              <Link 
                href="/login" 
                className="flex items-center justify-center gap-2 text-sm text-white/40 hover:text-white transition-colors mt-4"
              >
                <ChevronLeft className="w-4 h-4" />
                Volver al login
              </Link>
            </form>
          ) : (
            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-6 relative">
              {/* Dummy input to 'trap' browser autofill */}
              <input type="text" name="prevent_autofill" style={{ display: 'none' }} tabIndex={-1} />
              
              <div className="space-y-2">
                {/* Hidden username field to satisfy browser password managers */}
                <input type="hidden" name="username" value={email} autoComplete="username" />
                
                <Label htmlFor="verificationCode" className="text-sm font-medium ml-1">Código de 6 dígitos</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <Input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    autoComplete="one-time-code"
                    className="input-dark h-12 pl-10 rounded-2xl font-mono tracking-[0.5em] text-center"
                    {...resetForm.register("code")}
                  />
                </div>
                {resetForm.formState.errors.code && (
                  <p className="text-xs text-red-400 ml-1">{resetForm.formState.errors.code.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium ml-1">Nueva Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      id="newPassword"
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="input-dark h-12 pl-10 pr-10 rounded-2xl"
                      {...resetForm.register("newPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.newPassword && (
                    <p className="text-xs text-red-400 ml-1">{resetForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium ml-1">Confirmar Contraseña</Label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="input-dark h-12 pl-10 pr-10 rounded-2xl"
                      {...resetForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {resetForm.formState.errors.confirmPassword && (
                    <p className="text-xs text-red-400 ml-1">{resetForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full btn-gradient text-white border-0 h-12 rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.02]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Actualizar Contraseña"}
              </Button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-white/40 hover:text-white transition-colors"
              >
                ¿No recibiste el código? Volver a intentar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
