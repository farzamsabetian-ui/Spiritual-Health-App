/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FormField, Submission, SystemNotification, GeminiReport, UserSession } from "../types";
import {
  Sparkles,
  ClipboardList,
  CheckSquare,
  AlertCircle,
  Clock,
  Printer,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  BookOpen,
  Trash2,
  Archive,
  Eye,
  X,
  Save,
  Plus,
  RefreshCcw,
  RefreshCw,
  Sliders,
  Settings,
  Grid,
  HandHeart,
  Bell,
  Check,
  FileText,
  SlidersHorizontal,
  FolderDown,
  BarChart4,
  Users,
  UserPlus,
  Edit,
  Shield,
  Globe,
  MapPin,
  Database,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  Calendar,
  Search,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
  Legend,
  PieChart,
  Pie
} from "recharts";
import RegionalStatsDashboard from "./RegionalStatsDashboard";

const GEOGRAPHIC_GROUPS: Record<string, string[]> = {
  "Centro América": [
    "mexico", "méxico", "guatemala", "belice", "belize", "el salvador", "honduras", 
    "nicaragua", "costa rica", "panama", "panamá", "colombia", "venezuela", "ecuador", "cuba"
  ],
  "Sur América": [
    "peru", "perú", "bolivia", "chile", "argentina", "paraguay", "uruguay", "brasil", "brazil"
  ],
  "Norte América": [
    "estados unidos", "united states", "united states of america", "usa", "canada", "canadá", "alaska"
  ],
  "El Caribe": [
    "guyana", "guyana francesa", "guayana francesa", "french guiana", "surinam", "suriname", 
    "jamaica", "bahamas", "the bahamas", "haiti", "haití", "republica dominicana", "república dominicana", "puerto rico", 
    "antigua y barbuda", "barbados", "dominica", "granada", "san cristobal y nieves", "san cristóbal y nieves",
    "santa lucia", "santa lucía", "san vicente y las granadinas", "trinidad y tobago", "trinidad and tobago"
  ]
};

const normalizeCountryName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const getCountryCode = (countryName: string | undefined): string | null => {
  if (!countryName) return null;
  const norm = countryName.trim().toLowerCase();
  if (norm.includes("costa rica")) return "cr";
  if (norm.includes("el salvador")) return "sv";
  if (norm.includes("guatemala")) return "gt";
  if (norm.includes("honduras")) return "hn";
  if (norm.includes("nicaragua")) return "ni";
  if (norm.includes("panama") || norm.includes("panamá")) return "pa";
  if (norm.includes("belice") || norm.includes("belize")) return "bz";
  
  if (norm.includes("méxico") || norm.includes("mexico")) return "mx";
  if (norm.includes("colombia")) return "co";
  if (norm.includes("venezuela")) return "ve";
  if (norm.includes("ecuador")) return "ec";
  if (norm.includes("perú") || norm.includes("peru")) return "pe";
  if (norm.includes("bolivia")) return "bo";
  if (norm.includes("chile")) return "cl";
  if (norm.includes("argentina")) return "ar";
  if (norm.includes("paraguay")) return "py";
  if (norm.includes("uruguay")) return "uy";
  if (norm.includes("brasil") || norm.includes("brazil")) return "br";
  if (norm.includes("españa") || norm.includes("spain")) return "es";
  if (norm.includes("estados unidos") || norm.includes("usa") || norm.includes("united states")) return "us";
  if (norm.includes("canadá") || norm.includes("canada")) return "ca";
  
  if (norm.includes("alaska")) return "us";
  if (norm.includes("guyana francesa") || norm.includes("guayana francesa") || norm.includes("french guiana")) return "gf";
  if (norm.includes("guyana")) return "gy";
  if (norm.includes("surinam") || norm.includes("suriname")) return "sr";
  if (norm.includes("cuba")) return "cu";
  if (norm.includes("jamaica")) return "jm";
  if (norm.includes("bahamas")) return "bs";
  if (norm.includes("haiti") || norm.includes("haití")) return "ht";
  if (norm.includes("republica dominicana") || norm.includes("república dominicana") || norm.includes("dominican republic")) return "do";
  if (norm.includes("puerto rico")) return "pr";
  if (norm.includes("antigua y barbuda") || norm.includes("antigua and barbuda")) return "ag";
  if (norm.includes("barbados")) return "bb";
  if (norm.includes("dominica")) return "dm";
  if (norm.includes("granada") || norm.includes("grenada")) return "gd";
  if (norm.includes("san cristobal y nieves") || norm.includes("san cristóbal y nieves") || norm.includes("saint kitts and nevis")) return "kn";
  if (norm.includes("santa lucia") || norm.includes("santa lucía") || norm.includes("saint lucia")) return "lc";
  if (norm.includes("san vicente y las granadinas") || norm.includes("saint vincent and the grenadines")) return "vc";
  if (norm.includes("trinidad y tobago") || norm.includes("trinidad and tobago")) return "tt";
  
  return null;
};

const renderCountryFlagImage = (countryName: string | undefined, className: string = "h-3.5 w-5 object-cover rounded shadow-sm") => {
  const code = getCountryCode(countryName);
  if (code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        alt={countryName || "país"}
        className={`${className} inline-block align-middle`}
        referrerPolicy="no-referrer"
      />
    );
  }
  return <span className="inline-block align-middle text-[11px]">🏳️</span>;
};

const normalizeGroupName = (group: string): string => {
  if (!group) return "";
  return group
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .trim();
};

const getGroupCountries = (groupName: string): string[] => {
  if (!groupName) return [];
  const normSearch = normalizeGroupName(groupName);
  const foundKey = Object.keys(GEOGRAPHIC_GROUPS).find(key => {
    return normalizeGroupName(key) === normSearch;
  });
  return foundKey ? GEOGRAPHIC_GROUPS[foundKey] : [];
};

const isCountryInGroup = (countryName: string | undefined, groupName: string) => {
  if (!countryName) return false;
  const normDbName = normalizeCountryName(countryName);
  const normGroupSearch = normalizeGroupName(groupName);
  if (normGroupSearch === "lasamericas") {
    return Object.values(GEOGRAPHIC_GROUPS).some(countries => 
      countries.some(c => normalizeCountryName(c) === normDbName)
    );
  }
  const groupCountries = getGroupCountries(groupName);
  return groupCountries.some(c => normalizeCountryName(c) === normDbName);
};

