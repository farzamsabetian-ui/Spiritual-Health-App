/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  HandHeart, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Smartphone,
  Key,
  Fingerprint,
  RefreshCw,
  Copy,
  Check
} from "lucide-react";
import { UserSession } from "../types";

interface LoginProps {
  onLoginSuccess: (user: UserSession) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  // Credenciales estándar
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Control de fuerza bruta & Deslizador Captcha Humano
  const [failedOnce, setFailedOnce] = useState<boolean>(false);
  const [sliderVal, setSliderVal] = useState<number>(0);
  const [captchaPassed, setCaptchaPassed] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [lockTimeLeft, setLockTimeLeft] = useState<number>(0);

  // Estados para MFA (Doble Factor)
  const [mfaRequired, setMfaRequired] = useState<boolean>(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [otpSimulated, setOtpSimulated] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState<string[]>(Array(6).fill(""));
  const [copiedMfa, setCopiedMfa] = useState<boolean>(false);

  // Refs para inputs individuales de MFA
  const mfaInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Temporizador para cuenta regresiva en caso de bloqueo
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (lockTimeLeft > 0) {
      timer = setInterval(() => {
        setLockTimeLeft((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedOnce(false);
            setCaptchaPassed(false);
            setSliderVal(0);
            setError(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockTimeLeft]);

  // Enfocar el primer input de MFA cuando aparece la pantalla
  useEffect(() => {
    if (mfaRequired && mfaInputRefs.current[0]) {
      setTimeout(() => {
        mfaInputRefs.current[0]?.focus();
      }, 300);
    }
  }, [mfaRequired]);

  // Manejo del envío del formulario de credenciales (Paso 1)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLocked) {
      setError(`Cuenta bloqueada temporalmente. Por favor espere ${lockTimeLeft} segundos.`);
      return;
    }

    // Si ya falló una vez, requiere el captcha deslizable
    if (failedOnce && !captchaPassed) {
      setError("Verificación Humana Requerida: Por favor, deslice el control verde hacia la derecha antes de continuar.");
      return;
    }

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setIsLocked(true);
        setLockTimeLeft(data.remainingSeconds || 60);
        setCaptchaPassed(false);
        setSliderVal(0);
        throw new Error(data.error || "Límite de intentos excedido.");
      }

      if (!res.ok) {
        setFailedOnce(true);
        setCaptchaPassed(false);
        setSliderVal(0);
        throw new Error(data.error || "Algo salió mal al procesar la solicitud.");
      }

      // Si el servidor indica que requiere MFA
      if (data.mfaRequired) {
        setMfaRequired(true);
        setTempToken(data.tempToken);
        setOtpSimulated(data.otpSimulated);
        setMfaCode(Array(6).fill(""));
        setError(null);
        return;
      }

      // Inicio de sesión directo para Miembros de Cuerpo Auxiliar
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || "Fallo en la comunicación con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Manejo de la verificación del código MFA (Paso 2)
  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const code = mfaCode.join("").trim();
    if (code.length < 6) {
      setError("Por favor, ingrese el código completo de 6 dígitos.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "El código de seguridad ingresado es incorrecto.");
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || "Fallo al verificar el código de doble factor.");
    } finally {
      setLoading(false);
    }
  };

  // Cancelar MFA y regresar a credenciales
  const handleCancelMfa = () => {
    setMfaRequired(false);
    setTempToken(null);
    setOtpSimulated(null);
    setMfaCode(Array(6).fill(""));
    setError(null);
  };

  // Copiar código simulado para comodidad del usuario
  const handleCopyOtp = () => {
    if (otpSimulated) {
      navigator.clipboard.writeText(otpSimulated);
      setCopiedMfa(true);
      setTimeout(() => setCopiedMfa(false), 2000);

      // Autofill para mayor comodidad si el usuario quiere
      const digits = otpSimulated.split("");
      setMfaCode(digits);
      if (mfaInputRefs.current[5]) {
        mfaInputRefs.current[5]?.focus();
      }
    }
  };

  // Manejar el cambio de dígito en inputs individuales de MFA
  const handleMfaDigitChange = (val: string, index: number) => {
    if (isNaN(Number(val))) return;

    const newCode = [...mfaCode];
    newCode[index] = val.substring(val.length - 1); // Tomar solo el último caracter
    setMfaCode(newCode);

    // Auto-enfocar el siguiente campo si se ingresa un dígito
    if (val !== "" && index < 5) {
      mfaInputRefs.current[index + 1]?.focus();
    }
  };

  // Manejar la tecla Backspace para retroceder
  const handleMfaDigitKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (mfaCode[index] === "" && index > 0) {
        const newCode = [...mfaCode];
        newCode[index - 1] = "";
        setMfaCode(newCode);
        mfaInputRefs.current[index - 1]?.focus();
      } else {
        const newCode = [...mfaCode];
        newCode[index] = "";
        setMfaCode(newCode);
      }
    }
  };

