/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserSession, SystemNotification } from "./types";
import Login from "./components/Login";
import UserForm from "./components/UserForm";
import AdminDashboard from "./components/AdminDashboard";
import { 
  HandHeart, 
  Bell, 
  X, 
  CheckCircle, 
  RefreshCcw, 
  RefreshCw,
  Download,
  Table,
  Shield,
  Sun, 
  Moon, 
  User, 
  LogOut, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  FileText, 
  Mail, 
  Info, 
  Globe, 
  Sparkles, 
  Lock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Database,
  Grid,
  Users,
  Sliders,
  HelpCircle,
  BookOpen,
  Image,
  Sprout
} from "lucide-react";

const adminNavItems = [
  { id: "submissions", label: "Reporte de Envíos", icon: Grid },
  { id: "stats", label: "Estadísticas", icon: Globe },
  { id: "repositorio", label: "Repositorio de Guía", icon: BookOpen },
  { id: "builder", label: "Editor", icon: Sliders },
  { id: "users", label: "Usuarios", icon: Users },
  { id: "database", label: "Base de Datos", icon: Database },
];

export default function App() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [toast, setToast] = useState<{ id: string; title: string; message: string; type: string } | null>(null);
  const [isStatsActive, setIsStatsActive] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  const [activeTab, setActiveTab] = useState<"inicio" | "submissions" | "builder" | "reports" | "notifications" | "users" | "database" | "stats">(() => {
    const savedSession = localStorage.getItem("validaform_session");
    if (savedSession) {
      try {
        const u = JSON.parse(savedSession);
        if (u && (u.role === "auditor" || u.role === "health_team")) {
          return "inicio";
        }
      } catch (e) {}
    }
    return "submissions";
  });
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [mcaHomeTrigger, setMcaHomeTrigger] = useState<number>(0);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    return saved === "true";
  });
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState<boolean>(false);

  // UI state for dropdowns and interactive footer modals
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState<boolean>(false);
  const [dashboardSyncing, setDashboardSyncing] = useState<boolean>(false);
  const [isFormalReportActive, setIsFormalReportActive] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<"terms" | "privacy" | "contact" | null>(null);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  const isFullWidth = isStatsActive || (user !== null && (user.role === "admin" || user.role === "auditor" || user.role === "health_team"));

  const navItems = user?.role === "admin"
    ? adminNavItems
    : [
        adminNavItems.find(item => item.id === "stats")!,
        adminNavItems.find(item => item.id === "repositorio")!,
        adminNavItems.find(item => item.id === "submissions")!
      ];

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.add("light");
    localStorage.setItem("app_theme", "light");
  }, []);

  // Listen to dashboard state updates
  useEffect(() => {
    function handleSyncState(e: Event) {
      const customEvent = e as CustomEvent<{ loading: boolean }>;
      if (customEvent.detail) {
        setDashboardSyncing(customEvent.detail.loading);
      }
    }
    function handleFormalState(e: Event) {
      const customEvent = e as CustomEvent<{ active: boolean }>;
      if (customEvent.detail) {
        setIsFormalReportActive(customEvent.detail.active);
      }
    }
    window.addEventListener('dashboard-sync-state', handleSyncState as EventListener);
    window.addEventListener('dashboard-formal-state', handleFormalState as EventListener);
    return () => {
      window.removeEventListener('dashboard-sync-state', handleSyncState as EventListener);
      window.removeEventListener('dashboard-formal-state', handleFormalState as EventListener);
    };
  }, []);

  // Click outside to close dropdowns and sidebar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarMobileOpen(false);
      }
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleTheme = () => {
    // Force light mode unconditionally
  };

  const syncDataWithBackend = async () => {
    try {
      const emailsToRemove = ["maria.gomez@ejemplo.com", "juancarlos@ejemplo.com", "sofia.m@ejemplo.com"];
      const namesToRemove = ["maría gómez", "juan carlos pérez", "sofía martínez", "maria gomez", "juan carlos perez", "sofia martinez"];

      const localUsers = JSON.parse(localStorage.getItem("validaform_custom_users") || "[]").filter((u: any) => {
        if (!u) return false;
        const emailLower = (u.email || "").toLowerCase().trim();
        const nameLower = (u.name || "").toLowerCase().trim();
        return !emailsToRemove.includes(emailLower) && !namesToRemove.includes(nameLower);
      });

      const localSubmissions = JSON.parse(localStorage.getItem("validaform_submissions") || "[]").filter((sub: any) => {
        if (!sub) return false;
        const userEmailLower = (sub.userEmail || "").toLowerCase().trim();
        if (emailsToRemove.includes(userEmailLower)) return false;
        if (sub.data) {
          const fCorreo = (sub.data.f_correo || "").toLowerCase().trim();
          if (emailsToRemove.includes(fCorreo)) return false;
          const fNombre = (sub.data.f_nombre || "").toLowerCase().trim();
          if (namesToRemove.includes(fNombre)) return false;
          for (const key of Object.keys(sub.data)) {
            const val = sub.data[key];
            if (typeof val === "string") {
              const valLower = val.toLowerCase().trim();
              if (emailsToRemove.includes(valLower) || namesToRemove.includes(valLower)) return false;
            }
          }
        }
        return true;
      });

      localStorage.setItem("validaform_custom_users", JSON.stringify(localUsers));
      localStorage.setItem("validaform_submissions", JSON.stringify(localSubmissions));
      
      const res = await fetch("/api/sync-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: localUsers, submissions: localSubmissions })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.users) {
          const defaultEmails: string[] = [];
          const customUsers = data.users.filter((u: any) => {
            if (!u) return false;
            const emailLower = u.email.toLowerCase();
            return !defaultEmails.includes(emailLower) && !emailsToRemove.includes(emailLower);
          });
          localStorage.setItem("validaform_custom_users", JSON.stringify(customUsers));

          // REFRESH CURRENT LOGGED-IN USER SESSION FROM THE DATABASE IN REAL-TIME
          const savedSession = localStorage.getItem("validaform_session");
          if (savedSession) {
            try {
              const currentSess = JSON.parse(savedSession);
              const matchedUser = data.users.find((u: any) => u.email.toLowerCase() === currentSess.email.toLowerCase());
              if (matchedUser) {
                const updatedSess = {
                  ...currentSess,
                  name: matchedUser.name,
                  role: matchedUser.role,
                  country: matchedUser.country,
                  region: matchedUser.region,
                  driveUrl: matchedUser.driveUrl,
                  geographicGroup: matchedUser.geographicGroup ? String(matchedUser.geographicGroup).normalize("NFC") : undefined
                };
                localStorage.setItem("validaform_session", JSON.stringify(updatedSess));
                setUser(updatedSess);
              }
            } catch (e) {
              console.error("Error updating user session on sync:", e);
            }
          }
        }
        if (data.submissions) {
          const cleanedBackendSubs = data.submissions.filter((sub: any) => {
            if (!sub) return false;
            const userEmailLower = (sub.userEmail || "").toLowerCase().trim();
            if (emailsToRemove.includes(userEmailLower)) return false;
            if (sub.data) {
              const fCorreo = (sub.data.f_correo || "").toLowerCase().trim();
              if (emailsToRemove.includes(fCorreo)) return false;
              const fNombre = (sub.data.f_nombre || "").toLowerCase().trim();
              if (namesToRemove.includes(fNombre)) return false;
            }
            return true;
          });
          localStorage.setItem("validaform_submissions", JSON.stringify(cleanedBackendSubs));
        }
      }
    } catch (e) {
      console.error("Error al sincronizar datos locales con el backend:", e);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error("Error al marcar notificaciones como leídas:", e);
    }
  };

  // Cargar sesión del almacenamiento local para persistencia y sincronizar datos
  useEffect(() => {
    const savedSession = localStorage.getItem("validaform_session");
    let currentUser: UserSession | null = null;
    if (savedSession) {
      try {
        currentUser = JSON.parse(savedSession);
        if (currentUser && currentUser.geographicGroup) {
          currentUser.geographicGroup = String(currentUser.geographicGroup).normalize("NFC");
        }
        setUser(currentUser);
      } catch (e) {
        localStorage.removeItem("validaform_session");
      }
    }
    
    const adminUser = currentUser;
    syncDataWithBackend().finally(() => {
      setIsSyncing(false);
      if (adminUser && adminUser.role === "admin") {
        fetchNotifications();
      }
    });
  }, []);

  // Escuchar notificaciones del SSE del lado del Servidor cuando el rol es ADMINISTRADOR
  useEffect(() => {
    if (!user || user.role !== "admin") {
      setSseConnected(false);
      return;
    }

    const eventSource = new EventSource("/api/notifications/stream");

    eventSource.onmessage = (event) => {
      try {
        if (!event.data || event.data.trim() === "") return;
        const data = JSON.parse(event.data);
        
        if (data.connected) {
          setSseConnected(true);
          return;
        }

        if (data.id) {
          setNotifications(prev => {
            // Evitar duplicados
            if (prev.some(n => n.id === data.id)) return prev;
            return [data, ...prev];
          });
          
          // Mostrar Toast en tiempo real
          setToast({
            id: data.id,
            title: data.title,
            message: data.message,
            type: data.type
          });

          // Reproducir vibración
          if (navigator.vibrate) {
            navigator.vibrate(100);
          }
        }
      } catch (err) {
        console.error("Error al decodificar notificación SSE", err);
      }
    };

    eventSource.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoginSuccess = (session: UserSession) => {
    const normalizedSession = {
      ...session,
      geographicGroup: session.geographicGroup ? String(session.geographicGroup).normalize("NFC") : undefined
    };
    setUser(normalizedSession);
    localStorage.setItem("validaform_session", JSON.stringify(normalizedSession));
    if (normalizedSession.role === "auditor" || normalizedSession.role === "health_team") {
      setActiveTab("inicio");
    } else {
      setActiveTab("submissions");
    }
    if (normalizedSession.role === "admin") {
      fetchNotifications();
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsStatsActive(false);
    localStorage.removeItem("validaform_session");
    setNotifications([]);
    setSseConnected(false);
    setIsNotificationOpen(false);
    setIsProfileOpen(false);
    setIsMenuOpen(false);
    setIsSidebarMobileOpen(false);
  };

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-300 flex flex-col items-center justify-center font-sans relative overflow-hidden">
        {/* Decorative ambient background */}
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#8FA89B]/10 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
        <div className="flex flex-col items-center gap-4 z-10">
          <RefreshCcw className="h-10 w-10 text-[#8FA89B] animate-spin" />
          <p className="text-sm text-slate-400 font-medium font-sans">Iniciando y sincronizando base de datos...</p>
        </div>
      </div>
    );
  }

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-300 flex font-sans transition-colors duration-300 relative">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(143,168,155,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(143,168,155,0.035)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/4 w-[450px] h-[450px] bg-[#8FA89B]/5 dark:bg-[#8FA89B]/4 rounded-full blur-[110px] pointer-events-none -translate-y-1/2 z-0" />
      <div className="absolute bottom-10 right-1/4 w-[550px] h-[550px] bg-[#5F756B]/5 dark:bg-[#5F756B]/4 rounded-full blur-[130px] pointer-events-none translate-y-1/3 z-0" />

      {/* Retractable Sidebar for Admin & Auditor (Desktop) */}
      {user && (user.role === "admin" || user.role === "auditor" || user.role === "health_team") && (
        <aside
          ref={sidebarRef}
          className={`hidden md:flex flex-col shrink-0 border-r border-[#EAE5DF] dark:border-slate-900 bg-[#FBF9F6]/90 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300 sticky top-0 h-screen z-50 overflow-visible ${
            isSidebarCollapsed ? "w-20" : "w-64"
          }`}
        >
          {/* Floating Collapse/Expand Button */}
          <button
            onClick={() => {
              const newState = !isSidebarCollapsed;
              setIsSidebarCollapsed(newState);
              localStorage.setItem("admin_sidebar_collapsed", String(newState));
            }}
            className="absolute -right-3.5 top-6 z-50 flex h-7 w-7 items-center justify-center rounded-full border border-[#EAE5DF] bg-[#FBF9F6] text-[#8FA89B] shadow-sm hover:bg-[#8FA89B] hover:text-white hover:border-[#8FA89B] transition-all duration-300 cursor-pointer"
            title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>

          {/* Brand/Header matching height h-16 (Always Interactive Logo) */}
          <div className="h-16 flex items-center border-b border-[#EAE5DF] dark:border-slate-900/80 shrink-0 justify-center px-4">
            <button
              onClick={() => setActiveTab("inicio")}
              className={`flex items-center gap-3 overflow-hidden text-left focus:outline-none hover:opacity-85 transition-all active:scale-95 cursor-pointer ${
                isSidebarCollapsed ? "justify-center w-10 h-10" : "w-full"
              }`}
              title="Ir al inicio"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 shadow-sm">
                <HandHeart className="h-5 w-5 text-[#8FA89B]" strokeWidth={1.5} />
              </div>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col whitespace-nowrap"
                >
                  <span className="text-sm font-semibold font-serif text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight leading-none">
                    Salud Espiritual
                  </span>
                  <span className="text-[10px] text-[#8A847F] font-serif italic mt-0.5 leading-none">
                    {user.role === "admin" 
                      ? "Administrador" 
                      : user.role === "health_team" 
                      ? "Equipo de Salud Espiritual" 
                      : user.role === "auditor" 
                      ? "Consejero" 
                      : "Miembro de Cuerpo Auxiliar"}
                  </span>
                </motion.div>
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "repositorio") {
                      const url = user?.driveUrl || "https://drive.google.com/drive/u/2/folders/1z_9-wzWzxn3sWjtMZ88kgyGZnkpskWn_";
                      window.open(url, "_blank", "noopener,noreferrer");
                    } else {
                      setActiveTab(item.id as any);
                    }
                  }}
                  className={`flex items-center gap-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSidebarCollapsed 
                      ? "w-10 h-10 mx-auto justify-center p-0" 
                      : "w-full p-2.5 px-3.5"
                  } ${
                    isActive
                      ? "bg-[#8FA89B] text-white shadow-[0_4px_12px_rgba(143,168,155,0.25)]"
                      : "text-[#6B6661] dark:text-slate-400 hover:bg-[#8FA89B]/10 dark:hover:bg-slate-900/50 hover:text-[#3D3A37] dark:hover:text-slate-200"
                  }`}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-[#8FA89B]"}`} strokeWidth={isActive ? 2 : 1.5} />
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="truncate font-serif font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer of Sidebar with Integrated Settings/User details */}
          <div className="p-3 border-t border-[#EAE5DF] dark:border-slate-900/80 shrink-0 bg-[#FBF9F6]/40 dark:bg-slate-950/20">
            {!isSidebarCollapsed ? (
              /* Expanded Footer Widget */
              <div 
                className="relative flex items-center justify-between p-2 rounded-xl border border-[#EAE5DF] bg-[#FBF9F6]/90 dark:bg-slate-900/30 hover:bg-[#F4EFEA]/80 dark:hover:bg-slate-900/60 transition-all duration-200 group"
              >
                {/* Profile Trigger Area */}
                <div 
                  ref={profileRef}
                  className="relative flex-1 min-w-0"
                >
                  <button
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotificationOpen(false);
                    }}
                    className="flex items-center gap-2 w-full text-left cursor-pointer focus:outline-none"
                  >
                    {/* User Avatar */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8FA89B] text-white shrink-0 font-serif font-semibold text-xs shadow-sm">
                      {(() => {
                        const name = user.name;
                        const email = user.email;
                        if (name) {
                          const parts = name.trim().split(/\s+/);
                          if (parts.length > 1) {
                            return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                          }
                          return parts[0].slice(0, 2).toUpperCase();
                        }
                        return email ? email.slice(0, 2).toUpperCase() : "SE";
                      })()}
                    </div>
                    {/* Metadata */}
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="text-[11px] font-bold text-[#3D3A37] dark:text-white truncate font-serif">
                        {user.name || user.email.split("@")[0]}
                      </div>
                      <div className="text-[9px] text-[#8A847F] truncate font-sans">
                        {user.email}
                      </div>
                    </div>
                    <ChevronDown className={`h-3.5 w-3.5 text-[#8FA89B] transition-transform shrink-0 ${isProfileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Profile Details Popover (Opens upwards above footer) */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: -10 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-12 left-0 rounded-[16px] border border-[#EAE5DF]/60 dark:border-slate-800 bg-[#FCFAF7]/95 dark:bg-slate-950/95 backdrop-blur-md p-4 z-50 w-64 flex flex-col gap-3 shadow-lg"
                      >
                        <div className="px-1 text-left">
                          <p className="text-[11px] text-[#8A847F] dark:text-slate-400 font-serif leading-relaxed">
                            Hola, {(() => {
                              const name = user.name;
                              const email = user.email;
                              if (name) {
                                return name.trim().split(/\s+/)[0];
                              }
                              return email ? email.split("@")[0] : "User";
                            })()} - <span className="font-sans not-italic text-[10px] text-[#A8A29C] dark:text-slate-500 truncate block max-w-full">{user.email}</span>
                          </p>
                        </div>

                        <div className="h-[1px] w-full bg-[#F4EFEA] dark:bg-slate-800" />

                        <div className="px-1 text-left text-[11px] text-[#8A847F] dark:text-slate-400 font-serif space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Rol:</span>
                            <span className="font-semibold text-[#5F756B] dark:text-[#8FA89B] text-[10px]">
                              {user.role === "admin" 
                                ? "Administrador" 
                                : user.role === "auditor" 
                                ? "Consejero" 
                                : user.role === "health_team"
                                ? `Equipo de Salud Espiritual (${user.geographicGroup || "Sin asignar"})`
                                : "Miembro de Cuerpo Auxiliar"}
                            </span>
                          </div>
                          {(user.country || user.region) && (
                            <div className="flex justify-between items-center">
                              <span>Territorio:</span>
                              <span className="font-semibold text-[#5F756B] dark:text-[#8FA89B] text-[10px] truncate max-w-[125px]">
                                {[user.region, user.country].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="h-[1px] w-full bg-[#F4EFEA] dark:bg-slate-800" />

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-[#FBF9F6] dark:hover:bg-slate-900 py-2.5 text-xs font-semibold text-[#3D3A37] dark:text-slate-300 border border-[#EAE5DF]/60 hover:border-[#EAE5DF] dark:border-slate-800 transition-all duration-300 cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5 text-[#8FA89B]" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Right Side: Notification Bell Button */}
                {user && user.role === "admin" && (
                  <div className="relative shrink-0 ml-2" ref={notificationRef}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationOpen(!isNotificationOpen);
                        setIsProfileOpen(false);
                        if (!isNotificationOpen) {
                          markAllNotificationsRead();
                        }
                      }}
                      className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-150/80 dark:hover:bg-slate-800 text-[#8FA89B] transition-all duration-200 cursor-pointer focus:outline-none"
                      title="Alertas de Envío"
                    >
                      <Bell className="h-4.5 w-4.5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-emerald-500 shadow-md animate-pulse" />
                      )}
                    </button>

                    {/* Notifications Dropdown Panel */}
                    <AnimatePresence>
                      {isNotificationOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, x: -10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-0 left-full ml-4 rounded-[16px] border border-[#EAE5DF]/60 dark:border-slate-800 bg-[#FCFAF7]/95 dark:bg-slate-950/95 backdrop-blur-md p-2 z-50 overflow-hidden w-80 shadow-lg"
                        >
                          <div className="px-3.5 py-2.5 border-b border-[#F4EFEA] dark:border-slate-850/60 flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#3D3A37] dark:text-white font-serif">Alertas de Envío</span>
                            <span className="text-[10px] text-white font-semibold bg-[#8FA89B] px-2 py-0.5 rounded-full">
                              {notifications.length} Totales
                            </span>
                          </div>
                          
                          <div className="max-h-60 overflow-y-auto divide-y divide-[#F4EFEA] dark:divide-slate-900">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-8 text-center text-xs text-[#8A847F] italic font-serif">
                                No hay alertas registradas
                              </div>
                            ) : (
                              notifications.map((n) => (
                                <div key={n.id} className={`p-3 text-xs transition-colors hover:bg-[#FBF9F6] dark:hover:bg-slate-900/40 ${!n.read ? "bg-[#8FA89B]/5" : ""}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-semibold text-[#3D3A37] dark:text-slate-200 font-serif">{n.title}</span>
                                    <span className="text-[9px] text-[#A8A29C] shrink-0 font-sans">{n.timestamp ? n.timestamp.split("T")[1]?.slice(0,5) || "" : ""}</span>
                                  </div>
                                  <p className="text-[#8A847F] dark:text-slate-400 text-[11px] mt-0.5 leading-snug font-serif">{n.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            ) : (
              /* Collapsed Footer Widget */
              <div className="flex flex-col items-center gap-3">
                {/* Notification Bell (Collapsed) */}
                {user && user.role === "admin" && (
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => {
                        setIsNotificationOpen(!isNotificationOpen);
                        setIsProfileOpen(false);
                        if (!isNotificationOpen) {
                          markAllNotificationsRead();
                        }
                      }}
                      className="relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-150/80 dark:hover:bg-slate-800 text-[#8FA89B] transition-all duration-200 cursor-pointer focus:outline-none"
                      title="Alertas de Envío"
                    >
                      <Bell className="h-4.5 w-4.5" />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-emerald-500 shadow-md animate-pulse" />
                      )}
                    </button>

                    {/* Notifications Dropdown Panel (Collapsed) */}
                    <AnimatePresence>
                      {isNotificationOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, x: -10 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.95, x: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-0 left-14 rounded-[16px] border border-[#EAE5DF]/60 dark:border-slate-800 bg-[#FCFAF7]/95 dark:bg-slate-950/95 backdrop-blur-md p-2 z-50 overflow-hidden w-80 shadow-lg"
                        >
                          <div className="px-3.5 py-2.5 border-b border-[#F4EFEA] dark:border-slate-850/60 flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#3D3A37] dark:text-white font-serif">Alertas de Envío</span>
                            <span className="text-[10px] text-white font-semibold bg-[#8FA89B] px-2 py-0.5 rounded-full">
                              {notifications.length} Totales
                            </span>
                          </div>
                          
                          <div className="max-h-60 overflow-y-auto divide-y divide-[#F4EFEA] dark:divide-slate-900">
                            {notifications.length === 0 ? (
                              <div className="px-4 py-8 text-center text-xs text-[#8A847F] italic font-serif">
                                No hay alertas registradas
                              </div>
                            ) : (
                              notifications.map((n) => (
                                <div key={n.id} className={`p-3 text-xs transition-colors hover:bg-[#FBF9F6] dark:hover:bg-slate-900/40 ${!n.read ? "bg-[#8FA89B]/5" : ""}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="font-semibold text-[#3D3A37] dark:text-slate-200 font-serif">{n.title}</span>
                                    <span className="text-[9px] text-[#A8A29C] shrink-0 font-sans">{n.timestamp ? n.timestamp.split("T")[1]?.slice(0,5) || "" : ""}</span>
                                  </div>
                                  <p className="text-[#8A847F] dark:text-slate-400 text-[11px] mt-0.5 leading-snug font-serif">{n.message}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Profile Avatar Trigger (Collapsed) */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotificationOpen(false);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8FA89B] text-white shrink-0 font-serif font-semibold text-xs shadow-sm hover:ring-2 hover:ring-[#8FA89B]/40 transition-all duration-200 cursor-pointer focus:outline-none"
                    title={`Mi Cuenta: ${user.name || user.email}`}
                  >
                    {(() => {
                      const name = user.name;
                      const email = user.email;
                      if (name) {
                        const parts = name.trim().split(/\s+/);
                        if (parts.length > 1) {
                          return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                        }
                        return parts[0].slice(0, 2).toUpperCase();
                      }
                      return email ? email.slice(0, 2).toUpperCase() : "SE";
                    })()}
                  </button>

                  {/* Profile Details Popover (Collapsed) */}
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, x: 15, y: -10 }}
                        animate={{ opacity: 1, scale: 1, x: 15, y: -10 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-0 left-14 rounded-[16px] border border-[#EAE5DF]/60 dark:border-slate-800 bg-[#FCFAF7]/95 dark:bg-slate-950/95 backdrop-blur-md p-4 z-50 w-64 flex flex-col gap-3 shadow-lg"
                      >
                        <div className="px-1 text-left">
                          <p className="text-[11px] text-[#8A847F] dark:text-slate-400 font-serif leading-relaxed">
                            Hola, {(() => {
                              const name = user.name;
                              const email = user.email;
                              if (name) {
                                return name.trim().split(/\s+/)[0];
                              }
                              return email ? email.split("@")[0] : "User";
                            })()} - <span className="font-sans not-italic text-[10px] text-[#A8A29C] dark:text-slate-500 truncate block max-w-full">{user.email}</span>
                          </p>
                        </div>

                        <div className="h-[1px] w-full bg-[#F4EFEA] dark:bg-slate-800" />

                        <div className="px-1 text-left text-[11px] text-[#8A847F] dark:text-slate-400 font-serif space-y-1">
                          <div className="flex justify-between items-center">
                            <span>Rol:</span>
                            <span className="font-semibold text-[#5F756B] dark:text-[#8FA89B] text-[10px]">
                              {user.role === "admin" 
                                ? "Administrador" 
                                : user.role === "auditor" 
                                ? "Consejero" 
                                : user.role === "health_team"
                                ? `Equipo de Salud Espiritual (${user.geographicGroup || "Sin asignar"})`
                                : "Miembro de Cuerpo Auxiliar"}
                            </span>
                          </div>
                          {(user.country || user.region) && (
                            <div className="flex justify-between items-center">
                              <span>Territorio:</span>
                              <span className="font-semibold text-[#5F756B] dark:text-[#8FA89B] text-[10px] truncate max-w-[125px]">
                                {[user.region, user.country].filter(Boolean).join(", ")}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="h-[1px] w-full bg-[#F4EFEA] dark:bg-slate-800" />

                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-[#FBF9F6] dark:hover:bg-slate-900 py-2.5 text-xs font-semibold text-[#3D3A37] dark:text-slate-300 border border-[#EAE5DF]/60 hover:border-[#EAE5DF] dark:border-slate-800 transition-all duration-300 cursor-pointer"
                        >
                          <LogOut className="h-3.5 w-3.5 text-[#8FA89B]" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Sliding Drawer for Admin & Auditor (Mobile) */}
      <AnimatePresence>
        {user && (user.role === "admin" || user.role === "auditor" || user.role === "health_team") && isSidebarMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex" id="mobile_sidebar_drawer_backdrop">
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            
            {/* Drawer Content */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-64 max-w-[80vw] h-full bg-[#FBF9F6] dark:bg-slate-950 border-r border-[#EAE5DF] dark:border-slate-900 flex flex-col z-50 p-4"
              id="mobile_sidebar_drawer"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#EAE5DF] dark:border-slate-850 mb-6">
                <button
                  onClick={() => {
                    setActiveTab("inicio");
                    setIsSidebarMobileOpen(false);
                  }}
                  className="flex items-center gap-3 text-left focus:outline-none hover:opacity-85 transition-all active:scale-95 cursor-pointer"
                  title="Volver al inicio"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 shadow-sm">
                    <HandHeart className="h-5 w-5 text-[#8FA89B]" strokeWidth={1.5} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold font-serif text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight leading-none">
                      Salud Espiritual
                    </span>
                    <span className="text-[10px] text-[#8A847F] font-serif italic mt-0.5 leading-none">
                      {user.role === "admin" 
                        ? "Administrador" 
                        : user.role === "health_team" 
                        ? "Equipo de Salud Espiritual" 
                        : user.role === "auditor" 
                        ? "Consejero" 
                        : "Miembro de Cuerpo Auxiliar"}
                    </span>
                  </div>
                </button>
                
                <button
                  onClick={() => setIsSidebarMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-[#3D3A37] hover:bg-[#8FA89B]/10 transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.id === "repositorio") {
                          const url = user?.driveUrl || "https://drive.google.com/drive/u/2/folders/1z_9-wzWzxn3sWjtMZ88kgyGZnkpskWn_";
                          window.open(url, "_blank", "noopener,noreferrer");
                        } else {
                          setActiveTab(item.id as any);
                        }
                        setIsSidebarMobileOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold font-serif transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#8FA89B] text-white shadow-[0_4px_12px_rgba(143,168,155,0.25)]"
                          : "text-[#6B6661] dark:text-slate-400 hover:bg-[#8FA89B]/10 dark:hover:bg-slate-900/60 hover:text-[#3D3A37] dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-white" : "text-[#8FA89B]"}`} strokeWidth={isActive ? 2 : 1.5} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-[#EAE5DF] dark:border-slate-850">
                <button
                  onClick={() => {
                    setIsSidebarMobileOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-[#FBF9F6] dark:hover:bg-slate-900 py-2.5 text-xs font-semibold text-[#3D3A37] dark:text-slate-300 border border-[#EAE5DF]/60 hover:border-[#EAE5DF] dark:border-slate-800 transition-all duration-300 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5 text-[#8FA89B]" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col justify-between min-w-0">



      {/* 1. IMPROVEMENT: Unified, Frosted-Glass Global Navigation Header */}
      <header className={`sticky top-0 z-40 bg-[#FCFAF7]/85 dark:bg-slate-950/75 backdrop-blur-md border-b border-[#EAE5DF]/60 dark:border-slate-900/80 transition-colors duration-300 ${user && (user.role === "admin" || user.role === "auditor" || user.role === "health_team") ? "md:hidden" : ""}`}>
        <div className={`mx-auto px-4 h-16 flex items-center justify-between gap-4 transition-all duration-300 ${isFullWidth ? 'max-w-none px-6 md:px-10 lg:px-16' : 'max-w-7xl'}`}>
          {/* Brand Logo & Name with Minimalist Dropdown */}
          <div className="relative flex items-center gap-3" ref={menuRef}>
            {user && (user.role === "admin" || user.role === "auditor" || user.role === "health_team") ? (
              <button
                id="sidebar_toggle_trigger"
                onClick={() => {
                  setIsSidebarMobileOpen(!isSidebarMobileOpen);
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }}
                className="flex items-center gap-3 text-left focus:outline-none group select-none cursor-pointer"
                title={isSidebarCollapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#8FA89B] text-white shadow-[0_0_15px_rgba(143,168,155,0.3)] group-hover:scale-105 transition-transform duration-200">
                  <Menu className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black tracking-tight text-black dark:text-white leading-none">
                      Salud Espiritual
                    </span>
                  </div>
                  <span className="text-[10px] text-[#5F756B] dark:text-[#8FA89B] font-bold tracking-wider uppercase mt-0.5 leading-none flex items-center gap-1 capitalize">
                    {user.role === "admin" 
                      ? "Admin" 
                      : user.role === "health_team" 
                      ? "Equipo de Salud" 
                      : user.role === "auditor" 
                      ? "Consejero" 
                      : "MCA"} • {activeTab === "submissions" ? "Reporte de Envíos" :
                             activeTab === "stats" ? "Estadísticas" :
                             activeTab === "builder" ? "Editor" :
                             activeTab === "users" ? "Usuarios" :
                             activeTab === "database" ? "Base de Datos" : activeTab}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setMcaHomeTrigger(prev => prev + 1)}
                className="flex items-center gap-2.5 text-left focus:outline-none hover:opacity-80 transition-all active:scale-95 cursor-pointer"
                title="Volver al inicio"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 shadow-sm">
                  <HandHeart className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold font-serif text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight leading-none">
                    Portal de Salud Espiritual
                  </span>
                  {/* Secondary span/badge removed as requested */}
                </div>
              </button>
            )}
          </div>

          {/* Place an empty placeholder to maintain CSS layout grid flex spacing if desired */}
          <div className="hidden md:block flex-1" />

          {/* Right Action Items */}
          <div className="flex items-center gap-2">
            {/* Real-time notification Bell (if user is logged in as admin) */}
            {user && user.role === "admin" && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsProfileOpen(false);
                    if (!isNotificationOpen) {
                      markAllNotificationsRead();
                    }
                  }}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-850 transition-all cursor-pointer"
                  title="Alertas del Sistema"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8FA89B] text-[9px] font-bold text-white shadow-md animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
 
                {/* Notifications Dropdown Panel */}
                <AnimatePresence>
                  {isNotificationOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 rounded-2xl border border-[#EAE5DF] dark:border-slate-800 bg-[#FCFAF7]/95 dark:bg-slate-950/95 backdrop-blur-md p-2 shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-3.5 py-2.5 border-b border-slate-150 dark:border-slate-850/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-white font-serif">Alertas de Envío</span>
                        <span className="text-[10px] text-[#5F756B] dark:text-[#8FA89B] font-bold bg-[#8FA89B]/10 dark:bg-[#8FA89B]/20 border border-[#8FA89B]/15 px-2 py-0.5 rounded-full">
                          {notifications.length} Totales
                        </span>
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-900">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-xs text-slate-500 italic">
                            No hay alertas registradas en esta sesión
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div key={n.id} className={`p-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40 ${!n.read ? "bg-[#8FA89B]/5 dark:bg-[#8FA89B]/5" : ""}`}>
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</span>
                                <span className="text-[9px] text-slate-400 shrink-0">{n.timestamp ? n.timestamp.split("T")[1]?.slice(0,5) || "" : ""}</span>
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
 
            {/* Theme switch removed to preserve Light/Cream mode always */}

            {/* User Profile dropdown & Logout (if user is logged in) */}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsNotificationOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 px-3 rounded-full border border-[#EAE5DF] bg-[#FBF9F6]/60 dark:bg-slate-900/40 hover:bg-[#F4EFEA]/80 dark:hover:bg-slate-900 text-[#3D3A37] dark:text-slate-300 transition-all duration-300 cursor-pointer shadow-[0_2px_8px_rgba(143,168,155,0.04)]"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8FA89B] text-white font-serif text-xs font-semibold shrink-0 shadow-sm">
                    {(() => {
                      const name = user.name;
                      const email = user.email;
                      if (name) {
                        const parts = name.trim().split(/\s+/);
                        if (parts.length > 1) {
                          return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                        }
                        return parts[0].slice(0, 2).toUpperCase();
                      }
                      return email ? email.slice(0, 2).toUpperCase() : "SE";
                    })()}
                  </div>
                  <span className="hidden sm:inline text-xs font-medium text-[#3D3A37] dark:text-slate-300 font-serif">
                    {(() => {
                      const name = user.name;
                      const email = user.email;
                      if (name) {
                        return name.trim().split(/\s+/)[0];
                      }
                      return email ? email.split("@")[0] : "Usuario";
                    })()}
                  </span>
                  <span className="text-[9px] text-[#8A847F] dark:text-slate-450 ml-0.5 select-none">▼</span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-[16px] border border-[#EAE5DF]/60 dark:border-slate-800 bg-[#FCFAF7]/85 dark:bg-slate-950/85 backdrop-blur-md p-4 z-50 flex flex-col gap-3"
                    >
                      {/* User Info overview */}
                      <div className="px-1 text-left">
                        <p className="text-[11px] text-[#8A847F] dark:text-slate-400 font-serif leading-relaxed">
                          Hola, {(() => {
                            const name = user.name;
                            const email = user.email;
                            if (name) {
                              return name.trim().split(/\s+/)[0];
                            }
                            return email ? email.split("@")[0] : "User";
                          })()} - <span className="font-sans not-italic text-[10px] text-[#A8A29C] dark:text-slate-500 truncate block max-w-full">{user.email}</span>
                        </p>
                      </div>

                      <div className="h-[1px] w-full bg-[#F4EFEA] dark:bg-slate-800" />

                      {/* User Role & Location */}
                      <div className="px-1 text-left text-[11px] text-[#8A847F] dark:text-slate-400 font-serif space-y-1">
                        <div className="flex justify-between items-center">
                          <span>Rol:</span>
                          <span className="font-semibold text-[#5F756B] dark:text-[#8FA89B] text-[10px]">
                            {user.role === "admin" 
                              ? "Administrador" 
                              : user.role === "auditor" 
                              ? "Consejero" 
                              : user.role === "health_team"
                              ? `Equipo de Salud Espiritual (${user.geographicGroup || "Sin asignar"})`
                              : "Miembro de Cuerpo Auxiliar"}
                          </span>
                        </div>
                        {(user.country || user.region) && (
                          <div className="flex justify-between items-center">
                            <span>Territorio:</span>
                            <span className="font-semibold text-[#5F756B] dark:text-[#8FA89B] text-[10px] truncate max-w-[125px]">
                              {[user.region, user.country].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="h-[1px] w-full bg-[#F4EFEA] dark:bg-slate-800" />

                      {/* Elegant logout action */}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-transparent hover:bg-[#FBF9F6] dark:hover:bg-slate-900 py-2.5 text-xs font-semibold text-[#3D3A37] dark:text-slate-300 border border-[#EAE5DF]/60 hover:border-[#EAE5DF] dark:border-slate-800 transition-all duration-300 cursor-pointer"
                      >
                        <LogOut className="h-3.5 w-3.5 text-[#8FA89B]" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </header>



      {/* 3. IMPROVEMENT: Bento Card Page & Framer Motion Transitions */}
      <main className={`flex-1 w-full mx-auto p-4 md:py-8 transition-all duration-300 relative z-10 ${isFullWidth ? 'max-w-none px-6 md:px-10 lg:px-16 lg:py-6' : 'max-w-7xl lg:p-6'}`}>
        <AnimatePresence mode="wait">
          {(user.role === "admin" || user.role === "auditor" || user.role === "health_team") ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <AdminDashboard
                user={user}
                onLogout={handleLogout}
                notifications={notifications}
                setNotifications={setNotifications}
                sseConnected={sseConnected}
                onTabChange={(tab) => setIsStatsActive(tab === "stats")}
                theme={theme}
                toggleTheme={toggleTheme}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isHelpOpen={isHelpOpen}
                setIsHelpOpen={setIsHelpOpen}
              />
            </motion.div>
          ) : (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <UserForm
                user={user}
                onLogout={handleLogout}
                onTabChange={(tab) => setIsStatsActive(tab === "stats")}
                theme={theme}
                toggleTheme={toggleTheme}
                resetHomeTrigger={mcaHomeTrigger}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>


      </div>
    </div>
  );
}