const formatFechaLetras = (fechaStr: string | null | undefined, fallback: string = "Ninguna"): string => {
  if (!fechaStr) return fallback;
  const parts = fechaStr.split("-");
  if (parts.length >= 2) {
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} de ${year}`;
    }
  }
  return fechaStr;
};

interface AdminDashboardProps {
  user: UserSession;
  onLogout: () => void;
  notifications: SystemNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<SystemNotification[]>>;
  sseConnected: boolean;
  onTabChange?: (tab: string) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  activeTab: "inicio" | "submissions" | "builder" | "reports" | "notifications" | "users" | "database" | "stats";
  setActiveTab: (tab: "inicio" | "submissions" | "builder" | "reports" | "notifications" | "users" | "database" | "stats") => void;
  isHelpOpen: boolean;
  setIsHelpOpen: (open: boolean) => void;
}

export default function AdminDashboard({
  user,
  onLogout,
  notifications,
  setNotifications,
  sseConnected,
  onTabChange,
  theme,
  toggleTheme,
  activeTab,
  setActiveTab,
  isHelpOpen,
  setIsHelpOpen
}: AdminDashboardProps) {

  useEffect(() => {
    onTabChange?.(activeTab);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeTab, onTabChange]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reports, setReports] = useState<GeminiReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Estados para panel de acceso directo a la base de datos
  const [rawDBText, setRawDBText] = useState<string>("");
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [dbSaving, setDbSaving] = useState<boolean>(false);
  const [dbResetting, setDbResetting] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbSuccess, setDbSuccess] = useState<string | null>(null);
  const [dbPasswordInput, setDbPasswordInput] = useState<string>("");
  const [isDbAuthenticated, setIsDbAuthenticated] = useState<boolean>(false);
  const [verifiedDbPassword, setVerifiedDbPassword] = useState<string>("");
  const [dbFormatView, setDbFormatView] = useState<"json" | "mysql">("json");
  const [mysqlSelectedTable, setMysqlSelectedTable] = useState<string>("users");

  // Estados para gestión de usuarios
  interface ManageableUser {
    email: string;
    name: string;
    role: "admin" | "user" | "auditor" | "health_team";
    country?: string;
    region?: string;
    password?: string;
    archived?: boolean;
    driveUrl?: string;
    geographicGroup?: string;
  }
  const [users, setUsers] = useState<ManageableUser[]>([]);
  const [editingUser, setEditingUser] = useState<ManageableUser | null>(null); // si no es null, estamos editando
  const [userFormOpen, setUserFormOpen] = useState<boolean>(false);
  const [userFormName, setUserFormName] = useState<string>("");
  const [userFormEmail, setUserFormEmail] = useState<string>("");
  const [userFormPassword, setUserFormPassword] = useState<string>("");
  const [userFormRole, setUserFormRole] = useState<"admin" | "user" | "auditor" | "health_team">("user");
  const [userFormGeographicGroup, setUserFormGeographicGroup] = useState<string>("");
  const [userFormCountry, setUserFormCountry] = useState<string>("");
  const [userFormRegion, setUserFormRegion] = useState<string>("");
  const [userFormDriveUrl, setUserFormDriveUrl] = useState<string>("");
  const [userFormArchived, setUserFormArchived] = useState<boolean>(false);
  const [adminDriveUrl, setAdminDriveUrl] = useState<string>("");
  const [adminDriveSuccess, setAdminDriveSuccess] = useState<string | null>(null);
  const [adminDriveError, setAdminDriveError] = useState<string | null>(null);
  const [adminDriveLoading, setAdminDriveLoading] = useState<boolean>(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userFormSuccess, setUserFormSuccess] = useState<string | null>(null);
  const [userFormSubmitting, setUserFormSubmitting] = useState<boolean>(false);
  const [userEmailToDelete, setUserEmailToDelete] = useState<string | null>(null);
  
  // Estado para crear/editar campo en el constructor
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [newFieldLabel, setNewFieldLabel] = useState<string>("");
  const [newFieldType, setNewFieldType] = useState<"text" | "number" | "email" | "select" | "textarea" | "checkbox" | "section" | "date" | "table" | "list">("text");
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState<string>("");
  const [newFieldDescription, setNewFieldDescription] = useState<string>("");
  const [newFieldRequired, setNewFieldRequired] = useState<boolean>(true);
  const [newFieldOptions, setNewFieldOptions] = useState<string>(""); // Comma separated
  const [newFieldAllowOther, setNewFieldAllowOther] = useState<boolean>(false); // Permitir opción 'Otro'
  const [newFieldMultiple, setNewFieldMultiple] = useState<boolean>(false); // Permitir selección múltiple
  const [newFieldColumns, setNewFieldColumns] = useState<string>(""); // Comma separated for table
  const [newFieldPredefinedRows, setNewFieldPredefinedRows] = useState<string>(""); // Comma separated for table predefined rows
  const [newFieldMinLength, setNewFieldMinLength] = useState<number>(0);
  const [newFieldMaxLength, setNewFieldMaxLength] = useState<number>(0);
  const [newFieldMin, setNewFieldMin] = useState<number | "">("");
  const [newFieldMax, setNewFieldMax] = useState<number | "">("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [newFieldColumnTypes, setNewFieldColumnTypes] = useState<Record<string, 'text' | 'number' | 'checkbox' | 'select'>>({});
  const [newFieldColumnOptions, setNewFieldColumnOptions] = useState<Record<string, string>>({});
  const [newFieldDateRenderMode, setNewFieldDateRenderMode] = useState<"picker" | "dropdown">("picker");
  const [selectedAdminDate, setSelectedAdminDate] = useState<string>("");
  const [selectedAdminMonth, setSelectedAdminMonth] = useState<string>("");

  const [submissionsSubTab, setSubmissionsSubTab] = useState<"received" | "missing">("received");
  const [submissionSearch, setSubmissionSearch] = useState<string>("");
  const [submissionGroupFilter, setSubmissionGroupFilter] = useState<string>("Todos");
  const [submissionCountryFilter, setSubmissionCountryFilter] = useState<string>("Todos");
  const [sortField, setSortField] = useState<"country" | "region" | "name" | null>("country");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filtros para Directorio de Usuarios
  const [userSearch, setUserSearch] = useState<string>("");
  const [userGroupFilter, setUserGroupFilter] = useState<string>("Todos");
  const [userCountryFilter, setUserCountryFilter] = useState<string>("Todos");

  // Estados de generación de reportes
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<GeminiReport | null>(null);
  const [reportIdToDelete, setReportIdToDelete] = useState<string | null>(null);

  // Filtros regionales para el dashboard estadístico
  const [selectedCountry, setSelectedCountry] = useState<string>(() => user.country || "Todos");
  const [selectedRegion, setSelectedRegion] = useState<string>(() => user.region || "Todas");

  // Filter submissions and users for "health_team" role according to geographicGroup
  const roleSubmissions = React.useMemo(() => {
    if (user.role === "health_team" && user.geographicGroup) {
      return submissions.filter(sub => isCountryInGroup(sub.userCountry, user.geographicGroup));
    }
    return submissions;
  }, [submissions, user]);

  const roleUsers = React.useMemo(() => {
    if (user.role === "health_team" && user.geographicGroup) {
      return users.filter(u => isCountryInGroup(u.country, user.geographicGroup));
    }
    return users;
  }, [users, user]);

  // Obtener la lista unificada de países y regiones para los filtros
  const locations = React.useMemo(() => {
    const locationsMap: Record<string, Set<string>> = {};

    // 1. De los usuarios
    roleUsers.forEach(u => {
      if (u.country && u.country.trim() !== "") {
        const country = u.country.trim();
        if (!locationsMap[country]) {
          locationsMap[country] = new Set<string>();
        }
        if (u.region && u.region.trim() !== "") {
          locationsMap[country].add(u.region.trim());
        }
      }
    });

    // 2. De las respuestas
    roleSubmissions.forEach(s => {
      if (s.userCountry && s.userCountry.trim() !== "") {
        const country = s.userCountry.trim();
        if (!locationsMap[country]) {
          locationsMap[country] = new Set<string>();
        }
        if (s.userRegion && s.userRegion.trim() !== "") {
          locationsMap[country].add(s.userRegion.trim());
        }
      }
    });

    return Object.keys(locationsMap).sort().map(country => ({
      country,
      regions: Array.from(locationsMap[country]).sort()
    }));
  }, [roleUsers, roleSubmissions]);

  const filteredCountryOptions = React.useMemo(() => {
    if (submissionGroupFilter === "Todos") {
      return locations;
    }
    return locations.filter(loc => isCountryInGroup(loc.country, submissionGroupFilter));
  }, [locations, submissionGroupFilter]);

  useEffect(() => {
    if (submissionGroupFilter !== "Todos" && submissionCountryFilter !== "Todos") {
      const isStillAvailable = isCountryInGroup(submissionCountryFilter, submissionGroupFilter);
      if (!isStillAvailable) {
        setSubmissionCountryFilter("Todos");
      }
    }
  }, [submissionGroupFilter, submissionCountryFilter]);

  // Dashboard de análisis de cantidad de formularios recibidos (submissions)
  const submissionsTimelineData = React.useMemo(() => {
    if (!roleSubmissions || roleSubmissions.length === 0) return [];
    
    const counts: Record<string, number> = {};
    roleSubmissions.forEach(sub => {
      try {
        const date = new Date(sub.submittedAt);
        if (!isNaN(date.getTime())) {
          const dateStr = date.toISOString().split('T')[0]; // "YYYY-MM-DD"
          counts[dateStr] = (counts[dateStr] || 0) + 1;
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    const sortedDates = Object.keys(counts).sort();
    if (sortedDates.length === 0) return [];

    let accumulated = 0;
    return sortedDates.map(dateStr => {
      const count = counts[dateStr];
      accumulated += count;
      const [y, m, d] = dateStr.split('-');
      const formattedDate = `${d}/${m}`;
      return {
        dateStr,
        label: formattedDate,
        Cantidad: count,
        Acumulado: accumulated
      };
    });
  }, [roleSubmissions]);

  const submissionsByCountryData = React.useMemo(() => {
    if (!roleSubmissions || roleSubmissions.length === 0) return [];
    const counts: Record<string, number> = {};
    roleSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "N/A";
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([country, count]) => ({ country, Cantidad: count }))
      .sort((a, b) => b.Cantidad - a.Cantidad);
  }, [roleSubmissions]);

  const submissionsByRegionData = React.useMemo(() => {
    if (!roleSubmissions || roleSubmissions.length === 0) return [];
    const counts: Record<string, number> = {};
    roleSubmissions.forEach(sub => {
      const region = sub.userRegion?.trim() || "N/A";
      counts[region] = (counts[region] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([region, count]) => ({ region, Cantidad: count }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 8);
  }, [roleSubmissions]);

  const submissionsRecentStats = React.useMemo(() => {
    let last24h = 0;
    let last7d = 0;
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    roleSubmissions.forEach(sub => {
      try {
        const time = new Date(sub.submittedAt).getTime();
        if (!isNaN(time)) {
          const diff = now - time;
          if (diff >= 0 && diff <= oneDay) last24h++;
          if (diff >= 0 && diff <= sevenDays) last7d++;
        }
      } catch (e) {
        // ignore
      }
    });

    return { last24h, last7d };
  }, [roleSubmissions]);

  const submissionsActivityRate = React.useMemo(() => {
    const totalUsers = roleUsers.length;
    if (totalUsers === 0) return 0;
    return Math.round((roleSubmissions.length / totalUsers) * 100);
  }, [roleSubmissions, roleUsers]);

  // Helper function to parse form date safely
  const parseFormDate = (val: any) => {
    if (!val) return new Date(0);
    const str = String(val);
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return new Date(str);
    }
    if (/^\d{4}-\d{2}$/.test(str)) {
      return new Date(str + "-01");
    }
    const d = new Date(str);
    if (!isNaN(d.getTime())) return d;
    return new Date(0);
  };

  const dateFieldId = React.useMemo(() => {
    const isFechaField = (f: any) => f.type === "date" || (f.label && f.label.toLowerCase() === "fecha");
    const dateField = fields.find(isFechaField);
    return dateField ? dateField.id : null;
  }, [fields]);

  // Helper to extract date from submission dynamically matching fallback behavior
  const getSubDateValue = (sub: Submission) => {
    if (dateFieldId && sub.data[dateFieldId]) {
      return String(sub.data[dateFieldId]);
    }
    const foundDateKey = Object.keys(sub.data).find(k => {
      const val = sub.data[k];
      return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
    });
    if (foundDateKey) {
      return String(sub.data[foundDateKey]);
    }
    if (sub.submittedAt) {
      return sub.submittedAt.split("T")[0];
    }
    return null;
  };

  // Determinar la fecha más reciente de todo el sistema para definir "la fecha actual" (current Fecha)
  const latestFecha = React.useMemo(() => {
    if (!roleSubmissions || roleSubmissions.length === 0) return null;
    let maxDateVal: string | null = null;
    let maxDateObj: Date | null = null;
    
    roleSubmissions.forEach(sub => {
      const dStr = getSubDateValue(sub);
      if (dStr) {
        const dObj = parseFormDate(dStr);
        if (dObj.getTime() > 0) {
          if (!maxDateObj || dObj > maxDateObj) {
            maxDateObj = dObj;
            maxDateVal = dStr;
          }
        }
      }
    });
    return maxDateVal;
  }, [roleSubmissions, dateFieldId]);

  // Envíos de la fecha actual
  const currentSubmissions = React.useMemo(() => {
    if (!latestFecha) return [];
    return roleSubmissions.filter(sub => {
      const dStr = getSubDateValue(sub);
      return dStr === latestFecha;
    });
  }, [roleSubmissions, latestFecha, dateFieldId]);

  // Envíos de la fecha actual organizados (ordenados)
  const organizedSubmissions = React.useMemo(() => {
    const list = [...currentSubmissions];
    if (!sortField) return list;

    list.sort((a, b) => {
      let valA = "";
      let valB = "";

      if (sortField === "country") {
        valA = a.userCountry || "";
        valB = b.userCountry || "";
      } else if (sortField === "region") {
        valA = a.userRegion || "";
        valB = b.userRegion || "";
      } else if (sortField === "name") {
        const associatedUserA = roleUsers.find(u => u.email.toLowerCase() === a.userEmail.toLowerCase());
        valA = associatedUserA ? associatedUserA.name : (a.data.f_nombre || "Anónimo");
        const associatedUserB = roleUsers.find(u => u.email.toLowerCase() === b.userEmail.toLowerCase());
        valB = associatedUserB ? associatedUserB.name : (b.data.f_nombre || "Anónimo");
      }

      const cmp = valA.localeCompare(valB, "es", { sensitivity: "base" });
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return list;
  }, [currentSubmissions, sortField, sortOrder, roleUsers]);

  const handleSort = (field: "name" | "country" | "region") => {
    if (sortField === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // Usuarios activos (excluidos de estadísticas si están archivados)
  const activeUsersCount = React.useMemo(() => {
    return roleUsers.filter(u => u.role === "user" && !u.archived).length;
  }, [roleUsers]);

  // Envíos faltantes de la fecha actual
  const missingUsers = React.useMemo(() => {
    if (!latestFecha) return [];
    const submittedEmails = new Set(
      currentSubmissions.map(s => s.userEmail ? s.userEmail.toLowerCase() : "")
    );
    return roleUsers.filter(u => u.role === "user" && !u.archived && !submittedEmails.has(u.email.toLowerCase()));
  }, [roleUsers, currentSubmissions, latestFecha]);

  const uniqueSubmittedCount = React.useMemo(() => {
    if (!latestFecha) return 0;
    const submittedEmails = new Set(
      currentSubmissions.map(s => s.userEmail ? s.userEmail.toLowerCase() : "").filter(Boolean)
    );
    return roleUsers.filter(u => u.role === "user" && !u.archived && submittedEmails.has(u.email.toLowerCase())).length;
  }, [roleUsers, currentSubmissions, latestFecha]);

  const currentSubmissionsActivityRate = React.useMemo(() => {
    if (activeUsersCount === 0) return 0;
    return Math.min(100, Math.round((uniqueSubmittedCount / activeUsersCount) * 100));
  }, [uniqueSubmittedCount, activeUsersCount]);

  const filteredOrganizedSubmissions = React.useMemo(() => {
    let filtered = organizedSubmissions;
    if (submissionGroupFilter !== "Todos") {
      filtered = filtered.filter(sub => isCountryInGroup(sub.userCountry, submissionGroupFilter));
    }
    if (submissionCountryFilter !== "Todos") {
      filtered = filtered.filter(sub => (sub.userCountry || "").toLowerCase() === submissionCountryFilter.toLowerCase());
    }
    if (!submissionSearch.trim()) return filtered;
    const term = submissionSearch.toLowerCase().trim();
    return filtered.filter(sub => {
      const associatedUser = roleUsers.find(u => u.email.toLowerCase() === sub.userEmail.toLowerCase());
      const senderName = associatedUser ? associatedUser.name : (sub.data.f_nombre || "Anónimo");
      return (
        senderName.toLowerCase().includes(term) ||
        (sub.userEmail || "").toLowerCase().includes(term) ||
        (sub.userCountry || "").toLowerCase().includes(term) ||
        (sub.userRegion || "").toLowerCase().includes(term)
      );
    });
  }, [organizedSubmissions, submissionSearch, roleUsers, submissionCountryFilter, submissionGroupFilter]);

  const filteredMissingUsers = React.useMemo(() => {
    let filtered = missingUsers;
    if (submissionGroupFilter !== "Todos") {
      filtered = filtered.filter(u => isCountryInGroup(u.country, submissionGroupFilter));
    }
    if (submissionCountryFilter !== "Todos") {
      filtered = filtered.filter(u => (u.country || "").toLowerCase() === submissionCountryFilter.toLowerCase());
    }
    if (!submissionSearch.trim()) return filtered;
    const term = submissionSearch.toLowerCase().trim();
    return filtered.filter(u => {
      return (
        (u.name || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.country || "").toLowerCase().includes(term) ||
        (u.region || "").toLowerCase().includes(term)
      );
    });
  }, [missingUsers, submissionSearch, submissionCountryFilter, submissionGroupFilter]);

  const filteredUserCountryOptions = React.useMemo(() => {
    if (userGroupFilter === "Todos") {
      return locations;
    }
    return locations.filter(loc => isCountryInGroup(loc.country, userGroupFilter));
  }, [locations, userGroupFilter]);

  useEffect(() => {
    if (userGroupFilter !== "Todos" && userCountryFilter !== "Todos") {
      const isStillAvailable = isCountryInGroup(userCountryFilter, userGroupFilter);
      if (!isStillAvailable) {
        setUserCountryFilter("Todos");
      }
    }
  }, [userGroupFilter, userCountryFilter]);

  const filteredUsersListForDirectory = React.useMemo(() => {
    let filtered = users;
    if (userGroupFilter !== "Todos") {
      filtered = filtered.filter(u => isCountryInGroup(u.country, userGroupFilter));
    }
    if (userCountryFilter !== "Todos") {
      filtered = filtered.filter(u => (u.country || "").toLowerCase() === userCountryFilter.toLowerCase());
    }
    if (userSearch.trim()) {
      const term = userSearch.toLowerCase().trim();
      filtered = filtered.filter(u => 
        (u.name || "").toLowerCase().includes(term) ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.country || "").toLowerCase().includes(term) ||
        (u.region || "").toLowerCase().includes(term)
      );
    }
    return filtered;
  }, [users, userGroupFilter, userCountryFilter, userSearch]);

  const currentMetrics = React.useMemo(() => {
    const total = currentSubmissions.length;
    let excelenteCount = 0;
    currentSubmissions.forEach(sub => {
      const sat = sub.data.f_satisfaccion;
      if (sat === "Excelente") excelenteCount++;
    });
    const satisfactionPercent = total > 0 ? Math.round((excelenteCount / total) * 100) : 0;
    return { satisfactionPercent };
  }, [currentSubmissions]);

  const currentSubmissionsByCountryData = React.useMemo(() => {
    if (currentSubmissions.length === 0) return [];
    const counts: Record<string, number> = {};
    currentSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "N/A";
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([country, count]) => ({ country, Cantidad: count }))
      .sort((a, b) => b.Cantidad - a.Cantidad);
  }, [currentSubmissions]);

  const currentSubmissionsByRegionData = React.useMemo(() => {
    if (currentSubmissions.length === 0) return [];
    const counts: Record<string, number> = {};
    currentSubmissions.forEach(sub => {
      const region = sub.userRegion?.trim() || "N/A";
      counts[region] = (counts[region] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([region, count]) => ({ region, Cantidad: count }))
      .sort((a, b) => b.Cantidad - a.Cantidad)
      .slice(0, 8);
  }, [currentSubmissions]);

  // Drag and drop tracking
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // ESTADOS DE VISTA PREVIA PARA SIMULACIÓN DEL FORMATO POR PARTE DEL ADMINISTRADOR
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, string>>({});
  const [previewSubmitted, setPreviewSubmitted] = useState<boolean>(false);
  const [previewListInputs, setPreviewListInputs] = useState<Record<string, string>>({});

  // Sincronizar y cargar valores iniciales de Vista Previa al activar el tab o modificar campos
  useEffect(() => {
    if (isPreviewModalOpen) {
      const initialData: Record<string, any> = {};
      fields.forEach(f => {
        if (f.type !== "section") {
          if (f.type === "checkbox") {
            initialData[f.id] = f.options && f.options.length > 0 ? [] : false;
          } else if (f.type === "select" && f.multiple) {
            initialData[f.id] = [];
          } else if (f.type === "list") {
            initialData[f.id] = [];
          } else if (f.type === "boolean_justify") {
            initialData[f.id] = { answer: "", justification: "" };
          } else if (f.type === "table") {
            if (f.predefinedRows && f.predefinedRows.length > 0) {
              initialData[f.id] = f.predefinedRows.map(rowLabel => {
                const rowObj: Record<string, any> = { _rowLabel: rowLabel };
                (f.columns || ["Columna 1"]).forEach(col => {
                  const colType = f.columnTypes?.[col] || "text";
                  rowObj[col] = colType === "checkbox" ? false : "";
                });
                return rowObj;
              });
            } else {
              initialData[f.id] = [];
            }
          } else {
            initialData[f.id] = "";
          }
        }
      });
      setPreviewData(initialData);
      setPreviewErrors({});
      setPreviewSubmitted(false);
      setPreviewListInputs({});
    }
  }, [isPreviewModalOpen, fields]);

  const handlePreviewInputChange = (field: FormField, val: any) => {
    setPreviewData(prev => ({
      ...prev,
      [field.id]: val
    }));
    // Limpiar errores de validación de este campo al interactuar
    if (previewErrors[field.id]) {
      setPreviewErrors(prev => {
        const copy = { ...prev };
        delete copy[field.id];
        return copy;
      });
    }
  };

  const validatePreviewFormOfAdmin = () => {
    const errors: Record<string, string> = {};
    
    fields.forEach(field => {
      if (field.type === "section") return;
      
      const val = previewData[field.id];
      const isRequired = field.required;
      
      // 1. Validar requeridos
      if (isRequired) {
        if (field.type === "table") {
          if (!Array.isArray(val) || val.length === 0) {
            errors[field.id] = `La tabla '${field.label}' debe contener al menos una fila.`;
          }
        } else if (field.type === "checkbox") {
          if (field.options && field.options.length > 0) {
            if (!Array.isArray(val) || val.length === 0) {
              errors[field.id] = `Debes elegir al menos una opción en '${field.label}'.`;
            }
          } else {
            if (val !== true) {
              errors[field.id] = `Es obligatorio marcar la casilla '${field.label}'.`;
            }
          }
        } else if (field.type === "select" && field.multiple) {
          if (!Array.isArray(val) || val.length === 0) {
            errors[field.id] = `Debes seleccionar al menos una opción en '${field.label}'.`;
          }
        } else if (field.type === "list") {
          if (!Array.isArray(val) || val.length === 0) {
            errors[field.id] = `Debes añadir al menos un elemento a la lista '${field.label}'.`;
          }
        } else if (field.type === "boolean_justify") {
          const valObj = val as { answer?: string; justification?: string } | undefined;
          const ans = valObj?.answer || "";
          if (!ans) {
            errors[field.id] = `El campo '${field.label}' es obligatorio (selecciona Sí o No).`;
          } else if (ans === "Sí") {
            if (!valObj?.justification || valObj.justification.trim() === "") {
              if (field.id === "field_1781900513250") {
                errors[field.id] = `Debes especificar una cantidad válida en '${field.label}'.`;
              } else {
                errors[field.id] = `Debes ingresar una justificación detallada para tu respuesta Sí en '${field.label}'.`;
              }
            } else if (field.id === "field_1781900513250") {
              const num = Number(valObj.justification);
              if (isNaN(num) || num < 0) {
                errors[field.id] = `La respuesta en '${field.label}' debe ser un número mayor o igual a 0.`;
              }
            }
          }
        } else {
          if (val === undefined || val === null || String(val).trim() === "") {
            errors[field.id] = `El campo '${field.label}' es obligatorio.`;
          }
        }
      } else {
        if (field.type === "boolean_justify" && val) {
          const valObj = val as { answer?: string; justification?: string } | undefined;
          const ans = valObj?.answer || "";
          if (ans === "Sí") {
            if (!valObj?.justification || valObj.justification.trim() === "") {
              if (field.id === "field_1781900513250") {
                errors[field.id] = `Debes especificar una cantidad válida en '${field.label}'.`;
              } else {
                errors[field.id] = `Debes justificar tu respuesta Sí en '${field.label}'.`;
              }
            } else if (field.id === "field_1781900513250") {
              const num = Number(valObj.justification);
              if (isNaN(num) || num < 0) {
                errors[field.id] = `La respuesta en '${field.label}' debe ser un número mayor o igual a 0.`;
              }
            }
          }
        }
      }
      
      // 2. Extra validaciones (minLength, maxLength, values, etc.)
      const isPresent = val !== undefined && val !== null && String(val).trim() !== "";
      if (isPresent && field.type !== "section" && field.type !== "table" && field.type !== "list" && field.type !== "boolean_justify" && field.type !== "checkbox") {
        if (field.type === "text" || field.type === "textarea") {
          if (field.validation?.minLength && String(val).length < field.validation.minLength) {
            errors[field.id] = `Debe tener al menos ${field.validation.minLength} caracteres.`;
          }
          if (field.validation?.maxLength && String(val).length > field.validation.maxLength) {
            errors[field.id] = `No puede exceder los ${field.validation.maxLength} caracteres.`;
          }
        }
        if (field.type === "number") {
          const num = Number(val);
          if (isNaN(num)) {
            errors[field.id] = `Debe ingresar un valor numérico válido.`;
          } else {
            if (field.validation?.min !== undefined && field.validation?.min !== "" && num < Number(field.validation.min)) {
              errors[field.id] = `El valor mínimo permitido es ${field.validation.min}.`;
            }
            if (field.validation?.max !== undefined && field.validation?.max !== "" && num > Number(field.validation.max)) {
              errors[field.id] = `El valor máximo permitido es ${field.validation.max}.`;
            }
          }
        }
        if (field.type === "email" && field.validation?.pattern) {
          const regex = new RegExp(field.validation.pattern);
          if (!regex.test(String(val))) {
            errors[field.id] = `El formato del correo electrónico ingresado no es válido.`;
          }
        }
      }
    });
    
    setPreviewErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [fieldsRes, submissionsRes, reportsRes, usersRes] = await Promise.all([
        fetch("/api/form/fields"),
        fetch("/api/form/submissions"),
        fetch("/api/reports"),
        fetch("/api/users")
      ]);

      let backendFields: FormField[] = [];
      if (fieldsRes.ok) {
        backendFields = await fieldsRes.json();
      }

      // Sincronizar con almacenamiento local para garantizar que nunca se regrese a las preguntas por defecto
      const localSaved = localStorage.getItem("validaform_custom_fields");
      if (backendFields && backendFields.length > 0) {
        // Preferir siempre la base de datos del servidor si ya tiene campos guardados
        // Y actualizar el caché local para estar al día
        localStorage.setItem("validaform_custom_fields", JSON.stringify(backendFields));
      } else if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            backendFields = parsed;
            // Guardar silenciosamente en el servidor para que permanezca sincronizado
            fetch("/api/form/fields", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(backendFields),
            }).catch(err => console.error("Error al sincronizar campos locales con backend:", err));
          }
        } catch (e) {
          console.error("Error al decodificar campos locales guardados:", e);
        }
      }

      setFields(backendFields);
      if (submissionsRes.ok) {
        const subs = await submissionsRes.json();
        setSubmissions(subs);
        try {
          localStorage.setItem("validaform_submissions", JSON.stringify(subs));
        } catch (err) {
          console.error("Error al guardar submissions en localStorage:", err);
        }
      }
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (usersRes.ok) {
        const uList = await usersRes.json();
        setUsers(uList);
        try {
          const defaultEmails: string[] = [];
          const customUsers = uList.filter((u: any) => !defaultEmails.includes(u.email.toLowerCase()));
          localStorage.setItem("validaform_custom_users", JSON.stringify(customUsers));
        } catch (err) {
          console.error("Error al guardar custom_users en localStorage:", err);
        }
      }

      try {
        const driveRes = await fetch("/api/get-drive-url");
        if (driveRes.ok) {
          const driveData = await driveRes.json();
          if (driveData && driveData.url) {
            setAdminDriveUrl(driveData.url);
          }
        }
      } catch (err) {
        console.error("Error al obtener la URL global de Google Drive:", err);
      }
    } catch (e) {
      console.error("Error cargando los datos del dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // Cargar BD cruda cuando se activa la pestaña de base de datos y está autenticado
  useEffect(() => {
    if (activeTab === "database" && isDbAuthenticated) {
      fetchRawDatabase();
    }
  }, [activeTab, isDbAuthenticated]);

  const handleVerifyDbPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbLoading(true);
    setDbError(null);
    setDbSuccess(null);
    try {
      const res = await fetch("/api/admin/database/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: dbPasswordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo en la contraseña dada.");
      }
      setVerifiedDbPassword(dbPasswordInput);
      setIsDbAuthenticated(true);
      setDbSuccess("¡Autenticación de base de datos concedida!");
      // Cargar la base de datos inmediatamente usando esta contraseña
      await fetchRawDatabase(dbPasswordInput);
    } catch (err: any) {
      setDbError(err.message || "Error al verificar la contraseña.");
    } finally {
      setDbLoading(false);
    }
  };

  const fetchRawDatabase = async (overridePass?: string) => {
    const pass = overridePass || verifiedDbPassword;
    if (!pass) return;
    setDbLoading(true);
    setDbError(null);
    try {
      const res = await fetch("/api/admin/database/raw", {
        headers: { "X-Admin-Password": pass }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo obtener el archivo de base de datos desde el backend.");
      }
      const data = await res.json();
      setRawDBText(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setDbError(err.message || "Error de comunicación con el servidor de base de datos...");
    } finally {
      setDbLoading(false);
    }
  };

  const handleSaveRawDatabase = async () => {
    const pass = verifiedDbPassword;
    if (!pass) return;
    setDbSaving(true);
    setDbError(null);
    setDbSuccess(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(rawDBText);
      } catch (jsonErr: any) {
        throw new Error("Sintaxis JSON inválida: " + jsonErr.message);
      }

      const res = await fetch("/api/admin/database/save", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Password": pass 
        },
        body: JSON.stringify(parsed)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo en la persistencia del archivo JSON.");
      }

      setDbSuccess("¡Base de datos guardada, validada y sincronizada correctamente en server-db.json!");
      fetchInitialData();
    } catch (err: any) {
      setDbError(err.message || "Fallo al procesar o guardar los cambios...");
    } finally {
      setDbSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    const pass = verifiedDbPassword;
    if (!pass) return;
    if (!confirm("⚠️ ATENCIÓN: Estás a punto de restablecer la base de datos por completo. Todos los envíos guardados, alertas e informes de IA se borrarán permanentemente y las cuentas de administrador y usuario volverán a sus valores iniciales. ¿Estás absolutamente seguro de continuar?")) {
      return;
    }
    setDbResetting(true);
    setDbError(null);
    setDbSuccess(null);
    try {
      const res = await fetch("/api/admin/database/reset", {
        method: "POST",
        headers: { "X-Admin-Password": pass }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo en el restablecimiento.");
      }
      setDbSuccess("¡La base de datos se ha restablecido a sus valores semilla iniciales con éxito!");
      localStorage.removeItem("validaform_custom_fields");
      await fetchInitialData();
      await fetchRawDatabase(pass);
    } catch (err: any) {
      setDbError(err.message || "Fallo al restablecer la base de datos...");
    } finally {
      setDbResetting(false);
    }
  };

  const handleUpdateDriveUrl = async () => {
    setAdminDriveLoading(true);
    setAdminDriveSuccess(null);
    setAdminDriveError(null);
    try {
      const res = await fetch("/api/update-drive-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: adminDriveUrl })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Fallo al guardar la URL.");
      }
      setAdminDriveSuccess("¡Enlace global de Google Drive actualizado con éxito!");
      await fetchRawDatabase();
    } catch (err: any) {
      setAdminDriveError(err.message || "Error al actualizar la URL.");
    } finally {
      setAdminDriveLoading(false);
    }
  };

  const generateMySQLScript = (): string => {
    try {
      let dbObj;
      try {
        dbObj = JSON.parse(rawDBText);
      } catch (e) {
        dbObj = {
          users,
          formFields: fields,
          submissions,
          notifications,
          reports
        };
      }

      const escapeSQL = (val: any): string => {
        if (val === null || val === undefined) return "NULL";
        if (typeof val === "boolean") return val ? "1" : "0";
        if (typeof val === "number") return String(val);
        if (typeof val === "object") {
          const serialized = JSON.stringify(val);
          return `'${serialized.replace(/[\\]/g, '\\\\').replace(/[']/g, "\\'")}'`;
        }
        const str = String(val);
        return `'${str.replace(/[\\]/g, '\\\\').replace(/[']/g, "\\'")}'`;
      };

      let sql = `-- ----------------------------------------------------------------------\n`;
      sql += `-- ValidaForm MySQL Database Auto-Migration Export Script\n`;
      sql += `-- Relational mapping generated from: server-db.json\n`;
      sql += `-- Export date: ${new Date().toISOString()}\n`;
      sql += `-- Compatibilidad: MySQL 5.7+ / 8.0+ / MariaDB\n`;
      sql += `-- ----------------------------------------------------------------------\n\n`;

      sql += `CREATE DATABASE IF NOT EXISTS \`validaform_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n`;
      sql += `USE \`validaform_db\`;\n\n`;

      sql += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

      // 1. Table users
      sql += `-- --------------------------------------------------\n`;
      sql += `-- Estructura de tabla para \`users\`\n`;
      sql += `-- --------------------------------------------------\n`;
      sql += `DROP TABLE IF EXISTS \`users\`;\n`;
      sql += `CREATE TABLE \`users\` (\n`;
      sql += `  \`email\` VARCHAR(255) NOT NULL,\n`;
      sql += `  \`name\` VARCHAR(255) NOT NULL,\n`;
      sql += `  \`password\` VARCHAR(255) NOT NULL,\n`;
      sql += `  \`role\` VARCHAR(50) NOT NULL DEFAULT 'user',\n`;
      sql += `  \`country\` VARCHAR(100) DEFAULT NULL,\n`;
      sql += `  \`region\` VARCHAR(100) DEFAULT NULL,\n`;
      sql += `  PRIMARY KEY (\`email\`)\n`;
      sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

      const usersList = dbObj.users || [];
      if (usersList.length > 0) {
        sql += `-- Volcado de datos para la tabla \`users\`\n`;
        usersList.forEach((u: any) => {
          sql += `INSERT INTO \`users\` (\`email\`, \`name\`, \`password\`, \`role\`, \`country\`, \`region\`) VALUES (\n`;
          sql += `  ${escapeSQL(u.email)},\n`;
          sql += `  ${escapeSQL(u.name)},\n`;
          sql += `  ${escapeSQL(u.password || "user123")},\n`;
          sql += `  ${escapeSQL(u.role || "user")},\n`;
          sql += `  ${escapeSQL(u.country)},\n`;
          sql += `  ${escapeSQL(u.region)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      // 2. Table form_fields
      sql += `-- --------------------------------------------------\n`;
      sql += `-- Estructura de tabla para \`form_fields\`\n`;
      sql += `-- --------------------------------------------------\n`;
      sql += `DROP TABLE IF EXISTS \`form_fields\`;\n`;
      sql += `CREATE TABLE \`form_fields\` (\n`;
      sql += `  \`id\` VARCHAR(100) NOT NULL,\n`;
      sql += `  \`label\` VARCHAR(255) NOT NULL,\n`;
      sql += `  \`type\` VARCHAR(50) NOT NULL,\n`;
      sql += `  \`placeholder\` VARCHAR(255) DEFAULT NULL,\n`;
      sql += `  \`required\` TINYINT(1) NOT NULL DEFAULT 0,\n`;
      sql += `  \`options\` JSON DEFAULT NULL,\n`;
      sql += `  \`validation\` JSON DEFAULT NULL,\n`;
      sql += `  \`field_order\` INT NOT NULL DEFAULT 0,\n`;
      sql += `  PRIMARY KEY (\`id\`)\n`;
      sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

      const fieldsList = dbObj.formFields || [];
      if (fieldsList.length > 0) {
        sql += `-- Volcado de datos para la tabla \`form_fields\`\n`;
        fieldsList.forEach((f: any) => {
          sql += `INSERT INTO \`form_fields\` (\`id\`, \`label\`, \`type\`, \`placeholder\`, \`required\`, \`options\`, \`validation\`, \`field_order\`) VALUES (\n`;
          sql += `  ${escapeSQL(f.id)},\n`;
          sql += `  ${escapeSQL(f.label)},\n`;
          sql += `  ${escapeSQL(f.type)},\n`;
          sql += `  ${escapeSQL(f.placeholder)},\n`;
          sql += `  ${escapeSQL(f.required ? 1 : 0)},\n`;
          sql += `  ${escapeSQL(f.options)},\n`;
          sql += `  ${escapeSQL(f.validation)},\n`;
          sql += `  ${escapeSQL(f.order !== undefined ? f.order : 0)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      // 3. Table submissions
      sql += `-- --------------------------------------------------\n`;
      sql += `-- Estructura de tabla para \`submissions\`\n`;
      sql += `-- --------------------------------------------------\n`;
      sql += `DROP TABLE IF EXISTS \`submissions\`;\n`;
      sql += `CREATE TABLE \`submissions\` (\n`;
      sql += `  \`id\` VARCHAR(100) NOT NULL,\n`;
      sql += `  \`user_email\` VARCHAR(255) NOT NULL,\n`;
      sql += `  \`submitted_at\` VARCHAR(100) NOT NULL,\n`;
      sql += `  \`data\` JSON NOT NULL,\n`;
      sql += `  PRIMARY KEY (\`id\`),\n`;
      sql += `  FOREIGN KEY (\`user_email\`) REFERENCES \`users\` (\`email\`) ON DELETE CASCADE\n`;
      sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

      const submissionsList = dbObj.submissions || [];
      if (submissionsList.length > 0) {
        sql += `-- Volcado de datos para la tabla \`submissions\`\n`;
        submissionsList.forEach((s: any) => {
          sql += `INSERT INTO \`submissions\` (\`id\`, \`user_email\`, \`submitted_at\`, \`data\`) VALUES (\n`;
          sql += `  ${escapeSQL(s.id)},\n`;
          sql += `  ${escapeSQL(s.userEmail)},\n`;
          sql += `  ${escapeSQL(s.submittedAt)},\n`;
          sql += `  ${escapeSQL(s.data)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      // 4. Table notifications
      sql += `-- --------------------------------------------------\n`;
      sql += `-- Estructura de tabla para \`notifications\`\n`;
      sql += `-- --------------------------------------------------\n`;
      sql += `DROP TABLE IF EXISTS \`notifications\`;\n`;
      sql += `CREATE TABLE \`notifications\` (\n`;
      sql += `  \`id\` VARCHAR(100) NOT NULL,\n`;
      sql += `  \`title\` VARCHAR(255) NOT NULL,\n`;
      sql += `  \`message\` TEXT NOT NULL,\n`;
      sql += `  \`timestamp\` VARCHAR(100) NOT NULL,\n`;
      sql += `  \`is_read\` TINYINT(1) NOT NULL DEFAULT 0,\n`;
      sql += `  \`type\` VARCHAR(50) NOT NULL DEFAULT 'info',\n`;
      sql += `  PRIMARY KEY (\`id\`)\n`;
      sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

      const notificationsList = dbObj.notifications || [];
      if (notificationsList.length > 0) {
        sql += `-- Volcado de datos para la tabla \`notifications\`\n`;
        notificationsList.forEach((n: any) => {
          sql += `INSERT INTO \`notifications\` (\`id\`, \`title\`, \`message\`, \`timestamp\`, \`is_read\`, \`type\`) VALUES (\n`;
          sql += `  ${escapeSQL(n.id)},\n`;
          sql += `  ${escapeSQL(n.title)},\n`;
          sql += `  ${escapeSQL(n.message)},\n`;
          sql += `  ${escapeSQL(n.timestamp)},\n`;
          sql += `  ${escapeSQL(n.read ? 1 : 0)},\n`;
          sql += `  ${escapeSQL(n.type)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      // 5. Table reports
      sql += `-- --------------------------------------------------\n`;
      sql += `-- Estructura de tabla para \`reports\`\n`;
      sql += `-- --------------------------------------------------\n`;
      sql += `DROP TABLE IF EXISTS \`reports\`;\n`;
      sql += `CREATE TABLE \`reports\` (\n`;
      sql += `  \`id\` VARCHAR(100) NOT NULL,\n`;
      sql += `  \`generated_at\` VARCHAR(100) NOT NULL,\n`;
      sql += `  \`title\` VARCHAR(255) NOT NULL,\n`;
      sql += `  \`content\` TEXT NOT NULL,\n`;
      sql += `  \`submissions_count\` INT NOT NULL DEFAULT 0,\n`;
      sql += `  PRIMARY KEY (\`id\`)\n`;
      sql += `) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n\n`;

      const reportsList = dbObj.reports || [];
      if (reportsList.length > 0) {
        sql += `-- Volcado de datos para la tabla \`reports\`\n`;
        reportsList.forEach((r: any) => {
          sql += `INSERT INTO \`reports\` (\`id\`, \`generated_at\`, \`title\`, \`content\`, \`submissions_count\`) VALUES (\n`;
          sql += `  ${escapeSQL(r.id)},\n`;
          sql += `  ${escapeSQL(r.generatedAt)},\n`;
          sql += `  ${escapeSQL(r.title)},\n`;
          sql += `  ${escapeSQL(r.content)},\n`;
          sql += `  ${escapeSQL(r.submissionsCount)}\n`;
          sql += `);\n`;
        });
        sql += `\n`;
      }

      sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;
      return sql;
    } catch (err) {
      return `-- Error al generar el script de MySQL: ${String(err)}`;
    }
  };

  const handleUpdateFields = async (updatedFields: FormField[]) => {
    try {
      // Guardar localmente para evitar pérdidas accidentales o resets del servidor
      localStorage.setItem("validaform_custom_fields", JSON.stringify(updatedFields));

      const res = await fetch("/api/form/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields);
      }
    } catch (e) {
      console.error("Error al publicar la nueva estructura del formulario:", e);
    }
  };

  const handleMasterSaveFields = async () => {
    try {
      localStorage.setItem("validaform_custom_fields", JSON.stringify(fields));
      const res = await fetch("/api/form/fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (res.ok) {
        const data = await res.json();
        setFields(data.fields);
        alert("¡Estructura de preguntas del formulario guardada con éxito de forma definitiva! Los cambios permanecerán persistentes en su navegador y el servidor.");
      } else {
        alert("Los cambios se han guardado localmente en tu navegador de forma segura.");
      }
    } catch (e) {
      console.error("Error al guardar cambios de forma definitiva:", e);
      alert("Los cambios se han guardado localmente en tu navegador de forma segura.");
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", { method: "POST" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error("Fallo al marcar notificaciones como leídas", e);
    }
  };

  // Reordenar campos arriba/abajo
  const moveField = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= fields.length) return;

    const list = [...fields];
    const temp = list[index];
    list[index] = list[newIdx];
    list[newIdx] = temp;

    // Actualizar index de orden
    const reordered = list.map((f, i) => ({ ...f, order: i }));
    setFields(reordered);
    handleUpdateFields(reordered);
  };

  // Drag & Drop HTML5 Handlers
  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDragEnd = () => {
    if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) {
      const list = [...fields];
      const draggedNode = list[draggedIdx];
      list.splice(draggedIdx, 1);
      list.splice(dragOverIdx, 0, draggedNode);

      const reordered = list.map((f, i) => ({ ...f, order: i }));
      setFields(reordered);
      handleUpdateFields(reordered);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // Borrar campo
  const handleDeleteField = (id: string) => {
    const filtered = fields.filter((f) => f.id !== id);
    const reordered = filtered.map((f, i) => ({ ...f, order: i }));
    setFields(reordered);
    handleUpdateFields(reordered);
  };

  // Métodos de gestión de usuarios
  const handleEditClick = (u: ManageableUser) => {
    setEditingUser(u);
    setUserFormEmail(u.email);
    setUserFormName(u.name);
    setUserFormPassword(""); // Password starts empty for safety in edits
    setUserFormRole(u.role);
    setUserFormCountry(u.country || "");
    setUserFormRegion(u.region || "");
    setUserFormDriveUrl(u.driveUrl || "");
    setUserFormArchived(u.archived || false);
    setUserFormGeographicGroup(u.geographicGroup || "");
    setUserFormError(null);
    setUserFormSuccess(null);
    setUserFormOpen(true);
  };

  const handleCloseUserForm = () => {
    setUserFormOpen(false);
    setEditingUser(null);
    setUserFormEmail("");
    setUserFormName("");
    setUserFormPassword("");
    setUserFormRole("user");
    setUserFormCountry("");
    setUserFormRegion("");
    setUserFormDriveUrl("");
    setUserFormArchived(false);
    setUserFormGeographicGroup("");
    setUserFormError(null);
    setUserFormSuccess(null);
  };

  const handleDeleteUser = (emailToDelete: string) => {
    if (emailToDelete.toLowerCase() === user.email.toLowerCase()) {
      alert("No puedes eliminar tu propia cuenta de administrador.");
      return;
    }
    setUserEmailToDelete(emailToDelete);
  };

  const confirmDeleteUser = async () => {
    if (!userEmailToDelete) return;
    const emailToDelete = userEmailToDelete;

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(emailToDelete)}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al archivar usuario.");
      }
      // Marcar usuario como archivado en el estado local en vez de filtrarlo. No borrar respuestas.
      setUsers(prev => prev.map(u => u.email.toLowerCase() === emailToDelete.toLowerCase() ? { ...u, archived: true } : u));
      
      try {
        const existingUsers = JSON.parse(localStorage.getItem("validaform_custom_users") || "[]");
        const idx = existingUsers.findIndex((u: any) => u.email.toLowerCase() === emailToDelete.toLowerCase());
        if (idx !== -1) {
          existingUsers[idx].archived = true;
          localStorage.setItem("validaform_custom_users", JSON.stringify(existingUsers));
        }
      } catch (err) {
        console.error("Error archiving user in localStorage:", err);
      }
      
      setUserEmailToDelete(null);
    } catch (err: any) {
      alert("Error al archivar el usuario: " + err.message);
      setUserEmailToDelete(null);
    }
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormSubmitting(true);
    setUserFormError(null);
    setUserFormSuccess(null);

    if (!userFormName || !userFormEmail || !userFormRole) {
      setUserFormError("Por favor, completa los campos requeridos (*).");
      setUserFormSubmitting(false);
      return;
    }

    if (userFormRole === "health_team" && !userFormGeographicGroup) {
      setUserFormError("Por favor, selecciona un grupo geográfico para el Equipo de Salud Espiritual.");
      setUserFormSubmitting(false);
      return;
    }

    if (!editingUser && (!userFormPassword || !userFormPassword.trim())) {
      setUserFormError("Por favor, ingresa una contraseña válida para el nuevo usuario.");
      setUserFormSubmitting(false);
      return;
    }

    if (userFormPassword && userFormPassword.trim().length < 6) {
      setUserFormError("La contraseña debe tener al menos 6 caracteres.");
      setUserFormSubmitting(false);
      return;
    }

    try {
      const url = "/api/users";
      const method = editingUser ? "PUT" : "POST";
      const isUserRole = userFormRole === "user";
      const body = {
        email: userFormEmail,
        oldEmail: editingUser ? editingUser.email : undefined,
        name: userFormName,
        role: userFormRole,
        country: isUserRole ? (userFormCountry || undefined) : undefined,
        region: isUserRole ? (userFormRegion || undefined) : undefined,
        password: userFormPassword || undefined,
        archived: editingUser ? userFormArchived : false,
        driveUrl: userFormDriveUrl || undefined,
        geographicGroup: userFormRole === "health_team" ? userFormGeographicGroup : undefined
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Fallo al procesar el usuario.");
      }

      setUserFormSuccess(editingUser ? "¡Usuario actualizado con éxito!" : "¡Usuario creado con éxito!");

      // Guardar también en localStorage para persistencia
      const localUser = {
        email: userFormEmail.toLowerCase(),
        name: userFormName,
        password: userFormPassword || undefined,
        role: userFormRole,
        country: isUserRole ? (userFormCountry || undefined) : undefined,
        region: isUserRole ? (userFormRegion || undefined) : undefined,
        archived: editingUser ? userFormArchived : false,
        driveUrl: userFormDriveUrl || undefined,
        geographicGroup: userFormRole === "health_team" ? userFormGeographicGroup : undefined
      };

      try {
        const existingUsers = JSON.parse(localStorage.getItem("validaform_custom_users") || "[]");
        const lookupEmail = editingUser ? editingUser.email.toLowerCase() : localUser.email;
        const idx = existingUsers.findIndex((u: any) => u.email.toLowerCase() === lookupEmail);
        if (idx !== -1) {
          existingUsers[idx] = {
            ...existingUsers[idx],
            email: localUser.email,
            name: localUser.name,
            role: localUser.role,
            country: localUser.country,
            region: localUser.region,
            archived: localUser.archived,
            password: localUser.password || existingUsers[idx].password,
            driveUrl: localUser.driveUrl,
            geographicGroup: localUser.geographicGroup
          };
        } else {
          existingUsers.push(localUser);
        }
        localStorage.setItem("validaform_custom_users", JSON.stringify(existingUsers));
      } catch (err) {
        console.error("Error saving user to localStorage in AdminDashboard:", err);
      }

      // Actualización local para rendimiento inmediato
      if (editingUser) {
        setUsers(prev => prev.map(u => u.email.toLowerCase() === editingUser.email.toLowerCase() 
          ? { ...u, email: userFormEmail.toLowerCase(), name: userFormName, role: userFormRole, country: isUserRole ? userFormCountry : undefined, region: isUserRole ? userFormRegion : undefined, archived: userFormArchived, driveUrl: userFormDriveUrl, geographicGroup: userFormRole === "health_team" ? userFormGeographicGroup : undefined } 
          : u
        ));
      } else {
        const newlyCreated: ManageableUser = {
          email: userFormEmail.toLowerCase(),
          name: userFormName,
          role: userFormRole,
          country: isUserRole ? userFormCountry : undefined,
          region: isUserRole ? userFormRegion : undefined,
          archived: false,
          driveUrl: userFormDriveUrl,
          geographicGroup: userFormRole === "health_team" ? userFormGeographicGroup : undefined
        };
        setUsers(prev => [...prev, newlyCreated]);
      }

      setTimeout(() => {
        handleCloseUserForm();
      }, 1200);

    } catch (err: any) {
      setUserFormError(err.message || "Fallo de conexión...");
    } finally {
      setUserFormSubmitting(false);
    }
  };

  // Guardar un campo creado/editado
  const handleSaveField = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    if (!newFieldLabel.trim()) {
      setFieldError(newFieldType === "section" ? "El título de la sección es requerido." : "La etiqueta del campo es requerida.");
      return;
    }

    const fieldId = editingFieldId || "field_" + Date.now();

    const optionsArray = (newFieldType === "select" || newFieldType === "checkbox")
      ? newFieldOptions.split(",").map(o => o.trim()).filter(o => o.length > 0)
      : undefined;

    const columnsArray = newFieldType === "table"
      ? newFieldColumns.split(",").map(c => c.trim()).filter(c => c.length > 0)
      : undefined;

    const predefinedRowsArray = newFieldType === "table"
      ? newFieldPredefinedRows.split(",").map(r => r.trim()).filter(r => r.length > 0)
      : undefined;

    if (newFieldType === "select" && (!optionsArray || optionsArray.length === 0)) {
      setFieldError("Debes ingresar al menos una opción para el menú desplegable.");
      return;
    }

    if (newFieldType === "table" && (!columnsArray || columnsArray.length === 0)) {
      setFieldError("Debes ingresar al menos una columna para la tabla.");
      return;
    }

    const isSection = newFieldType === "section";
    const validation: any = { required: isSection ? false : newFieldRequired };
    if (!isSection) {
      if (newFieldType === "text" || newFieldType === "textarea") {
        if (newFieldMinLength > 0) validation.minLength = newFieldMinLength;
        if (newFieldMaxLength > 0) validation.maxLength = newFieldMaxLength;
      }
      if (newFieldType === "number") {
        if (newFieldMin !== "") validation.min = Number(newFieldMin);
        if (newFieldMax !== "") validation.max = Number(newFieldMax);
      }
      if (newFieldType === "email") {
        validation.pattern = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$";
      }
    }

    const columnTypesMap: Record<string, any> = {};
    const columnOptionsMap: Record<string, string[]> = {};
    if (newFieldType === "table" && columnsArray) {
      columnsArray.forEach(col => {
        const trimmedCol = col.trim();
        columnTypesMap[trimmedCol] = newFieldColumnTypes[trimmedCol] || newFieldColumnTypes[col] || "text";
        if ((newFieldColumnTypes[trimmedCol] === "select" || newFieldColumnTypes[col] === "select") && 
            (newFieldColumnOptions[trimmedCol] || newFieldColumnOptions[col])) {
          const rawOpts = newFieldColumnOptions[trimmedCol] || newFieldColumnOptions[col] || "";
          columnOptionsMap[trimmedCol] = rawOpts
            .split(",")
            .map(o => o.trim())
            .filter(o => o.length > 0);
        }
      });
    }

    const newField: FormField = {
      id: fieldId,
      label: newFieldLabel.trim(),
      type: newFieldType,
      placeholder: isSection ? undefined : (newFieldPlaceholder.trim() || undefined),
      description: newFieldDescription.trim() || undefined,
      required: isSection ? false : newFieldRequired,
      options: isSection ? undefined : optionsArray,
      allowOther: newFieldType === "select" ? newFieldAllowOther : undefined,
      multiple: newFieldType === "select" ? newFieldMultiple : undefined,
      columns: isSection ? undefined : columnsArray,
      columnTypes: newFieldType === "table" ? columnTypesMap : undefined,
      columnOptions: newFieldType === "table" ? columnOptionsMap : undefined,
      predefinedRows: isSection ? undefined : predefinedRowsArray,
      dateRenderMode: newFieldType === "date" ? newFieldDateRenderMode : undefined,
      validation: validation,
      order: editingFieldId ? fields.find(f => f.id === editingFieldId)?.order || 0 : fields.length
    };

    let updatedList: FormField[];
    if (editingFieldId) {
      updatedList = fields.map(f => f.id === editingFieldId ? newField : f);
    } else {
      updatedList = [...fields, newField];
    }

    const finalOrdered = updatedList.map((f, i) => ({ ...f, order: i }));
    setFields(finalOrdered);
    handleUpdateFields(finalOrdered);

    // Resetear formulario de edición
    setEditingFieldId(null);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldPlaceholder("");
    setNewFieldDescription("");
    setNewFieldRequired(true);
    setNewFieldOptions("");
    setNewFieldAllowOther(false);
    setNewFieldMultiple(false);
    setNewFieldColumns("");
    setNewFieldPredefinedRows("");
    setNewFieldMinLength(0);
    setNewFieldMaxLength(0);
    setNewFieldMin("");
    setNewFieldMax("");
    setNewFieldColumnTypes({});
    setNewFieldColumnOptions({});
    setNewFieldDateRenderMode("picker");
  };

  const handleEditFieldClick = (field: FormField) => {
    setEditingFieldId(field.id);
    setNewFieldLabel(field.label);
    setNewFieldType(field.type as any);
    setNewFieldPlaceholder(field.placeholder || "");
    setNewFieldDescription(field.description || "");
    setNewFieldRequired(field.required);
    setNewFieldOptions(field.options ? field.options.join(", ") : "");
    setNewFieldAllowOther(field.allowOther || false);
    setNewFieldMultiple(field.multiple || false);
    setNewFieldColumns(field.columns ? field.columns.join(",") : "");
    setNewFieldPredefinedRows(field.predefinedRows ? field.predefinedRows.join(",") : "");
    setNewFieldMinLength(field.validation?.minLength || 0);
    setNewFieldMaxLength(field.validation?.maxLength || 0);
    setNewFieldMin(field.validation?.min !== undefined ? field.validation.min : "");
    setNewFieldMax(field.validation?.max !== undefined ? field.validation.max : "");
    setNewFieldColumnTypes(field.columnTypes || {});
    setNewFieldDateRenderMode(field.dateRenderMode || "picker");
    
    const colOptionsMap: Record<string, string> = {};
    if (field.columnOptions) {
      Object.entries(field.columnOptions).forEach(([col, opts]) => {
        colOptionsMap[col] = opts.join(", ");
      });
    }
    setNewFieldColumnOptions(colOptionsMap);
    
    setActiveTab("builder");
  };

  // Generación de Reportes con Gemini
  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await fetch("/api/reports/generate", { method: "POST" });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Fallo técnico en generación del informe.");
      }
      const data: GeminiReport = await res.json();
      setReports(prev => [data, ...prev]);
      setActiveReport(data);
      // Recargar respuestas y alertas, ya que generar reporte introduce alertas
      fetchInitialData();
    } catch (e: any) {
      alert("Error al generar el reporte: " + e.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Función elegante para el PDF (Abre la vista de impresión con estilos corporativos en papel)
  const handlePrint = (report: GeminiReport) => {
    setActiveReport(report);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const handleDeleteReport = (id: string) => {
    setReportIdToDelete(id);
  };

  const confirmDeleteReport = async () => {
    if (!reportIdToDelete) return;
    try {
      const res = await fetch(`/api/reports/${reportIdToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportIdToDelete));
        if (activeReport?.id === reportIdToDelete) setActiveReport(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReportIdToDelete(null);
    }
  };

  // Parser simple de Markdown para informes
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // H1 Header
      if (line.startsWith("# ")) {
        return <h1 key={idx} className="mt-6 mb-4 text-2xl font-extrabold text-slate-900 border-b pb-2 dark:text-white dark:border-slate-800">{line.substring(2)}</h1>;
      }
      // H2 Header
      if (line.startsWith("## ")) {
        return <h2 key={idx} className="mt-5 mb-3 text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">{line.substring(3)}</h2>;
      }
      // H3 Header
      if (line.startsWith("### ")) {
        return <h3 key={idx} className="mt-4 mb-2 text-md font-semibold text-blue-700 dark:text-[#8FA89B]">{line.substring(4)}</h3>;
      }
      // Blockquote
      if (line.startsWith("> ")) {
        return <blockquote key={idx} className="my-3 border-l-4 border-blue-400 bg-[#8FA89B]/10/50 p-3 italic text-slate-600 dark:bg-blue-950/20 dark:text-slate-300">{line.substring(2)}</blockquote>;
      }
      // Bullet list
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return <li key={idx} className="ml-5 list-disc text-sm text-slate-600 my-1 py-0.5 dark:text-slate-300">{line.trim().substring(2)}</li>;
      }
      // Number list
      if (/^\d+\.\s/.test(line.trim())) {
        const parts = line.trim().split(/^\d+\.\s/);
        return <li key={idx} className="ml-5 list-decimal text-sm text-slate-600 my-1 py-0.5 dark:text-slate-300">{parts[1]}</li>;
      }
      // Tablas sencillas
      if (line.startsWith("|")) {
        // Ignorar líneas divisoras como |:---|---:|
        if (line.includes("---")) return null;
        const columns = line.split("|").map(col => col.trim()).filter(col => col.length > 0);
        return (
          <div key={idx} className="overflow-x-auto my-2">
            <table className="min-w-full divide-y divide-slate-100 border text-xs dark:divide-slate-800 dark:border-slate-800">
              <tbody>
                <tr className="bg-slate-50/40 dark:bg-slate-800/30">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-slate-700 dark:text-slate-300 font-medium">
                      {col.replace(/\*\*/g, "")}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        );
      }
      // Texto normal vacío
      if (!line.trim()) return <div key={idx} className="h-2"></div>;

      // Reemplazo básico de bold **text**
      const formattedLine = line.split("**").map((part, i) => {
        return i % 2 === 1 ? <strong key={i} className="font-bold text-slate-900 dark:text-slate-100">{part}</strong> : part;
      });

      return <p key={idx} className="text-sm text-slate-600 leading-relaxed my-1.5 dark:text-slate-300">{formattedLine}</p>;
    });
  };

  // Calcular métricas agregadas sencillas para el dashboard principal
  const calculateMetrics = () => {
    const total = submissions.length;
    let excelenteCount = 0;
    let avgAge = 0;
    
    submissions.forEach(sub => {
      // Buscar satisfacción en las respuestas
      const sat = sub.data.f_satisfaccion;
      if (sat === "Excelente") excelenteCount++;
      
      const ageField = fields.find(f => f.type === "number");
      if (ageField) {
        const val = Number(sub.data[ageField.id]);
        if (!isNaN(val)) avgAge += val;
      }
    });

    const satisfactionPercent = total > 0 ? ((excelenteCount / total) * 100).toFixed(0) : 0;
    const computedAvgAge = total > 0 ? (avgAge / total).toFixed(0) : "N/D";

    return { total, satisfactionPercent, computedAvgAge };
  };

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6 admin-dashboard-container">
      {/* Contenedor Principal en un solo bloque fluido y optimizado (Sin Sidebar Izquierdo) */}
      <div className="w-full">
        {/* Área de Contenido Principal */}
        <div className="w-full">
          {loading ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
              <RefreshCcw className="h-8 w-8 animate-spin text-[#8FA89B]" />
              <p className="text-sm text-slate-500">Recuperando datos actualizados de la base de datos...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
          {activeTab === "inicio" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-6 md:py-16 text-center max-w-5xl mx-auto w-full"
            >
              {/* Elegant Greeting & Intention */}
              <div className="max-w-2xl mb-12 space-y-4 flex flex-col items-center">
                {/* Elegant 9-pointed star vector symbol */}
                <div className="flex justify-center mb-6 text-[#5F756B] dark:text-[#8FA89B] opacity-85">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-16 w-16 md:h-20 md:w-20 transition-all duration-500 hover:scale-[1.03]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="50" cy="50" r="44" strokeWidth="0.75" strokeDasharray="3 3" className="opacity-50" />
                    <circle cx="50" cy="50" r="41" strokeWidth="0.5" className="opacity-30" />
                    <polygon points="50,14 81.18,68 18.82,68" className="opacity-70" />
                    <polygon points="73.14,22.42 62.31,83.83 14.55,43.75" className="opacity-70" />
                    <polygon points="85.45,43.75 37.69,83.83 26.86,22.42" className="opacity-70" />
                  </svg>
                </div>

                <h1 className="text-3xl md:text-5xl font-serif text-[#3D3A37] dark:text-[#EAE5DF] font-semibold tracking-tight flex flex-col items-center">
                  <span className="text-2xl md:text-3xl text-[#5F756B] dark:text-[#8FA89B] font-light italic font-serif">
                    Alláh'u'Abhá
                  </span>
                  <span className="block mt-2 text-3xl md:text-5xl font-semibold">
                    {user.name || "Servidor"}
                  </span>
                </h1>
                <p className="text-sm md:text-base italic text-[#5F756B] dark:text-[#C5C0BA] font-serif leading-relaxed px-4 opacity-90 max-w-lg mx-auto">
                  "Las enseñanzas de Bahá’u’lláh proporcionan «los medios conducentes a la elevación, el progreso, la educación, la protección y la regeneración de los pueblos de la tierra»."
                </p>
              </div>

              {/* Balanced & Highly Integrated Premium Grid Action Deck for Counselors */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="w-full max-w-5xl px-4 mt-8 mx-auto"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-md mx-auto lg:max-w-none">
                  
                  {/* Card 1: Regional Stats */}
                  <button
                    onClick={() => setActiveTab("stats")}
                    className="group flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-[#1C1917]/90 rounded-2xl border border-[#EAE5DF] dark:border-[#2D2A26] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer outline-none w-full"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 flex items-center justify-center transition-all duration-300 shrink-0 mb-6 group-hover:scale-105 group-hover:bg-[#8FA89B]/15">
                        <Globe className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-sans font-bold text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight transition-colors duration-300 leading-snug">
                        Estadísticas Regionales
                      </h3>
                      <p className="text-xs text-[#6B6661] dark:text-[#C5C0BA] mt-2 font-sans font-medium leading-relaxed">
                        Métricas y tendencias de salud regionalizadas.
                      </p>
                    </div>
                    <div className="mt-6 w-full flex justify-end">
                      <span className="text-xs font-semibold text-[#8FA89B] font-sans flex items-center gap-1">
                        Acceder <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                      </span>
                    </div>
                  </button>

                  {/* Card 2: Guide Repository */}
                  <button
                    onClick={() => window.open(adminDriveUrl || "https://drive.google.com/drive/u/2/folders/1z_9-wzWzxn3sWjtMZ88kgyGZnkpskWn_", "_blank", "noopener,noreferrer")}
                    className="group flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-[#1C1917]/90 rounded-2xl border border-[#EAE5DF] dark:border-[#2D2A26] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer outline-none w-full"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 flex items-center justify-center transition-all duration-300 shrink-0 mb-6 group-hover:scale-105 group-hover:bg-[#8FA89B]/15">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-sans font-bold text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight transition-colors duration-300 leading-snug">
                        Repositorio de Guía
                      </h3>
                      <p className="text-xs text-[#6B6661] dark:text-[#C5C0BA] mt-2 font-sans font-medium leading-relaxed">
                        Historias de salud, compilaciones y cartas de consulta.
                      </p>
                    </div>
                    <div className="mt-6 w-full flex justify-end">
                      <span className="text-xs font-semibold text-[#8FA89B] font-sans flex items-center gap-1">
                        Acceder <ExternalLink className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                      </span>
                    </div>
                  </button>

                  {/* Card 3: Submissions */}
                  <button
                    onClick={() => setActiveTab("submissions")}
                    className="group flex flex-col justify-between p-6 sm:p-8 bg-white dark:bg-[#1C1917]/90 rounded-2xl border border-[#EAE5DF] dark:border-[#2D2A26] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer outline-none w-full"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 flex items-center justify-center transition-all duration-300 shrink-0 mb-6 group-hover:scale-105 group-hover:bg-[#8FA89B]/15">
                        <Grid className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-sans font-bold text-[#3D3A37] dark:text-[#EAE5DF] tracking-tight transition-colors duration-300 leading-snug">
                        Reporte de Envíos
                      </h3>
                      <p className="text-xs text-[#6B6661] dark:text-[#C5C0BA] mt-2 font-sans font-medium leading-relaxed">
                        Seguimiento y visualización detallada de envíos de encuestas.
                      </p>
                    </div>
                    <div className="mt-6 w-full flex justify-end">
                      <span className="text-xs font-semibold text-[#8FA89B] font-sans flex items-center gap-1">
                        Acceder <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                      </span>
                    </div>
                  </button>

                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "stats" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <RegionalStatsDashboard 
                user={user} 
                selectedCountry={selectedCountry}
                setSelectedCountry={setSelectedCountry}
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                hideSidebar={true}
              />
            </motion.div>
          )}

          {/* ==================== TAB 1: RESPUESTAS & ESTADÍSTICAS ==================== */}
          {activeTab === "submissions" && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              
              {/* Sección de Dashboard de Respuestas y Métricas */}
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4 border-b border-slate-800 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <BarChart2 className="h-5 w-5 text-[#8FA89B]" />
                      Reporte de Envíos ({formatFechaLetras(latestFecha, "Ninguna")})
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Visualización en tiempo real y estadísticas de cumplimiento para la fecha de reporte activa: <strong className="text-[#8FA89B] font-semibold">{formatFechaLetras(latestFecha, "No definida")}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={fetchInitialData}
                    className="flex items-center gap-2 rounded-xl border border-[#EAE5DF] dark:border-slate-800 bg-[#FCFAF7] hover:bg-[#F3EFE9] dark:bg-slate-900 dark:hover:bg-slate-850 px-4 py-2.5 text-xs font-semibold text-[#3D3A37] dark:text-slate-200 transition-all duration-200 active:scale-95 shadow-sm hover:shadow cursor-pointer font-sans"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 text-[#5F756B] dark:text-[#8FA89B] ${loading ? "animate-spin" : ""}`} />
                    Sincronizar Datos
                  </button>
                </div>

                {/* Layout Principal: Métricas de Envíos y Faltantes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Total de Envíos Recibidos Card */}
                  <div className="group relative rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/40 to-slate-950/60 p-6 shadow-xl hover:border-emerald-500/30 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[220px]">
                    {/* Ambient Background Light Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                    
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium tracking-wide text-emerald-400 flex items-center gap-1.5 font-sans">
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          Envíos recibidos
                        </span>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
                          <Check className="h-5 w-5" />
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-baseline gap-2.5">
                        <span className="text-5xl font-black text-white tracking-tight font-mono">{uniqueSubmittedCount}</span>
                        <span className="text-sm text-slate-405 font-semibold">de {activeUsersCount} Miembros de Cuerpo Auxiliar esperados</span>
                      </div>
                      <p className="text-xs text-slate-505 mt-2">Formularios únicos completados satisfactoriamente para la fecha activa.</p>
                    </div>

                    {/* horizontal Progress Gauge */}
                    <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-2.5">
                      <div className="flex justify-between items-center text-[11px] font-medium font-sans">
                        <span className="text-slate-400 tracking-wide">Tasa de participación de miembros</span>
                        <span className="text-emerald-400 font-mono text-xs">{currentSubmissionsActivityRate}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${currentSubmissionsActivityRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Formularios Faltantes Card */}
                  <div className="group relative rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/40 to-slate-950/60 p-6 shadow-xl hover:border-[#D1A17B]/30 transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[220px]">
                    {/* Ambient Background Light Glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#D1A17B]/5 rounded-full blur-3xl group-hover:bg-[#D1A17B]/10 transition-all duration-500" />
                    
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-medium tracking-wide text-[#D1A17B] flex items-center gap-1.5 font-sans">
                          <span className="h-2 w-2 rounded-full bg-[#D1A17B]"></span>
                          Envíos faltantes
                        </span>
                        <div className="p-2.5 rounded-xl bg-[#D1A17B]/10 border border-[#D1A17B]/20 text-[#D1A17B] shadow-inner">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-baseline gap-2.5">
                        <span className="text-5xl font-black text-[#D1A17B] tracking-tight font-mono">{missingUsers.length}</span>
                        <span className="text-sm text-slate-405 font-semibold">Miembros de Cuerpo Auxiliar pendientes</span>
                      </div>
                      <p className="text-xs text-slate-505 mt-2">Usuarios de la plataforma que aún no han registrado su reporte.</p>
                    </div>

                    {/* horizontal Progress Gauge */}
                    <div className="mt-6 pt-4 border-t border-slate-800/60 space-y-2.5">
                      <div className="flex justify-between items-center text-[11px] font-medium font-sans">
                        <span className="text-slate-400 tracking-wide">Porcentaje de miembros pendientes</span>
                        <span className="text-[#D1A17B] font-mono text-xs">{100 - currentSubmissionsActivityRate}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
                        <div 
                          className="h-full bg-gradient-to-r from-[#B88660] to-[#D1A17B] rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${100 - currentSubmissionsActivityRate}%` }}
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Registro de Envíos y Faltantes */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6 shadow-2xl backdrop-blur-sm">
                
                {/* Controles del Panel: Tabs de Sub-sección y Buscador en Tiempo Real */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-5 mb-6 gap-4">
                  {/* Segmented Tab Buttons */}
                  <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 w-fit">
                    <button
                      onClick={() => {
                        setSubmissionsSubTab("received");
                        setSubmissionSearch("");
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                        submissionsSubTab === "received"
                          ? "bg-slate-800 text-emerald-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${submissionsSubTab === "received" ? "bg-emerald-400 animate-pulse" : "bg-emerald-500"}`}></span>
                      Formularios Recibidos ({filteredOrganizedSubmissions.length})
                    </button>
                    <button
                      onClick={() => {
                        setSubmissionsSubTab("missing");
                        setSubmissionSearch("");
                      }}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                        submissionsSubTab === "missing"
                          ? "bg-slate-800 text-[#D1A17B] shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${submissionsSubTab === "missing" ? "bg-[#D1A17B] animate-pulse" : "bg-[#D1A17B]"}`}></span>
                      Formularios Faltantes ({filteredMissingUsers.length})
                    </button>
                  </div>

                  {/* Real-time Submissions Filter and Search Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {/* Filtro por Grupo Geográfico */}
                    <div className="relative w-full sm:w-48">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      </span>
                      <select
                        id="submission_group_filter"
                        value={submissionGroupFilter}
                        onChange={(e) => setSubmissionGroupFilter(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2 pl-8 pr-8 text-xs font-medium focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-[#8FA89B]/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Todos">Todos los grupos</option>
                        {Object.keys(GEOGRAPHIC_GROUPS).map((grp) => (
                          <option key={grp} value={grp}>
                            {grp}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Filtro por País */}
                    <div className="relative w-full sm:w-48">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Globe className="h-3.5 w-3.5 text-slate-500" />
                      </span>
                      <select
                        value={submissionCountryFilter}
                        onChange={(e) => setSubmissionCountryFilter(e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2 pl-8 pr-8 text-xs font-medium focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-[#8FA89B]/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="Todos">Todos los países</option>
                        {filteredCountryOptions.map((loc) => (
                          <option key={loc.country} value={loc.country}>
                            {loc.country}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Buscador */}
                    <div className="relative w-full sm:w-72">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <Search className="h-4 w-4 text-slate-500" />
                      </span>
                      <input
                        type="text"
                        value={submissionSearch}
                        onChange={(e) => setSubmissionSearch(e.target.value)}
                        placeholder={submissionsSubTab === "received" ? "Buscar por nombre, país, región..." : "Buscar miembro de cuerpo auxiliar pendiente..."}
                        className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2 pl-9 pr-8 text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-[#8FA89B]/20 transition-all"
                      />
                      {submissionSearch && (
                        <button
                          onClick={() => setSubmissionSearch("")}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {submissionsSubTab === "received" ? (
                  filteredOrganizedSubmissions.length === 0 ? (
                    <div className="flex h-56 flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800/80 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-slate-950/80 flex items-center justify-center text-slate-600 mb-3 border border-slate-800/50">
                        <ClipboardList className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-slate-400 font-bold">
                        {submissionSearch ? "No se encontraron coincidencias" : "No se han registrado respuestas"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {submissionSearch 
                          ? "Intenta buscar con otros términos o limpia el filtro de búsqueda actual." 
                          : `Los envíos de los Miembros de Cuerpo Auxiliar para el periodo ${formatFechaLetras(latestFecha, "actual")} se mostrarán en esta lista.`
                        }
                      </p>
                      {submissionSearch && (
                        <button
                          onClick={() => setSubmissionSearch("")}
                          className="mt-4 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          Limpiar Filtro
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-850 bg-slate-950/20 shadow-lg">
                      <table className="min-w-full divide-y divide-slate-800/60 text-left text-xs sm:text-sm">
                        <thead className="bg-slate-950/70 border-b border-slate-800/80 text-[11px] font-semibold tracking-wide text-slate-400 font-sans">
                          <tr>
                            <th 
                              onClick={() => handleSort("name")}
                              className="px-5 py-4 cursor-pointer hover:bg-slate-900/50 hover:text-white transition-colors select-none group"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Nombre / Miembro de cuerpo auxiliar</span>
                                {sortField === "name" ? (
                                  sortOrder === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-emerald-400" /> : <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <ChevronUp className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            </th>
                            <th 
                              onClick={() => handleSort("country")}
                              className="px-5 py-4 cursor-pointer hover:bg-slate-900/50 hover:text-white transition-colors select-none group"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>País</span>
                                {sortField === "country" ? (
                                  sortOrder === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-emerald-400" /> : <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <ChevronUp className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            </th>
                            <th 
                              onClick={() => handleSort("region")}
                              className="px-5 py-4 cursor-pointer hover:bg-slate-900/50 hover:text-white transition-colors select-none group"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Región</span>
                                {sortField === "region" ? (
                                  sortOrder === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-emerald-400" /> : <ChevronDown className="h-3.5 w-3.5 text-emerald-400" />
                                ) : (
                                  <ChevronUp className="h-3.5 w-3.5 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            </th>
                            <th className="px-5 py-4 text-right">
                              Estado
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {filteredOrganizedSubmissions.map((sub, idx) => {
                            const associatedUser = roleUsers.find(u => u.email.toLowerCase() === sub.userEmail.toLowerCase());
                            const senderName = associatedUser ? associatedUser.name : (sub.data.f_nombre || "Anónimo");
                            const initials = senderName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                            
                            // Gen color based on index
                            const colors = [
                              "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                              "bg-[#8FA89B]/10 text-[#8FA89B] border-[#8FA89B]/20",
                              "bg-teal-500/10 text-teal-400 border-teal-500/20",
                              "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                            ];
                            const avatarColor = colors[idx % colors.length];

                            return (
                              <tr key={sub.id} className="hover:bg-slate-900/30 transition-all duration-150 group">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold font-mono ${avatarColor} shadow-inner shrink-0`}>
                                      {initials}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{senderName}</span>
                                      <span className="block text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px] sm:max-w-none">{sub.userEmail}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-semibold">
                                    {sub.userCountry || "N/A"}
                                  </span>
                                </td>
                                <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                                  {sub.userRegion || "N/A"}
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                                    <Check className="h-3 w-3" />
                                    Enviado
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  filteredMissingUsers.length === 0 ? (
                    <div className="flex h-56 flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800/80 rounded-xl">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-500/20">
                        <Check className="h-6 w-6" />
                      </div>
                      <p className="text-sm text-slate-300 font-bold">
                        {submissionSearch ? "No se encontraron coincidencias" : "¡Cumplimiento del 100%!"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        {submissionSearch 
                          ? "Intenta buscar con otros términos o limpia el filtro de búsqueda actual." 
                          : "Todos los Miembros de Cuerpo Auxiliar correspondientes han enviado su reporte correctamente para esta fecha."
                        }
                      </p>
                      {submissionSearch && (
                        <button
                          onClick={() => setSubmissionSearch("")}
                          className="mt-4 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                        >
                          Limpiar Filtro
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-xl border border-slate-850 bg-slate-950/20 shadow-lg">
                      <table className="min-w-full divide-y divide-slate-800/60 text-left text-xs sm:text-sm">
                        <thead className="bg-slate-950/70 border-b border-slate-800/80 text-[11px] font-semibold tracking-wide text-slate-400 font-sans">
                          <tr>
                            <th className="px-5 py-4">Usuario</th>
                            <th className="px-5 py-4">Ubicación / Región</th>
                            <th className="px-5 py-4 text-right">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {filteredMissingUsers.map((u, idx) => {
                            const senderName = u.name || "Sin nombre";
                            const initials = senderName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();
                            const colors = [
                              "bg-[#D1A17B]/10 text-[#D1A17B] border-[#D1A17B]/20",
                              "bg-amber-500/10 text-amber-400 border-amber-500/20",
                              "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            ];
                            const avatarColor = colors[idx % colors.length];

                            return (
                              <tr key={u.email} className="hover:bg-slate-900/30 transition-all duration-150 group">
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold font-mono ${avatarColor} shadow-inner shrink-0`}>
                                      {initials}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="block text-sm font-bold text-white group-hover:text-[#D1A17B] transition-colors">{senderName}</span>
                                      <span className="block text-[10px] text-slate-500 mt-0.5 truncate max-w-[150px] sm:max-w-none">{u.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 text-[11px] font-semibold">
                                      {u.country || "N/A"}
                                    </span>
                                    {u.region && (
                                      <span className="text-slate-500 text-xs font-mono">({u.region})</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-4 text-right">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#D1A17B]/10 px-2.5 py-1 text-[11px] font-bold text-[#D1A17B] border border-[#D1A17B]/20 animate-pulse">
                                    <AlertCircle className="h-3 w-3" />
                                    Pendiente
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== TAB 2: EDITOR DE FORMULARIO ==================== */}
          {activeTab === "builder" && user.role === "admin" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Sección Izquierda: Campos Actuales & Reordenamiento */}
              <div className="lg:col-span-7 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_0_20px_rgba(59, 130, 246,0.1)] backdrop-blur-sm">
                  <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Composición del Formulario</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Organiza el orden arrastrando las tarjetas o usando las flechas. Tus cambios se guardarán automáticamente.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        id="open_preview_modal_btn"
                        type="button"
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700/50 text-white px-4 py-2.5 text-xs font-bold transition-all hover:scale-[0.98]"
                      >
                        <Eye className="h-4 w-4 text-[#8FA89B]" />
                        <span>Vista Previa</span>
                      </button>
                      <button
                        id="save_db_changes_btn"
                        type="button"
                        onClick={handleMasterSaveFields}
                        className="flex items-center gap-1.5 rounded-xl bg-[#8FA89B] hover:bg-[#8FA89B] border border-[#8FA89B]/30 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-[0_0_12px_rgba(143,168,155,0.25)] hover:scale-[0.98]"
                      >
                        <Save className="h-4 w-4" />
                        <span>Guardar Cambios</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {fields.map((field, index) => {
                      const isDragged = draggedIdx === index;
                      const isOver = dragOverIdx === index;

                      return (
                        <div
                          key={field.id}
                          id={`builder_field_${field.id}`}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center justify-between rounded-xl border p-4 transition-all focus-within:ring-2 focus-within:ring-blue-950 ${
                            isDragged 
                              ? "opacity-40 border-[#8FA89B] bg-[#8FA89B]/10" 
                              : isOver 
                              ? "border-blue-400 bg-[#8FA89B]/20" 
                              : field.type === "section"
                              ? "border-[#8FA89B]/30 bg-blue-950/20 hover:border-[#8FA89B]/30 hover:bg-slate-900/50"
                              : "border-slate-800 bg-slate-950/40 hover:bg-slate-900/50"
                          }`}
                          style={{ cursor: 'move' }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Cursor de arrastre visual */}
                            <div className="flex flex-col gap-0.5 text-slate-500">
                              <span className="block h-1 w-3 rounded-full bg-slate-600"></span>
                              <span className="block h-1 w-3 rounded-full bg-slate-600"></span>
                              <span className="block h-1 w-3 rounded-full bg-slate-600"></span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  field.type === "section"
                                    ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                                    : "text-[#8FA89B] bg-[#8FA89B]/10 border border-[#8FA89B]/20"
                                }`}>
                                  {field.type === "section" ? "SECCIÓN" : field.type.toUpperCase()}
                                </span>
                                {field.required && field.type !== "section" && (
                                  <span className="text-[9px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                                    Obligatorio
                                  </span>
                                )}
                              </div>
                              <span className={`mt-1 block text-sm font-semibold ${
                                field.type === "section" ? "text-[#8FA89B] text-base" : "text-white"
                              }`}>
                                {field.label}
                              </span>
                              {field.description && (
                                <span className="block text-xs text-slate-400 italic">
                                  Descripción: "{field.description}"
                                </span>
                              )}
                              {field.type !== "section" && (
                                <>
                                  {field.placeholder && (
                                    <span className="block text-xs text-slate-500 italic">
                                      Marcador: "{field.placeholder}"
                                    </span>
                                  )}
                                  {field.options && field.options.length > 0 && (
                                    <span className="mt-0.5 max-w-xs block text-[10px] text-slate-400 truncate">
                                      Opciones: {field.options.join(" | ")}
                                    </span>
                                  )}
                                  {field.columns && field.columns.length > 0 && (
                                    <span className="mt-0.5 max-w-xs block text-[10px] text-slate-400 truncate">
                                      Columnas: {field.columns.join(" | ")}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Controles de Acción (Mover, Editar, Eliminar) */}
                          <div className="flex items-center gap-1.5">
                            <button
                              id={`move_up_${field.id}`}
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveField(index, "up")}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-850 hover:text-white disabled:opacity-20 transition-colors"
                            >
                              <ChevronUp className="h-4.5 w-4.5" />
                            </button>
                            <button
                              id={`move_down_${field.id}`}
                              type="button"
                              disabled={index === fields.length - 1}
                              onClick={() => moveField(index, "down")}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-850 hover:text-white disabled:opacity-20 transition-colors"
                            >
                              <ChevronDown className="h-4.5 w-4.5" />
                            </button>
                            <button
                              id={`edit_field_${field.id}`}
                              type="button"
                              onClick={() => handleEditFieldClick(field)}
                              className="rounded-lg p-1.5 text-[#8FA89B] hover:bg-[#5F756B]/10 hover:text-[#8FA89B] transition-colors"
                              title="Editar campo"
                            >
                              <SlidersHorizontal className="h-4.5 w-4.5" />
                            </button>
                            <button
                              id={`delete_field_${field.id}`}
                              type="button"
                              onClick={() => handleDeleteField(field.id)}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                              title="Eliminar campo"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección Derecha: Añadir o Editar Campo */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_0_20px_rgba(59, 130, 246,0.1)] backdrop-blur-sm">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {editingFieldId ? "Editar Campo Existente" : "Agregar Nuevo Campo"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configura el tipo, la validación y el estilo del campo secundario.
                    </p>
                  </div>

                  {fieldError && (
                    <div className="mb-4 rounded-lg bg-red-500/10 p-2.5 text-xs text-red-400 border border-red-500/20">
                      {fieldError}
                    </div>
                  )}

                  <form id="field_builder_form" onSubmit={handleSaveField} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        {newFieldType === "section" ? "Título de la Sección" : "Etiqueta del Campo (Pregunta)"}
                      </label>
                      <input
                        id="builder_label"
                        type="text"
                        value={newFieldLabel}
                        onChange={(e) => setNewFieldLabel(e.target.value)}
                        placeholder={newFieldType === "section" ? "Ej. Datos de Facturación" : "Ej. Teléfono Móvil"}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-2 focus:ring-[#8FA89B]/20"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Tipo de Dato
                        </label>
                        <select
                          id="builder_type"
                          value={newFieldType}
                          onChange={(e) => setNewFieldType(e.target.value as any)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-2 focus:ring-[#8FA89B]/20"
                        >
                          <option value="text" className="bg-slate-900 text-slate-300">Texto Corto</option>
                          <option value="number" className="bg-slate-900 text-slate-300">Número</option>
                          <option value="email" className="bg-slate-900 text-slate-300">Correo Electrónico</option>
                          <option value="select" className="bg-slate-900 text-slate-300">Menú Desplegable (Select)</option>
                          <option value="textarea" className="bg-slate-900 text-slate-300">Texto Largo (TextArea)</option>
                          <option value="checkbox" className="bg-slate-900 text-slate-300">Casilla de Verificación (Checkbox)</option>
                          <option value="boolean_justify" className="bg-slate-900 text-slate-300">Sí / No con Justificación (Boolean Justify)</option>
                          <option value="list" className="bg-slate-900 text-slate-300">Lista Dinámica (List)</option>
                          <option value="date" className="bg-slate-900 text-slate-300">Fecha (Date)</option>
                          <option value="table" className="bg-slate-900 text-slate-300">Tabla de Datos (Table)</option>
                          <option value="section" className="bg-slate-900 text-slate-300">Sección / Separador (Section)</option>
                        </select>
                      </div>
                      {newFieldType !== "section" && (
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                            ¿Es Requerido?
                          </label>
                          <div className="flex items-center space-x-2 mt-1">
                            <input
                              id="builder_required"
                              type="checkbox"
                              checked={newFieldRequired}
                              onChange={(e) => setNewFieldRequired(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-[#5F756B] focus:ring-blue-500 focus:ring-offset-slate-950"
                            />
                            <span className="text-sm text-slate-400">Sí, obligatorio</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                        {newFieldType === "section" ? "Descripción de la Sección" : "Descripción del Campo"}
                      </label>
                      <textarea
                        id="builder_description"
                        rows={2}
                        value={newFieldDescription}
                        onChange={(e) => setNewFieldDescription(e.target.value)}
                        placeholder={
                          newFieldType === "section"
                            ? "Escribe una breve descripción para guiar al usuario en esta sección del formulario..."
                            : "Una pequeña descripción explicativa que aparecerá debajo de la pregunta..."
                        }
                        className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-2 focus:ring-[#8FA89B]/20"
                      />
                    </div>

                    {newFieldType !== "section" && (
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                          Texto de Ayuda / Marcador (Placeholder)
                        </label>
                        <input
                          id="builder_placeholder"
                          type="text"
                          value={newFieldPlaceholder}
                          onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                          placeholder="Ej. Ingresa 10 dígitos..."
                          className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-2 focus:ring-[#8FA89B]/20"
                        />
                      </div>
                    )}

                    {/* Mostrar campo columnas si es tipo TABLE */}
                    {newFieldType === "table" && (
                      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/10 p-4 shadow-inner">
                        {/* SECCIÓN DE COLUMNAS DE LA TABLA */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Columnas de la Tabla *
                              </label>
                              <span className="text-[9px] text-slate-500 block">Ingresa las columnas principales que estructurarán la tabla.</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                              {newFieldPredefinedRows ? newFieldPredefinedRows.split(",").filter(r => r.trim().length > 0).length : 0} registradas
                            </span>
                          </div>

                          {/* Visual Columns List */}
                          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
                            {(newFieldPredefinedRows ? newFieldPredefinedRows.split(",") : []).map((row, rIdx) => {
                              const trimmed = row.trim();
                              if (!trimmed && row !== "") return null;
                              return (
                                <div key={rIdx} className="flex items-center gap-2 bg-slate-950/50 rounded-lg p-1.5 px-2.5 border border-slate-900/80 transition-all hover:border-slate-800">
                                  <span className="text-slate-500 text-[10px] font-semibold select-none w-5 font-mono">Col{rIdx+1}</span>
                                  <input
                                    type="text"
                                    value={row}
                                    onChange={(e) => {
                                      const rows = newFieldPredefinedRows.split(",");
                                      rows[rIdx] = e.target.value;
                                      setNewFieldPredefinedRows(rows.join(","));
                                    }}
                                    placeholder="Nombre de la columna..."
                                    className="bg-transparent text-sm text-slate-200 outline-none flex-1 border-b border-transparent focus:border-[#8FA89B]/30 py-0.5"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const rows = newFieldPredefinedRows.split(",");
                                      rows.splice(rIdx, 1);
                                      setNewFieldPredefinedRows(rows.join(","));
                                    }}
                                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                    title="Eliminar columna"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Add Column Button bar */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              id="quick_add_row_input"
                              placeholder="Ej. Empresa A, Aspecto 1, Mañana..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const target = e.currentTarget;
                                  const val = target.value.trim();
                                  if (val) {
                                    const rows = newFieldPredefinedRows ? newFieldPredefinedRows.split(",") : [];
                                    rows.push(val);
                                    setNewFieldPredefinedRows(rows.join(","));
                                    target.value = "";
                                  }
                                }
                              }}
                              className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none transition-all focus:border-[#8FA89B]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("quick_add_row_input") as HTMLInputElement;
                                if (el && el.value.trim()) {
                                  const rows = newFieldPredefinedRows ? newFieldPredefinedRows.split(",") : [];
                                  rows.push(el.value.trim());
                                  setNewFieldPredefinedRows(rows.join(","));
                                  el.value = "";
                                }
                              }}
                              className="rounded-lg bg-[#8FA89B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5F756B] transition-all flex items-center gap-1 shadow"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Añadir Columna</span>
                            </button>
                          </div>
                        </div>

                        {/* SECCIÓN DE SUBCOLUMNAS (CAMPOS DEBAJO DE CADA COLUMNA) */}
                        <div className="border-t border-slate-800/60 pt-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Subcolumnas de la Tabla *
                              </label>
                              <span className="text-[9px] text-slate-500 block">Estos campos de entrada irán justo debajo de cada columna de arriba.</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-800">
                              {newFieldColumns ? newFieldColumns.split(",").filter(c => c.trim().length > 0).length : 0} registradas
                            </span>
                          </div>
                          
                          {/* Visual Subcolumns List / Editor */}
                          <div className="space-y-3 mb-3 max-h-72 overflow-y-auto pr-1">
                            {(newFieldColumns ? newFieldColumns.split(",") : []).map((colRaw, cIdx) => {
                              const col = colRaw.trim();
                              if (!col && colRaw !== "") return null;
                              return (
                                <div key={cIdx} className="bg-slate-950/50 rounded-xl p-3 border border-slate-900 space-y-2.5 transition-all hover:border-slate-800">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#8FA89B] text-[10px] font-bold select-none w-14">Subcampo {cIdx+1}</span>
                                    <input
                                      type="text"
                                      value={colRaw}
                                      onChange={(e) => {
                                        const cols = newFieldColumns.split(",");
                                        const oldColName = cols[cIdx].trim();
                                        const newColRawName = e.target.value;
                                        const newColName = newColRawName.trim();
                                        cols[cIdx] = newColRawName;
                                        setNewFieldColumns(cols.join(","));
                                        
                                        // Migrar tipo y opciones al cambiar el nombre de la clave
                                        if (newColName !== oldColName) {
                                          setNewFieldColumnTypes(prev => {
                                            const copy = { ...prev };
                                            if (copy[oldColName]) {
                                              copy[newColName] = copy[oldColName];
                                              delete copy[oldColName];
                                            }
                                            return copy;
                                          });
                                          setNewFieldColumnOptions(prev => {
                                            const copy = { ...prev };
                                            if (copy[oldColName]) {
                                              copy[newColName] = copy[oldColName];
                                              delete copy[oldColName];
                                            }
                                            return copy;
                                          });
                                        }
                                      }}
                                      placeholder="Nombre del subcampo..."
                                      className="bg-transparent text-xs font-semibold text-slate-200 outline-none flex-1 border-b border-slate-800/80 focus:border-[#8FA89B] py-0.5"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const cols = newFieldColumns.split(",");
                                        cols.splice(cIdx, 1);
                                        setNewFieldColumns(cols.join(","));
                                        
                                        // Limpiar tipo y opciones
                                        setNewFieldColumnTypes(prev => {
                                          const copy = { ...prev };
                                          delete copy[col];
                                          return copy;
                                        });
                                        setNewFieldColumnOptions(prev => {
                                          const copy = { ...prev };
                                          delete copy[col];
                                          return copy;
                                        });
                                      }}
                                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                                      title="Eliminar"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 pt-1.5 border-t border-slate-900/60">
                                    <div>
                                      <label className="text-[9px] text-slate-500 block font-semibold uppercase tracking-wider">Tipo de entrada</label>
                                      <select
                                        value={newFieldColumnTypes[col] || "text"}
                                        onChange={(e) => {
                                          setNewFieldColumnTypes(prev => ({
                                            ...prev,
                                            [col]: e.target.value as any
                                          }));
                                        }}
                                        className="w-full mt-0.5 rounded-md bg-slate-900 border border-slate-805 px-2 py-1 text-[11px] text-slate-300 outline-none focus:border-[#8FA89B]"
                                      >
                                        <option value="text">Texto Corto</option>
                                        <option value="number">Número</option>
                                        <option value="checkbox">Casilla (Checkbox)</option>
                                        <option value="select">Lista (Dropdown)</option>
                                      </select>
                                    </div>

                                    {(newFieldColumnTypes[col] || "text") === "select" && (
                                      <div>
                                        <label className="text-[9px] text-slate-500 block font-semibold uppercase tracking-wider">Opciones (coma-sep)</label>
                                        <input
                                          type="text"
                                          value={newFieldColumnOptions[col] || ""}
                                          onChange={(e) => {
                                            setNewFieldColumnOptions(prev => ({
                                              ...prev,
                                              [col]: e.target.value
                                            }));
                                          }}
                                          placeholder="Bueno, Regular, Malo"
                                          className="w-full mt-0.5 rounded-md bg-slate-900 border border-slate-805 px-2 py-1 text-[11px] text-slate-300 placeholder-slate-600 outline-none focus:border-[#8FA89B]"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Add Subcolumn Button bar */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              id="quick_add_column_input"
                              placeholder="Ej. Cantidad, Descripción, Nota..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const target = e.currentTarget;
                                  const val = target.value.trim();
                                  if (val) {
                                    const cols = newFieldColumns ? newFieldColumns.split(",") : [];
                                    cols.push(val);
                                    setNewFieldColumns(cols.join(","));
                                    target.value = "";
                                  }
                                }
                              }}
                              className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none transition-all focus:border-[#8FA89B]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const el = document.getElementById("quick_add_column_input") as HTMLInputElement;
                                if (el && el.value.trim()) {
                                  const cols = newFieldColumns ? newFieldColumns.split(",") : [];
                                  cols.push(el.value.trim());
                                  setNewFieldColumns(cols.join(","));
                                  el.value = "";
                                }
                              }}
                              className="rounded-lg bg-[#8FA89B]/35 border border-[#8FA89B]/35 px-3 py-1.5 text-xs font-semibold text-[#8FA89B] hover:bg-[#8FA89B]/50 hover:text-white transition-all flex items-center gap-1 shadow"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Añadir Subcolumna</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                      {/* Mostrar campo opciones si es tipo SELECT o CHECKBOX */}
                     {(newFieldType === "select" || newFieldType === "checkbox") && (
                       <div className="space-y-3">
                         <div>
                           <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                             Opciones (Separadas por comas)
                           </label>
                           <textarea
                             id="builder_options"
                             rows={2}
                             value={newFieldOptions}
                             onChange={(e) => setNewFieldOptions(e.target.value)}
                             placeholder={newFieldType === "checkbox" ? "Opción A, Opción B, Opción C" : "Excelente, Bueno, Regular, Malo"}
                             className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3.5 py-2 text-sm text-slate-300 placeholder-slate-600 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-2 focus:ring-[#8FA89B]/20"
                           />
                           <span className="text-[10px] text-slate-500 block mt-1">
                             {newFieldType === "checkbox" 
                               ? "Ingresa las múltiples opciones que el usuario podrá marcar como casillas. Deja vacío si quieres una única casilla de confirmación."
                               : "Ingresa las opciones que el usuario podrá elegir en el menú desplegable."}
                           </span>
                         </div>

                         {newFieldType === "select" && (
                           <div className="space-y-3.5 mt-1">
                             <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/20 px-3.5 py-3 shadow-sm">
                               <input
                                 type="checkbox"
                                 id="builder_allow_other"
                                 checked={newFieldAllowOther}
                                 onChange={(e) => setNewFieldAllowOther(e.target.checked)}
                                 className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-[#5F756B] focus:ring-blue-500 focus:ring-offset-slate-950 mt-0.5"
                                />
                               <div>
                                 <label htmlFor="builder_allow_other" className="text-xs font-bold text-slate-300 select-none cursor-pointer flex items-center gap-1.5 leading-none">
                                   <span>Permitir la Opción "Otro"</span>
                                   <span className="rounded bg-[#8FA89B]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#8FA89B] tracking-wide uppercase">Opcional</span>
                                 </label>
                                 <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-relaxed">
                                   Si se activa, el usuario verá una opción "Otro" al final del desplegable y podrá ingresar un texto personalizado para su respuesta.
                                 </span>
                               </div>
                             </div>

                             <div className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/20 px-3.5 py-3 shadow-sm">
                               <input
                                 type="checkbox"
                                 id="builder_multiple"
                                 checked={newFieldMultiple}
                                 onChange={(e) => setNewFieldMultiple(e.target.checked)}
                                 className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-[#5F756B] focus:ring-blue-500 focus:ring-offset-slate-950 mt-0.5"
                               />
                               <div>
                                 <label htmlFor="builder_multiple" className="text-xs font-bold text-slate-300 select-none cursor-pointer flex items-center gap-1.5 leading-none">
                                   <span>Permitir Selección Múltiple (Elegir 1 o más)</span>
                                   <span className="rounded bg-[#8FA89B]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#8FA89B] tracking-wide uppercase">Opcional</span>
                                 </label>
                                 <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-relaxed">
                                   Si se activa, el usuario podrá seleccionar múltiples elementos de la lista en lugar de uno solo (se renderizará como un selector múltiple amigable e intuitivo).
                                 </span>
                               </div>
                             </div>
                           </div>
                         )}

                         {newFieldType === "select" && (
                           <div className="p-3.5 rounded-xl border border-dashed border-[#8FA89B]/20 bg-[#8FA89B]/5 space-y-3">
                             <div className="flex items-center gap-1 text-[#8FA89B] text-xs font-bold uppercase tracking-wider">
                               <span className="text-sm">📅</span> Cargar Fechas Seleccionadas por el Administrador
                             </div>
                             <p className="text-[11px] text-slate-400 leading-normal">
                               Facilita la creación de un desplegable de fechas seleccionando las fechas específicas o meses que deseas agregar a la lista de opciones:
                             </p>
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                               {/* Selector por mes/año */}
                               <div className="space-y-1.5">
                                 <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">Formato Mes/Año</label>
                                 <div className="flex gap-2">
                                   <input
                                     type="month"
                                     value={selectedAdminMonth}
                                     onChange={(e) => setSelectedAdminMonth(e.target.value)}
                                     className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-[#8FA89B]"
                                   />
                                   <button
                                     type="button"
                                     onClick={() => {
                                       if (selectedAdminMonth) {
                                         const [year, month] = selectedAdminMonth.split("-");
                                         const monthsNames = [
                                           "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                                         ];
                                         const mIndex = parseInt(month, 10) - 1;
                                         const formattedDate = `${monthsNames[mIndex]} ${year}`;
                                         
                                         const currentOptions = newFieldOptions ? newFieldOptions.split(",").map(o => o.trim()).filter(Boolean) : [];
                                         if (!currentOptions.includes(formattedDate)) {
                                           currentOptions.push(formattedDate);
                                           setNewFieldOptions(currentOptions.join(", "));
                                         }
                                       }
                                     }}
                                     className="rounded-lg bg-[#8FA89B] hover:bg-[#5F756B] px-3 py-1.5 text-xs font-semibold text-white transition-all shadow"
                                   >
                                     Agregar
                                   </button>
                                 </div>
                               </div>

                               {/* Selector fecha completa */}
                               <div className="space-y-1.5">
                                 <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">Fecha Completa (Día/Mes/Año)</label>
                                 <div className="flex gap-2">
                                   <input
                                     type="date"
                                     value={selectedAdminDate}
                                     onChange={(e) => setSelectedAdminDate(e.target.value)}
                                     className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 outline-none focus:border-[#8FA89B]"
                                   />
                                   <button
                                     type="button"
                                     onClick={() => {
                                       if (selectedAdminDate) {
                                         const [year, month, day] = selectedAdminDate.split("-");
                                         const monthsNames = [
                                           "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                           "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                                         ];
                                         const mIndex = parseInt(month, 10) - 1;
                                         const formattedDate = `${parseInt(day, 10)} de ${monthsNames[mIndex]} de ${year}`;
                                         
                                         const currentOptions = newFieldOptions ? newFieldOptions.split(",").map(o => o.trim()).filter(Boolean) : [];
                                         if (!currentOptions.includes(formattedDate)) {
                                           currentOptions.push(formattedDate);
                                           setNewFieldOptions(currentOptions.join(", "));
                                         }
                                       }
                                     }}
                                     className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition-all shadow"
                                   >
                                     Agregar
                                   </button>
                                 </div>
                               </div>
                             </div>

                             <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-[#8FA89B]/10 pt-2">
                               <span>También puedes borrar o editar las fechas directamente en la caja de texto superior.</span>
                               <button
                                 type="button"
                                 onClick={() => {
                                   if (window.confirm("¿Seguro que deseas vaciar las opciones?")) {
                                     setNewFieldOptions("");
                                   }
                                 }}
                                 className="text-red-400 hover:text-red-300 font-medium transition-colors"
                               >
                                 Limpiar Opciones
                               </button>
                             </div>
                           </div>
                         )}
                       </div>
                     )}

                     {/* Mostrar opción de estilo de renderizado si es tipo DATE */}
                     {newFieldType === "date" && (
                       <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/10 p-3.5 shadow-inner">
                         <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                           Presentación de la Fecha *
                         </label>
                         <div className="grid grid-cols-2 gap-3 mt-1.5">
                           <button
                             type="button"
                             onClick={() => setNewFieldDateRenderMode("picker")}
                             className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                               newFieldDateRenderMode === "picker"
                                 ? "border-[#8FA89B] bg-[#8FA89B]/10 text-[#8FA89B]"
                                 : "border-slate-800 bg-slate-950/20 text-slate-400 hover:bg-slate-900 hover:text-slate-300"
                             }`}
                           >
                             Selector Mes/Año (Picker)
                           </button>
                           <button
                             type="button"
                             onClick={() => setNewFieldDateRenderMode("dropdown")}
                             className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                               newFieldDateRenderMode === "dropdown"
                                 ? "border-[#8FA89B] bg-[#8FA89B]/10 text-[#8FA89B]"
                                 : "border-slate-800 bg-slate-950/20 text-slate-400 hover:bg-slate-900 hover:text-slate-300"
                             }`}
                           >
                             Desplegables Mes/Año
                           </button>
                         </div>
                         <span className="text-[10px] text-slate-500 block leading-relaxed mt-1">
                           Selecciona si deseas mostrar el selector nativo de Mes y Año o dos menús desplegables independientes para Mes y Año.
                         </span>
                       </div>
                     )}

                    {/* Validaciones Condicionales */}
                    {(newFieldType === "text" || newFieldType === "textarea") && (
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Mínimo Caracteres
                          </label>
                          <input
                            id="builder_min_len"
                            type="number"
                            value={newFieldMinLength || ""}
                            onChange={(e) => setNewFieldMinLength(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-[#8FA89B] focus:ring-2 focus:ring-[#8FA89B]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Máximo Caracteres
                          </label>
                          <input
                            id="builder_max_len"
                            type="number"
                            value={newFieldMaxLength || ""}
                            onChange={(e) => setNewFieldMaxLength(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-[#8FA89B] focus:ring-2 focus:ring-[#8FA89B]/20"
                          />
                        </div>
                      </div>
                    )}

                    {newFieldType === "number" && (
                      <div className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Valor Mínimo
                          </label>
                          <input
                            id="builder_min"
                            type="number"
                            value={newFieldMin}
                            onChange={(e) => setNewFieldMin(e.target.value !== "" ? Number(e.target.value) : "")}
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-[#8FA89B] focus:ring-2 focus:ring-[#8FA89B]/20"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Valor Máximo
                          </label>
                          <input
                            id="builder_max"
                            type="number"
                            value={newFieldMax}
                            onChange={(e) => setNewFieldMax(e.target.value !== "" ? Number(e.target.value) : "")}
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-[#8FA89B] focus:ring-2 focus:ring-[#8FA89B]/20"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex gap-2">
                      <button
                        id="save_field_btn"
                        type="submit"
                        className="flex-1 rounded-lg bg-[#8FA89B] py-2.5 text-xs font-bold text-white shadow-[0_0_12px_rgba(143,168,155,0.3)] hover:bg-[#5F756B] hover:scale-[0.99] transition-all"
                      >
                        {editingFieldId ? "Actualizar Campo" : "Insertar en el Formulario"}
                      </button>
                      {editingFieldId && (
                        <button
                          id="cancel_edit_btn"
                          type="button"
                          onClick={() => {
                            setEditingFieldId(null);
                            setNewFieldLabel("");
                            setNewFieldType("text");
                            setNewFieldPlaceholder("");
                            setNewFieldRequired(true);
                            setNewFieldOptions("");
                            setNewFieldAllowOther(false);
                            setNewFieldMultiple(false);
                            setNewFieldColumns("");
                            setNewFieldMinLength(0);
                            setNewFieldMaxLength(0);
                            setNewFieldMin("");
                            setNewFieldMax("");
                            setNewFieldColumnTypes({});
                            setNewFieldColumnOptions({});
                            setNewFieldDateRenderMode("picker");
                          }}
                          className="rounded-lg border border-slate-800 px-3 py-2.5 text-xs font-medium text-slate-400 bg-slate-950/30 hover:bg-slate-850 hover:text-white transition-all"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== PORTAL: SIMULADOR DE VISTA PREVIA EN CONDICIÓN DE MODAL (ADMIN) ==================== */}
          {isPreviewModalOpen && user.role === "admin" && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop blur overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsPreviewModalOpen(false)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              />
              
              {/* Modal Card wrapper */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-sm z-10"
              >
                {/* Header built with pristine design */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 sticky top-0 z-20">
                  <div className="flex items-center gap-2">
                    <Eye className="text-[#8FA89B] h-5 w-5" />
                    <h2 className="text-md font-bold text-white">Vista Previa del Formulario (Simulador)</h2>
                  </div>
                  <button
                    id="close_preview_modal_btn"
                    onClick={() => setIsPreviewModalOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Scrollable Container covering the form simulator body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                  <div className="rounded-2xl bg-gradient-to-r from-blue-900/10 via-slate-900/40 to-slate-900/20 border border-[#8FA89B]/15 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(143,168,155,0.05)]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <Eye className="text-[#8FA89B] h-5 w-5" />
                      Entorno de Simulación del Formulario
                    </h2>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-3xl leading-relaxed font-sans">
                      Este espacio permite a los administradores probar interactivamente el diseño actual, autocompletados condicionales, límites numéricos y flujos lógicos en tiempo real. 
                      <strong className="text-slate-300 ml-1">Los envíos aquí simulan validaciones del cliente y no alteran la base de datos de producción.</strong>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      id="reset_sandbox_btn"
                      type="button"
                      onClick={() => {
                        const initialData: Record<string, any> = {};
                        fields.forEach(f => {
                          if (f.type !== "section") {
                            if (f.type === "checkbox") {
                              initialData[f.id] = f.options && f.options.length > 0 ? [] : false;
                            } else if (f.type === "select" && f.multiple) {
                              initialData[f.id] = [];
                            } else if (f.type === "list") {
                              initialData[f.id] = [];
                            } else if (f.type === "boolean_justify") {
                              initialData[f.id] = { answer: "", justification: "" };
                            } else if (f.type === "table") {
                              if (f.predefinedRows && f.predefinedRows.length > 0) {
                                initialData[f.id] = f.predefinedRows.map(rowLabel => {
                                  const rowObj: Record<string, any> = { _rowLabel: rowLabel };
                                  (f.columns || ["Columna 1"]).forEach(col => {
                                    const colType = f.columnTypes?.[col] || "text";
                                    rowObj[col] = colType === "checkbox" ? false : "";
                                  });
                                  return rowObj;
                                });
                              } else {
                                initialData[f.id] = [];
                              }
                            } else {
                              initialData[f.id] = "";
                            }
                          }
                        });
                        setPreviewData(initialData);
                        setPreviewErrors({});
                        setPreviewSubmitted(false);
                        setPreviewListInputs({});
                      }}
                      className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900 transition-all active:scale-[0.98]"
                    >
                      Reiniciar Simulación
                    </button>
                    <button
                      id="test_validate_all_btn"
                      type="button"
                      onClick={() => {
                        const isValid = validatePreviewFormOfAdmin();
                        if (isValid) {
                          setPreviewSubmitted(true);
                        }
                      }}
                      className="rounded-xl bg-[#8FA89B] hover:bg-[#8FA89B] border border-[#8FA89B]/20 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-[0_0_12px_rgba(143,168,155,0.3)] active:scale-[0.98]"
                    >
                      Probar Enviar Formulario
                    </button>
                  </div>
                </div>
              </div>

              {previewSubmitted ? (
                // Success simulator message
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center shadow-[0_0_15px_rgba(16,185,129,0.1)] font-sans"
                >
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckSquare className="h-7 w-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white">¡Validación de Simulación Exitosa!</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-xl mx-auto">
                    La estructura del formulario cumple con todas las condiciones y reglas de validación asignadas. Las entradas ingresadas son sintácticamente válidas para los usuarios de producción.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <button
                      id="btn_continue_preview"
                      type="button"
                      onClick={() => setPreviewSubmitted(false)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-xs font-semibold text-white transition-all shadow active:scale-[0.98]"
                    >
                      Volver a interactuar
                    </button>
                  </div>
                </motion.div>
              ) : fields.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 italic text-sm font-sans">
                  El formulario de preguntas está vacío actualmente. Agrega preguntas en el "Editor de Formulario" para comenzar a interactuar con la previsualización.
                </div>
              ) : (
                // Simulador del Formulario
                <div className="max-w-4xl mx-auto rounded-2xl bg-slate-900/40 border border-slate-800 p-6 md:p-8 shadow-[0_0_20px_rgba(143,168,155,0.05)] backdrop-blur-sm space-y-6">
                  {/* Encabezado Ficticio de Vista Previa */}
                  <div className="border-b border-slate-800/80 pb-6 whitespace-normal">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#8FA89B]/10 border border-[#8FA89B]/20 text-[#8FA89B] font-mono text-xs font-bold shrink-0">
                        DEMO
                      </div>
                      <div className="text-left">
                        <h1 className="text-xl font-bold text-white tracking-tight">Encuesta de Salud Espiritual (Simulada)</h1>
                        <p className="text-xs text-slate-500 mt-0.5 font-sans">Interactúa con el formulario para probar el diseño final y sus flujos correspondientes.</p>
                      </div>
                    </div>
                  </div>

                  <form
                    id="simulated_preview_form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const isValid = validatePreviewFormOfAdmin();
                      if (isValid) {
                        setPreviewSubmitted(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Previene enviar el formulario al pulsar Enter, para cumplir el requisito
                      if (e.key === "Enter") {
                        const target = e.target as HTMLElement;
                        if (target && (target.tagName === "INPUT" || target.tagName === "SELECT")) {
                          e.preventDefault();
                        }
                      }
                    }}
                    className="space-y-6 text-left"
                  >
                    {fields.map((field) => {
                      if (field.type === "section") {
                        return (
                          <div key={field.id} className="pt-6 pb-2 border-b border-slate-800/70 first:pt-0 whitespace-normal">
                            <h3 className="text-md font-bold text-[#8FA89B] tracking-tight">{field.label}</h3>
                            {field.description && (
                              <p className="text-xs text-slate-500 mt-1 font-sans">{field.description}</p>
                            )}
                          </div>
                        );
                      }

                      const value = previewData[field.id];
                      const error = previewErrors[field.id];
                      const hasError = !!error;

                      return (
                        <div key={field.id} className="space-y-2 whitespace-normal">
                          <label className="flex items-center text-sm font-semibold text-slate-300">
                            <span>{field.label}</span>
                            {field.required && (
                              <span className="ml-1 text-red-540 text-red-400 font-bold" title="Requerido">*</span>
                            )}
                          </label>

                          {field.description && (
                            <p className="text-xs text-slate-500 leading-relaxed -mt-0.5 mb-1.5 font-sans">
                              {field.description}
                            </p>
                          )}

                          {/* Renderizado Condicional de Tipos de Entrada en la Simulación */}
                          {field.type === "textarea" ? (
                            <textarea
                              id={`preview_${field.id}`}
                              rows={3}
                              value={value || ""}
                              onChange={(e) => handlePreviewInputChange(field, e.target.value)}
                              placeholder={field.placeholder || "Escribe tu respuesta aquí..."}
                              className={`w-full rounded-lg border bg-slate-950/40 px-3.5 py-2 text-sm text-slate-300 placeholder-slate-700 outline-none transition-all ${
                                hasError
                                  ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-955"
                                  : "border-slate-800 focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20"
                              }`}
                            />
                          ) : field.type === "select" ? (
                            <div className="space-y-2">
                              {field.multiple ? (
                                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-955/20 p-3 animate-none">
                                  {(field.options || []).map(opt => {
                                    const currentSel = Array.isArray(value) ? value : [];
                                    const isSel = currentSel.includes(opt);
                                    return (
                                      <button
                                        key={opt}
                                        type="button"
                                        onClick={() => {
                                          const next = isSel 
                                            ? currentSel.filter(o => o !== opt) 
                                            : [...currentSel, opt];
                                          handlePreviewInputChange(field, next);
                                        }}
                                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                                          isSel
                                            ? "border-[#8FA89B] bg-[#8FA89B]/10 text-[#8FA89B] animate-none"
                                            : "border-slate-800 bg-slate-900/30 text-slate-400 hover:bg-slate-850 hover:border-slate-700 animate-none"
                                        }`}
                                      >
                                        <span>{opt}</span>
                                        {isSel && <Check className="h-3.5 w-3.5 text-[#8FA89B] shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <select
                                  id={`preview_${field.id}`}
                                  value={value || ""}
                                  onChange={(e) => handlePreviewInputChange(field, e.target.value)}
                                  className={`w-full rounded-lg border bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-300 outline-none transition-all ${
                                    hasError
                                      ? "border-red-500/50 focus:border-red-500"
                                      : "border-slate-800 focus:border-[#8FA89B] focus:bg-slate-950/80"
                                  }`}
                                >
                                  <option value="" className="bg-slate-950 text-slate-650">- Seleccionar opción -</option>
                                  {(field.options || []).map(opt => (
                                    <option key={opt} value={opt} className="bg-slate-955 text-slate-300">{opt}</option>
                                  ))}
                                  {field.allowOther && (
                                    <option value="Otro" className="bg-slate-955 text-slate-300">Otro (Especificar)</option>
                                  )}
                                </select>
                              )}
                            </div>
                          ) : field.type === "checkbox" ? (
                            field.options && field.options.length > 0 ? (
                              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-955/20 p-4">
                                {field.options.map(opt => {
                                  const currentSel = Array.isArray(value) ? value : [];
                                  const isChecked = currentSel.includes(opt);
                                  return (
                                    <label key={opt} className="flex items-center space-x-3 bg-slate-955/10 hover:bg-slate-955/35 rounded-lg p-2.5 cursor-pointer transition-all border border-transparent hover:border-slate-800 text-left">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          const next = isChecked
                                            ? currentSel.filter(v => v !== opt)
                                            : [...currentSel, opt];
                                          handlePreviewInputChange(field, next);
                                        }}
                                        className="h-4 w-4 rounded border-slate-750 bg-slate-950 text-[#5F756B] focus:ring-blue-450 cursor-pointer"
                                      />
                                      <span className="text-sm text-slate-300">{opt}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3 rounded-lg border border-slate-800 bg-slate-955/25 p-3.5">
                                <input
                                  id={`preview_${field.id}`}
                                  type="checkbox"
                                  checked={!!value}
                                  onChange={(e) => handlePreviewInputChange(field, e.target.checked)}
                                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-[#5F756B] focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-sm text-slate-450 text-left">
                                  {field.placeholder || "Acepto los términos y confirmo la veracidad de la información enviada."}
                                </span>
                              </div>
                            )
                          ) : field.type === "list" ? (
                            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-955/20 p-4">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={previewListInputs[field.id] || ""}
                                  onChange={(e) => setPreviewListInputs(prev => ({ ...prev, [field.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const currentValStr = (previewListInputs[field.id] || "").trim();
                                      if (currentValStr !== "") {
                                        const currentItems = Array.isArray(value) ? value : [];
                                        if (!currentItems.includes(currentValStr)) {
                                          handlePreviewInputChange(field, [...currentItems, currentValStr]);
                                          setPreviewListInputs(prev => ({ ...prev, [field.id]: "" }));
                                        }
                                      }
                                    }
                                  }}
                                  placeholder={field.placeholder || "Escribe un elemento y presiona Enter o Añadir..."}
                                  className="flex-1 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-sm text-slate-300 placeholder-slate-700 outline-none focus:border-[#8FA89B] focus:bg-slate-950"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentValStr = (previewListInputs[field.id] || "").trim();
                                    if (currentValStr !== "") {
                                      const currentItems = Array.isArray(value) ? value : [];
                                      if (!currentItems.includes(currentValStr)) {
                                        handlePreviewInputChange(field, [...currentItems, currentValStr]);
                                        setPreviewListInputs(prev => ({ ...prev, [field.id]: "" }));
                                      }
                                    }
                                  }}
                                  className="rounded-lg bg-[#8FA89B] hover:bg-[#5F756B] px-3.5 py-1.5 text-xs font-semibold text-white transition-all flex items-center gap-1 shrink-0"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Añadir</span>
                                </button>
                              </div>

                              {(!Array.isArray(value) || value.length === 0) ? (
                                <p className="text-xs text-slate-500 italic py-0.5 text-left">La lista interactiva está vacía.</p>
                              ) : (
                                <ul className="divide-y divide-slate-800/50 max-h-48 overflow-y-auto pr-1">
                                  {value.map((item: string, index: number) => (
                                    <li key={index} className="flex items-center justify-between py-1.5 text-xs text-slate-300">
                                      <span className="flex items-center gap-1.5">
                                        <span className="h-1 w-1 rounded-full bg-slate-600 animate-pulse"></span>
                                        {item}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = value.filter((_, i) => i !== index);
                                          handlePreviewInputChange(field, next);
                                        }}
                                        className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/5 transition-all animate-none"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ) : field.type === "table" ? (
                            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-955/10 p-4 shadow-inner">
                              <div className={(field.id === "field_1782063151398" || field.id === "field_1782072026008") ? "grid grid-cols-1 md:grid-cols-5 gap-3" : (field.id === "field_1782063582212" ? "grid grid-cols-1 md:grid-cols-4 gap-3" : "space-y-4")}>
                                {(!Array.isArray(value) || value.length === 0) ? (
                                  <div className="rounded-lg border border-dashed border-slate-800 p-6 text-center text-slate-500 italic text-xs">
                                    No hay filas en la simulación. Haz clic abajo para añadir.
                                  </div>
                                ) : (
                                  value.map((row: any, rIdx: number) => (
                                    <div key={rIdx} className={(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") ? "rounded-xl border border-slate-800 bg-slate-955/45 p-2 px-3 space-y-2 shadow-inner flex flex-col justify-between h-full" : "rounded-xl border border-slate-800 bg-slate-955/40 p-4 space-y-3 shadow-inner"}>
                                      <div className={(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") ? "flex items-center justify-between border-b border-slate-800/80 pb-1.5 min-h-[44px]" : "flex items-center justify-between border-b border-slate-800/80 pb-2"}>
                                        <div className="flex items-center gap-2">
                                          {!(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") && (
                                            <span className="h-1.5 w-1.5 rounded-full bg-[#8FA89B]"></span>
                                          )}
                                          {field.predefinedRows && field.predefinedRows.length > 0 ? (
                                            <span className="text-xs font-bold text-slate-350">
                                              {row._rowLabel || `Columna ${rIdx + 1}`}
                                            </span>
                                          ) : (
                                            <input
                                              type="text"
                                              value={row._rowLabel || ""}
                                              onChange={(e) => {
                                                const currentRows = [...value];
                                                currentRows[rIdx] = {
                                                  ...currentRows[rIdx],
                                                  _rowLabel: e.target.value
                                                };
                                                handlePreviewInputChange(field, currentRows);
                                              }}
                                              placeholder="Nombre de la Fila..."
                                              className="bg-transparent text-xs font-bold text-slate-300 outline-none border-b border-dashed border-slate-800 focus:border-[#8FA89B] pb-0.5"
                                            />
                                          )}
                                        </div>
                                        
                                        {(!field.predefinedRows || field.predefinedRows.length === 0) && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const currentRows = [...value];
                                              currentRows.splice(rIdx, 1);
                                              handlePreviewInputChange(field, currentRows);
                                            }}
                                            className="text-red-440 hover:text-red-300 p-1"
                                            title="Eliminar fila"
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>

                                      <div className={(field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008") ? "w-full" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"}>
                                        {(field.columns || ["Columna 1"]).map((col, cIdx) => {
                                          const colType = field.columnTypes?.[col] || "text";
                                          const colOpts = (field.columnOptions?.[col] as string[]) || [];
                                          const isSpecialRow = field.id === "field_1782063151398" || field.id === "field_1782063582212" || field.id === "field_1782072026008";
                                          return (
                                            <div key={cIdx} className={isSpecialRow ? "text-left" : "space-y-1 text-left"}>
                                              {!(isSpecialRow && col.toLowerCase() === "cantidad") && (
                                                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{col}</label>
                                              )}
                                              {colType === "checkbox" ? (
                                                <label className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-2 cursor-pointer h-9 transition-all hover:bg-slate-850">
                                                  <input
                                                    type="checkbox"
                                                    checked={!!row[col]}
                                                    onChange={(e) => {
                                                      const currentRows = [...value];
                                                      currentRows[rIdx] = {
                                                        ...currentRows[rIdx],
                                                        [col]: e.target.checked
                                                      };
                                                      handlePreviewInputChange(field, currentRows);
                                                    }}
                                                    className="h-3.5 w-3.5 rounded border-slate-750 bg-slate-955 text-[#5F756B] focus:ring-blue-555 cursor-pointer"
                                                  />
                                                  <span className="text-[11px] text-slate-400 select-none font-sans">Marcar</span>
                                                </label>
                                              ) : colType === "select" ? (
                                                <select
                                                  value={row[col] || ""}
                                                  onChange={(e) => {
                                                    const currentRows = [...value];
                                                    currentRows[rIdx] = {
                                                      ...currentRows[rIdx],
                                                      [col]: e.target.value
                                                    };
                                                    handlePreviewInputChange(field, currentRows);
                                                  }}
                                                  className="w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 outline-none"
                                                >
                                                  <option value="" className="bg-slate-950 text-slate-500">- Elegir -</option>
                                                  {colOpts.map(opt => (
                                                    <option key={opt} value={opt} className="bg-slate-950 text-slate-300">{opt}</option>
                                                  ))}
                                                </select>
                                              ) : colType === "number" ? (
                                                <input
                                                  type="number"
                                                  min={0}
                                                  onKeyDown={(e) => {
                                                    if (e.key === "-" || e.key === "e") {
                                                      e.preventDefault();
                                                    }
                                                  }}
                                                  value={row[col] !== undefined && row[col] !== null ? row[col] : ""}
                                                  onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (val !== "" && Number(val) < 0) {
                                                      val = "0";
                                                    }
                                                    const currentRows = [...value];
                                                    currentRows[rIdx] = {
                                                      ...currentRows[rIdx],
                                                      [col]: val === "" ? "" : Number(val)
                                                    };
                                                    handlePreviewInputChange(field, currentRows);
                                                  }}
                                                  placeholder={isSpecialRow && col.toLowerCase() === "cantidad" ? "Escribir..." : `Escribir ${col}...`}
                                                  className={isSpecialRow ? "w-full rounded-lg bg-slate-900 border border-slate-850 px-2.5 py-1.5 text-center text-xs text-slate-200 placeholder-slate-705 outline-none focus:border-[#8FA89B]" : "w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-705 outline-none focus:border-[#8FA89B]"}
                                                />
                                              ) : (
                                                <input
                                                  type="text"
                                                  value={row[col] || ""}
                                                  onChange={(e) => {
                                                    const currentRows = [...value];
                                                    currentRows[rIdx] = {
                                                      ...currentRows[rIdx],
                                                      [col]: e.target.value
                                                    };
                                                    handlePreviewInputChange(field, currentRows);
                                                  }}
                                                  placeholder={isSpecialRow && col.toLowerCase() === "cantidad" ? "Escribir..." : `Escribir ${col}...`}
                                                  className={isSpecialRow ? "w-full rounded-lg bg-slate-900 border border-slate-850 px-2.5 py-1.5 text-center text-xs text-slate-200 placeholder-slate-705 outline-none focus:border-[#8FA89B]" : "w-full rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 placeholder-slate-705 outline-none focus:border-[#8FA89B]"}
                                                />
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              {(!field.predefinedRows || field.predefinedRows.length === 0) && (
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentRows = Array.isArray(value) ? value : [];
                                      const newRow: Record<string, any> = { _rowLabel: "" };
                                      (field.columns || ["Columna 1"]).forEach(col => {
                                        const colType = field.columnTypes?.[col] || "text";
                                        newRow[col] = colType === "checkbox" ? false : "";
                                      });
                                      handlePreviewInputChange(field, [...currentRows, newRow]);
                                    }}
                                    className="rounded-lg bg-[#8FA89B]/10 border border-[#8FA89B]/20 text-[#8FA89B] px-3 py-1.5 text-[11px] font-semibold hover:bg-[#5F756B] hover:text-white transition-all flex items-center gap-1 shadow-sm"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Añadir Fila de Prueba</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : field.type === "boolean_justify" ? (
                            (() => {
                              const valObj = (value && typeof value === 'object') ? value : { answer: "", justification: "" };
                              const ans = valObj.answer || "";
                              const justification = valObj.justification || "";

                              const handleAnswerChange = (newAns: string) => {
                                const newJust = newAns === "Sí" ? justification : "";
                                handlePreviewInputChange(field, { answer: newAns, justification: newJust });
                              };

                              const handleJustificationChange = (newJust: string) => {
                                handlePreviewInputChange(field, { ...valObj, justification: newJust });
                              };

                              return (
                                <div className="space-y-3.5 p-4 rounded-xl border border-slate-800 bg-slate-950/20 text-left">
                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      id={`preview_${field.id}_btn_yes`}
                                      type="button"
                                      onClick={() => handleAnswerChange("Sí")}
                                      className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all ${
                                        ans === "Sí"
                                          ? "border-[#8FA89B] bg-[#8FA89B]/10 text-[#8FA89B] font-bold animate-none"
                                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-900 animate-none"
                                      }`}
                                    >
                                      Sí
                                    </button>
                                    <button
                                      id={`preview_${field.id}_btn_no`}
                                      type="button"
                                      onClick={() => handleAnswerChange("No")}
                                      className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-semibold transition-all ${
                                        ans === "No"
                                          ? "border-amber-500/60 bg-amber-500/10 text-amber-400 font-bold animate-none"
                                          : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:bg-slate-900 animate-none"
                                      }`}
                                    >
                                      No
                                    </button>
                                  </div>

                                  <AnimatePresence>
                                    {ans === "Sí" && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden space-y-2 pt-2 border-t border-slate-800/50"
                                      >
                                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider font-sans">
                                          {field.id === "field_1781900022784"
                                            ? "Regularidad de facilitación"
                                            : field.id === "field_1781900513250"
                                            ? "Cantidad de ayudantes con fines de protección"
                                            : "Justifique su respuesta"}{" "}
                                          <span className="text-red-400 font-bold">*</span>
                                        </label>
                                        {field.id === "field_1781900022784" ? (
                                          <select
                                            id={`preview_${field.id}_justification`}
                                            value={justification}
                                            onChange={(e) => handleJustificationChange(e.target.value)}
                                            className={`w-full rounded-lg border bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-300 outline-none transition-all ${
                                              hasError && !justification.trim()
                                                ? "border-red-500/50 focus:border-red-500"
                                                : "border-slate-800 focus:border-[#8FA89B] focus:bg-slate-950/80"
                                            }`}
                                          >
                                            <option value="" className="bg-slate-900 text-slate-400">-- Seleccionar regularidad --</option>
                                            <option value="Cada semana" className="bg-slate-900 text-slate-300">Cada semana</option>
                                            <option value="Cada mes" className="bg-slate-900 text-slate-300">Cada mes</option>
                                            <option value="Cada 3 meses" className="bg-slate-900 text-slate-300">Cada 3 meses</option>
                                            <option value="Cada 6 meses" className="bg-slate-900 text-slate-300">Cada 6 meses</option>
                                            <option value="Cada año" className="bg-slate-900 text-slate-300">Cada año</option>
                                          </select>
                                        ) : field.id === "field_1781900513250" ? (
                                          <input
                                            type="number"
                                            id={`preview_${field.id}_justification`}
                                            min={0}
                                            onKeyDown={(e) => {
                                              if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+" || e.key === "." || e.key === ",") {
                                                e.preventDefault();
                                              }
                                            }}
                                            value={justification}
                                            onChange={(e) => {
                                              let val = e.target.value;
                                              val = val.replace(/[^0-9]/g, "");
                                              handleJustificationChange(val);
                                            }}
                                            placeholder="Escriba la cantidad (números >= 0)..."
                                            className={`w-full rounded-lg border bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-300 placeholder-slate-700 outline-none transition-all ${
                                              hasError
                                                ? "border-red-500/50 focus:border-red-500"
                                                : "border-slate-800 focus:border-[#8FA89B] focus:bg-slate-950/80"
                                            }`}
                                          />
                                        ) : (
                                          <textarea
                                            id={`preview_${field.id}_justification`}
                                            rows={2}
                                            value={justification}
                                            onChange={(e) => handleJustificationChange(e.target.value)}
                                            placeholder="Explique las razones o detalles..."
                                            className={`w-full rounded-lg border bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-300 placeholder-slate-700 outline-none transition-all ${
                                              hasError && !justification.trim()
                                                ? "border-red-500/50 focus:border-red-500"
                                                : "border-slate-800 focus:border-[#8FA89B] focus:bg-slate-950/80"
                                            }`}
                                          />
                                        )}
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })()
                          ) : (
                            // Campos Estándar: text, email, number, date picker o dropdown fallback
                            (() => {
                              const isDateDropdown = field.type === "date" && field.dateRenderMode === "dropdown";
                              if (isDateDropdown) {
                                const currentYear = new Date().getFullYear();
                                const parts = String(value || "").split("-");
                                const year = parts[0] || "";
                                const month = parts[1] || "";

                                const handleDatePartChange = (part: 'year' | 'month', valPart: string) => {
                                  const newYear = part === 'year' ? valPart : year;
                                  const newMonth = part === 'month' ? valPart : month;
                                  if (newYear && newMonth) {
                                    handlePreviewInputChange(field, `${newYear}-${newMonth}`);
                                  } else {
                                    handlePreviewInputChange(field, newYear || newMonth ? `${newYear || '1900'}-${newMonth || '01'}` : "");
                                  }
                                };

                                return (
                                  <div className="flex gap-2 rounded-xl border border-slate-800 bg-slate-950/20 p-2.5 text-left">
                                    <div className="flex-1">
                                      <span className="block text-[10px] font-semibold text-slate-500 mb-1">AÑO</span>
                                      <select
                                        value={year}
                                        onChange={(e) => handleDatePartChange('year', e.target.value)}
                                        className="w-full rounded bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-300"
                                      >
                                        <option value="">-- Año --</option>
                                        {Array.from({ length: 41 }, (_, i) => String(currentYear - 30 + i)).map(y => (
                                          <option key={y} value={y}>{y}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex-1">
                                      <span className="block text-[10px] font-semibold text-slate-500 mb-1">MES</span>
                                      <select
                                        value={month}
                                        onChange={(e) => handleDatePartChange('month', e.target.value)}
                                        className="w-full rounded bg-slate-900 border border-slate-800 px-2 py-1 text-xs text-slate-300"
                                      >
                                        <option value="">-- Mes --</option>
                                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(m => (
                                          <option key={m} value={m}>{m}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <input
                                  id={`preview_${field.id}`}
                                  type={field.type === "date" ? "month" : field.type}
                                  value={value || ""}
                                  min={field.type === "number" ? 0 : undefined}
                                  onKeyDown={(e) => {
                                    if (field.type === "number" && (e.key === "-" || e.key === "e")) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => {
                                    let val = e.target.value;
                                    if (field.type === "number") {
                                      if (val !== "" && Number(val) < 0) {
                                        val = "0";
                                      }
                                    }
                                    handlePreviewInputChange(field, val);
                                  }}
                                  placeholder={field.placeholder || ""}
                                  className={`w-full rounded-lg border bg-slate-950/40 px-3.5 py-2.5 text-sm text-slate-300 placeholder-slate-700 outline-none transition-all ${
                                    hasError
                                      ? "border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-950"
                                      : "border-slate-800 focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20"
                                  }`}
                                />
                              );
                            })()
                          )}

                          {hasError && (
                            <p className="text-xs text-red-450 mt-1 flex items-center gap-1 font-sans text-left">
                              <AlertCircle className="h-3 w-3 shrink-0" />
                              <span>{error}</span>
                            </p>
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/85">
                      <button
                        id="form_preview_reset_btn"
                        type="button"
                        onClick={() => {
                          const initialData: Record<string, any> = {};
                          fields.forEach(f => {
                            if (f.type !== "section") {
                              if (f.type === "checkbox") {
                                initialData[f.id] = f.options && f.options.length > 0 ? [] : false;
                              } else if (f.type === "select" && f.multiple) {
                                initialData[f.id] = [];
                              } else if (f.type === "list") {
                                initialData[f.id] = [];
                              } else if (f.type === "boolean_justify") {
                                initialData[f.id] = { answer: "", justification: "" };
                              } else if (f.type === "table") {
                                if (f.predefinedRows && f.predefinedRows.length > 0) {
                                  initialData[f.id] = f.predefinedRows.map(rowLabel => {
                                    const rowObj: Record<string, any> = { _rowLabel: rowLabel };
                                    (f.columns || ["Columna 1"]).forEach(col => {
                                      const colType = f.columnTypes?.[col] || "text";
                                      rowObj[col] = colType === "checkbox" ? false : "";
                                    });
                                    return rowObj;
                                  });
                                } else {
                                  initialData[f.id] = [];
                                }
                              } else {
                                initialData[f.id] = "";
                              }
                            }
                          });
                          setPreviewData(initialData);
                          setPreviewErrors({});
                          setPreviewSubmitted(false);
                          setPreviewListInputs({});
                        }}
                        className="rounded-lg border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-400 bg-slate-950/20 hover:text-white hover:bg-slate-850 hover:border-slate-700 transition"
                      >
                        Reiniciar
                      </button>
                      <button
                        id="form_preview_submit_btn"
                        type="submit"
                        className="rounded-lg bg-[#8FA89B] hover:bg-[#8FA89B] px-5 py-2.5 text-xs font-bold text-white transition shadow-lg active:scale-[0.98]"
                      >
                        Enviar para Validar (Simulado)
                      </button>
                    </div>
                  </form>
                </div>
              )}
                </div>
              </motion.div>
            </div>
          )}

          {/* ==================== TAB 4: ALERTAS DEL SISTEMA (COGNITIVAS) ==================== */}
          {activeTab === "notifications" && user.role === "admin" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_0_20px_rgba(59, 130, 246,0.1)] backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">Notificaciones del Servidor</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Auditoría en tiempo real para eventos de inicios de sesión, envíos de formulario y reestructuraciones.</p>
                  </div>
                  <button
                    onClick={markAllNotificationsRead}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    <Check className="h-4.5 w-4.5" />
                    Marcar todo como leído
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-500 mt-2">No se han registrado alertas en el servidor.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 max-h-[500px] overflow-y-auto pr-2 scrollbar">
                    {notifications.map((not) => (
                      <div
                        key={not.id}
                        id={`notification_row_${not.id}`}
                        className={`flex items-start justify-between py-4 ${not.read ? "opacity-40" : "bg-[#8FA89B]/5"}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 rounded-full p-1.5 ${
                            not.type === "success" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : not.type === "warning"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20"
                          }`}>
                            <AlertCircle className="h-4.5 w-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{not.title}</span>
                              {!not.read && (
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-550 inline-block animate-pulse"></span>
                              )}
                            </div>
                            <p className="text-xs text-slate-305 mt-1">{not.message}</p>
                            <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">
                              Recibido: {new Date(not.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== TAB 5: GESTIÓN DE USUARIOS (NUEVO MODULO) ==================== */}
          {activeTab === "users" && user.role === "admin" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Directorio de Usuarios</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permite administrar, dar de alta, modificar y dar de baja todos los usuarios y administradores de Encuesta Salud Espiritual.
                  </p>
                </div>
                {!userFormOpen && (
                  <button
                    id="add_user_btn"
                    onClick={() => {
                      setEditingUser(null);
                      setUserFormEmail("");
                      setUserFormName("");
                      setUserFormPassword("");
                      setUserFormRole("user");
                      setUserFormCountry("");
                      setUserFormRegion("");
                      setUserFormError(null);
                      setUserFormSuccess(null);
                      setUserFormOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-lg bg-[#8FA89B] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_15px_rgba(143,168,155,0.3)] hover:bg-[#5F756B] transition-all active:scale-[0.98]"
                  >
                    <UserPlus className="h-4 w-4" />
                    Registrar Nuevo Usuario
                  </button>
                )}
              </div>

              <AnimatePresence>
                {userFormOpen && (
                  <motion.div
                    id="user_form_block"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-[0_0_20px_rgba(143,168,155,0.05)] backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-[#8FA89B] uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="h-4 w-4" />
                        {editingUser ? "Modificar Datos de Usuario" : "Registrar Nueva Cuenta"}
                      </h4>
                      <button
                        id="close_user_form_btn"
                        onClick={handleCloseUserForm}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Cancelar
                      </button>
                    </div>

                    <form id="user_form" onSubmit={handleUserFormSubmit} className="space-y-4">
                      {userFormError && (
                        <div id="user_form_error" className="flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
                          <AlertCircle className="h-5 w-5 shrink-0" />
                          <span>{userFormError}</span>
                        </div>
                      )}
                      {userFormSuccess && (
                        <div id="user_form_success" className="flex items-start gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 border border-emerald-500/20">
                          <Check className="h-5 w-5 shrink-0" />
                          <span>{userFormSuccess}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            Nombre Completo *
                          </label>
                          <input
                            id="user_form_name_input"
                            type="text"
                            value={userFormName}
                            onChange={(e) => setUserFormName(e.target.value)}
                            placeholder="Ej. Carlos Pérez"
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 px-3.5 text-sm text-slate-300 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            Correo Electrónico *
                          </label>
                          <input
                            id="user_form_email_input"
                            type="email"
                            value={userFormEmail}
                            onChange={(e) => setUserFormEmail(e.target.value)}
                            placeholder="ejemplo@validaform.com"
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 px-3.5 text-sm text-slate-300 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            Contraseña {editingUser ? "(Dejar en blanco para mantener actual)" : "*"}
                          </label>
                          <input
                            id="user_form_password_input"
                            type="password"
                            value={userFormPassword}
                            onChange={(e) => setUserFormPassword(e.target.value)}
                            placeholder={editingUser ? "********" : "Mínimo 6 caracteres"}
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 px-3.5 text-sm text-slate-300 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20"
                            required={!editingUser}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                            Rol del Usuario *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              id="btn_role_user"
                              type="button"
                              onClick={() => setUserFormRole("user")}
                              className={`rounded-lg py-2 border text-xs font-semibold text-center transition-all ${
                                userFormRole === "user"
                                  ? "border-[#8FA89B]/30 bg-[#8FA89B]/10 text-[#8FA89B] font-bold"
                                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900/60"
                              }`}
                            >
                              Miembro de Cuerpo Auxiliar
                            </button>
                            <button
                              id="btn_role_auditor"
                              type="button"
                              onClick={() => setUserFormRole("auditor")}
                              className={`rounded-lg py-2 border text-xs font-semibold text-center transition-all ${
                                userFormRole === "auditor"
                                  ? "border-[#8FA89B]/30 bg-[#8FA89B]/10 text-[#8FA89B] font-bold"
                                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900/60"
                              }`}
                            >
                              Consejero
                            </button>
                            <button
                              id="btn_role_health_team"
                              type="button"
                              onClick={() => setUserFormRole("health_team")}
                              className={`rounded-lg py-2 border text-xs font-semibold text-center transition-all ${
                                userFormRole === "health_team"
                                  ? "border-[#8FA89B]/30 bg-[#8FA89B]/10 text-[#8FA89B] font-bold"
                                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900/60"
                              }`}
                            >
                              Equipo de Salud Espiritual
                            </button>
                            <button
                              id="btn_role_admin"
                              type="button"
                              onClick={() => setUserFormRole("admin")}
                              className={`rounded-lg py-2 border text-xs font-semibold text-center transition-all ${
                                userFormRole === "admin"
                                  ? "border-[#8FA89B]/30 bg-[#8FA89B]/10 text-[#8FA89B] font-bold"
                                  : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-900/60"
                              }`}
                            >
                              Administrador
                            </button>
                          </div>
                        </div>

                        {userFormRole === "health_team" && (
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                              Grupo Geográfico *
                            </label>
                            <select
                              id="user_form_geographic_group_select"
                              value={userFormGeographicGroup}
                              onChange={(e) => setUserFormGeographicGroup(e.target.value)}
                              className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 px-3.5 text-sm text-slate-300 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20 appearance-none pointer-events-auto"
                              required
                            >
                              <option value="" className="text-slate-600 bg-slate-950">Seleccionar Grupo...</option>
                              <option value="Centro América" className="text-slate-300 bg-slate-950">Centro América</option>
                              <option value="Sur América" className="text-slate-300 bg-slate-950">Sur América</option>
                              <option value="Norte América" className="text-slate-300 bg-slate-950">Norte América</option>
                              <option value="El Caribe" className="text-slate-300 bg-slate-950">El Caribe</option>
                            </select>
                          </div>
                        )}

                        {userFormRole === "user" && (
                          <>
                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                País de Residencia
                              </label>
                              <select
                                id="user_form_country_select"
                                value={userFormCountry}
                                onChange={(e) => setUserFormCountry(e.target.value)}
                                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 px-3.5 text-sm text-slate-300 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20 appearance-none pointer-events-auto"
                              >
                                <option value="" className="text-slate-600 bg-slate-950">Seleccionar...</option>
                                <option value="Antigua y Barbuda" className="text-slate-300 bg-slate-950">Antigua y Barbuda</option>
                                <option value="Argentina" className="text-slate-300 bg-slate-950">Argentina</option>
                                <option value="Bahamas" className="text-slate-300 bg-slate-950">Bahamas</option>
                                <option value="Barbados" className="text-slate-300 bg-slate-950">Barbados</option>
                                <option value="Belice" className="text-slate-300 bg-slate-950">Belice</option>
                                <option value="Bolivia" className="text-slate-300 bg-slate-950">Bolivia</option>
                                <option value="Brasil" className="text-slate-300 bg-slate-950">Brasil</option>
                                <option value="Canadá" className="text-slate-300 bg-slate-950">Canadá</option>
                                <option value="Chile" className="text-slate-300 bg-slate-950">Chile</option>
                                <option value="Colombia" className="text-slate-300 bg-slate-950">Colombia</option>
                                <option value="Costa Rica" className="text-slate-300 bg-slate-950">Costa Rica</option>
                                <option value="Cuba" className="text-slate-300 bg-slate-950">Cuba</option>
                                <option value="Dominica" className="text-slate-300 bg-slate-950">Dominica</option>
                                <option value="Ecuador" className="text-slate-300 bg-slate-950">Ecuador</option>
                                <option value="El Salvador" className="text-slate-300 bg-slate-950">El Salvador</option>
                                <option value="Estados Unidos" className="text-slate-300 bg-slate-950">Estados Unidos</option>
                                <option value="Granada" className="text-slate-300 bg-slate-950">Granada</option>
                                <option value="Guatemala" className="text-slate-300 bg-slate-950">Guatemala</option>
                                <option value="Guyana" className="text-slate-300 bg-slate-950">Guyana</option>
                                <option value="Guyana Francesa" className="text-slate-300 bg-slate-950">Guyana Francesa</option>
                                <option value="Haití" className="text-slate-300 bg-slate-950">Haití</option>
                                <option value="Honduras" className="text-slate-300 bg-slate-950">Honduras</option>
                                <option value="Jamaica" className="text-slate-300 bg-slate-950">Jamaica</option>
                                <option value="México" className="text-slate-300 bg-slate-950">México</option>
                                <option value="Nicaragua" className="text-slate-300 bg-slate-950">Nicaragua</option>
                                <option value="Panamá" className="text-slate-300 bg-slate-950">Panamá</option>
                                <option value="Paraguay" className="text-slate-300 bg-slate-950">Paraguay</option>
                                <option value="Perú" className="text-slate-300 bg-slate-950">Perú</option>
                                <option value="Puerto Rico" className="text-slate-300 bg-slate-950">Puerto Rico</option>
                                <option value="República Dominicana" className="text-slate-300 bg-slate-950">República Dominicana</option>
                                <option value="San Cristóbal y Nieves" className="text-slate-300 bg-slate-950">San Cristóbal y Nieves</option>
                                <option value="Santa Lucía" className="text-slate-300 bg-slate-950">Santa Lucía</option>
                                <option value="San Vicente y las Granadinas" className="text-slate-300 bg-slate-950">San Vicente y las Granadinas</option>
                                <option value="Surinam" className="text-slate-300 bg-slate-950">Surinam</option>
                                <option value="Trinidad y Tobago" className="text-slate-300 bg-slate-950">Trinidad y Tobago</option>
                                <option value="Uruguay" className="text-slate-300 bg-slate-950">Uruguay</option>
                                <option value="Venezuela" className="text-slate-300 bg-slate-950">Venezuela</option>
                                <option value="Otro" className="text-slate-300 bg-slate-950">Otro</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Región o Estado
                              </label>
                              <input
                                id="user_form_region_input"
                                type="text"
                                value={userFormRegion}
                                onChange={(e) => setUserFormRegion(e.target.value)}
                                placeholder="Ej. Madrid, Jalisco..."
                                className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 px-3.5 text-sm text-slate-300 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20"
                              />
                            </div>
                          </>
                        )}

                        {editingUser && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                              Enlace de Google Drive Personalizado (Opcional)
                            </label>
                            <input
                              id="user_form_drive_url_input"
                              type="url"
                              value={userFormDriveUrl}
                              onChange={(e) => setUserFormDriveUrl(e.target.value)}
                              placeholder="https://drive.google.com/drive/folders/..."
                              className="w-full rounded-lg border border-slate-800 bg-slate-950/50 py-2.5 px-3.5 text-sm text-slate-300 outline-none transition-all focus:border-[#8FA89B] focus:bg-slate-950/80 focus:ring-1 focus:ring-[#8FA89B]/20"
                            />
                            <p className="mt-1 text-[10px] text-slate-500">
                              Si se deja vacío, este usuario utilizará la carpeta de Google Drive global configurada en la sección de base de datos.
                            </p>
                          </div>
                        )}
                      </div>

                      {editingUser && (
                        <div className="flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/20 p-3.5 mt-2">
                          <input
                            id="user_form_archived_checkbox"
                            type="checkbox"
                            checked={userFormArchived}
                            onChange={(e) => setUserFormArchived(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-[#5F756B] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                          />
                          <div>
                            <label htmlFor="user_form_archived_checkbox" className="block text-xs font-bold uppercase tracking-wider text-slate-300 cursor-pointer">
                              Cuenta Archivada / Desactivada
                            </label>
                            <span className="text-[10px] text-slate-500 block">Impide el acceso del usuario a la plataforma sin eliminar su historial de respuestas.</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                        <button
                          id="btn_cancel_user_form"
                          type="button"
                          onClick={handleCloseUserForm}
                          className="rounded-lg border border-slate-800 bg-slate-950/30 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          id="btn_submit_user_form"
                          type="submit"
                          disabled={userFormSubmitting}
                          className="rounded-lg bg-[#8FA89B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#5F756B] shadow-[0_0_10px_rgba(143,168,155,0.2)] transition-all disabled:opacity-50"
                        >
                          {userFormSubmitting ? "Guardando..." : editingUser ? "Actualizar Usuario" : "Registrar Usuario"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Listado de Usuarios */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm backdrop-blur-sm space-y-5">
                {/* Panel de Filtros para Usuarios */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Buscador */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-slate-500" />
                    </span>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Buscar por nombre, correo..."
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2 pl-9 pr-8 text-xs font-medium placeholder-slate-500 focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-[#8FA89B]/20 transition-all"
                    />
                    {userSearch && (
                      <button
                        onClick={() => setUserSearch("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Filtro Grupo Geográfico */}
                  <div className="relative">
                    <select
                      id="directory_group_filter"
                      value={userGroupFilter}
                      onChange={(e) => setUserGroupFilter(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2 pl-3 pr-8 text-xs font-medium focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-[#8FA89B]/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Todos">🗺️ Todos los Grupos</option>
                      {Object.keys(GEOGRAPHIC_GROUPS).map((grp) => (
                        <option key={grp} value={grp}>
                          {grp}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>

                  {/* Filtro por País */}
                  <div className="relative">
                    <select
                      id="directory_country_filter"
                      value={userCountryFilter}
                      onChange={(e) => setUserCountryFilter(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl py-2 pl-3 pr-8 text-xs font-medium focus:outline-none focus:border-slate-700 focus:ring-1 focus:ring-[#8FA89B]/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="Todos">🌎 Todos los Países</option>
                      {filteredUserCountryOptions.map((loc) => (
                        <option key={loc.country} value={loc.country}>
                          {loc.country}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto min-w-full">
                  <table className="min-w-full divide-y divide-slate-850 text-left text-xs text-slate-300 font-sans">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800">
                        <th className="pb-3 font-semibold uppercase tracking-wider">Nombre y Cuenta</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Rol de Sistema</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider">Ubicación</th>
                        <th className="pb-3 font-semibold uppercase tracking-wider text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredUsersListForDirectory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            No se han encontrado usuarios que coincidan con los filtros.
                          </td>
                        </tr>
                      ) : (
                        filteredUsersListForDirectory.map((u) => {
                          const isSelf = u.email.toLowerCase() === user.email.toLowerCase();
                          return (
                            <tr key={u.email} className={`hover:bg-slate-950/20 transition-colors ${u.archived ? "bg-slate-950/15 opacity-80" : ""}`}>
                              <td className="py-4 pr-3">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold border uppercase ${
                                    u.archived 
                                      ? "bg-slate-900 text-slate-500 border-slate-800" 
                                      : "bg-slate-850 text-slate-200 border-slate-800"
                                  }`}>
                                    {u.name.charAt(0)}
                                  </div>
                                  <div>
                                    <span className={`font-bold block ${u.archived ? "text-slate-450 line-through" : "text-slate-100"}`}>
                                      {u.name} {isSelf && <small className="text-[#8FA89B] font-semibold font-sans italic block sm:inline sm:ml-1.5">(Tú)</small>}
                                    </span>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-slate-500 font-mono block">{u.email}</span>
                                      {u.archived && (
                                        <span className="inline-flex items-center rounded-md bg-red-500/10 px-1.5 py-0.5 text-[8px] font-bold text-red-400 border border-red-500/20 uppercase tracking-wider">
                                          Archivado
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 pr-3">
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                  u.archived
                                    ? "bg-slate-950/40 text-slate-500 border border-slate-900"
                                    : u.role === "admin"
                                    ? "bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20 shadow-[0_0_10px_rgba(143,168,155,0.05)]"
                                    : u.role === "auditor"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]"
                                    : u.role === "health_team"
                                    ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.05)]"
                                    : "bg-slate-800/40 text-slate-400 border border-slate-800"
                                }`}>
                                  <Shield className="h-3 w-3" />
                                  {u.role === "admin" 
                                    ? "Administrador" 
                                    : u.role === "auditor" 
                                    ? "Consejero" 
                                    : u.role === "health_team"
                                    ? `Equipo de Salud Espiritual (${u.geographicGroup || "Sin asignar"})`
                                    : "Miembro de Cuerpo Auxiliar"}
                                </span>
                              </td>
                              <td className="py-4 pr-3">
                                {u.country ? (
                                  <div className="flex items-center gap-1.5 text-[11px] text-slate-350">
                                    <Globe className="h-3 w-3 text-slate-500 shrink-0" />
                                    <span>{u.country}</span>
                                    {u.region && (
                                      <>
                                        <span className="text-slate-600">/</span>
                                        <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                        <span className="text-slate-400 text-[10px]">{u.region}</span>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-600 text-[10px] italic">Sin ubicación vinculada</span>
                                )}
                              </td>
                              <td className="py-4 text-right space-x-2 whitespace-nowrap">
                                <button
                                  id={`edit_user_${u.email.replace(/[@.]/g, "_")}`}
                                  onClick={() => handleEditClick(u)}
                                  className="inline-flex items-center gap-1 rounded bg-slate-800/40 px-2 py-1 text-[10px] font-semibold text-[#8FA89B] border border-slate-800 hover:bg-slate-800 hover:text-white transition-all"
                                  title="Editar parámetros del usuario"
                                >
                                  <Edit className="h-3 w-3" />
                                  Editar
                                </button>
                                <button
                                  id={`delete_user_${u.email.replace(/[@.]/g, "_")}`}
                                  onClick={() => handleDeleteUser(u.email)}
                                  disabled={isSelf || u.archived}
                                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-semibold transition-all ${
                                    isSelf || u.archived
                                      ? "bg-slate-900/10 text-slate-600 cursor-not-allowed border border-transparent" 
                                      : "bg-red-500/5 text-red-400 border border-red-500/15 hover:bg-red-500/15 hover:text-red-300"
                                  }`}
                                  title={isSelf ? "No puedes archivar tu propia cuenta de administrador" : u.archived ? "Este usuario ya se encuentra archivado" : "Archivar cuenta del usuario"}
                                >
                                  <Archive className="h-3 w-3" />
                                  {u.archived ? "Archivado" : "Archivar"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* ==================== TAB 6: ACCESO GENERAL A LA BASE DE DATOS ==================== */}
          {activeTab === "database" && user.role === "admin" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {!isDbAuthenticated ? (
                <div className="max-w-md mx-auto my-12 rounded-2xl border border-slate-850 bg-slate-900/40 p-8 backdrop-blur-sm text-center space-y-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8FA89B]/10 text-[#8FA89B] border border-[#8FA89B]/20">
                    <Shield className="h-6 w-6 text-[#8FA89B]" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">Consola de Base de Datos Protegida</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Este panel contiene acceso directo para leer y reconfigurar la base de datos completa. Ingresa la contraseña administrativa para continuar.
                    </p>
                  </div>

                  <form onSubmit={handleVerifyDbPassword} className="space-y-4 text-left">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">Contraseña de Acceso</label>
                      <input
                        id="db_password_prompt_input"
                        type="password"
                        placeholder="••••••••••••••"
                        value={dbPasswordInput}
                        onChange={(e) => setDbPasswordInput(e.target.value)}
                        className="w-full rounded-xl bg-slate-950/80 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-605 outline-none focus:border-[#8FA89B] focus:ring-1 focus:ring-[#8FA89B]/20 transition-all font-mono"
                        required
                        autoFocus
                      />
                    </div>

                    {dbError && (
                      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-100 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                        <span>{dbError}</span>
                      </div>
                    )}

                    <button
                      id="db_unlock_btn"
                      type="submit"
                      disabled={dbLoading}
                      className="w-full rounded-xl bg-[#8FA89B] hover:bg-[#5F756B] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_0_15px_rgba(143,168,155,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {dbLoading ? (
                        <>
                          <RefreshCcw className="h-4 w-4 animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <span>Desbloquear Consola</span>
                      )}
                    </button>
                  </form>

                  <div className="pt-2 text-[10px] text-slate-500 border-t border-slate-850">
                    💡 <span className="font-medium text-slate-400">Pista de contraseña:</span> <code className="bg-slate-950 px-1.5 py-0.5 rounded text-[#8FA89B] font-mono">admin-valida-2026</code>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">Acceso Directo y Consola de Base de Datos (server-db.json)</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Permite leer la información completa estructurada de la base de datos de manera física, realizar cambios directamente al archivo JSON o restablecer las semillas iniciales.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        id="db_refresh_btn"
                        onClick={() => fetchRawDatabase()}
                        disabled={dbLoading}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
                      >
                        <RefreshCcw className={`h-4 w-4 ${dbLoading ? "animate-spin" : ""}`} />
                        Sincronizar de Nuevo
                      </button>

                      <button
                        id="db_reset_btn"
                        onClick={handleResetDatabase}
                        disabled={dbResetting}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Restablecer Semillas
                      </button>
                      
                      <button
                        id="db_download_btn"
                        onClick={() => {
                          try {
                            const blob = new Blob([rawDBText], { type: "application/json" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `validaform-backup-${new Date().toISOString().split('T')[0]}.json`;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          } catch (err: any) {
                            alert("No se pudo descargar el archivo: " + err.message);
                          }
                        }}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 transition-all"
                      >
                        <FolderDown className="h-4 w-4" />
                        Exportar Backup JSON
                      </button>
                    </div>
                  </div>

                  {dbError && (
                    <div id="db_error_box" className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <span>{dbError}</span>
                    </div>
                  )}

                  {dbSuccess && (
                    <div id="db_success_box" className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400 flex items-start gap-3">
                      <Check className="h-5 w-5 shrink-0" />
                      <span>{dbSuccess}</span>
                    </div>
                  )}

                  {/* Selector de formato de visualización */}
                  <div className="flex border-b border-slate-800 gap-1.5 mb-6">
                    <button
                      id="view_format_json_btn"
                      onClick={() => setDbFormatView("json")}
                      className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
                        dbFormatView === "json"
                          ? "border-[#8FA89B] text-[#8FA89B] bg-[#8FA89B]/5 rounded-t-lg"
                          : "border-transparent text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <Database className="h-3.5 w-3.5 text-[#8FA89B]" />
                      Motor Servidor JSON
                    </button>
                    <button
                      id="view_format_mysql_btn"
                      onClick={() => setDbFormatView("mysql")}
                      className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all flex items-center gap-2 ${
                        dbFormatView === "mysql"
                          ? "border-emerald-500 text-emerald-400 bg-emerald-500/5 rounded-t-lg"
                          : "border-transparent text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <span className="text-sm">🐬</span>
                      Formato Relacional MySQL (SQL Script)
                    </button>
                  </div>

                  {dbFormatView === "json" ? (
                    /* Contenedor principal de visualización - JSON */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Panel lateral: Resumen por colección */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
                          <h4 className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-4">Colecciones de Datos</h4>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-xl bg-slate-950/40 p-3.5 border border-slate-850">
                              <div className="flex items-center gap-2.5">
                                <Users className="h-4 w-4 text-sky-400" />
                                <span className="text-xs font-medium text-slate-300">Usuarios Registrados</span>
                              </div>
                              <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-xs font-bold text-sky-400 border border-sky-400/20">
                                {users.length}
                              </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-950/40 p-3.5 border border-slate-850">
                              <div className="flex items-center gap-2.5">
                                <Grid className="h-4 w-4 text-indigo-400" />
                                <span className="text-xs font-medium text-slate-300">Envíos / Encuestas</span>
                              </div>
                              <span className="rounded-full bg-indigo-400/10 px-2 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-400/20">
                                {submissions.length}
                              </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-950/40 p-3.5 border border-slate-850">
                              <div className="flex items-center gap-2.5">
                                <Sliders className="h-4 w-4 text-amber-400" />
                                <span className="text-xs font-medium text-slate-300">Estructura de Preguntas</span>
                              </div>
                              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-400/20">
                                {fields.length}
                              </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-950/40 p-3.5 border border-slate-850">
                              <div className="flex items-center gap-2.5">
                                <Sparkles className="h-4 w-4 text-emerald-400" />
                                <span className="text-xs font-medium text-slate-300">Informes Inteligentes</span>
                              </div>
                              <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-400/20">
                                {reports.length}
                              </span>
                            </div>

                            <div className="flex items-center justify-between rounded-xl bg-slate-950/40 p-3.5 border border-slate-850">
                              <div className="flex items-center gap-2.5">
                                <Bell className="h-4 w-4 text-purple-400" />
                                <span className="text-xs font-medium text-slate-300">Notificaciones / Alertas</span>
                              </div>
                              <span className="rounded-full bg-purple-400/10 px-2 py-0.5 text-xs font-bold text-purple-400 border border-purple-400/20">
                                {notifications.length}
                              </span>
                            </div>
                          </div>
                        </div>


                        {/* Módulo de Google Drive global */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
                          <h4 className="text-xs font-bold text-blue-200 uppercase tracking-widest flex items-center gap-2">
                            <span>📁</span> Carpeta Global de Google Drive
                          </h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Define el enlace global de Google Drive que se mostrará a los Miembros de Cuerpo Auxiliar (MCA) en su página de inicio si no tienen un enlace específico asignado.
                          </p>

                          <div className="space-y-2">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Enlace de la Carpeta de Google Drive</label>
                            <div className="flex gap-2">
                              <input
                                id="admin_drive_url_input"
                                type="url"
                                value={adminDriveUrl}
                                onChange={(e) => setAdminDriveUrl(e.target.value)}
                                placeholder="https://drive.google.com/drive/folders/..."
                                className="flex-1 rounded-lg border border-slate-800 bg-slate-950/60 py-2 px-3 text-xs text-slate-300 outline-none focus:border-[#8FA89B] transition-all"
                              />
                              <button
                                type="button"
                                onClick={handleUpdateDriveUrl}
                                disabled={adminDriveLoading || !adminDriveUrl.trim()}
                                className="rounded-lg bg-[#8FA89B] hover:bg-[#5F756B] disabled:bg-slate-800 disabled:text-slate-600 px-3.5 py-2 text-[11px] font-bold text-white transition-all cursor-pointer shrink-0"
                              >
                                {adminDriveLoading ? "Guardando..." : "Guardar"}
                              </button>
                            </div>
                            <p className="text-[9px] text-slate-500 leading-normal">
                              Este enlace abrirá la Unidad de Google Drive correspondiente en una pestaña nueva para que los MCA organicen sus archivos.
                            </p>
                          </div>

                          {adminDriveSuccess && (
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[11px] text-emerald-400 flex items-start gap-2">
                              <Check className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>{adminDriveSuccess}</span>
                            </div>
                          )}

                          {adminDriveError && (
                            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[11px] text-red-400 flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>{adminDriveError}</span>
                            </div>
                          )}
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-955/40 p-5 text-xs text-slate-400 space-y-2">
                          <span className="font-bold text-slate-300 block mb-1">💡 Notas sobre la edición directa</span>
                          <p>
                            El editor de texto a la derecha te permite modificar las listas de usuarios, respuestas de formulario, campos personalizados, informes de IA y notificaciones.
                          </p>
                          <p>
                            Asegúrate de respetar el formato JSON correcto con llaves de apertura y cierre antes de guardar cambios. Al presionar **"Almacenar Cambios Físicos"**, tu archivo del servidor `server-db.json` se sobrescribirá instantáneamente.
                          </p>
                        </div>
                      </div>

                      {/* Panel derecho: Editor de JSON */}
                      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#8FA89B] uppercase tracking-wider flex items-center gap-1.5 font-mono">
                            <FileText className="h-4 w-4" />
                            Editor Interactivo de server-db.json
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Formato de almacenamiento: utf-8
                          </span>
                        </div>

                        {dbLoading ? (
                          <div className="flex h-96 items-center justify-center flex-col space-y-3">
                            <RefreshCcw className="h-8 w-8 animate-spin text-[#8FA89B]" />
                            <span className="text-xs text-slate-500">Recuperando registros directos desde la memoria intermedia del servidor...</span>
                          </div>
                        ) : (
                          <>
                            <textarea
                              id="raw_db_textarea"
                              value={rawDBText}
                              onChange={(e) => setRawDBText(e.target.value)}
                              className="w-full h-120 font-mono text-xs text-slate-300 bg-slate-950/90 border border-slate-800 rounded-xl p-4 leading-relaxed outline-none focus:border-[#8FA89B] focus:ring-1 focus:ring-[#8FA89B]/20"
                              spellCheck={false}
                            />

                            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                              <button
                                id="btn_format_db_json"
                                onClick={() => {
                                  try {
                                    const parsed = JSON.parse(rawDBText);
                                    setRawDBText(JSON.stringify(parsed, null, 2));
                                    setDbError(null);
                                  } catch (e: any) {
                                    setDbError("No se pudo formatear debido a un error de sintaxis en el JSON: " + e.message);
                                  }
                                }}
                                className="rounded-lg border border-slate-800 bg-slate-950/30 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                              >
                                Dar Formato Estético
                              </button>

                              <button
                                id="btn_save_raw_db"
                                onClick={handleSaveRawDatabase}
                                disabled={dbSaving || dbLoading}
                                className="flex items-center gap-1.5 rounded-lg bg-[#8FA89B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#5F756B] shadow-[0_0_15px_rgba(143,168,155,0.25)] transition-all disabled:opacity-50"
                              >
                                <Save className="h-4 w-4" />
                                {dbSaving ? "Sobrescribiendo server-db.json..." : "Almacenar Cambios Físicos"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Contenedor principal de visualización - MySQL */
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Left Side: Table schemas map */}
                      <div className="lg:col-span-1 space-y-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm">
                          <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span>📋</span> Tablas Relacionales MySQL
                          </h4>
                          <div className="space-y-2.5">
                            {[
                              { id: "users", name: "users", rows: users.length, icon: "👤", desc: "Datos de usuario y credenciales" },
                              { id: "form_fields", name: "form_fields", rows: fields.length, icon: "⚙️", desc: "Estructuras de las preguntas dinámicas" },
                              { id: "submissions", name: "submissions", rows: submissions.length, icon: "📥", desc: "Respuestas directas mapeadas por usuario" },
                              { id: "notifications", name: "notifications", rows: notifications.length, icon: "🔔", desc: "Auditoría de advertencias y eventos" },
                              { id: "reports", name: "reports", rows: reports.length, icon: "📊", desc: "Análisis consolidados con inteligencia artificial" },
                            ].map((tbl) => (
                              <button
                                key={tbl.id}
                                id={`mysql_table_btn_${tbl.id}`}
                                onClick={() => setMysqlSelectedTable(tbl.id)}
                                className={`w-full flex items-start gap-3 rounded-xl p-3 border text-left transition-all ${
                                  mysqlSelectedTable === tbl.id
                                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                    : "bg-slate-950/40 border-slate-850 hover:bg-slate-800/30"
                                }`}
                              >
                                <span className="text-lg shrink-0 pt-0.5">{tbl.icon}</span>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold text-slate-200">{tbl.name}</span>
                                    <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-mono font-bold text-emerald-400 border border-slate-800">
                                      {tbl.rows} fil.
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">{tbl.desc}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Detalle del Esquema Seleccionado */}
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                            <span className="text-xs font-bold text-slate-350 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                              <span>🔑</span> Esquema: <code className="text-emerald-400 font-mono text-xs">{mysqlSelectedTable}</code>
                            </span>
                          </div>

                          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                            {mysqlSelectedTable === "users" && (
                              <div className="space-y-2.5">
                                {[
                                  { name: "email", type: "VARCHAR(255)", key: "PRI", null: "NO", desc: "Identificador único y correo electrónico." },
                                  { name: "name", type: "VARCHAR(255)", key: "-", null: "NO", desc: "Nombre completo o razón social." },
                                  { name: "password", type: "VARCHAR(255)", key: "-", null: "NO", desc: "Clave cifrada de acceso de sistema." },
                                  { name: "role", type: "VARCHAR(50)", key: "-", null: "NO", desc: "Rol asignado (admin, user, auditor)." },
                                  { name: "country", type: "VARCHAR(100)", key: "-", null: "YES", desc: "País origen geolocalizado." },
                                  { name: "region", type: "VARCHAR(100)", key: "-", null: "YES", desc: "Región o provincia geolocalizada." },
                                ].map((col) => (
                                  <div key={col.name} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <code className="text-xs font-mono font-bold text-emerald-400">{col.name}</code>
                                      <span className="text-[10px] bg-slate-900 font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">{col.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                                      {col.key === "PRI" && <span className="text-yellow-500 font-bold">● PRIMARY KEY</span>}
                                      <span>Null: {col.null}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal">{col.desc}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {mysqlSelectedTable === "form_fields" && (
                              <div className="space-y-2.5">
                                {[
                                  { name: "id", type: "VARCHAR(100)", key: "PRI", null: "NO", desc: "Nombre único de identificación técnica del campo." },
                                  { name: "label", type: "VARCHAR(255)", key: "-", null: "NO", desc: "Texto descriptivo mostrado en el formulario." },
                                  { name: "type", type: "VARCHAR(50)", key: "-", null: "NO", desc: "Tipo de input (email, date, select, etc.)." },
                                  { name: "placeholder", type: "VARCHAR(255)", key: "-", null: "YES", desc: "Texto guía opcional dentro del input." },
                                  { name: "required", type: "TINYINT(1)", key: "-", null: "NO", desc: "Si el campo es mandatorio u obligatorio (0 o 1)." },
                                  { name: "options", type: "JSON", key: "-", null: "YES", desc: "Arreglo de strings en formato JSON nativo de MySQL." },
                                  { name: "validation", type: "JSON", key: "-", null: "YES", desc: "Conjunto de limitadores de tamaño y regex en JSON." },
                                  { name: "field_order", type: "INT", key: "-", null: "NO", desc: "Posición numérica en el generador dinámico." },
                                ].map((col) => (
                                  <div key={col.name} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <code className="text-xs font-mono font-bold text-emerald-400">{col.name}</code>
                                      <span className="text-[10px] bg-slate-900 font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">{col.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                                      {col.key === "PRI" && <span className="text-yellow-500 font-bold">● PRIMARY KEY</span>}
                                      <span>Null: {col.null}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal">{col.desc}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {mysqlSelectedTable === "submissions" && (
                              <div className="space-y-2.5">
                                {[
                                  { name: "id", type: "VARCHAR(100)", key: "PRI", null: "NO", desc: "Folio o código único identificando el envío." },
                                  { name: "user_email", type: "VARCHAR(255)", key: "MUL", null: "NO", desc: "Llave foránea enlazada a users.email con ON DELETE CASCADE." },
                                  { name: "submitted_at", type: "VARCHAR(100)", key: "-", null: "NO", desc: "Fecha de inserción estructurada ISO-8601." },
                                  { name: "data", type: "JSON", key: "-", null: "NO", desc: "Contrato de objeto estructurado del formulario en formato JSON nativo." },
                                ].map((col) => (
                                  <div key={col.name} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <code className="text-xs font-mono font-bold text-emerald-400">{col.name}</code>
                                      <span className="text-[10px] bg-slate-900 font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">{col.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                                      {col.key === "PRI" && <span className="text-yellow-500 font-bold">● PRIMARY KEY</span>}
                                      {col.key === "MUL" && <span className="text-[#8FA89B] font-bold">🔑 FOREIGN KEY</span>}
                                      <span>Null: {col.null}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal">{col.desc}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {mysqlSelectedTable === "notifications" && (
                              <div className="space-y-2.5">
                                {[
                                  { name: "id", type: "VARCHAR(100)", key: "PRI", null: "NO", desc: "Consecutivo de la notificación generada." },
                                  { name: "title", type: "VARCHAR(255)", key: "-", null: "NO", desc: "Encabezado o asunto principal del aviso." },
                                  { name: "message", type: "TEXT", key: "-", null: "NO", desc: "Cuerpo descriptivo detallado del incidente." },
                                  { name: "timestamp", type: "VARCHAR(100)", key: "-", null: "NO", desc: "Instante temporal ISO-8601 del suceso." },
                                  { name: "is_read", type: "TINYINT(1)", key: "-", null: "NO", desc: "Contador de revisión del administrador (0 o 1)." },
                                  { name: "type", type: "VARCHAR(50)", key: "-", null: "NO", desc: "Categoría del sistema (info, success, warning)." },
                                ].map((col) => (
                                  <div key={col.name} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <code className="text-xs font-mono font-bold text-emerald-400">{col.name}</code>
                                      <span className="text-[10px] bg-slate-900 font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">{col.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                                      {col.key === "PRI" && <span className="text-yellow-500 font-bold">● PRIMARY KEY</span>}
                                      <span>Null: {col.null}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal">{col.desc}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {mysqlSelectedTable === "reports" && (
                              <div className="space-y-2.5">
                                {[
                                  { name: "id", type: "VARCHAR(100)", key: "PRI", null: "NO", desc: "Llave identificadora del reporte consolidado." },
                                  { name: "generated_at", type: "VARCHAR(100)", key: "-", null: "NO", desc: "Fecha de generación temporal." },
                                  { name: "title", type: "VARCHAR(255)", key: "-", null: "NO", desc: "Título del informe analítico de IA." },
                                  { name: "content", type: "TEXT", key: "-", null: "NO", desc: "Contenido markdown del reporte inteligente de Gemini." },
                                  { name: "submissions_count", type: "INT", key: "-", null: "NO", desc: "Registros considerados en la muestra." },
                                ].map((col) => (
                                  <div key={col.name} className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <code className="text-xs font-mono font-bold text-emerald-400">{col.name}</code>
                                      <span className="text-[10px] bg-slate-900 font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">{col.type}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
                                      {col.key === "PRI" && <span className="text-yellow-500 font-bold">● PRIMARY KEY</span>}
                                      <span>Null: {col.null}</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal">{col.desc}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Code editor / Script Console */}
                      <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col gap-4 backdrop-blur-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                              <span className="text-sm">⚡</span>
                              Script de Generación y Volcado Real de MySQL
                            </span>
                            <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
                              Sincronizado al instante con todos tus datos en vivo del sistema.
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              id="btn_copy_mysql_script"
                              onClick={() => {
                                try {
                                  navigator.clipboard.writeText(generateMySQLScript());
                                  alert("🚀 ¡Script SQL copiado exitosamente al portapapeles!");
                                } catch (e) {
                                  alert("Error al copiar al portapapeles");
                                }
                              }}
                              className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-805 hover:text-white transition-all flex items-center gap-1 font-semibold"
                            >
                              <span>📋</span> Copiar Script SQL
                            </button>
                            <button
                              id="btn_download_mysql_script"
                              onClick={() => {
                                try {
                                  const sqlText = generateMySQLScript();
                                  const blob = new Blob([sqlText], { type: "text/plain" });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `validaform-mysql-import-${new Date().toISOString().split('T')[0]}.sql`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                } catch (err: any) {
                                  alert("Error al descargar: " + err.message);
                                }
                              }}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            >
                              <FolderDown className="h-4 w-4" />
                              Exportar script .sql
                            </button>
                          </div>
                        </div>

                        <div className="relative">
                          <textarea
                            readOnly
                            value={generateMySQLScript()}
                            className="w-full h-120 font-mono text-[10.5px] text-emerald-350 bg-slate-950 border border-emerald-950/50 rounded-xl p-5 leading-normal outline-none focus:ring-1 focus:ring-emerald-950 resize-y"
                            spellCheck={false}
                          />
                          <div className="absolute right-3 top-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-405 font-mono text-[9px] px-2 py-0.5 rounded-full font-bold">
                            VISTA PREVIA
                          </div>
                        </div>

                        <div className="rounded-xl border border-[#8FA89B]/10 bg-[#8FA89B]/5 p-4 text-xs text-slate-400 leading-relaxed space-y-1.5">
                          <p className="font-bold text-slate-300 flex items-center gap-1">
                            <span>💡</span> Instrucciones para importación en MySQL Server:
                          </p>
                          <ol className="list-decimal pl-4.5 space-y-1 font-sans text-[11px]">
                            <li>Copia o descarga el archivo <code className="text-emerald-400">.sql</code> generado.</li>
                            <li>Ejecuta el script en tu administrador de MySQL favorito (ej. <span className="text-slate-200 font-medium">MySQL Workbench</span>, <span className="text-slate-200 font-medium font-sans">phpMyAdmin</span>, o directamente vía terminal: <code className="bg-slate-950 px-1 py-0.5 rounded text-[#8FA89B] text-[10px] font-mono">mysql -u root -p &lt; script.sql</code>).</li>
                            <li>El comando crea automáticamente un esquema <code className="text-emerald-400 font-mono">validaform_db</code>, mapea las relaciones, llaves primarias/foráneas y hace la inserción limpia de tus registros.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
            </div>
          )}
        </div>
      </div>

      {/* Pop-up de confirmación para archivar usuario */}
      <AnimatePresence>
        {userEmailToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-yellow-500/30 bg-slate-900 p-6 shadow-2xl"
              id="confirm_delete_modal"
            >
              <div className="flex items-center gap-3 text-yellow-450 mb-4">
                <div className="rounded-full bg-yellow-500/10 p-2 text-yellow-400">
                  <Archive className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">¿Archivar usuario y revocar acceso?</h3>
              </div>
              
              <p className="text-sm text-slate-350 mb-6 leading-relaxed">
                ¿Estás seguro de que deseas archivar la cuenta de <strong className="text-white font-semibold block mt-1 break-all bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">{userEmailToDelete}</strong>?
                Se denegará el acceso futuro a este usuario de manera inmediata, pero <span className="text-yellow-400 font-semibold">todas sus respuestas de encuesta e historial se conservarán intactas</span> en la base de datos.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setUserEmailToDelete(null)}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                  id="cancel_delete_btn"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="rounded-lg bg-yellow-600 hover:bg-yellow-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] active:scale-[0.98]"
                  id="confirm_delete_btn"
                >
                  Sí, Archivar Cuenta
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pop-up de confirmación para eliminar reporte */}
      <AnimatePresence>
        {reportIdToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl"
              id="confirm_delete_report_modal"
            >
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <div className="rounded-full bg-red-500/10 p-2">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-white">¿Eliminar informe definitivamente?</h3>
              </div>
              
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente el informe <strong className="text-white font-semibold block mt-1 break-all bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">{reports.find(r => r.id === reportIdToDelete)?.title || reportIdToDelete}</strong>? Esta acción no se puede deshacer.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setReportIdToDelete(null)}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                  id="cancel_delete_report_btn"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteReport}
                  className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2 text-xs font-semibold text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-[0.98]"
                  id="confirm_delete_report_btn"
                >
                  Sí, Eliminar Informe
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Ayuda Rápida / Manual del Coordinador */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl text-slate-100"
              id="help_modal"
            >
              <button
                onClick={() => setIsHelpOpen(false)}
                className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Cerrar"
                id="close_help_modal_btn"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 text-[#8FA89B] mb-5 border-b border-slate-800 pb-3">
                <div className="rounded-full bg-[#8FA89B]/10 p-2 shrink-0">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-none">Manual & Ayuda al Coordinador</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Guía rápida de operaciones en la plataforma Salud Espiritual</p>
                </div>
              </div>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 text-xs text-slate-300 leading-relaxed custom-scrollbar">
                {/* Sección 1 */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#8FA89B]/20 text-[#8FA89B] text-[10px] font-extrabold">1</span>
                    Gestión de Respuestas
                  </h4>
                  <p className="pl-6 text-[11px] text-slate-400">
                    En la pestaña <strong className="text-slate-200">Respuestas</strong> puede visualizar cada formulario de validación de encuesta enviado por los colaboradores. Puede filtrar por países, regiones o por el estado del formulario (Archivado, Pendiente, etc.). Use el botón de exportación para descargar la base de datos completa.
                  </p>
                </div>

                {/* Sección 2 */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#8FA89B]/20 text-[#8FA89B] text-[10px] font-extrabold">2</span>
                    Estadísticas & Análisis Regional
                  </h4>
                  <p className="pl-6 text-[11px] text-slate-400">
                    En la pestaña <strong className="text-slate-200">Estadísticas</strong> se muestran gráficos interactivos sobre la satisfacción, edad promedio, y distribución regional. Estos gráficos se actualizan en tiempo real a medida que se registran nuevas encuestas.
                  </p>
                </div>

                {/* Sección 3 */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#8FA89B]/20 text-[#8FA89B] text-[10px] font-extrabold">3</span>
                    Editor de Formulario & Gestión
                  </h4>
                  <p className="pl-6 text-[11px] text-slate-400">
                    Los Administradores pueden utilizar el <strong className="text-slate-200">Editor de Formulario</strong> para agregar o modificar preguntas de la encuesta principal, habilitando campos dinámicos sin necesidad de cambiar el código de la aplicación.
                  </p>
                </div>

                {/* Sección 4 */}
                <div className="space-y-1.5">
                  <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#8FA89B]/20 text-[#8FA89B] text-[10px] font-extrabold">4</span>
                    Alertas en Tiempo Real (SSE)
                  </h4>
                  <p className="pl-6 text-[11px] text-slate-400">
                    El servicio <strong className="text-slate-200">SSE (Server-Sent Events)</strong> mantiene una conexión constante con el servidor para alertarle inmediatamente cuando un colaborador envía un nuevo formulario o cuando ocurre un evento importante.
                  </p>
                </div>

                {/* Caja de Soporte */}
                <div className="rounded-xl bg-slate-950/60 p-3.5 border border-slate-800/80 mt-4">
                  <h5 className="font-bold text-xs text-white mb-1 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-emerald-400" />
                    Soporte Técnico Especializado
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    ¿Tiene dudas adicionales o necesita asistencia técnica con la base de datos? Póngase en contacto directo con soporte al correo: <strong className="text-slate-300 font-mono">soporte.espiritual@coordinacion.org</strong> o contacte al administrador de su región.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 border-t border-slate-800 pt-4">
                <button
                  onClick={() => setIsHelpOpen(false)}
                  className="rounded-lg bg-[#8FA89B] hover:bg-[#5F756B] px-5 py-2 text-xs font-semibold text-white transition-all shadow-[0_0_15px_rgba(143,168,155,0.3)] active:scale-[0.98] cursor-pointer"
                  id="close_help_btn"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