  // Pegar código completo en las cajitas de MFA
  const handleMfaPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (pastedData.length === 6 && !isNaN(Number(pastedData))) {
      setMfaCode(pastedData.split(""));
      mfaInputRefs.current[5]?.focus();
    }
  };

  return (
    <div 
      id="login_screen" 
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-10 select-none bg-[#FBF9F6]"
    >
      {/* Soft warm elegant glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#8FA89B]/5 blur-[100px] pointer-events-none z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#8FA89B]/5 blur-[100px] pointer-events-none z-10" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md overflow-hidden rounded-[24px] border border-[#EAE5DF] bg-white shadow-[0_15px_40px_rgba(61,58,55,0.04)] z-30 p-6 sm:p-10"
      >
        {/* Floating delicate highlights */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#EAE5DF] to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8FA89B]/10 to-transparent" />

        <AnimatePresence mode="wait">
          {!mfaRequired ? (
            // PASO 1: Formulario de credenciales estándar con Rate Limiting y Slider Captcha
            <motion.div
              key="step_credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Card Header */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 shadow-sm">
                    <HandHeart className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[10px] tracking-widest text-[#8FA89B] uppercase font-bold mb-1">
                  Portal de Salud Espiritual
                </p>
                <h2 className="text-3xl font-semibold font-serif text-[#3D3A37] tracking-tight">
                  Bienvenido
                </h2>
                <p className="mt-2 text-xs text-[#6B6661] font-medium leading-relaxed max-w-sm mx-auto">
                  Inicie sesión para acceder a su espacio.
                </p>
              </div>

              {/* Form Error Banner */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-5 p-3.5 rounded-xl border text-xs font-medium flex flex-col gap-1 shadow-sm ${
                    isLocked 
                      ? "bg-amber-50 border-amber-200 text-amber-800" 
                      : "bg-red-50 border-red-200 text-red-655"
                  }`}
                  id="login_error_banner"
                >
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                    {isLocked ? (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 animate-bounce" />
                        <span>Acceso Bloqueado Temporalmente</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Alerta de Seguridad de Ingreso</span>
                      </>
                    )}
                  </div>
                  <span>{error}</span>
                </motion.div>
              )}

              {/* Bloqueo por Fuerza Bruta (Cuenta Regresiva) */}
              {isLocked ? (
                <div className="p-6 rounded-2xl bg-[#FBF9F6] border border-[#EAE5DF] text-center space-y-4 my-4">
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 animate-pulse">
                      <RefreshCw className="h-6 w-6 animate-spin" style={{ animationDuration: "3s" }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#3D3A37]">Enfriamiento de Seguridad Activo</p>
                    <p className="text-xs text-[#6B6661]">Múltiples credenciales erróneas detectadas. El sistema se ha bloqueado temporalmente para proteger el portal.</p>
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#8FA89B] tracking-wider">
                    00:{lockTimeLeft < 10 ? `0${lockTimeLeft}` : lockTimeLeft}
                  </div>
                  <p className="text-[10px] text-[#A8A29C]">Por favor, espere para realizar un nuevo intento.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" id="login_form">
                  {/* Correo */}
                  <div className="group">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5F756B] mb-2 transition-colors group-focus-within:text-[#8FA89B]">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-[#A8A29C] group-focus-within:text-[#8FA89B] transition-colors">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input
                        id="input_email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nombre@ejemplo.com"
                        className="w-full rounded-xl border border-[#E5E0DA] bg-[#FDFDFD] py-3.5 pl-11 pr-4 text-sm text-[#3D3A37] placeholder-[#A8A29C] outline-none transition-all focus:border-[#8FA89B] focus:bg-white focus:ring-4 focus:ring-[#8FA89B]/10 shadow-[0_2px_4px_rgba(61,58,55,0.01)]"
                      />
                    </div>
                  </div>

                  {/* Contraseña */}
                  <div className="group">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5F756B] mb-2 transition-colors group-focus-within:text-[#8FA89B]">
                      Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="input_password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-[#E5E0DA] bg-[#FDFDFD] py-3.5 pl-4 pr-11 text-sm text-[#3D3A37] placeholder-[#A8A29C] outline-none transition-all focus:border-[#8FA89B] focus:bg-white focus:ring-4 focus:ring-[#8FA89B]/10 shadow-[0_2px_4px_rgba(61,58,55,0.01)]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#A8A29C] hover:text-[#8FA89B] transition-colors cursor-pointer"
                        title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>
                  </div>

                  {/* DESLIZADOR CAPTCHA DE SEGURIDAD (Se muestra tras 1 intento erróneo) */}
                  {failedOnce && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-1.5 pt-1"
                    >
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#8FA89B]">
                        Prueba de Humanidad Requerida (Anti-Bot)
                      </label>
                      <div className="relative h-11 w-full rounded-xl bg-[#FBF9F6] border border-[#EAE5DF] overflow-hidden flex items-center justify-center select-none shadow-inner">
                        <div 
                          className="absolute left-0 top-0 bottom-0 bg-[#8FA89B]/10 transition-all duration-75 flex items-center justify-end pr-2"
                          style={{ width: `${sliderVal}%` }}
                        />
                        
                        <span className="text-xs font-semibold text-[#6B6661] z-10 pointer-events-none">
                          {captchaPassed ? "✓ Verificación Humana Completada" : "Desliza para verificar >>>"}
                        </span>

                        {!captchaPassed && (
                          <input 
                            id="slider_captcha"
                            type="range" 
                            min="0" 
                            max="100" 
                            value={sliderVal} 
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setSliderVal(val);
                              if (val >= 95) {
                                setCaptchaPassed(true);
                                setSliderVal(100);
                              }
                            }}
                            onMouseUp={() => {
                              if (sliderVal < 95) setSliderVal(0);
                            }}
                            onTouchEnd={() => {
                              if (sliderVal < 95) setSliderVal(0);
                            }}
                            className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-20"
                          />
                        )}

                        <div 
                          className="absolute left-1 top-1 bottom-1 w-9 rounded-lg bg-white border border-[#EAE5DF] shadow-sm flex items-center justify-center pointer-events-none z-10 transition-all duration-75"
                          style={{ left: captchaPassed ? "calc(100% - 38px)" : `calc(${sliderVal}% * 0.85 + 4px)` }}
                        >
                          <Fingerprint className={`h-4.5 w-4.5 ${captchaPassed ? "text-[#8FA89B]" : "text-[#A8A29C] animate-pulse"}`} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Recuerdame & Links de ayuda */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-[#6B6661] select-none hover:text-[#3D3A37] transition-colors">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-[#E5E0DA] bg-white accent-[#8FA89B] cursor-pointer focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="font-medium">Mantener sesión iniciada</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setError("Por favor, póngase en contacto con el Administrador principal para recuperar o restablecer sus credenciales encriptadas.")}
                      className="text-[#5F756B] hover:text-[#3D3A37] font-semibold transition-colors cursor-pointer hover:underline underline-offset-4"
                    >
                      ¿Olvidó contraseña?
                    </button>
                  </div>

                  {/* Botón de Enviar */}
                  <button
                    id="auth_submit_btn"
                    type="submit"
                    disabled={loading || (failedOnce && !captchaPassed)}
                    className="relative mt-2 w-full rounded-xl bg-[#8FA89B] hover:bg-[#7D9689] py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(143,168,155,0.15)] hover:shadow-[0_6px_20px_rgba(143,168,155,0.25)] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2 overflow-hidden group"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <>
                        <span>Ingresar</span>
                        <ArrowRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
                  {/* Bottom Footer Text */}
                  <div className="mt-8 pt-6 border-t border-[#F4EFEA] text-center">
                    <p className="text-xs text-[#8A847F] italic font-serif">
                      Gracias por el cuidado que brinda.
                    </p>
                  </div>
                </form>
              )}
            </motion.div>
          ) : (
            // PASO 2: Verificación de Doble Factor (MFA) para Administradores y Consejeros
            <motion.div
              key="step_mfa"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Volver */}
              <button
                type="button"
                onClick={handleCancelMfa}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6661] hover:text-[#3D3A37] transition-colors cursor-pointer group"
                id="btn_back_to_credentials"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Volver a credenciales</span>
              </button>

              {/* MFA Header */}
              <div className="text-center">
                <div className="relative inline-block mb-3">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8FA89B]/10 border border-[#8FA89B]/20 text-[#8FA89B] shadow-sm">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold font-serif text-[#3D3A37] tracking-tight">
                  Autenticación Doble Factor (MFA)
                </h2>
                <p className="mt-1.5 text-[10px] font-bold text-[#8FA89B] uppercase tracking-widest leading-relaxed">
                  Requerido para Administradores, Consejeros y Equipo de Salud Espiritual
                </p>
                <p className="mt-3 text-xs text-[#6B6661] max-w-sm mx-auto leading-relaxed">
                  Para resguardar el portal, se ha enviado un código de seguridad temporal de 6 dígitos. Ingrésalo a continuación para completar tu acceso seguro.
                </p>
              </div>

              {/* Toast/Notificación Inteligente Simuladora de Token */}
              {otpSimulated && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-[#FBF9F6] border border-[#EAE5DF] text-xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#8FA89B]">
                    <span className="flex items-center gap-1">
                      <Smartphone className="h-3.5 w-3.5" />
                      Dispositivo Seguro (Simulador OTP)
                    </span>
                    <span className="text-[#8FA89B]">Enviado vía SMS/Email</span>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg p-2.5 border border-[#EAE5DF] shadow-sm">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-[#8FA89B]" />
                      <span className="font-mono text-sm font-bold tracking-widest text-[#3D3A37]">
                        {otpSimulated}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyOtp}
                      className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#FBF9F6] hover:bg-[#8FA89B]/10 text-[#5F756B] transition-all flex items-center gap-1 border border-[#EAE5DF]"
                      title="Copiar y Autocompletar"
                      id="btn_copy_otp"
                    >
                      {copiedMfa ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span className="text-emerald-600">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar y Llenar</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* MFA Error Banner */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-655 flex items-center gap-2"
                >
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* 6-Digit Code Inputs Form */}
              <form onSubmit={handleVerifyMfa} className="space-y-6">
                <div className="flex justify-between items-center gap-2 sm:gap-3" id="mfa_inputs_container">
                  {mfaCode.map((digit, idx) => (
                    <input
                      key={`mfa_digit_${idx}`}
                      id={`mfa_input_${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleMfaDigitChange(e.target.value, idx)}
                      onKeyDown={(e) => handleMfaDigitKeyDown(e, idx)}
                      onPaste={handleMfaPaste}
                      ref={(el) => (mfaInputRefs.current[idx] = el)}
                      className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold rounded-xl border border-[#E5E0DA] bg-white shadow-sm text-[#3D3A37] focus:border-[#8FA89B] focus:ring-4 focus:ring-[#8FA89B]/10 outline-none transition-all font-mono"
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <button
                    id="mfa_submit_btn"
                    type="submit"
                    disabled={loading || mfaCode.some(d => d === "")}
                    className="w-full rounded-xl bg-[#8FA89B] hover:bg-[#7D9689] py-3.5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(143,168,155,0.15)] hover:shadow-[0_6px_20px_rgba(143,168,155,0.25)] transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4.5 w-4.5" />
                        <span>Completar Verificación MFA</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-[#8A847F]">
                    ¿No recibiste el código?{" "}
                    <button 
                      type="button" 
                      onClick={() => {
                        setError(null);
                        setMfaCode(Array(6).fill(""));
                        // Simular reenvío
                        fetch("/api/auth/login", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ email, password }),
                        })
                        .then(r => r.json())
                        .then(d => {
                          if (d.mfaRequired) {
                            setOtpSimulated(d.otpSimulated);
                            setTempToken(d.tempToken);
                            setError("Código reenviado con éxito.");
                            setTimeout(() => setError(null), 3000);
                          }
                        });
                      }}
                      className="text-[#5F756B] font-semibold hover:underline"
                    >
                      Reenviar código
                    </button>
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
