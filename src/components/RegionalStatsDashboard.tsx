import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { createPortal } from "react-dom";
import { 
  Users, 
  MapPin, 
  BookOpen, 
  Award, 
  Shield, 
  FileText, 
  Globe, 
  ChevronRight, 
  ChevronDown,
  RefreshCw,
  Activity,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Briefcase,
  Layers,
  Sparkles,
  BarChart2,
  PieChart as PieIcon,
  Table as TableIcon,
  Search,
  ZoomIn,
  ZoomOut,
  Download,
  CheckSquare,
  Map,
  Sliders,
  Sprout
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserSession } from "../types";
import { HelpersEvolutionTable } from "./HelpersEvolutionTable";
import { LsaEvolutionTable } from "./LsaEvolutionTable";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";

const getCountryCode = (countryName: string): string | null => {
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

const normalizeCountryName = (name: string): string => {
  if (!name) return "";
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

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

const isCountryInGroup = (countryName: string | undefined, groupName: string): boolean => {
  if (!countryName) return false;
  const normGroupSearch = normalizeGroupName(groupName);
  if (normGroupSearch === "lasamericas") {
    // Check if country belongs to ANY of our 4 groups
    const normCountry = normalizeCountryName(countryName);
    return Object.values(GEOGRAPHIC_GROUPS).some(countries => 
      countries.some(c => normalizeCountryName(c) === normCountry)
    );
  }
  const allowed = getGroupCountries(groupName);
  const normCountry = normalizeCountryName(countryName);
  return allowed.some(c => normalizeCountryName(c) === normCountry);
};

const getCountryDisplayName = (country: string, group: string) => {
  if (country === "Todos") {
    const normGroup = normalizeGroupName(group);
    if (normGroup === "lasamericas") return "Todo el Continente";
    if (normGroup === "centroamerica") return "Toda Centro América";
    if (normGroup === "suramerica") return "Toda Sur América";
    if (normGroup === "norteamerica") return "Toda Norte América";
    if (normGroup === "elcaribe") return "Todo el Caribe";
    return "Todos";
  }
  return country;
};

const getGroupConsolidatedLabel = (country: string, group: string) => {
  if (country === "Todos") {
    const normGroup = normalizeGroupName(group);
    if (normGroup === "lasamericas") return "Todo el Continente";
    if (normGroup === "centroamerica") return "Toda Centro América";
    if (normGroup === "suramerica") return "Toda Sur América";
    if (normGroup === "norteamerica") return "Toda Norte América";
    if (normGroup === "elcaribe") return "Todo el Caribe";
    return group;
  }
  return country;
};

const isCountryAllowedInMap = (properties: any, groupName: string): boolean => {
  const dbName = getDbCountryName(properties);
  return isCountryInGroup(dbName, groupName);
};

const renderCountryFlagImage = (countryName: string, className: string = "h-4 w-6 object-cover rounded shadow-sm") => {
  const code = getCountryCode(countryName);
  if (code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        alt={countryName}
        className={`${className} inline-block align-middle`}
        referrerPolicy="no-referrer"
      />
    );
  }
  return <span className="inline-block align-middle text-sm">🌍</span>;
};

function NinePointedStar({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12,2 13.54,7.77 18.43,4.34 15.9,9.75 21.85,10.26 16.43,12.78 20.66,17 14.89,15.45 15.42,21.4 12,16.5 8.58,21.4 9.11,15.45 3.34,17 7.57,12.78 2.15,10.26 8.1,9.75 5.57,4.34 10.46,7.77" />
    </svg>
  );
}

interface RegionalStatsDashboardProps {
  user: UserSession;
  selectedCountry?: string;
  setSelectedCountry?: (country: string) => void;
  selectedRegion?: string;
  setSelectedRegion?: (region: string) => void;
  hideSidebar?: boolean;
}

interface Submission {
  id: string;
  userEmail: string;
  submittedAt: string;
  userCountry?: string;
  userRegion?: string;
  data: Record<string, any>;
}

interface DBUser {
  email: string;
  name: string;
  role: string;
  country?: string;
  region?: string;
}

// IDs de campos constantes correspondientes al esquema de la base de datos
const FIELD_TEMAS = "field_1781838259883";           // Temas de salud espiritual (multi select)
const FIELD_RUHI_MCA = "field_1781826006155";        // Tabla de libros completados MCA
const FIELD_ESTUDIO_CARTA = "field_1781841094600";   // Checkbox ¿Ha estudiado carta 1 de enero 2016?
const FIELD_MCA_RELATOS = "field_1781841273190";     // Relatos de salud espiritual estudiados por el MCA (checkbox)
const FIELD_MCA_ESPACIOS = "field_1781897268711";    // ¿Ha participado en espacios de estudio sobre la salud espiritual? (checkbox)
const FIELD_MCA_FACILITA = "field_1781900022784";    // ¿Usted está facilitando alguno de estos espacios de estudio? (boolean_justify)
const FIELD_AYUDANTES_NOMBRADOS = "field_1781900419873"; // Número total de ayudantes nombrados
const FIELD_AYUDANTES_PROTECCION = "field_1781900513250"; // boolean_justify: Ayudantes protección?
const FIELD_AYUDANTES_RUHI = "field_1781983653340";   // Tabla Ruhí ayudantes
const FIELD_AYUDANTES_CARTA = "field_1782063015835";  // Ayudantes estudiaron carta 1 ene 2016
const FIELD_AYUDANTES_RELATOS = "field_1782063151398"; // Tabla: Relatos estudiados ayudantes
const FIELD_AYUDANTES_ESPACIOS = "field_1782063187227"; // Ayudantes participaron en espacios
const FIELD_AYUDANTES_FACILITADOS = "field_1782063210057"; // Espacios facilitados por ayudantes
const FIELD_ASAMBLEAS_CANTIDAD = "field_1782063375445"; // Cantidad de AEL en país/región
const FIELD_ASAMBLEAS_ESPACIOS = "field_1782063582212"; // Tabla: AEL participaron en espacios
const FIELD_ASAMBLEAS_RELATOS = "field_1782072026008";  // Tabla: AEL estudiaron relatos
const FIELD_ASAMBLEAS_CONSULTA = "field_1782072087319"; // AEL consultan regularmente
const FIELD_ASAMBLEAS_LINEAS = "field_1782072119225";   // AEL tienen líneas de acción

// Mapeo de nombres del GeoJSON a nombres usados en la base de datos
const geoJsonNameToDbName: { [key: string]: string } = {
  "canada": "Canadá",
  "united states": "Estados Unidos",
  "united states of america": "Estados Unidos",
  "usa": "Estados Unidos",
  "mexico": "México",
  "guatemala": "Guatemala",
  "belize": "Belice",
  "el salvador": "El Salvador",
  "honduras": "Honduras",
  "nicaragua": "Nicaragua",
  "costa rica": "Costa Rica",
  "panama": "Panamá",
  "colombia": "Colombia",
  "venezuela": "Venezuela",
  "ecuador": "Ecuador",
  "peru": "Perú",
  "bolivia": "Bolivia",
  "brazil": "Brasil",
  "paraguay": "Paraguay",
  "chile": "Chile",
  "argentina": "Argentina",
  "uruguay": "Uruguay",
  "guyana": "Guyana",
  "suriname": "Surinam",
  "french guiana": "Guayana Francesa",
  "cuba": "Cuba",
  "the bahamas": "Bahamas",
  "bahamas": "Bahamas",
  "jamaica": "Jamaica",
  "haiti": "Haití",
  "dominican republic": "República Dominicana",
  "dominican rep.": "República Dominicana",
  "trinidad and tobago": "Trinidad y Tobago",
  "puerto rico": "Puerto Rico",
  "antigua and barb.": "Antigua y Barbuda",
  "barbados": "Barbados",
  "dominica": "Dominica",
  "grenada": "Granada",
  "st. kitts and nevis": "San Cristóbal y Nieves",
  "saint lucia": "Santa Lucía",
  "st. vin. and gren.": "San Vicente y las Granadinas"
};

const getDbCountryName = (properties: any): string => {
  const name = properties?.name || properties?.NAME || "";
  const norm = name.toLowerCase().trim();
  return geoJsonNameToDbName[norm] || name;
};

const hexToRgba = (hex: string, alpha: number): string => {
  const cleanHex = hex.replace("#", "");
  const num = parseInt(cleanHex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const getIntensityColor = (count: number, maxCount: number, baseColorHex = "#10b981"): string => {
  if (count === 0) return "rgba(30, 41, 59, 0.15)"; // slate-800 low opacity
  const ratio = maxCount > 0 ? count / maxCount : 0;
  const opacity = 0.15 + ratio * 0.7;
  return hexToRgba(baseColorHex, opacity);
};

export default function RegionalStatsDashboard({
  user,
  selectedCountry: propCountry,
  setSelectedCountry: setPropCountry,
  selectedRegion: propRegion,
  setSelectedRegion: setPropRegion,
  hideSidebar = false
}: RegionalStatsDashboardProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dbUsers, setDbUsers] = useState<DBUser[]>([]);
  const latestExportCSV = useRef<any>(null);
  const latestExportJSON = useRef<any>(null);
  const [dateFieldId, setDateFieldId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Excluir envíos de usuarios archivados para que no cuenten en estadísticas, gráficos o paneles
  const activeSubmissions = React.useMemo(() => {
    const archivedEmails = new Set(
      dbUsers.filter(u => u.archived).map(u => u.email.toLowerCase())
    );
    return submissions.filter(s => s.userEmail && !archivedEmails.has(s.userEmail.toLowerCase()));
  }, [submissions, dbUsers]);

  // Ubicación seleccionada en el menú izquierdo (modo local o controlado)
  const [localCountry, setLocalCountry] = useState<string>("Todos");
  const [localRegion, setLocalRegion] = useState<string>("Todas");

  const isCountryControlled = propCountry !== undefined && setPropCountry !== undefined;
  const isRegionControlled = propRegion !== undefined && setPropRegion !== undefined;

  const selectedCountry = isCountryControlled ? propCountry : localCountry;
  const selectedRegion = isRegionControlled ? propRegion : localRegion;

  const setSelectedCountry = (country: string) => {
    if (isCountryControlled) {
      setPropCountry(country);
    } else {
      setLocalCountry(country);
    }
  };

  const setSelectedRegion = (region: string) => {
    if (isRegionControlled) {
      setPropRegion(region);
    } else {
      setLocalRegion(region);
    }
  };
  const [selectedGroup, setSelectedGroup] = useState<string>(() => {
    if (user && user.role === "health_team" && user.geographicGroup) {
      return user.geographicGroup;
    }
    return "Las Américas";
  });

  // Render phase state correction to prevent any timing or asynchronous state desync for health_team users
  if (user && user.role === "health_team" && user.geographicGroup && selectedGroup !== user.geographicGroup) {
    setSelectedGroup(user.geographicGroup);
  }

  useEffect(() => {
    if (user && user.role === "health_team" && user.geographicGroup) {
      setSelectedGroup(user.geographicGroup);
    }
  }, [user]);

  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"general" | "mca" | "helpers" | "lsa">("general");
  const [hasPortal, setHasPortal] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(event.target as Node)) {
        setIsRegionDropdownOpen(false);
      }
      if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
        setIsGroupDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (selectedCountry !== "Todos" && !isCountryInGroup(selectedCountry, selectedGroup)) {
      setSelectedCountry("Todos");
      setSelectedRegion("Todas");
    }
  }, [selectedGroup]);

  useEffect(() => {
    const el = document.getElementById("header-menu-portal");
    if (el) {
      setHasPortal(true);
    } else {
      setHasPortal(false);
    }
  }, []);
  const [subTab, setSubTab] = useState<"instituto" | "capacitacion" | "espacios" | "resumen" | "temas">("resumen");
  const [viewMode, setViewMode] = useState<"both" | "charts" | "tables">("both");
  const [selectedTimelineTopics, setSelectedTimelineTopics] = useState<string[]>([]);
  const [mcaSearch, setMcaSearch] = useState<string>("");
  const [hoveredMapCountry, setHoveredMapCountry] = useState<string | null>(null);
  const [selectedMapCountry, setSelectedMapCountry] = useState<string>("México");
  const [showExportDropdown, setShowExportDropdown] = useState<boolean>(false);
  const [formalReportMode, setFormalReportMode] = useState<boolean>(false);
  const [pdfSections, setPdfSections] = useState<Record<string, boolean>>({
    general: true,
    mca: true,
    helpers: true,
    lsa: true,
  });
  const shouldShowSubTab = (tabName: "instituto" | "capacitacion" | "espacios" | "resumen" | "temas") => {
    if (formalReportMode) return true;
    if (activeTab === "mca") {
      return subTab === tabName;
    }
    return true;
  };
  const [tableSearch, setTableSearch] = useState<string>("");
  const [selectedRuhiBookTab, setSelectedRuhiBookTab] = useState<string>("Libro 8");
  const [sortField, setSortField] = useState<string>("country");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Estados para el mapa interactivo de Temas de Salud Espiritual
  const [selectedThemeForMap, setSelectedThemeForMap] = useState<string>("__SIN_FILTRO__");
  const [hoveredThemeMapCountry, setHoveredThemeMapCountry] = useState<string | null>(null);
  const [themeMapZoomScale, setThemeMapZoomScale] = useState<number>(1);
  const [themeMapPanX, setThemeMapPanX] = useState<number>(0);
  const [themeMapPanY, setThemeMapPanY] = useState<number>(0);
  const [isThemeMapDragging, setIsThemeMapDragging] = useState<boolean>(false);
  const [themeMapDragStart, setThemeMapDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [themeMapMouseDownPos, setThemeMapMouseDownPos] = useState<{ x: number; y: number } | null>(null);
  const [themeMapPanelTab, setThemeMapPanelTab] = useState<"countries" | "regions">("countries");

  useEffect(() => {
    setTableSearch("");
    setSortField("country");
    setSortDirection("asc");
  }, [activeTab, subTab]);

  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [mapError, setMapError] = useState<boolean>(false);
  const [mapLoading, setMapLoading] = useState<boolean>(true);

  // Estados de Zoom y Pan para el mapa interactivo
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mouseDownPos, setMouseDownPos] = useState<{ x: number; y: number } | null>(null);

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.3, 6));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(prev - 0.3, 0.8);
      if (next <= 1.0) {
        setPanX(0);
        setPanY(0);
      }
      return next;
    });
  };

  const handleZoomReset = () => {
    setZoomScale(1);
    setPanX(0);
    setPanY(0);
  };

  const handleMapMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleMapMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.x);
    setPanY(e.clientY - dragStart.y);
  };

  const handleMapMouseUp = () => {
    setIsDragging(false);
  };

  const handleThemeMapZoomIn = () => {
    setThemeMapZoomScale((prev) => Math.min(prev + 0.3, 6));
  };

  const handleThemeMapZoomOut = () => {
    setThemeMapZoomScale((prev) => {
      const next = Math.max(prev - 0.3, 0.8);
      if (next <= 1.0) {
        setThemeMapPanX(0);
        setThemeMapPanY(0);
      }
      return next;
    });
  };

  const handleThemeMapZoomReset = () => {
    setThemeMapZoomScale(1);
    setThemeMapPanX(0);
    setThemeMapPanY(0);
  };

  const handleThemeMapMouseDown = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    setIsThemeMapDragging(true);
    setThemeMapDragStart({ x: e.clientX - themeMapPanX, y: e.clientY - themeMapPanY });
    setMouseDownPos({ x: e.clientX, y: e.clientY });
  };

  const handleThemeMapMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!isThemeMapDragging) return;
    setThemeMapPanX(e.clientX - themeMapDragStart.x);
    setThemeMapPanY(e.clientY - themeMapDragStart.y);
  };

  const handleThemeMapMouseUp = () => {
    setIsThemeMapDragging(false);
  };

  useEffect(() => {
    setMapLoading(true);
    fetch("/americas.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load map data");
        return res.json();
      })
      .then((data) => {
        setGeoJsonData(data);
        setMapLoading(false);
        setMapError(false);
      })
      .catch((err) => {
        console.error("Error loading map:", err);
        setMapLoading(false);
        setMapError(true);
      });
  }, []);

  // Sincronizar el país seleccionado en el mapa con el filtro de país seleccionado en el dashboard
  useEffect(() => {
    if (selectedCountry && selectedCountry !== "Todos") {
      setSelectedMapCountry(selectedCountry);
    }
  }, [selectedCountry]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subsRes, usersRes, fieldsRes] = await Promise.all([
        fetch("/api/form/submissions"),
        fetch("/api/users"),
        fetch("/api/form/fields")
      ]);

      if (!subsRes.ok || !usersRes.ok || !fieldsRes.ok) {
        throw new Error("No se pudo obtener la información estadística del servidor.");
      }

      const subsData = await subsRes.json();
      const usersData = await usersRes.json();
      const fieldsData = await fieldsRes.json();

      setSubmissions(subsData);
      setDbUsers(usersData);

      const isFechaField = (f: any) => f.type === "date" || (f.label && f.label.toLowerCase() === "fecha");
      const dateField = fieldsData.find(isFechaField);
      if (dateField) {
        setDateFieldId(dateField.id);
      }

      // Pre-seleccionar la región del usuario si está registrada
      if (user.country) {
        setSelectedCountry(user.country);
        if (user.region) {
          setSelectedRegion(user.region);
        } else {
          setSelectedRegion("Todas");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error al conectar con la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Dispatch loading & formal mode state back to App.tsx
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('dashboard-sync-state', { detail: { loading } }));
  }, [loading]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('dashboard-formal-state', { detail: { active: formalReportMode } }));
  }, [formalReportMode]);

  // Listen to top header triggers
  useEffect(() => {
    const handleSync = () => {
      fetchData();
    };
    const handleExportCSVTrigger = () => {
      if (latestExportCSV.current) {
        latestExportCSV.current();
      }
    };
    const handleExportJSONTrigger = () => {
      if (latestExportJSON.current) {
        latestExportJSON.current();
      }
    };
    const handleToggleFormalTrigger = () => {
      setFormalReportMode((prev) => !prev);
    };
    const handlePrintTrigger = () => {
      window.focus();
      window.print();
    };

    window.addEventListener('trigger-dashboard-sync', handleSync);
    window.addEventListener('trigger-dashboard-export-csv', handleExportCSVTrigger);
    window.addEventListener('trigger-dashboard-export-json', handleExportJSONTrigger);
    window.addEventListener('trigger-dashboard-toggle-formal', handleToggleFormalTrigger);
    window.addEventListener('trigger-dashboard-print', handlePrintTrigger);

    return () => {
      window.removeEventListener('trigger-dashboard-sync', handleSync);
      window.removeEventListener('trigger-dashboard-export-csv', handleExportCSVTrigger);
      window.removeEventListener('trigger-dashboard-export-json', handleExportJSONTrigger);
      window.removeEventListener('trigger-dashboard-toggle-formal', handleToggleFormalTrigger);
      window.removeEventListener('trigger-dashboard-print', handlePrintTrigger);
    };
  }, [fetchData]);

  // Extraer todos los países y sus regiones registrados tanto en usuarios como en submissions
  const getLocationsList = () => {
    const locationsMap: Record<string, Set<string>> = {};

    // 1. De los usuarios (solo activos)
    dbUsers.filter(u => !u.archived).forEach(u => {
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

    // 2. De los envíos (solo activos)
    activeSubmissions.forEach(s => {
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

    // Convertir a estructura ordenada
    const sortedCountries = Object.keys(locationsMap).sort().map(country => ({
      country,
      regions: Array.from(locationsMap[country]).sort()
    }));

    return sortedCountries;
  };

  const locations = getLocationsList().filter(loc => isCountryInGroup(loc.country, selectedGroup));

  // Filtrar submissions y usuarios basados en la selección (excluyendo archivados)
  const getFilteredData = () => {
    let filteredSubs = [...activeSubmissions];
    let filteredUsrList = dbUsers.filter(u => u.role === "user" && !u.archived); // MCAs activos

    if (selectedGroup !== "Las Américas") {
      filteredSubs = filteredSubs.filter(s => isCountryInGroup(s.userCountry, selectedGroup));
      filteredUsrList = filteredUsrList.filter(u => isCountryInGroup(u.country, selectedGroup));
    }

    if (selectedCountry !== "Todos") {
      filteredSubs = filteredSubs.filter(s => s.userCountry && s.userCountry.toLowerCase() === selectedCountry.toLowerCase());
      filteredUsrList = filteredUsrList.filter(u => u.country && u.country.toLowerCase() === selectedCountry.toLowerCase());

      if (selectedRegion !== "Todas") {
        filteredSubs = filteredSubs.filter(s => s.userRegion && s.userRegion.toLowerCase() === selectedRegion.toLowerCase());
        filteredUsrList = filteredUsrList.filter(u => u.region && u.region.toLowerCase() === selectedRegion.toLowerCase());
      }
    }

    return { filteredSubs, filteredUsrList };
  };

   const { filteredSubs, filteredUsrList } = getFilteredData();
 
   // parseFormDate is defined at the top of the component
 
   // Obtener el envío más reciente de cada usuario para evitar duplicaciones en el recuento regional de datos acumulados
  const getLatestSubmissionsByEmail = (subsList: Submission[]) => {
    const latestMap: Record<string, Submission> = {};
    subsList.forEach(sub => {
      const email = sub.userEmail.toLowerCase();
      if (!latestMap[email]) {
        latestMap[email] = sub;
      } else {
        let useNew = false;
        if (dateFieldId) {
          const valNew = sub.data[dateFieldId];
          const valExisting = latestMap[email].data[dateFieldId];
          if (valNew && valExisting) {
            const dateNew = parseFormDate(valNew);
            const dateExisting = parseFormDate(valExisting);
            if (dateNew.getTime() !== dateExisting.getTime()) {
              useNew = dateNew > dateExisting;
            } else {
              // Si la fecha del formulario es idéntica, usamos la de envío como fallback
              useNew = new Date(sub.submittedAt) > new Date(latestMap[email].submittedAt);
            }
          } else if (valNew) {
            useNew = true;
          } else if (valExisting) {
            useNew = false;
          } else {
            useNew = new Date(sub.submittedAt) > new Date(latestMap[email].submittedAt);
          }
        } else {
          useNew = new Date(sub.submittedAt) > new Date(latestMap[email].submittedAt);
        }

        if (useNew) {
          latestMap[email] = sub;
        }
      }
    });
    return Object.values(latestMap);
  };

  const getSumFieldFromSubmissions = (subsList: Submission[], fieldId: string) => {
    const territoryMap: Record<string, number> = {};
    subsList.forEach(sub => {
      const country = (sub.userCountry || "Desconocido").trim().toLowerCase();
      const region = (sub.userRegion || "Sin Región").trim().toLowerCase();
      const key = `${country}_${region}`;
      const val = Number(sub.data[fieldId]) || 0;
      if (territoryMap[key] === undefined) {
        territoryMap[key] = val;
      } else {
        territoryMap[key] = Math.max(territoryMap[key], val);
      }
    });
    return Object.values(territoryMap).reduce((sum, val) => sum + val, 0);
  };

  const getSumLsaFromSubmissions = (subsList: Submission[]) => {
    return getSumFieldFromSubmissions(subsList, FIELD_ASAMBLEAS_CANTIDAD);
  };

  const latestSubmissions = getLatestSubmissionsByEmail(filteredSubs);

  // getSubDateValue is defined at the top of the component

  // Find the latest date registered in the field "Fecha" across all submissions in the database
  const latestFechaInDatabase = React.useMemo(() => {
    if (!activeSubmissions || activeSubmissions.length === 0) return null;
    let maxDateVal: string | null = null;
    let maxDateObj: Date | null = null;
    
    activeSubmissions.forEach(sub => {
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
  }, [activeSubmissions, dateFieldId]);

  // Helper to get latest submissions up to a given date
  const getLatestSubmissionsByEmailUpToDate = (subsList: Submission[], targetDateStr: string | null) => {
    if (!targetDateStr) return [];
    const targetDate = parseFormDate(targetDateStr);
    const latestMap: Record<string, Submission> = {};
    subsList.forEach(sub => {
      const email = sub.userEmail.toLowerCase();
      const subDateStr = getSubDateValue(sub);
      if (!subDateStr) return;
      const subDate = parseFormDate(subDateStr);
      
      // Only consider submissions up to the target date
      if (subDate.getTime() <= targetDate.getTime()) {
        if (!latestMap[email]) {
          latestMap[email] = sub;
        } else {
          const valNew = subDate;
          const valExisting = parseFormDate(getSubDateValue(latestMap[email]));
          if (valNew.getTime() > valExisting.getTime()) {
            latestMap[email] = sub;
          } else if (valNew.getTime() === valExisting.getTime()) {
            // Tie-breaker: actual submittedAt timestamp
            if (new Date(sub.submittedAt) > new Date(latestMap[email].submittedAt)) {
              latestMap[email] = sub;
            }
          }
        }
      }
    });
    return Object.values(latestMap);
  };

  const dateTrendMetrics = React.useMemo(() => {
    if (!filteredSubs || filteredSubs.length === 0) {
      return {
        hasTrend: false,
        lastDateLabel: "",
        prevDateLabel: "",
        mca: { current: 0, previous: 0, pct: 0, state: "neutral" as const },
        helpers: { current: 0, previous: 0, pct: 0, state: "neutral" as const },
        lsa: { current: 0, previous: 0, pct: 0, state: "neutral" as const }
      };
    }

    const datesSet = new Set<string>();
    filteredSubs.forEach(sub => {
      const dStr = getSubDateValue(sub);
      if (dStr) datesSet.add(dStr);
    });

    const uniqueDatesSorted = Array.from(datesSet).sort((a, b) => {
      return parseFormDate(a).getTime() - parseFormDate(b).getTime();
    });

    if (uniqueDatesSorted.length < 1) {
      return {
        hasTrend: false,
        lastDateLabel: "",
        prevDateLabel: "",
        mca: { current: 0, previous: 0, pct: 0, state: "neutral" as const },
        helpers: { current: 0, previous: 0, pct: 0, state: "neutral" as const },
        lsa: { current: 0, previous: 0, pct: 0, state: "neutral" as const }
      };
    }

    const lastDate = uniqueDatesSorted[uniqueDatesSorted.length - 1];
    const prevDate = uniqueDatesSorted.length >= 2 ? uniqueDatesSorted[uniqueDatesSorted.length - 2] : null;

    const calcStatsForSubList = (subsList: Submission[]) => {
      const mcaCount = subsList.length;

      const helpersCount = subsList.reduce((sum, sub) => {
        const num = Number(sub.data[FIELD_AYUDANTES_NOMBRADOS]);
        return isNaN(num) ? sum : sum + num;
      }, 0);

      const helpersProtectionCount = subsList.reduce((sum, sub) => {
        const valObj = sub.data[FIELD_AYUDANTES_PROTECCION];
        if (valObj && typeof valObj === "object") {
          const ans = valObj.answer;
          if (ans === "Sí" || ans === "Si") {
            const num = Number(valObj.justification);
            return sum + (isNaN(num) ? 1 : num);
          }
        } else if (valObj === "Sí" || valObj === "Si") {
          return sum + 1;
        }
        return sum;
      }, 0);

      const lsaCount = getSumLsaFromSubmissions(subsList);

      return { mcaCount, helpersCount, helpersProtectionCount, lsaCount };
    };

    const currentSubs = getLatestSubmissionsByEmailUpToDate(filteredSubs, lastDate);
    const currentStats = calcStatsForSubList(currentSubs);

    const previousSubs = prevDate ? getLatestSubmissionsByEmailUpToDate(filteredSubs, prevDate) : [];
    const previousStats = calcStatsForSubList(previousSubs);

    const getTrendPctAndState = (curr: number, prev: number) => {
      if (!prevDate || prev === 0) {
        return { pct: 0, state: "neutral" as const };
      }
      const diff = curr - prev;
      const pct = Math.round((diff / prev) * 100);
      let state: "up" | "down" | "neutral" = "neutral";
      if (diff > 0) state = "up";
      else if (diff < 0) state = "down";
      return { pct, state };
    };

    const mcaTrend = getTrendPctAndState(currentStats.mcaCount, previousStats.mcaCount);
    const helpersTrend = getTrendPctAndState(currentStats.helpersCount, previousStats.helpersCount);
    const helpersProtectionTrend = getTrendPctAndState(currentStats.helpersProtectionCount, previousStats.helpersProtectionCount);
    const lsaTrend = getTrendPctAndState(currentStats.lsaCount, previousStats.lsaCount);

    const formatShortDate = (dateStr: string) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", { month: "short", year: "numeric" });
      }
      if (/^\d{4}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "-01T00:00:00").toLocaleDateString("es-ES", { month: "short", year: "numeric" });
      }
      return dateStr;
    };

    return {
      hasTrend: !!prevDate,
      lastDateLabel: formatShortDate(lastDate),
      prevDateLabel: prevDate ? formatShortDate(prevDate) : "",
      mca: {
        current: currentStats.mcaCount,
        previous: previousStats.mcaCount,
        ...mcaTrend
      },
      helpers: {
        current: currentStats.helpersCount,
        previous: previousStats.helpersCount,
        ...helpersTrend
      },
      helpersProtection: {
        current: currentStats.helpersProtectionCount,
        previous: previousStats.helpersProtectionCount,
        ...helpersProtectionTrend
      },
      lsa: {
        current: currentStats.lsaCount,
        previous: previousStats.lsaCount,
        ...lsaTrend
      }
    };
  }, [filteredSubs, dateFieldId]);

  // ==========================================
  // CÁLCULO DE MÉTRICAS: 1. MIEMBROS DE CUERPO AUXILIAR (MCA)
  // ==========================================
  const mcaTotalRegistered = filteredUsrList.length;
  const mcaTotalWithSubmissions = latestSubmissions.length;

  // Percentage of MCAs that are currently En Proceso in the Libros Ruhi
  const mcaEnProcesoRuhiCount = latestSubmissions.filter(sub => {
    const tableData = sub.data[FIELD_RUHI_MCA];
    if (tableData && typeof tableData === "object") {
      const rows = Object.values(tableData);
      return rows.some((row: any) => {
        if (row && typeof row === "object") {
          const columns = ["U1", "U2", "U3"];
          return columns.some(col => row[col] === "En Proceso");
        }
        return false;
      });
    }
    return false;
  }).length;
  
  // Listado de MCAs y su estado
  const mcaList = filteredUsrList.map(u => {
    const latestSub = latestSubmissions.find(s => s.userEmail.toLowerCase() === u.email.toLowerCase());
    return {
      name: u.name || u.email,
      email: u.email,
      submitted: !!latestSub,
      date: latestSub ? new Date(latestSub.submittedAt).toLocaleDateString("es-ES", { dateStyle: "short" }) : "Pendiente"
    };
  });

  // Temas recurrentes de Salud Espiritual (frecuencia)
  const recurrentTopics = React.useMemo(() => {
    const topicsCounts: Record<string, number> = {};
    let totalMentions = 0;

    // Usar latestSubmissions para contar solo el envío más reciente de cada usuario (una vez por usuario)
    const targetSubmissions = latestSubmissions;

    targetSubmissions.forEach(sub => {
      const val = sub.data[FIELD_TEMAS];
      if (Array.isArray(val)) {
        val.forEach((topic: string) => {
          if (topic && topic.trim() !== "") {
            topicsCounts[topic] = (topicsCounts[topic] || 0) + 1;
            totalMentions++;
          }
        });
      } else if (typeof val === "string" && val.trim() !== "") {
        topicsCounts[val] = (topicsCounts[val] || 0) + 1;
        totalMentions++;
      }
    });

    const mcaCountForPercent = targetSubmissions.length;

    return Object.entries(topicsCounts)
      .map(([name, count]) => ({
        name,
        count,
        percent: mcaCountForPercent > 0 ? Math.round((count / mcaCountForPercent) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [latestSubmissions]);

  // Evolución temporal de los temas recurrentes (frecuencia / menciones en el tiempo por Fecha)
  const recurrentTopicsTimelineData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    // Agrupamos todos los envíos filtrados por su campo "Fecha" para responder dinámicamente a los filtros
    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01"; // Fallback razonable
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      // Normalizamos la clave de fecha a "YYYY-MM"
      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    // Buscamos todos los temas únicos presentes en los envíos filtrados
    const allTopicsSet = new Set<string>();
    filteredSubs.forEach((sub) => {
      const val = sub.data[FIELD_TEMAS];
      if (Array.isArray(val)) {
        val.forEach((topic) => {
          if (topic && typeof topic === "string" && topic.trim() !== "") {
            allTopicsSet.add(topic.trim());
          }
        });
      } else if (typeof val === "string" && val.trim() !== "") {
        allTopicsSet.add(val.trim());
      }
    });
    const uniqueTopics = Array.from(allTopicsSet);

    // Mapeamos cada fecha contando las menciones de cada tema
    const timeline = sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      const counts: Record<string, number> = {};

      uniqueTopics.forEach(topic => {
        counts[topic] = 0;
      });

      subs.forEach((sub) => {
        const val = sub.data[FIELD_TEMAS];
        if (Array.isArray(val)) {
          val.forEach((topic) => {
            if (topic && typeof topic === "string" && topic.trim() !== "") {
              const cleaned = topic.trim();
              counts[cleaned] = (counts[cleaned] || 0) + 1;
            }
          });
        } else if (typeof val === "string" && val.trim() !== "") {
          const cleaned = val.trim();
          counts[cleaned] = (counts[cleaned] || 0) + 1;
        }
      });

      return {
        fecha: formatDisplayDate(dateKey),
        rawFecha: dateKey,
        ...counts
      };
    });

    return {
      timeline,
      uniqueTopics
    };
  }, [filteredSubs, dateFieldId]);

  // Datos de intensidad por tema para el mapa interactivo de Temas de Salud Espiritual
  const themeIntensityData = React.useMemo(() => {
    const countryTopicCounts: Record<string, Record<string, number>> = {};
    const regionTopicCounts: Record<string, Record<string, number>> = {};
    const allTopicsSet = new Set<string>();

    const countrySubsMap: Record<string, any[]> = {};
    activeSubmissions.forEach(sub => {
      const c = sub.userCountry ? sub.userCountry.trim().toLowerCase() : "";
      if (c && isCountryInGroup(c, selectedGroup)) {
        if (!countrySubsMap[c]) countrySubsMap[c] = [];
        countrySubsMap[c].push(sub);
      }
    });

    Object.entries(countrySubsMap).forEach(([countryKey, subs]) => {
      const latestSubs = getLatestSubmissionsByEmail(subs);
      const counts: Record<string, number> = {};
      latestSubs.forEach(sub => {
        const val = sub.data[FIELD_TEMAS];
        const processTopic = (topic: string) => {
          if (topic && topic.trim() !== "") {
            const trimmed = topic.trim();
            counts[trimmed] = (counts[trimmed] || 0) + 1;
            allTopicsSet.add(trimmed);
          }
        };

        if (Array.isArray(val)) {
          val.forEach(processTopic);
        } else if (typeof val === "string" && val.trim() !== "") {
          processTopic(val);
        }
      });
      countryTopicCounts[countryKey] = counts;
    });

    const regionSubsMap: Record<string, any[]> = {};
    activeSubmissions.forEach(sub => {
      const c = sub.userCountry ? sub.userCountry.trim().toLowerCase() : "";
      const r = sub.userRegion ? sub.userRegion.trim().toLowerCase() : "";
      if (c && r && isCountryInGroup(c, selectedGroup)) {
        const key = `${c}|${r}`;
        if (!regionSubsMap[key]) regionSubsMap[key] = [];
        regionSubsMap[key].push(sub);
      }
    });

    Object.entries(regionSubsMap).forEach(([regionKey, subs]) => {
      const latestSubs = getLatestSubmissionsByEmail(subs);
      const counts: Record<string, number> = {};
      latestSubs.forEach(sub => {
        const val = sub.data[FIELD_TEMAS];
        const processTopic = (topic: string) => {
          if (topic && topic.trim() !== "") {
            const trimmed = topic.trim();
            counts[trimmed] = (counts[trimmed] || 0) + 1;
          }
        };

        if (Array.isArray(val)) {
          val.forEach(processTopic);
        } else if (typeof val === "string" && val.trim() !== "") {
          processTopic(val);
        }
      });
      regionTopicCounts[regionKey] = counts;
    });

    return {
      countryTopicCounts,
      regionTopicCounts,
      allTopics: Array.from(allTopicsSet).sort()
    };
  }, [activeSubmissions, selectedGroup]);

  const getTopicColor = React.useCallback((topicName: string) => {
    const allTopics = themeIntensityData.allTopics;
    const index = allTopics.indexOf(topicName);
    const colors = [
      "#10b981", // Emerald/Green
      "#3b82f6", // Blue
      "#6366f1", // Indigo
      "#a855f7", // Purple
      "#ec4899", // Pink
      "#f59e0b", // Amber
      "#14b8a6", // Teal
      "#06b6d4", // Cyan
      "#f97316", // Orange
      "#ef4444", // Red
      "#8b5cf6", // Violet
      "#0ea5e9", // Sky
    ];
    if (index === -1) return "#64748b"; // fallback slate
    return colors[index % colors.length];
  }, [themeIntensityData.allTopics]);

  const maxCountForThemeMap = React.useMemo(() => {
    let max = 0;
    Object.values(themeIntensityData.countryTopicCounts).forEach(counts => {
      if (selectedThemeForMap === "Todos") {
        const sum = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
        if (sum > max) max = sum;
      } else if (selectedThemeForMap === "__SIN_FILTRO__") {
        // no count
      } else {
        const val = counts[selectedThemeForMap] || 0;
        if (val > max) max = val;
      }
    });
    return max || 1;
  }, [themeIntensityData, selectedThemeForMap]);

  const themeMapStats = React.useMemo(() => {
    let countriesCount = 0;
    let regionsCount = 0;
    let totalMentions = 0;

    const countryDetailsList: { name: string; count: number }[] = [];
    const regionDetailsList: { country: string; region: string; count: number }[] = [];

    Object.entries(themeIntensityData.countryTopicCounts).forEach(([countryKey, counts]) => {
      let count = 0;
      if (selectedThemeForMap === "Todos") {
        count = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
      } else if (selectedThemeForMap === "__SIN_FILTRO__") {
        count = 0;
      } else {
        count = counts[selectedThemeForMap] || 0;
      }

      if (count > 0) {
        countriesCount++;
        totalMentions += count;
        const displayName = locations.find(l => l.country.toLowerCase() === countryKey)?.country || 
                            activeSubmissions.find(s => s.userCountry && s.userCountry.toLowerCase() === countryKey)?.userCountry || 
                            countryKey.charAt(0).toUpperCase() + countryKey.slice(1);
        countryDetailsList.push({ name: displayName, count });
      }
    });

    Object.entries(themeIntensityData.regionTopicCounts).forEach(([regionKey, counts]) => {
      const [cKey, rKey] = regionKey.split("|");
      let count = 0;
      if (selectedThemeForMap === "Todos") {
        count = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);
      } else if (selectedThemeForMap === "__SIN_FILTRO__") {
        count = 0;
      } else {
        count = counts[selectedThemeForMap] || 0;
      }

      if (count > 0) {
        regionsCount++;
        const countryDisplayName = locations.find(l => l.country.toLowerCase() === cKey)?.country || 
                                   activeSubmissions.find(s => s.userCountry && s.userCountry.toLowerCase() === cKey)?.userCountry || 
                                   cKey.charAt(0).toUpperCase() + cKey.slice(1);
        const regionDisplayName = activeSubmissions.find(s => s.userRegion && s.userRegion.toLowerCase() === rKey)?.userRegion || 
                                  rKey.charAt(0).toUpperCase() + rKey.slice(1);
        regionDetailsList.push({ country: countryDisplayName, region: regionDisplayName, count });
      }
    });

    countryDetailsList.sort((a, b) => b.count - a.count);
    regionDetailsList.sort((a, b) => b.count - a.count);

    return {
      countriesCount,
      regionsCount,
      totalMentions,
      countryDetailsList,
      regionDetailsList
    };
  }, [themeIntensityData, selectedThemeForMap, locations, activeSubmissions]);

  // Libros del Instituto Ruhí completados por los MCAs
  // Estructura: Libro 8, Libro 9, Libro 10, Libro 11, Libro 12, Libro 13, Libro 14 completado por cuántos
  const getMcaRuhiStats = () => {
    const bookCounts: Record<string, { 
      completed: number; 
      studying: number;
      u1_completed: number;
      u1_studying: number;
      u2_completed: number;
      u2_studying: number;
      u3_completed: number;
      u3_studying: number;
    }> = {};
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    bookNames.forEach(b => { 
      bookCounts[b] = { 
        completed: 0, 
        studying: 0,
        u1_completed: 0,
        u1_studying: 0,
        u2_completed: 0,
        u2_studying: 0,
        u3_completed: 0,
        u3_studying: 0,
      }; 
    });

    latestSubmissions.forEach(sub => {
      const tableData = sub.data[FIELD_RUHI_MCA];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8") label = "Libro 8";
          if (label === "L9") label = "Libro 9";
          if (label === "L10") label = "Libro 10";
          if (label === "L11") label = "Libro 11";
          if (label === "L12") label = "Libro 12";
          if (label === "L13") label = "Libro 13";
          if (label === "L14") label = "Libro 14";
          if (bookNames.includes(label)) {
            // Verificar columnas U1, U2, U3
            const columns = ["U1", "U2", "U3"];
            let hasCompleted = false;
            let hasStudying = false;

            columns.forEach(col => {
              const val = row[col];
              if (val === "Completado") {
                hasCompleted = true;
                if (col === "U1") bookCounts[label].u1_completed++;
                if (col === "U2") bookCounts[label].u2_completed++;
                if (col === "U3") bookCounts[label].u3_completed++;
              }
              if (val === "En Proceso") {
                hasStudying = true;
                if (col === "U1") bookCounts[label].u1_studying++;
                if (col === "U2") bookCounts[label].u2_studying++;
                if (col === "U3") bookCounts[label].u3_studying++;
              }
            });

            if (hasCompleted) bookCounts[label].completed++;
            if (hasStudying) bookCounts[label].studying++;
          }
        });
      }
    });

    return Object.entries(bookCounts).map(([book, counts]) => ({
      book,
      completed: counts.completed,
      studying: counts.studying,
      u1_completed: counts.u1_completed,
      u1_studying: counts.u1_studying,
      u2_completed: counts.u2_completed,
      u2_studying: counts.u2_studying,
      u3_completed: counts.u3_completed,
      u3_studying: counts.u3_studying,
      completedPercent: mcaTotalWithSubmissions > 0 ? Math.round((counts.completed / mcaTotalWithSubmissions) * 100) : 0,
      studyingPercent: mcaTotalWithSubmissions > 0 ? Math.round((counts.studying / mcaTotalWithSubmissions) * 100) : 0
    }));
  };

  const mcaRuhiBooks = getMcaRuhiStats();

  const mcaRuhiUnitsPercentageData = mcaRuhiBooks.flatMap(b => {
    const shortBook = b.book.replace("Libro ", "L");
    return [
      {
        unitLabel: `${shortBook} U1`,
        completado: mcaTotalWithSubmissions > 0 ? Math.round((b.u1_completed / mcaTotalWithSubmissions) * 100) : 0,
        enProceso: mcaTotalWithSubmissions > 0 ? Math.round((b.u1_studying / mcaTotalWithSubmissions) * 100) : 0,
      },
      {
        unitLabel: `${shortBook} U2`,
        completado: mcaTotalWithSubmissions > 0 ? Math.round((b.u2_completed / mcaTotalWithSubmissions) * 100) : 0,
        enProceso: mcaTotalWithSubmissions > 0 ? Math.round((b.u2_studying / mcaTotalWithSubmissions) * 100) : 0,
      },
      {
        unitLabel: `${shortBook} U3`,
        completado: mcaTotalWithSubmissions > 0 ? Math.round((b.u3_completed / mcaTotalWithSubmissions) * 100) : 0,
        enProceso: mcaTotalWithSubmissions > 0 ? Math.round((b.u3_studying / mcaTotalWithSubmissions) * 100) : 0,
      }
    ];
  });

  // Obtener los totales de Libros Completados agrupados por País y Región para los MCAs
  const getMcaRuhiByLocationStats = () => {
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      books: Record<string, { total: number; u1: number; u2: number; u3: number }>;
      totalCompleted: number;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initBooks: Record<string, { total: number; u1: number; u2: number; u3: number }> = {};
        bookNames.forEach(b => {
          initBooks[b] = { total: 0, u1: 0, u2: 0, u3: 0 };
        });
        locationMap[key] = {
          country,
          region,
          books: initBooks,
          totalCompleted: 0
        };
      }

      const tableData = sub.data[FIELD_RUHI_MCA];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8" || label === "Libro 8") label = "Libro 8";
          else if (label === "L9" || label === "Libro 9") label = "Libro 9";
          else if (label === "L10" || label === "Libro 10") label = "Libro 10";
          else if (label === "L11" || label === "Libro 11") label = "Libro 11";
          else if (label === "L12" || label === "Libro 12") label = "Libro 12";
          else if (label === "L13" || label === "Libro 13") label = "Libro 13";
          else if (label === "L14" || label === "Libro 14") label = "Libro 14";

          if (bookNames.includes(label)) {
            let isCompleted = false;
            let subU1 = 0;
            let subU2 = 0;
            let subU3 = 0;

            if (row["U1"] === "Completado") {
              isCompleted = true;
              subU1 = 1;
            }
            if (row["U2"] === "Completado") {
              isCompleted = true;
              subU2 = 1;
            }
            if (row["U3"] === "Completado") {
              isCompleted = true;
              subU3 = 1;
            }

            if (isCompleted) {
              locationMap[key].books[label].total++;
              locationMap[key].books[label].u1 += subU1;
              locationMap[key].books[label].u2 += subU2;
              locationMap[key].books[label].u3 += subU3;
              locationMap[key].totalCompleted++;
            }
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const mcaRuhiByLocationStats = getMcaRuhiByLocationStats();

  // Obtener los totales de Libros Estudiados (Completados o En Proceso) agrupados por País y Región para los MCAs
  const getMcaRuhiStudiedByLocationStats = () => {
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      books: Record<string, number>;
      totalStudied: number;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initBooks: Record<string, number> = {};
        bookNames.forEach(b => {
          initBooks[b] = 0;
        });
        locationMap[key] = {
          country,
          region,
          books: initBooks,
          totalStudied: 0
        };
      }

      const tableData = sub.data[FIELD_RUHI_MCA];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8" || label === "Libro 8") label = "Libro 8";
          else if (label === "L9" || label === "Libro 9") label = "Libro 9";
          else if (label === "L10" || label === "Libro 10") label = "Libro 10";
          else if (label === "L11" || label === "Libro 11") label = "Libro 11";
          else if (label === "L12" || label === "Libro 12") label = "Libro 12";
          else if (label === "L13" || label === "Libro 13") label = "Libro 13";
          else if (label === "L14" || label === "Libro 14") label = "Libro 14";

          if (bookNames.includes(label)) {
            const u1 = row["U1"];
            const u2 = row["U2"];
            const u3 = row["U3"];
            const hasStudied = 
              u1 === "Completado" || u1 === "En Proceso" ||
              u2 === "Completado" || u2 === "En Proceso" ||
              u3 === "Completado" || u3 === "En Proceso";

            if (hasStudied) {
              locationMap[key].books[label]++;
              locationMap[key].totalStudied++;
            }
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const mcaRuhiStudiedByLocationStats = getMcaRuhiStudiedByLocationStats();

  // Obtener los totales de Libros En Proceso agrupados por País y Región para los MCAs
  const getMcaRuhiStudyingByLocationStats = () => {
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      books: Record<string, { total: number; u1: number; u2: number; u3: number }>;
      totalStudying: number;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initBooks: Record<string, { total: number; u1: number; u2: number; u3: number }> = {};
        bookNames.forEach(b => {
          initBooks[b] = { total: 0, u1: 0, u2: 0, u3: 0 };
        });
        locationMap[key] = {
          country,
          region,
          books: initBooks,
          totalStudying: 0
        };
      }

      const tableData = sub.data[FIELD_RUHI_MCA];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8" || label === "Libro 8") label = "Libro 8";
          else if (label === "L9" || label === "Libro 9") label = "Libro 9";
          else if (label === "L10" || label === "Libro 10") label = "Libro 10";
          else if (label === "L11" || label === "Libro 11") label = "Libro 11";
          else if (label === "L12" || label === "Libro 12") label = "Libro 12";
          else if (label === "L13" || label === "Libro 13") label = "Libro 13";
          else if (label === "L14" || label === "Libro 14") label = "Libro 14";

          if (bookNames.includes(label)) {
            let isStudying = false;
            let subU1 = 0;
            let subU2 = 0;
            let subU3 = 0;

            if (row["U1"] === "En Proceso") {
              isStudying = true;
              subU1 = 1;
            }
            if (row["U2"] === "En Proceso") {
              isStudying = true;
              subU2 = 1;
            }
            if (row["U3"] === "En Proceso") {
              isStudying = true;
              subU3 = 1;
            }

            if (isStudying) {
              locationMap[key].books[label].total++;
              locationMap[key].books[label].u1 += subU1;
              locationMap[key].books[label].u2 += subU2;
              locationMap[key].books[label].u3 += subU3;
              locationMap[key].totalStudying++;
            }
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const mcaRuhiStudyingByLocationStats = getMcaRuhiStudyingByLocationStats();

  // Helper para unificar completados y en proceso con análisis de periodo previo para Ruhí
  const getMcaRuhiStatsByLocationForSubs = (subsList: Submission[]) => {
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      booksCompleted: Record<string, { total: number; u1: number; u2: number; u3: number }>;
      booksStudying: Record<string, { total: number; u1: number; u2: number; u3: number }>;
    }> = {};

    subsList.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initBooksCompleted: Record<string, { total: number; u1: number; u2: number; u3: number }> = {};
        const initBooksStudying: Record<string, { total: number; u1: number; u2: number; u3: number }> = {};
        bookNames.forEach(b => {
          initBooksCompleted[b] = { total: 0, u1: 0, u2: 0, u3: 0 };
          initBooksStudying[b] = { total: 0, u1: 0, u2: 0, u3: 0 };
        });
        locationMap[key] = {
          country,
          region,
          booksCompleted: initBooksCompleted,
          booksStudying: initBooksStudying,
        };
      }

      const tableData = sub.data[FIELD_RUHI_MCA];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8" || label === "Libro 8") label = "Libro 8";
          else if (label === "L9" || label === "Libro 9") label = "Libro 9";
          else if (label === "L10" || label === "Libro 10") label = "Libro 10";
          else if (label === "L11" || label === "Libro 11") label = "Libro 11";
          else if (label === "L12" || label === "Libro 12") label = "Libro 12";
          else if (label === "L13" || label === "Libro 13") label = "Libro 13";
          else if (label === "L14" || label === "Libro 14") label = "Libro 14";

          if (bookNames.includes(label)) {
            // Completados
            let isCompleted = false;
            let subU1Comp = 0, subU2Comp = 0, subU3Comp = 0;
            if (row["U1"] === "Completado") { isCompleted = true; subU1Comp = 1; }
            if (row["U2"] === "Completado") { isCompleted = true; subU2Comp = 1; }
            if (row["U3"] === "Completado") { isCompleted = true; subU3Comp = 1; }
            if (isCompleted) {
              locationMap[key].booksCompleted[label].total++;
              locationMap[key].booksCompleted[label].u1 += subU1Comp;
              locationMap[key].booksCompleted[label].u2 += subU2Comp;
              locationMap[key].booksCompleted[label].u3 += subU3Comp;
            }

            // En proceso
            let isStudying = false;
            let subU1Study = 0, subU2Study = 0, subU3Study = 0;
            if (row["U1"] === "En Proceso") { isStudying = true; subU1Study = 1; }
            if (row["U2"] === "En Proceso") { isStudying = true; subU2Study = 1; }
            if (row["U3"] === "En Proceso") { isStudying = true; subU3Study = 1; }
            if (isStudying) {
              locationMap[key].booksStudying[label].total++;
              locationMap[key].booksStudying[label].u1 += subU1Study;
              locationMap[key].booksStudying[label].u2 += subU2Study;
              locationMap[key].booksStudying[label].u3 += subU3Study;
            }
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) return a.country.localeCompare(b.country);
      return a.region.localeCompare(b.region);
    });
  };

  const currentMcaRuhiStats = React.useMemo(() => {
    return getMcaRuhiStatsByLocationForSubs(latestSubmissions);
  }, [latestSubmissions]);

  const uniqueDatesSortedForRuhi = React.useMemo(() => {
    const datesSet = new Set<string>();
    filteredSubs.forEach(sub => {
      const dStr = getSubDateValue(sub);
      if (dStr) datesSet.add(dStr);
    });
    return Array.from(datesSet).sort((a, b) => {
      return parseFormDate(a).getTime() - parseFormDate(b).getTime();
    });
  }, [filteredSubs, dateFieldId]);

  const previousMcaRuhiStats = React.useMemo(() => {
    const prevDate = uniqueDatesSortedForRuhi.length >= 2 ? uniqueDatesSortedForRuhi[uniqueDatesSortedForRuhi.length - 2] : null;
    const prevSubs = prevDate ? getLatestSubmissionsByEmailUpToDate(filteredSubs, prevDate) : [];
    return getMcaRuhiStatsByLocationForSubs(prevSubs);
  }, [filteredSubs, uniqueDatesSortedForRuhi]);

  const { currentBookCompleted, currentBookStudying, prevBookCompleted, prevBookStudying } = React.useMemo(() => {
    let currentCompletedSum = 0;
    let currentStudyingSum = 0;
    currentMcaRuhiStats.forEach(loc => {
      const bookComp = loc.booksCompleted[selectedRuhiBookTab];
      const bookStudy = loc.booksStudying[selectedRuhiBookTab];
      if (bookComp) currentCompletedSum += bookComp.total;
      if (bookStudy) currentStudyingSum += bookStudy.total;
    });

    let prevCompletedSum = 0;
    let prevStudyingSum = 0;
    previousMcaRuhiStats.forEach(loc => {
      const bookComp = loc.booksCompleted[selectedRuhiBookTab];
      const bookStudy = loc.booksStudying[selectedRuhiBookTab];
      if (bookComp) prevCompletedSum += bookComp.total;
      if (bookStudy) prevStudyingSum += bookStudy.total;
    });

    return {
      currentBookCompleted: currentCompletedSum,
      currentBookStudying: currentStudyingSum,
      prevBookCompleted: prevCompletedSum,
      prevBookStudying: prevStudyingSum,
    };
  }, [currentMcaRuhiStats, previousMcaRuhiStats, selectedRuhiBookTab]);

  const bookUnitTotals = React.useMemo(() => {
    let u1Comp = 0, u2Comp = 0, u3Comp = 0;
    let u1Study = 0, u2Study = 0, u3Study = 0;

    currentMcaRuhiStats.forEach(loc => {
      const comp = loc.booksCompleted[selectedRuhiBookTab];
      const study = loc.booksStudying[selectedRuhiBookTab];
      if (comp) {
        u1Comp += comp.u1;
        u2Comp += comp.u2;
        u3Comp += comp.u3;
      }
      if (study) {
        u1Study += study.u1;
        u2Study += study.u2;
        u3Study += study.u3;
      }
    });

    let prevU1Comp = 0, prevU2Comp = 0, prevU3Comp = 0;
    let prevU1Study = 0, prevU2Study = 0, prevU3Study = 0;
    previousMcaRuhiStats.forEach(loc => {
      const comp = loc.booksCompleted[selectedRuhiBookTab];
      const study = loc.booksStudying[selectedRuhiBookTab];
      if (comp) {
        prevU1Comp += comp.u1;
        prevU2Comp += comp.u2;
        prevU3Comp += comp.u3;
      }
      if (study) {
        prevU1Study += study.u1;
        prevU2Study += study.u2;
        prevU3Study += study.u3;
      }
    });

    return {
      u1Comp, u2Comp, u3Comp,
      u1Study, u2Study, u3Study,
      diffU1Comp: u1Comp - prevU1Comp,
      diffU2Comp: u2Comp - prevU2Comp,
      diffU3Comp: u3Comp - prevU3Comp,
      diffU1Study: u1Study - prevU1Study,
      diffU2Study: u2Study - prevU2Study,
      diffU3Study: u3Study - prevU3Study,
    };
  }, [currentMcaRuhiStats, previousMcaRuhiStats, selectedRuhiBookTab]);

  const filteredMcaRuhiStats = React.useMemo(() => {
    let stats = currentMcaRuhiStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      stats = stats.filter(
        loc => loc.country.toLowerCase().includes(q) || loc.region.toLowerCase().includes(q)
      );
    }
    return stats;
  }, [currentMcaRuhiStats, tableSearch]);

  const filteredBookUnitTotals = React.useMemo(() => {
    let u1Comp = 0, u2Comp = 0, u3Comp = 0;
    let u1Study = 0, u2Study = 0, u3Study = 0;

    filteredMcaRuhiStats.forEach(loc => {
      const comp = loc.booksCompleted[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
      const study = loc.booksStudying[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
      u1Comp += comp.u1;
      u2Comp += comp.u2;
      u3Comp += comp.u3;
      u1Study += study.u1;
      u2Study += study.u2;
      u3Study += study.u3;
    });

    let prevU1Comp = 0, prevU2Comp = 0, prevU3Comp = 0;
    let prevU1Study = 0, prevU2Study = 0, prevU3Study = 0;
    
    let prevStats = previousMcaRuhiStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      prevStats = prevStats.filter(
        loc => loc.country.toLowerCase().includes(q) || loc.region.toLowerCase().includes(q)
      );
    }

    prevStats.forEach(loc => {
      const comp = loc.booksCompleted[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
      const study = loc.booksStudying[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
      prevU1Comp += comp.u1;
      prevU2Comp += comp.u2;
      prevU3Comp += comp.u3;
      prevU1Study += study.u1;
      prevU2Study += study.u2;
      prevU3Study += study.u3;
    });

    return {
      u1Comp, u2Comp, u3Comp,
      u1Study, u2Study, u3Study,
      filteredMcaTotal: latestSubmissions.filter(sub => {
        if (!tableSearch.trim()) return true;
        const q = tableSearch.toLowerCase().trim();
        const country = sub.userCountry?.toLowerCase() || "";
        const region = sub.userRegion?.toLowerCase() || "";
        return country.includes(q) || region.includes(q);
      }).length,
      compTotal: u1Comp + u2Comp + u3Comp,
      studyTotal: u1Study + u2Study + u3Study,
      diffU1Comp: u1Comp - prevU1Comp,
      diffU2Comp: u2Comp - prevU2Comp,
      diffU3Comp: u3Comp - prevU3Comp,
      diffU1Study: u1Study - prevU1Study,
      diffU2Study: u2Study - prevU2Study,
      diffU3Study: u3Study - prevU3Study,
      diffCompTotal: (u1Comp + u2Comp + u3Comp) - (prevU1Comp + prevU2Comp + prevU3Comp),
      diffStudyTotal: (u1Study + u2Study + u3Study) - (prevU1Study + prevU2Study + prevU3Study),
    };
  }, [filteredMcaRuhiStats, previousMcaRuhiStats, selectedRuhiBookTab, tableSearch, latestSubmissions]);

  // Helper para unificar completados y en proceso con análisis de periodo previo para Ruhí en Ayudantes
  const getHelpersRuhiStatsByLocationForSubs = (subsList: Submission[]) => {
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      booksCompleted: Record<string, { total: number; u1: number; u2: number; u3: number }>;
      booksStudying: Record<string, { total: number; u1: number; u2: number; u3: number }>;
    }> = {};

    subsList.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initBooksCompleted: Record<string, { total: number; u1: number; u2: number; u3: number }> = {};
        const initBooksStudying: Record<string, { total: number; u1: number; u2: number; u3: number }> = {};
        bookNames.forEach(b => {
          initBooksCompleted[b] = { total: 0, u1: 0, u2: 0, u3: 0 };
          initBooksStudying[b] = { total: 0, u1: 0, u2: 0, u3: 0 };
        });
        locationMap[key] = {
          country,
          region,
          booksCompleted: initBooksCompleted,
          booksStudying: initBooksStudying,
        };
      }

      const tableData = sub.data[FIELD_AYUDANTES_RUHI];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8" || label === "Libro 8") label = "Libro 8";
          else if (label === "L9" || label === "Libro 9") label = "Libro 9";
          else if (label === "L10" || label === "Libro 10") label = "Libro 10";
          else if (label === "L11" || label === "Libro 11") label = "Libro 11";
          else if (label === "L12" || label === "Libro 12") label = "Libro 12";
          else if (label === "L13" || label === "Libro 13") label = "Libro 13";
          else if (label === "L14" || label === "Libro 14") label = "Libro 14";

          if (bookNames.includes(label)) {
            let compTotal = 0, compU1 = 0, compU2 = 0, compU3 = 0;
            let studyTotal = 0, studyU1 = 0, studyU2 = 0, studyU3 = 0;

            Object.keys(row).forEach(k => {
              if (k !== "_rowLabel") {
                const val = Number(row[k]) || 0;
                const kLower = k.toLowerCase();
                const isCompleted = kLower.includes("completado");
                const isStudying = kLower.includes("estudiando") || kLower.includes("proceso");

                if (isCompleted) {
                  compTotal += val;
                  if (kLower.includes("u1") || kLower.includes("unidad 1") || kLower.includes("unidad1")) {
                    compU1 += val;
                  }
                  if (kLower.includes("u2") || kLower.includes("unidad 2") || kLower.includes("unidad2")) {
                    compU2 += val;
                  }
                  if (kLower.includes("u3") || kLower.includes("unidad 3") || kLower.includes("unidad3")) {
                    compU3 += val;
                  }
                } else if (isStudying) {
                  studyTotal += val;
                  if (kLower.includes("u1") || kLower.includes("unidad 1") || kLower.includes("unidad1")) {
                    studyU1 += val;
                  }
                  if (kLower.includes("u2") || kLower.includes("unidad 2") || kLower.includes("unidad2")) {
                    studyU2 += val;
                  }
                  if (kLower.includes("u3") || kLower.includes("unidad 3") || kLower.includes("unidad3")) {
                    studyU3 += val;
                  }
                }
              }
            });

            if (compTotal > 0) {
              locationMap[key].booksCompleted[label].total += compTotal;
              locationMap[key].booksCompleted[label].u1 += compU1;
              locationMap[key].booksCompleted[label].u2 += compU2;
              locationMap[key].booksCompleted[label].u3 += compU3;
            }
            if (studyTotal > 0) {
              locationMap[key].booksStudying[label].total += studyTotal;
              locationMap[key].booksStudying[label].u1 += studyU1;
              locationMap[key].booksStudying[label].u2 += studyU2;
              locationMap[key].booksStudying[label].u3 += studyU3;
            }
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) return a.country.localeCompare(b.country);
      return a.region.localeCompare(b.region);
    });
  };

  const currentHelperRuhiStatsByLocation = React.useMemo(() => {
    return getHelpersRuhiStatsByLocationForSubs(latestSubmissions);
  }, [latestSubmissions]);

  const previousHelperRuhiStatsByLocation = React.useMemo(() => {
    const prevDate = uniqueDatesSortedForRuhi.length >= 2 ? uniqueDatesSortedForRuhi[uniqueDatesSortedForRuhi.length - 2] : null;
    const prevSubs = prevDate ? getLatestSubmissionsByEmailUpToDate(filteredSubs, prevDate) : [];
    return getHelpersRuhiStatsByLocationForSubs(prevSubs);
  }, [filteredSubs, uniqueDatesSortedForRuhi]);

  const { currentHelperBookCompleted, currentHelperBookStudying, prevHelperBookCompleted, prevHelperBookStudying } = React.useMemo(() => {
    let currentCompletedSum = 0;
    let currentStudyingSum = 0;
    currentHelperRuhiStatsByLocation.forEach(loc => {
      const bookComp = loc.booksCompleted[selectedRuhiBookTab];
      const bookStudy = loc.booksStudying[selectedRuhiBookTab];
      if (bookComp) currentCompletedSum += bookComp.total;
      if (bookStudy) currentStudyingSum += bookStudy.total;
    });

    let prevCompletedSum = 0;
    let prevStudyingSum = 0;
    previousHelperRuhiStatsByLocation.forEach(loc => {
      const bookComp = loc.booksCompleted[selectedRuhiBookTab];
      const bookStudy = loc.booksStudying[selectedRuhiBookTab];
      if (bookComp) prevCompletedSum += bookComp.total;
      if (bookStudy) prevStudyingSum += bookStudy.total;
    });

    return {
      currentHelperBookCompleted: currentCompletedSum,
      currentHelperBookStudying: currentStudyingSum,
      prevHelperBookCompleted: prevCompletedSum,
      prevHelperBookStudying: prevStudyingSum,
    };
  }, [currentHelperRuhiStatsByLocation, previousHelperRuhiStatsByLocation, selectedRuhiBookTab]);

  const filteredHelperRuhiStatsByLocation = React.useMemo(() => {
    let stats = currentHelperRuhiStatsByLocation;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      stats = stats.filter(
        loc => loc.country.toLowerCase().includes(q) || loc.region.toLowerCase().includes(q)
      );
    }
    return stats;
  }, [currentHelperRuhiStatsByLocation, tableSearch]);

  const filteredHelperBookUnitTotals = React.useMemo(() => {
    let u1Comp = 0, u2Comp = 0, u3Comp = 0;
    let u1Study = 0, u2Study = 0, u3Study = 0;

    filteredHelperRuhiStatsByLocation.forEach(loc => {
      const comp = loc.booksCompleted[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
      const study = loc.booksStudying[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
      u1Comp += comp.u1;
      u2Comp += comp.u2;
      u3Comp += comp.u3;
      u1Study += study.u1;
      u2Study += study.u2;
      u3Study += study.u3;
    });

    let prevU1Comp = 0, prevU2Comp = 0, prevU3Comp = 0;
    let prevU1Study = 0, prevU2Study = 0, prevU3Study = 0;
    
    let prevStats = previousHelperRuhiStatsByLocation;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      prevStats = prevStats.filter(
        loc => loc.country.toLowerCase().includes(q) || loc.region.toLowerCase().includes(q)
      );
    }

    prevStats.forEach(loc => {
      const comp = loc.booksCompleted[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
      const study = loc.booksStudying[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
      prevU1Comp += comp.u1;
      prevU2Comp += comp.u2;
      prevU3Comp += comp.u3;
      prevU1Study += study.u1;
      prevU2Study += study.u2;
      prevU3Study += study.u3;
    });

    return {
      u1Comp, u2Comp, u3Comp,
      u1Study, u2Study, u3Study,
      filteredHelperTotal: latestSubmissions.filter(sub => {
        if (!tableSearch.trim()) return true;
        const q = tableSearch.toLowerCase().trim();
        const country = sub.userCountry?.toLowerCase() || "";
        const region = sub.userRegion?.toLowerCase() || "";
        return country.includes(q) || region.includes(q);
      }).length,
      compTotal: u1Comp + u2Comp + u3Comp,
      studyTotal: u1Study + u2Study + u3Study,
      diffU1Comp: u1Comp - prevU1Comp,
      diffU2Comp: u2Comp - prevU2Comp,
      diffU3Comp: u3Comp - prevU3Comp,
      diffU1Study: u1Study - prevU1Study,
      diffU2Study: u2Study - prevU2Study,
      diffU3Study: u3Study - prevU3Study,
      diffCompTotal: (u1Comp + u2Comp + u3Comp) - (prevU1Comp + prevU2Comp + prevU3Comp),
      diffStudyTotal: (u1Study + u2Study + u3Study) - (prevU1Study + prevU2Study + prevU3Study),
    };
  }, [filteredHelperRuhiStatsByLocation, previousHelperRuhiStatsByLocation, selectedRuhiBookTab, tableSearch, latestSubmissions]);

  // Cuántos MCAs han estudiado la carta de salud espiritual de Jan 1 2016
  const mcaStudiedLetterCount = latestSubmissions.filter(sub => {
    const val = sub.data[FIELD_ESTUDIO_CARTA];
    if (Array.isArray(val)) {
      return val.includes("Si") || val.includes("Sí") || val.includes("SÍ");
    }
    return val === "Si" || val === "Sí" || val === "SÍ";
  }).length;

  const mcaLetterPercent = mcaTotalWithSubmissions > 0 ? Math.round((mcaStudiedLetterCount / mcaTotalWithSubmissions) * 100) : 0;

  // Historic accumulation of MCAs who have studied the letter
  const mcaLetterHistoryData = React.useMemo(() => {
    if (!filteredSubs || filteredSubs.length === 0) return [];

    // Get all unique dates from filteredSubs
    const datesSet = new Set<string>();
    filteredSubs.forEach(sub => {
      const dStr = getSubDateValue(sub);
      if (dStr) datesSet.add(dStr);
    });

    const uniqueDatesSorted = Array.from(datesSet).sort((a, b) => {
      return parseFormDate(a).getTime() - parseFormDate(b).getTime();
    });

    if (uniqueDatesSorted.length === 0) return [];

    const formatShortDate = (dateStr: string) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
      }
      if (/^\d{4}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "-01T00:00:00").toLocaleDateString("es-ES", { month: "short", year: "numeric" });
      }
      return dateStr;
    };

    // Calculate accumulation up to each date
    return uniqueDatesSorted.map(dateStr => {
      // Find latest submissions up to this date
      const subsUpToDate = getLatestSubmissionsByEmailUpToDate(filteredSubs, dateStr);
      
      const count = subsUpToDate.filter(sub => {
        const val = sub.data[FIELD_ESTUDIO_CARTA];
        if (Array.isArray(val)) {
          return val.includes("Si") || val.includes("Sí") || val.includes("SÍ");
        }
        return val === "Si" || val === "Sí" || val === "SÍ";
      }).length;

      return {
        date: dateStr,
        label: formatShortDate(dateStr),
        count: count,
      };
    });
  }, [filteredSubs, dateFieldId]);

  // Relatos de Salud Espiritual estudiados por MCAs
  const getMcaStoriesStats = () => {
    const storyCounts: Record<string, number> = {};
    const storyNames = ["Orchard", "San Pedro", "Batula", "Bramour", "Miramar"];
    storyNames.forEach(s => { storyCounts[s] = 0; });

    latestSubmissions.forEach(sub => {
      const val = sub.data[FIELD_MCA_RELATOS];
      if (Array.isArray(val)) {
        val.forEach((story: string) => {
          if (storyCounts[story] !== undefined) {
            storyCounts[story]++;
          }
        });
      } else if (typeof val === "string") {
        if (storyCounts[val] !== undefined) {
          storyCounts[val]++;
        }
      }
    });

    return Object.entries(storyCounts).map(([story, count]) => ({ story, count }));
  };

  const mcaStories = getMcaStoriesStats();

  const mcaStoriesPercentage = React.useMemo(() => {
    return mcaStories.map(item => ({
      ...item,
      percent: mcaTotalWithSubmissions > 0 ? Math.round((item.count / mcaTotalWithSubmissions) * 100) : 0
    }));
  }, [mcaStories, mcaTotalWithSubmissions]);

  // Obtener los totales de Relatos Estudiados agrupados por País y Región para los MCAs
  const getMcaStoriesByLocationStatsForSubs = (subs: typeof latestSubmissions) => {
    const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      stories: Record<string, number>;
      totalStories: number;
    }> = {};

    subs.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initStories: Record<string, number> = {};
        storyNames.forEach(s => {
          initStories[s] = 0;
        });
        locationMap[key] = {
          country,
          region,
          stories: initStories,
          totalStories: 0
        };
      }

      const val = sub.data[FIELD_MCA_RELATOS];
      if (Array.isArray(val)) {
        val.forEach((story: string) => {
          if (storyNames.includes(story)) {
            locationMap[key].stories[story]++;
            locationMap[key].totalStories++;
          }
        });
      } else if (typeof val === "string") {
        if (storyNames.includes(val)) {
          locationMap[key].stories[val]++;
          locationMap[key].totalStories++;
        }
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const mcaStoriesByLocationStats = React.useMemo(() => {
    return getMcaStoriesByLocationStatsForSubs(latestSubmissions);
  }, [latestSubmissions]);

  const previousMcaStoriesByLocationStats = React.useMemo(() => {
    const prevDate = uniqueDatesSortedForRuhi.length >= 2 ? uniqueDatesSortedForRuhi[uniqueDatesSortedForRuhi.length - 2] : null;
    const prevSubs = prevDate ? getLatestSubmissionsByEmailUpToDate(filteredSubs, prevDate) : [];
    return getMcaStoriesByLocationStatsForSubs(prevSubs);
  }, [filteredSubs, uniqueDatesSortedForRuhi]);

  // --- ESTADÍSTICAS DE ESPACIOS DE SALUD PARA CUERPO AUXILIAR (MCA) ---
  const mcaParticipatingCount = React.useMemo(() => {
    return latestSubmissions.filter(sub => {
      const val = sub.data[FIELD_MCA_ESPACIOS];
      if (Array.isArray(val)) {
        return val.includes("Si") || val.includes("Sí") || val.includes("SÍ");
      }
      return val === "Si" || val === "Sí" || val === "SÍ";
    }).length;
  }, [latestSubmissions]);

  const mcaParticipatingPercent = mcaTotalWithSubmissions > 0
    ? Math.round((mcaParticipatingCount / mcaTotalWithSubmissions) * 100)
    : 0;

  const mcaParticipationChartData = React.useMemo(() => {
    const activeVal = mcaParticipatingCount;
    const inactiveVal = Math.max(0, mcaTotalWithSubmissions - mcaParticipatingCount);
    return [
      { name: "Participa", value: activeVal, fill: "#8b5cf6" },
      { name: "No Participa", value: inactiveVal, fill: "#334155" }
    ];
  }, [mcaParticipatingCount, mcaTotalWithSubmissions]);

  const mcaFacilitatingCount = React.useMemo(() => {
    return latestSubmissions.filter(sub => {
      const val = sub.data[FIELD_MCA_FACILITA];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        return val.answer === "Si" || val.answer === "Sí" || val.answer === "SÍ" || val.answer === "yes" || val.answer === "Yes";
      }
      return false;
    }).length;
  }, [latestSubmissions]);

  const mcaFacilitatingPercent = mcaTotalWithSubmissions > 0
    ? Math.round((mcaFacilitatingCount / mcaTotalWithSubmissions) * 100)
    : 0;

  const mcaFacilitationChartData = React.useMemo(() => {
    const activeVal = mcaFacilitatingCount;
    const inactiveVal = Math.max(0, mcaTotalWithSubmissions - mcaFacilitatingCount);
    return [
      { name: "Facilita", value: activeVal, fill: "#3b82f6" },
      { name: "No Facilita", value: inactiveVal, fill: "#334155" }
    ];
  }, [mcaFacilitatingCount, mcaTotalWithSubmissions]);

  const mcaFacilitationRegularities = React.useMemo(() => {
    const regularityCounts: Record<string, number> = {
      "Sin espacio facilitado": Math.max(0, mcaTotalWithSubmissions - mcaFacilitatingCount),
      "Cada año": 0,
      "Cada 6 meses": 0,
      "Cada 3 meses": 0,
      "Cada mes": 0,
      "Cada semana": 0
    };
    
    latestSubmissions.forEach(sub => {
      const val = sub.data[FIELD_MCA_FACILITA];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const isFacilitating = val.answer === "Si" || val.answer === "Sí" || val.answer === "SÍ" || val.answer === "yes" || val.answer === "Yes";
        if (isFacilitating && val.justification && typeof val.justification === "string" && val.justification.trim() !== "") {
          const normReg = val.justification.trim();
          let stdReg = normReg;
          if (normReg.toLowerCase() === "cada semana" || normReg.toLowerCase() === "semanal") stdReg = "Cada semana";
          else if (normReg.toLowerCase() === "cada mes" || normReg.toLowerCase() === "mensual") stdReg = "Cada mes";
          else if (normReg.toLowerCase() === "cada 3 meses" || normReg.toLowerCase() === "trimestral") stdReg = "Cada 3 meses";
          else if (normReg.toLowerCase() === "cada 6 meses" || normReg.toLowerCase() === "semestral") stdReg = "Cada 6 meses";
          else if (normReg.toLowerCase() === "cada año" || normReg.toLowerCase() === "anual") stdReg = "Cada año";
          
          if (stdReg in regularityCounts) {
            regularityCounts[stdReg] = (regularityCounts[stdReg] || 0) + 1;
          }
        }
      }
    });

    const ORDERED_CATEGORIES = [
      "Sin espacio facilitado",
      "Cada año",
      "Cada 6 meses",
      "Cada 3 meses",
      "Cada mes",
      "Cada semana"
    ];

    return ORDERED_CATEGORIES.map(category => ({
      regularity: category,
      count: regularityCounts[category] || 0
    }));
  }, [latestSubmissions, mcaTotalWithSubmissions, mcaFacilitatingCount]);

  const mcaFacilitationRegularitiesWithPercentages = React.useMemo(() => {
    const total = mcaFacilitationRegularities.reduce((sum, item) => sum + item.count, 0);
    return mcaFacilitationRegularities.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));
  }, [mcaFacilitationRegularities]);

  const mcaSpacesTimelineData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01";
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    return sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      const periodLatestSubs = getLatestSubmissionsByEmail(subs);

      const participating = periodLatestSubs.filter(sub => {
        const val = sub.data[FIELD_MCA_ESPACIOS];
        if (Array.isArray(val)) {
          return val.includes("Si") || val.includes("Sí") || val.includes("SÍ");
        }
        return val === "Si" || val === "Sí" || val === "SÍ";
      }).length;

      const facilitating = periodLatestSubs.filter(sub => {
        const val = sub.data[FIELD_MCA_FACILITA];
        if (val && typeof val === "object" && !Array.isArray(val)) {
          return val.answer === "Si" || val.answer === "Sí" || val.answer === "SÍ" || val.answer === "yes" || val.answer === "Yes";
        }
        return false;
      }).length;

      return {
        fechaKey: dateKey,
        fecha: formatDisplayDate(dateKey),
        participating,
        facilitating,
        total: periodLatestSubs.length
      };
    });
  }, [filteredSubs, dateFieldId]);

  const mcaSpacesTrendStats = React.useMemo(() => {
    const data = mcaSpacesTimelineData;
    const len = data.length;

    const defaultStats = {
      participating: {
        recentChange: 0,
        recentDirection: "none" as "up" | "down" | "none",
        totalChange: 0,
        totalDirection: "none" as "up" | "down" | "none",
        firstVal: 0,
        lastVal: 0,
        prevVal: 0
      },
      facilitating: {
        recentChange: 0,
        recentDirection: "none" as "up" | "down" | "none",
        totalChange: 0,
        totalDirection: "none" as "up" | "down" | "none",
        firstVal: 0,
        lastVal: 0,
        prevVal: 0
      }
    };

    if (len === 0) return defaultStats;

    const firstPoint = data[0];
    const lastPoint = data[len - 1];
    const prevPoint = len >= 2 ? data[len - 2] : firstPoint;

    // 1. Participation
    const partRecentChange = lastPoint.participating - prevPoint.participating;
    const partTotalChange = lastPoint.participating - firstPoint.participating;
    
    let partRecentDir: "up" | "down" | "none" = "none";
    if (partRecentChange > 0) partRecentDir = "up";
    else if (partRecentChange < 0) partRecentDir = "down";

    let partTotalDir: "up" | "down" | "none" = "none";
    if (partTotalChange > 0) partTotalDir = "up";
    else if (partTotalChange < 0) partTotalDir = "down";

    // 2. Facilitation
    const facRecentChange = lastPoint.facilitating - prevPoint.facilitating;
    const facTotalChange = lastPoint.facilitating - firstPoint.facilitating;

    let facRecentDir: "up" | "down" | "none" = "none";
    if (facRecentChange > 0) facRecentDir = "up";
    else if (facRecentChange < 0) facRecentDir = "down";

    let facTotalDir: "up" | "down" | "none" = "none";
    if (facTotalChange > 0) facTotalDir = "up";
    else if (facTotalChange < 0) facTotalDir = "down";

    return {
      participating: {
        recentChange: partRecentChange,
        recentDirection: partRecentDir,
        totalChange: partTotalChange,
        totalDirection: partTotalDir,
        firstVal: firstPoint.participating,
        lastVal: lastPoint.participating,
        prevVal: prevPoint.participating
      },
      facilitating: {
        recentChange: facRecentChange,
        recentDirection: facRecentDir,
        totalChange: facTotalChange,
        totalDirection: facTotalDir,
        firstVal: firstPoint.facilitating,
        lastVal: lastPoint.facilitating,
        prevVal: prevPoint.facilitating
      }
    };
  }, [mcaSpacesTimelineData]);

  const mcaSpacesTableData = React.useMemo(() => {
    return latestSubmissions.map(sub => {
      const user = dbUsers.find(u => u.email.toLowerCase() === sub.userEmail.toLowerCase());
      const name = user ? user.name : sub.userEmail;

      const participatesVal = sub.data[FIELD_MCA_ESPACIOS];
      let participates = false;
      if (Array.isArray(participatesVal)) {
        participates = participatesVal.includes("Si") || participatesVal.includes("Sí") || participatesVal.includes("SÍ");
      } else {
        participates = participatesVal === "Si" || participatesVal === "Sí" || participatesVal === "SÍ";
      }

      const facilitatesVal = sub.data[FIELD_MCA_FACILITA];
      let facilitates = false;
      let regularity = "-";
      if (facilitatesVal && typeof facilitatesVal === "object" && !Array.isArray(facilitatesVal)) {
        facilitates = facilitatesVal.answer === "Si" || facilitatesVal.answer === "Sí" || facilitatesVal.answer === "SÍ" || facilitatesVal.answer === "yes" || facilitatesVal.answer === "Yes";
        regularity = facilitatesVal.justification || "-";
      }

      let formDate = "No registrada";
      if (dateFieldId && sub.data[dateFieldId]) {
        formDate = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          formDate = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          formDate = sub.submittedAt.split("T")[0];
        }
      }

      return {
        email: sub.userEmail,
        name,
        country: sub.userCountry || user?.country || "Desconocido",
        region: sub.userRegion || user?.region || "N/A",
        participates,
        facilitates,
        regularity,
        formDate
      };
    });
  }, [latestSubmissions, dbUsers, dateFieldId]);

  // Agrupar la participación y facilitación de espacios de salud por país y región
  const mcaSpacesByLocationStats = React.useMemo(() => {
    const locationMap: Record<string, {
      country: string;
      region: string;
      totalMcas: number;
      participatesCount: number;
      facilitatesCount: number;
    }> = {};

    mcaSpacesTableData.forEach(row => {
      const country = row.country || "Desconocido";
      const region = row.region || "N/A";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        locationMap[key] = {
          country,
          region,
          totalMcas: 0,
          participatesCount: 0,
          facilitatesCount: 0
        };
      }

      locationMap[key].totalMcas++;
      if (row.participates) {
        locationMap[key].participatesCount++;
      }
      if (row.facilitates) {
        locationMap[key].facilitatesCount++;
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  }, [mcaSpacesTableData]);

  // ==========================================
  // CÁLCULO DE MÉTRICAS: 2. AYUDANTES (ASSISTANTS)
  // ==========================================
  // Identificar la última fecha registrada en los envíos para filtrar al último periodo
  const lastPeriodDate = React.useMemo(() => {
    if (!filteredSubs || filteredSubs.length === 0) return null;
    const datesSet = new Set<string>();
    filteredSubs.forEach(sub => {
      const dStr = getSubDateValue(sub);
      if (dStr) datesSet.add(dStr);
    });
    const uniqueDatesSorted = Array.from(datesSet).sort((a, b) => {
      return parseFormDate(a).getTime() - parseFormDate(b).getTime();
    });
    return uniqueDatesSorted[uniqueDatesSorted.length - 1] || null;
  }, [filteredSubs, dateFieldId]);

  // Suma de ayudantes nombrados por MCAs en el área seleccionada (acumulado total)
  const helpersTotalNamed = latestSubmissions.reduce((sum, sub) => {
    const num = Number(sub.data[FIELD_AYUDANTES_NOMBRADOS]);
    return isNaN(num) ? sum : sum + num;
  }, 0);

  // Ayudantes de protección nombrados
  const helpersProtectionCount = latestSubmissions.reduce((sum, sub) => {
    const valObj = sub.data[FIELD_AYUDANTES_PROTECCION];
    if (valObj && typeof valObj === "object") {
      const ans = valObj.answer;
      if (ans === "Sí" || ans === "Si") {
        // En este formulario, para "Sí", se registra la cantidad numérica en el campo justification
        const num = Number(valObj.justification);
        return sum + (isNaN(num) ? 1 : num);
      }
    } else if (valObj === "Sí" || valObj === "Si") {
      return sum + 1;
    }
    return sum;
  }, 0);

  // Ayudantes que estudiaron la carta 1 Ene 2016 en el último periodo únicamente
  const helpersStudiedLetterTotal = React.useMemo(() => {
    const lastPeriodSubs = latestSubmissions.filter(sub => {
      const dStr = getSubDateValue(sub);
      return dStr === lastPeriodDate;
    });
    return lastPeriodSubs.reduce((sum, sub) => {
      const num = Number(sub.data[FIELD_AYUDANTES_CARTA]);
      return isNaN(num) ? sum : sum + num;
    }, 0);
  }, [latestSubmissions, lastPeriodDate, dateFieldId]);

  // Ayudantes en espacios de estudio y cuántos facilitados
  const helpersStudiedInSpaces = latestSubmissions.reduce((sum, sub) => {
    const num = Number(sub.data[FIELD_AYUDANTES_ESPACIOS]);
    return isNaN(num) ? sum : sum + num;
  }, 0);

  const spacesFacilitatedByHelpers = latestSubmissions.reduce((sum, sub) => {
    const num = Number(sub.data[FIELD_AYUDANTES_FACILITADOS]);
    return isNaN(num) ? sum : sum + num;
  }, 0);

  // Ayudantes nombrados en el último periodo únicamente
  const helpersTotalNamedLastPeriod = React.useMemo(() => {
    const lastPeriodSubs = latestSubmissions.filter(sub => {
      const dStr = getSubDateValue(sub);
      return dStr === lastPeriodDate;
    });
    return lastPeriodSubs.reduce((sum, sub) => {
      const num = Number(sub.data[FIELD_AYUDANTES_NOMBRADOS]);
      return isNaN(num) ? sum : sum + num;
    }, 0);
  }, [latestSubmissions, lastPeriodDate, dateFieldId]);

  const helpersLetterPercent = helpersTotalNamedLastPeriod > 0 ? Math.round((helpersStudiedLetterTotal / helpersTotalNamedLastPeriod) * 100) : 0;

  // Historic accumulation of helpers who have studied the letter
  const helpersLetterHistoryData = React.useMemo(() => {
    if (!filteredSubs || filteredSubs.length === 0) return [];

    const datesSet = new Set<string>();
    filteredSubs.forEach(sub => {
      const dStr = getSubDateValue(sub);
      if (dStr) datesSet.add(dStr);
    });

    const uniqueDatesSorted = Array.from(datesSet).sort((a, b) => {
      return parseFormDate(a).getTime() - parseFormDate(b).getTime();
    });

    if (uniqueDatesSorted.length === 0) return [];

    const formatShortDate = (dateStr: string) => {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" });
      }
      if (/^\d{4}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "-01T00:00:00").toLocaleDateString("es-ES", { month: "short", year: "numeric" });
      }
      return dateStr;
    };

    return uniqueDatesSorted.map(dateStr => {
      const subsUpToDate = getLatestSubmissionsByEmailUpToDate(filteredSubs, dateStr);
      
      const count = subsUpToDate.reduce((sum, sub) => {
        const num = Number(sub.data[FIELD_AYUDANTES_CARTA]);
        return isNaN(num) ? sum : sum + num;
      }, 0);

      return {
        date: dateStr,
        label: formatShortDate(dateStr),
        count: count,
      };
    });
  }, [filteredSubs, dateFieldId]);

  // Obtener los totales de Relatos Estudiados agrupados por País y Región para los ayudantes
  const getHelperStoriesByLocationStatsForSubs = (subs: typeof latestSubmissions) => {
    const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      stories: Record<string, number>;
      totalStories: number;
    }> = {};

    subs.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initStories: Record<string, number> = {};
        storyNames.forEach(s => {
          initStories[s] = 0;
        });
        locationMap[key] = {
          country,
          region,
          stories: initStories,
          totalStories: 0
        };
      }

      const tableData = sub.data[FIELD_AYUDANTES_RELATOS];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          const story = row._rowLabel || "";
          if (storyNames.includes(story)) {
            const keys = Object.keys(row).filter(k => k !== "_rowLabel");
            keys.forEach(k => {
              const val = Number(row[k]);
              if (!isNaN(val)) {
                locationMap[key].stories[story] += val;
                locationMap[key].totalStories += val;
              }
            });
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const helperStoriesByLocationStats = React.useMemo(() => {
    const currentPeriodSubs = latestSubmissions.filter(sub => {
      const dStr = getSubDateValue(sub);
      return dStr === lastPeriodDate;
    });
    return getHelperStoriesByLocationStatsForSubs(currentPeriodSubs);
  }, [latestSubmissions, lastPeriodDate, dateFieldId]);

  const previousHelperStoriesByLocationStats = React.useMemo(() => {
    const prevDate = uniqueDatesSortedForRuhi.length >= 2 ? uniqueDatesSortedForRuhi[uniqueDatesSortedForRuhi.length - 2] : null;
    const prevSubs = prevDate ? getLatestSubmissionsByEmailUpToDate(filteredSubs, prevDate) : [];
    return getHelperStoriesByLocationStatsForSubs(prevSubs);
  }, [filteredSubs, uniqueDatesSortedForRuhi]);

  // Libros Ruhí por ayudantes (sumatorio por libro y unidades del ÚLTIMO periodo únicamente)
  const getHelpersRuhiStats = () => {
    const bookStats: Record<string, { 
      completed: number; 
      studying: number;
      u1_completed: number;
      u1_studying: number;
      u2_completed: number;
      u2_studying: number;
      u3_completed: number;
      u3_studying: number;
    }> = {};
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    bookNames.forEach(b => { 
      bookStats[b] = { 
        completed: 0, 
        studying: 0,
        u1_completed: 0,
        u1_studying: 0,
        u2_completed: 0,
        u2_studying: 0,
        u3_completed: 0,
        u3_studying: 0,
      }; 
    });

    const lastPeriodSubs = latestSubmissions.filter(sub => {
      const dStr = getSubDateValue(sub);
      return dStr === lastPeriodDate;
    });

    lastPeriodSubs.forEach(sub => {
      const tableData = sub.data[FIELD_AYUDANTES_RUHI];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let rowLabel = row._rowLabel || "";
          if (rowLabel === "L8") rowLabel = "Libro 8";
          if (rowLabel === "L9") rowLabel = "Libro 9";
          if (rowLabel === "L10") rowLabel = "Libro 10";
          if (rowLabel === "L11") rowLabel = "Libro 11";
          if (rowLabel === "L12") rowLabel = "Libro 12";
          if (rowLabel === "L13") rowLabel = "Libro 13";
          if (rowLabel === "L14") rowLabel = "Libro 14";

          if (bookStats[rowLabel] !== undefined) {
            const keys = Object.keys(row);
            keys.forEach(k => {
              const val = Number(row[k]);
              if (!isNaN(val)) {
                const kLower = k.toLowerCase();
                const isCompleted = kLower.includes("completado");
                const isStudying = kLower.includes("estudiando") || kLower.includes("proceso");

                if (isCompleted) {
                  bookStats[rowLabel].completed += val;
                  if (kLower.includes("u1") || kLower.includes("unidad 1") || kLower.includes("unidad1")) {
                    bookStats[rowLabel].u1_completed += val;
                  }
                  if (kLower.includes("u2") || kLower.includes("unidad 2") || kLower.includes("unidad2")) {
                    bookStats[rowLabel].u2_completed += val;
                  }
                  if (kLower.includes("u3") || kLower.includes("unidad 3") || kLower.includes("unidad3")) {
                    bookStats[rowLabel].u3_completed += val;
                  }
                } else if (isStudying) {
                  bookStats[rowLabel].studying += val;
                  if (kLower.includes("u1") || kLower.includes("unidad 1") || kLower.includes("unidad1")) {
                    bookStats[rowLabel].u1_studying += val;
                  }
                  if (kLower.includes("u2") || kLower.includes("unidad 2") || kLower.includes("unidad2")) {
                    bookStats[rowLabel].u2_studying += val;
                  }
                  if (kLower.includes("u3") || kLower.includes("unidad 3") || kLower.includes("unidad3")) {
                    bookStats[rowLabel].u3_studying += val;
                  }
                }
              }
            });
          }
        });
      }
    });

    return Object.entries(bookStats).map(([book, counts]) => ({
      book,
      completed: counts.completed,
      studying: counts.studying,
      u1_completed: counts.u1_completed,
      u1_studying: counts.u1_studying,
      u2_completed: counts.u2_completed,
      u2_studying: counts.u2_studying,
      u3_completed: counts.u3_completed,
      u3_studying: counts.u3_studying,
      completedPercent: helpersTotalNamedLastPeriod > 0 ? Math.round((counts.completed / helpersTotalNamedLastPeriod) * 100) : 0,
      studyingPercent: helpersTotalNamedLastPeriod > 0 ? Math.round((counts.studying / helpersTotalNamedLastPeriod) * 100) : 0
    }));
  };

  const helpersRuhiBooks = getHelpersRuhiStats();

  const helpersRuhiUnitsPercentageData = React.useMemo(() => {
    return helpersRuhiBooks.flatMap(b => {
      const shortBook = b.book.replace("Libro ", "L");
      return [
        {
          unitLabel: `${shortBook} U1`,
          completado: helpersTotalNamedLastPeriod > 0 ? Math.round((b.u1_completed / helpersTotalNamedLastPeriod) * 100) : 0,
          enProceso: helpersTotalNamedLastPeriod > 0 ? Math.round((b.u1_studying / helpersTotalNamedLastPeriod) * 100) : 0,
        },
        {
          unitLabel: `${shortBook} U2`,
          completado: helpersTotalNamedLastPeriod > 0 ? Math.round((b.u2_completed / helpersTotalNamedLastPeriod) * 100) : 0,
          enProceso: helpersTotalNamedLastPeriod > 0 ? Math.round((b.u2_studying / helpersTotalNamedLastPeriod) * 100) : 0,
        },
        {
          unitLabel: `${shortBook} U3`,
          completado: helpersTotalNamedLastPeriod > 0 ? Math.round((b.u3_completed / helpersTotalNamedLastPeriod) * 100) : 0,
          enProceso: helpersTotalNamedLastPeriod > 0 ? Math.round((b.u3_studying / helpersTotalNamedLastPeriod) * 100) : 0,
        }
      ];
    });
  }, [helpersRuhiBooks, helpersTotalNamedLastPeriod]);

  const getHelpersRuhiStudiedByLocationStats = () => {
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      books: Record<string, number>;
      totalStudied: number;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initBooks: Record<string, number> = {};
        bookNames.forEach(b => {
          initBooks[b] = 0;
        });
        locationMap[key] = {
          country,
          region,
          books: initBooks,
          totalStudied: 0
        };
      }

      const tableData = sub.data[FIELD_AYUDANTES_RUHI];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8" || label === "Libro 8") label = "Libro 8";
          else if (label === "L9" || label === "Libro 9") label = "Libro 9";
          else if (label === "L10" || label === "Libro 10") label = "Libro 10";
          else if (label === "L11" || label === "Libro 11") label = "Libro 11";
          else if (label === "L12" || label === "Libro 12") label = "Libro 12";
          else if (label === "L13" || label === "Libro 13") label = "Libro 13";
          else if (label === "L14" || label === "Libro 14") label = "Libro 14";

          if (bookNames.includes(label)) {
            let rowSum = 0;
            Object.keys(row).forEach(k => {
              if (k !== "_rowLabel") {
                const val = Number(row[k]);
                if (!isNaN(val)) {
                  rowSum += val;
                }
              }
            });
            if (rowSum > 0) {
              locationMap[key].books[label] += rowSum;
              locationMap[key].totalStudied += rowSum;
            }
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const helpersRuhiStudiedByLocationStats = getHelpersRuhiStudiedByLocationStats();

  // Relatos estudiados por ayudantes (último periodo únicamente para evitar acumular periodos diferentes)
  const getHelpersStoriesStats = () => {
    const storyCounts: Record<string, number> = {};
    const storyNames = ["Orchard", "San Pedro", "Batula", "Bramour", "Miramar"];
    storyNames.forEach(s => { storyCounts[s] = 0; });

    const currentPeriodSubs = latestSubmissions.filter(sub => {
      const dStr = getSubDateValue(sub);
      return dStr === lastPeriodDate;
    });

    currentPeriodSubs.forEach(sub => {
      const tableData = sub.data[FIELD_AYUDANTES_RELATOS];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          const label = row._rowLabel || "";
          if (storyCounts[label] !== undefined) {
            const keys = Object.keys(row).filter(k => k !== "_rowLabel");
            keys.forEach(k => {
              const val = Number(row[k]);
              if (!isNaN(val)) {
                storyCounts[label] += val;
              }
            });
          }
        });
      }
    });

    return Object.entries(storyCounts).map(([story, count]) => ({ story, count }));
  };

  const helpersStories = getHelpersStoriesStats();

  const helpersStoriesPercentage = React.useMemo(() => {
    return helpersStories.map(item => ({
      ...item,
      percent: helpersTotalNamedLastPeriod > 0 ? Math.round((item.count / helpersTotalNamedLastPeriod) * 100) : 0
    }));
  }, [helpersStories, helpersTotalNamedLastPeriod]);

  const helpersStoriesHistoricalData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01";
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    const storyNames = ["Orchard", "San Pedro", "Batula", "Bramour", "Miramar"];

    return sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      const periodLatestSubs = getLatestSubmissionsByEmail(subs);
      
      const counts: Record<string, number> = {};
      storyNames.forEach(s => { counts[s] = 0; });

      periodLatestSubs.forEach(sub => {
        const tableData = sub.data[FIELD_AYUDANTES_RELATOS];
        if (Array.isArray(tableData)) {
          tableData.forEach((row: any) => {
            const label = row._rowLabel || "";
            if (counts[label] !== undefined) {
              const keys = Object.keys(row).filter(k => k !== "_rowLabel");
              keys.forEach(k => {
                const val = Number(row[k]);
                if (!isNaN(val)) {
                  counts[label] += val;
                }
              });
            }
          });
        }
      });

      return {
        fecha: formatDisplayDate(dateKey),
        rawFecha: dateKey,
        Orchard: counts["Orchard"],
        "San Pedro": counts["San Pedro"],
        Batula: counts["Batula"],
        Bramour: counts["Bramour"],
        Miramar: counts["Miramar"]
      };
    });
  }, [filteredSubs, dateFieldId]);

  const helpersStoriesTrendStats = React.useMemo(() => {
    const data = helpersStoriesHistoricalData;
    const len = data.length;
    const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
    
    const stats: Record<string, {
      recentChange: number;
      recentDirection: "up" | "down" | "none";
      firstVal: number;
      lastVal: number;
      prevVal: number;
      pctChange: number;
    }> = {};

    storyNames.forEach(key => {
      stats[key] = {
        recentChange: 0,
        recentDirection: "none",
        firstVal: 0,
        lastVal: 0,
        prevVal: 0,
        pctChange: 0
      };
    });

    if (len === 0) return stats;

    const firstPoint = data[0];
    const lastPoint = data[len - 1];
    const prevPoint = len >= 2 ? data[len - 2] : firstPoint;

    storyNames.forEach(key => {
      const firstVal = (firstPoint[key as keyof typeof firstPoint] as number) || 0;
      const lastVal = (lastPoint[key as keyof typeof lastPoint] as number) || 0;
      const prevVal = (prevPoint[key as keyof typeof prevPoint] as number) || 0;

      const recentChange = lastVal - prevVal;
      let recentDirection: "up" | "down" | "none" = "none";
      if (recentChange > 0) recentDirection = "up";
      else if (recentChange < 0) recentDirection = "down";

      const pctChange = prevVal > 0 ? Math.round((recentChange / prevVal) * 100) : 0;

      stats[key] = {
        recentChange,
        recentDirection,
        firstVal,
        lastVal,
        prevVal,
        pctChange
      };
    });

    return stats;
  }, [helpersStoriesHistoricalData]);

  const getHelpersStoriesByLocationStats = () => {
    const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      stories: Record<string, number>;
      totalStories: number;
    }> = {};

    const currentPeriodSubs = latestSubmissions.filter(sub => {
      const dStr = getSubDateValue(sub);
      return dStr === lastPeriodDate;
    });

    currentPeriodSubs.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initStories: Record<string, number> = {};
        storyNames.forEach(s => {
          initStories[s] = 0;
        });
        locationMap[key] = {
          country,
          region,
          stories: initStories,
          totalStories: 0
        };
      }

      const tableData = sub.data[FIELD_AYUDANTES_RELATOS];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          const label = row._rowLabel || "";
          if (storyNames.includes(label)) {
            const keys = Object.keys(row).filter(k => k !== "_rowLabel");
            keys.forEach(k => {
              const val = Number(row[k]);
              if (!isNaN(val)) {
                locationMap[key].stories[label] += val;
                locationMap[key].totalStories += val;
              }
            });
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const helpersStoriesByLocationStats = getHelpersStoriesByLocationStats();

  const getHelpersRuhiByLocationStats = () => {
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      books: Record<string, { total: number; u1: number; u2: number; u3: number }>;
      totalCompleted: number;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initBooks: Record<string, { total: number; u1: number; u2: number; u3: number }> = {};
        bookNames.forEach(b => {
          initBooks[b] = { total: 0, u1: 0, u2: 0, u3: 0 };
        });
        locationMap[key] = {
          country,
          region,
          books: initBooks,
          totalCompleted: 0
        };
      }

      const tableData = sub.data[FIELD_AYUDANTES_RUHI];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8" || label === "Libro 8") label = "Libro 8";
          else if (label === "L9" || label === "Libro 9") label = "Libro 9";
          else if (label === "L10" || label === "Libro 10") label = "Libro 10";
          else if (label === "L11" || label === "Libro 11") label = "Libro 11";
          else if (label === "L12" || label === "Libro 12") label = "Libro 12";
          else if (label === "L13" || label === "Libro 13") label = "Libro 13";
          else if (label === "L14" || label === "Libro 14") label = "Libro 14";

          if (bookNames.includes(label)) {
            let rowCompleted = 0;
            let u1Val = 0;
            let u2Val = 0;
            let u3Val = 0;

            Object.keys(row).forEach(k => {
              if (k !== "_rowLabel") {
                const val = Number(row[k]) || 0;
                const kLower = k.toLowerCase();
                if (kLower.includes("completado")) {
                  rowCompleted += val;
                  if (kLower.includes("u1") || kLower.includes("unidad 1") || kLower.includes("unidad1")) {
                    u1Val += val;
                  }
                  if (kLower.includes("u2") || kLower.includes("unidad 2") || kLower.includes("unidad2")) {
                    u2Val += val;
                  }
                  if (kLower.includes("u3") || kLower.includes("unidad 3") || kLower.includes("unidad3")) {
                    u3Val += val;
                  }
                }
              }
            });

            if (rowCompleted > 0) {
              locationMap[key].books[label].total += rowCompleted;
              locationMap[key].books[label].u1 += u1Val;
              locationMap[key].books[label].u2 += u2Val;
              locationMap[key].books[label].u3 += u3Val;
              locationMap[key].totalCompleted += rowCompleted;
            }
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const helpersRuhiByLocationStats = getHelpersRuhiByLocationStats();

  const getHelpersRuhiStudyingByLocationStats = () => {
    const bookNames = ["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      books: Record<string, { total: number; u1: number; u2: number; u3: number }>;
      totalStudying: number;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        const initBooks: Record<string, { total: number; u1: number; u2: number; u3: number }> = {};
        bookNames.forEach(b => {
          initBooks[b] = { total: 0, u1: 0, u2: 0, u3: 0 };
        });
        locationMap[key] = {
          country,
          region,
          books: initBooks,
          totalStudying: 0
        };
      }

      const tableData = sub.data[FIELD_AYUDANTES_RUHI];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          let label = row._rowLabel || "";
          if (label === "L8" || label === "Libro 8") label = "Libro 8";
          else if (label === "L9" || label === "Libro 9") label = "Libro 9";
          else if (label === "L10" || label === "Libro 10") label = "Libro 10";
          else if (label === "L11" || label === "Libro 11") label = "Libro 11";
          else if (label === "L12" || label === "Libro 12") label = "Libro 12";
          else if (label === "L13" || label === "Libro 13") label = "Libro 13";
          else if (label === "L14" || label === "Libro 14") label = "Libro 14";

          if (bookNames.includes(label)) {
            let rowStudying = 0;
            let u1Val = 0;
            let u2Val = 0;
            let u3Val = 0;

            Object.keys(row).forEach(k => {
              if (k !== "_rowLabel") {
                const val = Number(row[k]) || 0;
                const kLower = k.toLowerCase();
                const isStudying = kLower.includes("estudiando") || kLower.includes("proceso");
                if (isStudying) {
                  rowStudying += val;
                  if (kLower.includes("u1") || kLower.includes("unidad 1") || kLower.includes("unidad1")) {
                    u1Val += val;
                  }
                  if (kLower.includes("u2") || kLower.includes("unidad 2") || kLower.includes("unidad2")) {
                    u2Val += val;
                  }
                  if (kLower.includes("u3") || kLower.includes("unidad 3") || kLower.includes("unidad3")) {
                    u3Val += val;
                  }
                }
              }
            });

            if (rowStudying > 0) {
              locationMap[key].books[label].total += rowStudying;
              locationMap[key].books[label].u1 += u1Val;
              locationMap[key].books[label].u2 += u2Val;
              locationMap[key].books[label].u3 += u3Val;
              locationMap[key].totalStudying += rowStudying;
            }
          }
        });
      }
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  };

  const helpersRuhiStudyingByLocationStats = getHelpersRuhiStudyingByLocationStats();

  const helpersParticipationPercent = helpersTotalNamed > 0
    ? Math.round((helpersStudiedInSpaces / helpersTotalNamed) * 100)
    : 0;

  const helpersParticipationChartData = React.useMemo(() => {
    const activeVal = helpersStudiedInSpaces;
    const inactiveVal = Math.max(0, helpersTotalNamed - helpersStudiedInSpaces);
    return [
      { name: "Participa", value: activeVal, fill: "#8b5cf6" },
      { name: "No Participa", value: inactiveVal, fill: "#334155" }
    ];
  }, [helpersStudiedInSpaces, helpersTotalNamed]);

  const helpersFacilitationPercent = helpersTotalNamed > 0
    ? Math.round((spacesFacilitatedByHelpers / helpersTotalNamed) * 100)
    : 0;

  const helpersFacilitationChartData = React.useMemo(() => {
    const activeVal = spacesFacilitatedByHelpers;
    const inactiveVal = Math.max(0, helpersTotalNamed - spacesFacilitatedByHelpers);
    return [
      { name: "Facilita", value: activeVal, fill: "#3b82f6" },
      { name: "No Facilita", value: inactiveVal, fill: "#334155" }
    ];
  }, [spacesFacilitatedByHelpers, helpersTotalNamed]);

  const helpersSpacesTimelineData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01";
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    return sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      const periodLatestSubs = getLatestSubmissionsByEmail(subs);

      const participating = periodLatestSubs.reduce((sum, sub) => {
        const num = Number(sub.data[FIELD_AYUDANTES_ESPACIOS]);
        return isNaN(num) ? sum : sum + num;
      }, 0);

      const facilitating = periodLatestSubs.reduce((sum, sub) => {
        const num = Number(sub.data[FIELD_AYUDANTES_FACILITADOS]);
        return isNaN(num) ? sum : sum + num;
      }, 0);

      return {
        fechaKey: dateKey,
        fecha: formatDisplayDate(dateKey),
        participating,
        facilitating,
        total: periodLatestSubs.length
      };
    });
  }, [filteredSubs, dateFieldId]);

  const helpersSpacesTrendStats = React.useMemo(() => {
    const data = helpersSpacesTimelineData;
    const len = data.length;

    const defaultStats = {
      participating: {
        recentChange: 0,
        recentDirection: "none" as "up" | "down" | "none",
        totalChange: 0,
        totalDirection: "none" as "up" | "down" | "none",
        firstVal: 0,
        lastVal: 0,
        prevVal: 0
      },
      facilitating: {
        recentChange: 0,
        recentDirection: "none" as "up" | "down" | "none",
        totalChange: 0,
        totalDirection: "none" as "up" | "down" | "none",
        firstVal: 0,
        lastVal: 0,
        prevVal: 0
      }
    };

    if (len === 0) return defaultStats;

    const firstPoint = data[0];
    const lastPoint = data[len - 1];
    const prevPoint = len >= 2 ? data[len - 2] : firstPoint;

    // 1. Participation
    const partRecentChange = lastPoint.participating - prevPoint.participating;
    const partTotalChange = lastPoint.participating - firstPoint.participating;
    
    let partRecentDir: "up" | "down" | "none" = "none";
    if (partRecentChange > 0) partRecentDir = "up";
    else if (partRecentChange < 0) partRecentDir = "down";

    let partTotalDir: "up" | "down" | "none" = "none";
    if (partTotalChange > 0) partTotalDir = "up";
    else if (partTotalChange < 0) partTotalDir = "down";

    // 2. Facilitation
    const facRecentChange = lastPoint.facilitating - prevPoint.facilitating;
    const facTotalChange = lastPoint.facilitating - firstPoint.facilitating;

    let facRecentDir: "up" | "down" | "none" = "none";
    if (facRecentChange > 0) facRecentDir = "up";
    else if (facRecentChange < 0) facRecentDir = "down";

    let facTotalDir: "up" | "down" | "none" = "none";
    if (facTotalChange > 0) facTotalDir = "up";
    else if (facTotalChange < 0) facTotalDir = "down";

    return {
      participating: {
        recentChange: partRecentChange,
        recentDirection: partRecentDir,
        totalChange: partTotalChange,
        totalDirection: partTotalDir,
        firstVal: firstPoint.participating,
        lastVal: lastPoint.participating,
        prevVal: prevPoint.participating
      },
      facilitating: {
        recentChange: facRecentChange,
        recentDirection: facRecentDir,
        totalChange: facTotalChange,
        totalDirection: facTotalDir,
        firstVal: firstPoint.facilitating,
        lastVal: lastPoint.facilitating,
        prevVal: prevPoint.facilitating
      }
    };
  }, [helpersSpacesTimelineData]);

  const helpersSpacesByLocationStats = React.useMemo(() => {
    const locationMap: Record<string, {
      country: string;
      region: string;
      totalHelpers: number;
      participatesCount: number;
      facilitatesCount: number;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        locationMap[key] = {
          country,
          region,
          totalHelpers: 0,
          participatesCount: 0,
          facilitatesCount: 0
        };
      }

      const totalH = Number(sub.data[FIELD_AYUDANTES_NOMBRADOS]) || 0;
      const partH = Number(sub.data[FIELD_AYUDANTES_ESPACIOS]) || 0;
      const facH = Number(sub.data[FIELD_AYUDANTES_FACILITADOS]) || 0;

      locationMap[key].totalHelpers += totalH;
      locationMap[key].participatesCount += partH;
      locationMap[key].facilitatesCount += facH;
    });

    return Object.values(locationMap).sort((a, b) => {
      if (a.country !== b.country) {
        return a.country.localeCompare(b.country);
      }
      return a.region.localeCompare(b.region);
    });
  }, [latestSubmissions]);


  // ==========================================
  // CÁLCULO DE MÉTRICAS: 3. ASAMBLEAS ESPIRITUALES LOCALES (AEL)
  // ==========================================
  // Total de AEL en el país/región. Al ser un número compartido regionalmente, 
  // tomamos el valor máximo registrado por los MCAs en esta región, o el último registrado.
  const lsaTotalCount = getSumLsaFromSubmissions(latestSubmissions);

  // AEL que consultan regularmente en sus reuniones
  const lsaConsultingCount = getSumFieldFromSubmissions(latestSubmissions, FIELD_ASAMBLEAS_CONSULTA);

  // AEL con líneas de acción / estrategias
  const lsaActionLinesCount = getSumFieldFromSubmissions(latestSubmissions, FIELD_ASAMBLEAS_LINEAS);

  // AEL que han estudiado relatos
  const getLsaStoriesStats = () => {
    const storyNames = ["Orchard", "San Pedro", "Batula", "Bramour", "Miramar"];
    const territoryMap: Record<string, Record<string, number>> = {};

    latestSubmissions.forEach(sub => {
      const country = (sub.userCountry || "Desconocido").trim().toLowerCase();
      const region = (sub.userRegion || "Sin Región").trim().toLowerCase();
      const key = `${country}_${region}`;

      if (!territoryMap[key]) {
        territoryMap[key] = {};
        storyNames.forEach(s => { territoryMap[key][s] = 0; });
      }

      const tableData = sub.data[FIELD_ASAMBLEAS_RELATOS];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          const label = row._rowLabel || "";
          if (storyNames.includes(label)) {
            const keys = Object.keys(row).filter(k => k !== "_rowLabel");
            keys.forEach(k => {
              const val = Number(row[k]);
              if (!isNaN(val)) {
                if (val > territoryMap[key][label]) {
                  territoryMap[key][label] = val;
                }
              }
            });
          }
        });
      }
    });

    const lsaStoryCounts: Record<string, number> = {};
    storyNames.forEach(s => { lsaStoryCounts[s] = 0; });

    Object.values(territoryMap).forEach(territoryCounts => {
      storyNames.forEach(s => {
        lsaStoryCounts[s] += territoryCounts[s] || 0;
      });
    });

    return Object.entries(lsaStoryCounts).map(([story, count]) => ({ story, count }));
  };

  const lsaStories = getLsaStoriesStats();

  const lsaStoriesPercentage = React.useMemo(() => {
    return lsaStories.map(item => ({
      ...item,
      percent: lsaTotalCount > 0 ? Math.round((item.count / lsaTotalCount) * 100) : 0
    }));
  }, [lsaStories, lsaTotalCount]);

  // Histórico de relatos estudiados por las Asambleas (AEL) utilizando el campo Fecha
  const lsaStoriesHistoricalData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01";
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    const storyNames = ["Orchard", "San Pedro", "Batula", "Bramour", "Miramar"];

    return sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      
      const territoryMap: Record<string, Record<string, number>> = {};

      subs.forEach(sub => {
        const country = (sub.userCountry || "Desconocido").trim().toLowerCase();
        const region = (sub.userRegion || "Sin Región").trim().toLowerCase();
        const key = `${country}_${region}`;

        if (!territoryMap[key]) {
          territoryMap[key] = {};
          storyNames.forEach(s => { territoryMap[key][s] = 0; });
        }

        const tableData = sub.data[FIELD_ASAMBLEAS_RELATOS];
        if (Array.isArray(tableData)) {
          tableData.forEach((row: any) => {
            const label = row._rowLabel || "";
            if (storyNames.includes(label)) {
              const keys = Object.keys(row).filter(k => k !== "_rowLabel");
              keys.forEach(k => {
                const val = Number(row[k]);
                if (!isNaN(val)) {
                  if (val > territoryMap[key][label]) {
                    territoryMap[key][label] = val;
                  }
                }
              });
            }
          });
        }
      });

      const lsaStoryCounts: Record<string, number> = {};
      storyNames.forEach(s => { lsaStoryCounts[s] = 0; });

      Object.values(territoryMap).forEach(territoryCounts => {
        storyNames.forEach(s => {
          lsaStoryCounts[s] += territoryCounts[s] || 0;
        });
      });

      return {
        fecha: formatDisplayDate(dateKey),
        rawFecha: dateKey,
        Orchard: lsaStoryCounts["Orchard"],
        "San Pedro": lsaStoryCounts["San Pedro"],
        Batula: lsaStoryCounts["Batula"],
        Bramour: lsaStoryCounts["Bramour"],
        Miramar: lsaStoryCounts["Miramar"]
      };
    });
  }, [filteredSubs, dateFieldId]);

  // Histórico de consulta regular por las Asambleas (AEL) utilizando el campo Fecha
  const lsaConsultingHistoricalData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01";
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    return sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      
      const territoryMap: Record<string, { total: number; consulting: number }> = {};

      subs.forEach(sub => {
        const country = (sub.userCountry || "Desconocido").trim().toLowerCase();
        const region = (sub.userRegion || "Sin Región").trim().toLowerCase();
        const key = `${country}_${region}`;

        const totalVal = Number(sub.data[FIELD_ASAMBLEAS_CANTIDAD]) || 0;
        const consultingVal = Number(sub.data[FIELD_ASAMBLEAS_CONSULTA]) || 0;

        if (!territoryMap[key]) {
          territoryMap[key] = { total: totalVal, consulting: consultingVal };
        } else {
          if (totalVal > territoryMap[key].total) {
            territoryMap[key].total = totalVal;
          }
          if (consultingVal > territoryMap[key].consulting) {
            territoryMap[key].consulting = consultingVal;
          }
        }
      });

      let totalSum = 0;
      let consultingSum = 0;

      Object.values(territoryMap).forEach(val => {
        totalSum += val.total;
        consultingSum += val.consulting;
      });

      return {
        fecha: formatDisplayDate(dateKey),
        rawFecha: dateKey,
        total: totalSum,
        consultan: consultingSum,
        noConsultan: Math.max(0, totalSum - consultingSum)
      };
    });
  }, [filteredSubs, dateFieldId]);

  // Histórico de líneas de acción por las Asambleas (AEL) utilizando el campo Fecha
  const lsaActionLinesHistoricalData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01";
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    return sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      
      const territoryMap: Record<string, { total: number; actionLines: number }> = {};

      subs.forEach(sub => {
        const country = (sub.userCountry || "Desconocido").trim().toLowerCase();
        const region = (sub.userRegion || "Sin Región").trim().toLowerCase();
        const key = `${country}_${region}`;

        const totalVal = Number(sub.data[FIELD_ASAMBLEAS_CANTIDAD]) || 0;
        const actionLinesVal = Number(sub.data[FIELD_ASAMBLEAS_LINEAS]) || 0;

        if (!territoryMap[key]) {
          territoryMap[key] = { total: totalVal, actionLines: actionLinesVal };
        } else {
          if (totalVal > territoryMap[key].total) {
            territoryMap[key].total = totalVal;
          }
          if (actionLinesVal > territoryMap[key].actionLines) {
            territoryMap[key].actionLines = actionLinesVal;
          }
        }
      });

      let totalSum = 0;
      let actionLinesSum = 0;

      Object.values(territoryMap).forEach(val => {
        totalSum += val.total;
        actionLinesSum += val.actionLines;
      });

      return {
        fecha: formatDisplayDate(dateKey),
        rawFecha: dateKey,
        total: totalSum,
        actionLines: actionLinesSum,
        noActionLines: Math.max(0, totalSum - actionLinesSum)
      };
    });
  }, [filteredSubs, dateFieldId]);

  const lsaStoriesTrendStats = React.useMemo(() => {
    const data = lsaStoriesHistoricalData;
    const len = data.length;
    const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
    
    const stats: Record<string, {
      recentChange: number;
      recentDirection: "up" | "down" | "none";
      firstVal: number;
      lastVal: number;
      prevVal: number;
      pctChange: number;
    }> = {};

    storyNames.forEach(key => {
      stats[key] = {
        recentChange: 0,
        recentDirection: "none",
        firstVal: 0,
        lastVal: 0,
        prevVal: 0,
        pctChange: 0
      };
    });

    if (len === 0) return stats;

    const firstPoint = data[0];
    const lastPoint = data[len - 1];
    const prevPoint = len >= 2 ? data[len - 2] : firstPoint;

    storyNames.forEach(key => {
      const firstVal = (firstPoint[key as keyof typeof firstPoint] as number) || 0;
      const lastVal = (lastPoint[key as keyof typeof lastPoint] as number) || 0;
      const prevVal = (prevPoint[key as keyof typeof prevPoint] as number) || 0;

      const recentChange = lastVal - prevVal;
      let recentDirection: "up" | "down" | "none" = "none";
      if (recentChange > 0) recentDirection = "up";
      else if (recentChange < 0) recentDirection = "down";

      const pctChange = prevVal > 0 ? Math.round((recentChange / prevVal) * 100) : 0;

      stats[key] = {
        recentChange,
        recentDirection,
        firstVal,
        lastVal,
        prevVal,
        pctChange
      };
    });

    return stats;
  }, [lsaStoriesHistoricalData]);

  // AEL que han participado en espacios de estudio periódicos, desglosado por facilitador
  const getLsaPeriodicSpacesStats = () => {
    const facilitators = ["Asamblea Nacional o Consejo Regional", "AEL", "MCA", "Ayudante"];
    const territoryMap: Record<string, Record<string, number>> = {};

    latestSubmissions.forEach(sub => {
      const country = (sub.userCountry || "Desconocido").trim().toLowerCase();
      const region = (sub.userRegion || "Sin Región").trim().toLowerCase();
      const key = `${country}_${region}`;

      if (!territoryMap[key]) {
        territoryMap[key] = {};
        facilitators.forEach(f => { territoryMap[key][f] = 0; });
      }

      const tableData = sub.data[FIELD_ASAMBLEAS_ESPACIOS];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          const label = row._rowLabel || "";
          if (facilitators.includes(label)) {
            const keys = Object.keys(row).filter(k => k !== "_rowLabel");
            keys.forEach(k => {
              const val = Number(row[k]);
              if (!isNaN(val)) {
                if (val > territoryMap[key][label]) {
                  territoryMap[key][label] = val;
                }
              }
            });
          }
        });
      }
    });

    const spaceCounts: Record<string, number> = {};
    facilitators.forEach(f => { spaceCounts[f] = 0; });

    Object.values(territoryMap).forEach(territoryCounts => {
      facilitators.forEach(f => {
        spaceCounts[f] += territoryCounts[f] || 0;
      });
    });

    return Object.entries(spaceCounts).map(([facilitator, count]) => ({ facilitator, count }));
  };

  const lsaSpaces = getLsaPeriodicSpacesStats();

  const getLsaSpacesDetailedStats = () => {
    const facilitators = ["Asamblea Nacional o Consejo Regional", "AEL", "MCA", "Ayudante"];
    const locationMap: Record<string, {
      country: string;
      region: string;
      values: Record<string, number>;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        locationMap[key] = {
          country,
          region,
          values: {}
        };
        facilitators.forEach(f => { locationMap[key].values[f] = 0; });
      }

      const tableData = sub.data[FIELD_ASAMBLEAS_ESPACIOS];
      if (Array.isArray(tableData)) {
        tableData.forEach((row: any) => {
          const label = row._rowLabel || "";
          if (facilitators.includes(label)) {
            const keys = Object.keys(row).filter(k => k !== "_rowLabel");
            keys.forEach(k => {
              const val = Number(row[k]);
              if (!isNaN(val)) {
                if (val > locationMap[key].values[label]) {
                  locationMap[key].values[label] = val;
                }
              }
            });
          }
        });
      }
    });

    return Object.values(locationMap)
      .map(item => {
        const total = Object.values(item.values).reduce((sum, v) => sum + v, 0);
        return {
          ...item,
          total
        };
      })
      .filter(item => item.total > 0)
      .sort((a, b) => a.country.localeCompare(b.country) || a.region.localeCompare(b.region));
  };

  const lsaSpacesDetailed = getLsaSpacesDetailedStats();

  const getLsaManagementDetailedStats = () => {
    const locationMap: Record<string, {
      country: string;
      region: string;
      totalLsa: number;
      consultingCount: number;
      actionLinesCount: number;
    }> = {};

    latestSubmissions.forEach(sub => {
      const country = sub.userCountry?.trim() || "Desconocido";
      const region = sub.userRegion?.trim() || "Sin Región";
      const key = `${country}||${region}`;

      if (!locationMap[key]) {
        locationMap[key] = {
          country,
          region,
          totalLsa: 0,
          consultingCount: 0,
          actionLinesCount: 0
        };
      }

      const totalLsa = Number(sub.data[FIELD_ASAMBLEAS_CANTIDAD]) || 0;
      const consulting = Number(sub.data[FIELD_ASAMBLEAS_CONSULTA]) || 0;
      const actionLines = Number(sub.data[FIELD_ASAMBLEAS_LINEAS]) || 0;

      if (totalLsa > locationMap[key].totalLsa) {
        locationMap[key].totalLsa = totalLsa;
      }
      if (consulting > locationMap[key].consultingCount) {
        locationMap[key].consultingCount = consulting;
      }
      if (actionLines > locationMap[key].actionLinesCount) {
        locationMap[key].actionLinesCount = actionLines;
      }
    });

    return Object.values(locationMap)
      .filter(item => item.totalLsa > 0 || item.consultingCount > 0 || item.actionLinesCount > 0)
      .sort((a, b) => a.country.localeCompare(b.country) || a.region.localeCompare(b.region));
  };

  const lsaManagementDetailed = getLsaManagementDetailedStats();

  const getFacilitatorColor = (name: string): string => {
    const n = name.trim();
    if (n === "Asamblea Nacional o Consejo Regional" || n === "Asamblea / Consejo") return "#a855f7"; // Purple
    if (n === "AEL") return "#ec4899"; // Pink
    if (n === "MCA") return "#38bdf8"; // Sky Blue
    if (n === "Ayudante") return "#fbbf24"; // Amber/Orange
    return "#64748b"; // Default Slate
  };

  const getFacilitatorBgClass = (name: string): string => {
    const n = name.trim();
    if (n === "Asamblea Nacional o Consejo Regional" || n === "Asamblea / Consejo") return "bg-purple-500";
    if (n === "AEL") return "bg-pink-500";
    if (n === "MCA") return "bg-sky-400";
    if (n === "Ayudante") return "bg-amber-400";
    return "bg-slate-500";
  };
  
  // Export to CSV helper
  const exportToCSV = (data: any[], headers: string[], filename: string) => {
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(h => {
          const val = row[h] !== undefined ? String(row[h]) : "";
          // Escape quotes
          const escaped = val.replace(/"/g, '""');
          return escaped.includes(",") || escaped.includes("\n") || escaped.includes('"')
            ? `"${escaped}"`
            : escaped;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON helper
  const exportToJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.json`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    let exportData: any[] = [];
    let headers: string[] = [];
    let filename = `Reporte_${activeTab}_${selectedCountry}_${selectedRegion}`.replace(/\s+/g, "_");

    if (activeTab === "general") {
      headers = ["Nombre_o_Email", "Email", "Reporte_Enviado", "Ultima_Fecha_Reporte"];
      exportData = mcaList.map(item => ({
        Nombre_o_Email: item.name,
        Email: item.email,
        Reporte_Enviado: item.submitted ? "Sí" : "No",
        Ultima_Fecha_Reporte: item.date
      }));
    } else if (activeTab === "mca") {
      headers = ["Libro", "Completado", "Estudiando", "Porcentaje_Completado", "Porcentaje_Estudiando"];
      exportData = mcaRuhiBooks.map(b => ({
        Libro: b.book,
        Completado: b.completed,
        Estudiando: b.studying,
        Porcentaje_Completado: `${b.completedPercent}%`,
        Porcentaje_Estudiando: `${b.studyingPercent}%`
      }));
    } else if (activeTab === "helpers") {
      headers = ["Libro", "Completados", "Estudiando"];
      exportData = helpersRuhiBooks.map(b => ({
        Libro: b.book,
        Completados: b.completed,
        Estudiando: b.studying
      }));
    } else if (activeTab === "lsa") {
      headers = ["Facilitador", "Total_Asambleas"];
      exportData = lsaSpaces.map(sp => ({
        Facilitador: sp.facilitator,
        Total_Asambleas: sp.count
      }));
    }

    exportToCSV(exportData, headers, filename);
    setShowExportDropdown(false);
  };

  const handleExportJSON = () => {
    const filename = `Submissions_${activeTab}_${selectedCountry}_${selectedRegion}`.replace(/\s+/g, "_");
    exportToJSON(filteredSubs, filename);
    setShowExportDropdown(false);
  };

  latestExportCSV.current = handleExportCSV;
  latestExportJSON.current = handleExportJSON;

  // Crecimiento histórico de Ayudantes y AEL (Asambleas Espirituales Locales) utilizando el campo Fecha en la base de datos
  const growthData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    // Agrupamos todos los envíos filtrados por su campo "Fecha" para responder dinámicamente a los filtros
    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01"; // Fallback razonable si no tiene fecha
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        // Fallback de respaldo alternativo buscando cualquier clave de fecha
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      // Normalizamos la clave de fecha a "YYYY-MM"
      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    return sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      // Sumamos la cantidad de ayudantes de este período
      const helpersCount = subs.reduce((sum, sub) => {
        const num = Number(sub.data[FIELD_AYUDANTES_NOMBRADOS]);
        return isNaN(num) ? sum : sum + num;
      }, 0);

      // Sumamos la cantidad de ayudantes de protección de este período
      const helpersProtectionCount = subs.reduce((sum, sub) => {
        const valObj = sub.data[FIELD_AYUDANTES_PROTECCION];
        if (valObj && typeof valObj === "object") {
          const ans = valObj.answer;
          if (ans === "Sí" || ans === "Si") {
            const num = Number(valObj.justification);
            return sum + (isNaN(num) ? 1 : num);
          }
        } else if (valObj === "Sí" || valObj === "Si") {
          return sum + 1;
        }
        return sum;
      }, 0);

      // Obtenemos el total de AEL para este período (suma por países y regiones)
      const lsaCount = getSumLsaFromSubmissions(subs);

      return {
        fecha: formatDisplayDate(dateKey),
        rawFecha: dateKey,
        helpers: helpersCount,
        helpersProtection: helpersProtectionCount,
        lsa: lsaCount,
        mca: subs.length
      };
    });
  }, [filteredSubs, dateFieldId]);

  const { helpersTrendInfo, helpersProtectionTrendInfo, lsaTrendInfo } = React.useMemo(() => {
    const hFirst = growthData.length > 0 ? growthData[0].helpers : 0;
    const hLast = growthData.length > 0 ? growthData[growthData.length - 1].helpers : 0;
    const hDiff = hLast - hFirst;
    const hPct = hFirst > 0 ? Math.round((hDiff / hFirst) * 100) : 0;
    const hRange = growthData.length >= 2 
      ? `${growthData[0].fecha} - ${growthData[growthData.length - 1].fecha}`
      : "";

    const hpFirst = growthData.length > 0 ? (growthData[0].helpersProtection || 0) : 0;
    const hpLast = growthData.length > 0 ? (growthData[growthData.length - 1].helpersProtection || 0) : 0;
    const hpDiff = hpLast - hpFirst;
    const hpPct = hpFirst > 0 ? Math.round((hpDiff / hpFirst) * 100) : 0;
    const hpRange = growthData.length >= 2 
      ? `${growthData[0].fecha} - ${growthData[growthData.length - 1].fecha}`
      : "";

    const lFirst = growthData.length > 0 ? growthData[0].lsa : 0;
    const lLast = growthData.length > 0 ? growthData[growthData.length - 1].lsa : 0;
    const lDiff = lLast - lFirst;
    const lPct = lFirst > 0 ? Math.round((lDiff / lFirst) * 100) : 0;
    const lRange = growthData.length >= 2 
      ? `${growthData[0].fecha} - ${growthData[growthData.length - 1].fecha}`
      : "";

    return {
      helpersTrendInfo: { first: hFirst, last: hLast, diff: hDiff, pct: hPct, range: hRange },
      helpersProtectionTrendInfo: { first: hpFirst, last: hpLast, diff: hpDiff, pct: hpPct, range: hpRange },
      lsaTrendInfo: { first: lFirst, last: lLast, diff: lDiff, pct: lPct, range: lRange }
    };
  }, [growthData]);

  // Histórico de relatos estudiados por los MCAs utilizando el campo Fecha
  const mcaStoriesHistoricalData = React.useMemo(() => {
    const dateMap: Record<string, Submission[]> = {};

    filteredSubs.forEach((sub) => {
      let dateVal = "2026-02-01";
      if (dateFieldId && sub.data[dateFieldId]) {
        dateVal = String(sub.data[dateFieldId]);
      } else {
        const foundDateKey = Object.keys(sub.data).find(k => {
          const val = sub.data[k];
          return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
        });
        if (foundDateKey) {
          dateVal = String(sub.data[foundDateKey]);
        } else if (sub.submittedAt) {
          dateVal = sub.submittedAt.split("T")[0];
        }
      }

      let dateKey = dateVal;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        dateKey = dateVal.substring(0, 7);
      }

      if (!dateMap[dateKey]) {
        dateMap[dateKey] = [];
      }
      dateMap[dateKey].push(sub);
    });

    const sortedDates = Object.keys(dateMap).sort();

    const formatDisplayDate = (key: string) => {
      if (/^\d{4}-\d{2}$/.test(key)) {
        const [year, month] = key.split("-");
        const months: Record<string, string> = {
          "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
          "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
          "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic"
        };
        return `${months[month] || month} ${year}`;
      }
      return key;
    };

    const storyNames = ["Orchard", "San Pedro", "Batula", "Bramour", "Miramar"];

    return sortedDates.map((dateKey) => {
      const subs = dateMap[dateKey];
      
      const counts: Record<string, number> = {};
      storyNames.forEach(s => { counts[s] = 0; });

      subs.forEach(sub => {
        const val = sub.data[FIELD_MCA_RELATOS];
        if (Array.isArray(val)) {
          val.forEach((story: string) => {
            const matched = storyNames.find(s => story.toLowerCase().includes(s.toLowerCase()));
            if (matched) {
              counts[matched]++;
            }
          });
        } else if (typeof val === "string") {
          const matched = storyNames.find(s => val.toLowerCase().includes(s.toLowerCase()));
          if (matched) {
            counts[matched]++;
          }
        }
      });

      return {
        fecha: formatDisplayDate(dateKey),
        rawFecha: dateKey,
        Orchard: counts["Orchard"],
        "San Pedro": counts["San Pedro"],
        Batula: counts["Batula"],
        Bramour: counts["Bramour"],
        Miramar: counts["Miramar"]
      };
    });
  }, [filteredSubs, dateFieldId]);

  const mcaStoriesTrendStats = React.useMemo(() => {
    const data = mcaStoriesHistoricalData;
    const len = data.length;
    const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
    
    const stats: Record<string, {
      recentChange: number;
      recentDirection: "up" | "down" | "none";
      firstVal: number;
      lastVal: number;
      prevVal: number;
      pctChange: number;
    }> = {};

    storyNames.forEach(key => {
      stats[key] = {
        recentChange: 0,
        recentDirection: "none",
        firstVal: 0,
        lastVal: 0,
        prevVal: 0,
        pctChange: 0
      };
    });

    if (len === 0) return stats;

    const firstPoint = data[0];
    const lastPoint = data[len - 1];
    const prevPoint = len >= 2 ? data[len - 2] : firstPoint;

    storyNames.forEach(key => {
      const firstVal = (firstPoint[key as keyof typeof firstPoint] as number) || 0;
      const lastVal = (lastPoint[key as keyof typeof lastPoint] as number) || 0;
      const prevVal = (prevPoint[key as keyof typeof prevPoint] as number) || 0;

      const recentChange = lastVal - prevVal;
      let recentDirection: "up" | "down" | "none" = "none";
      if (recentChange > 0) recentDirection = "up";
      else if (recentChange < 0) recentDirection = "down";

      const pctChange = prevVal > 0 ? Math.round((recentChange / prevVal) * 100) : 0;

      stats[key] = {
        recentChange,
        recentDirection,
        firstVal,
        lastVal,
        prevVal,
        pctChange
      };
    });

    return stats;
  }, [mcaStoriesHistoricalData]);


  // --- SISTEMA DE ORDENACIÓN Y BÚSQUEDA DE TABLAS ---
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to desc for easier metrics viewing
    }
  };

  const getSortedMcaRuhiStudied = () => {
    let result = mcaRuhiStudiedByLocationStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      if (sortField.startsWith("Libro ")) {
        valA = a.books[sortField] || 0;
        valB = b.books[sortField] || 0;
      }
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  };

  const getSortedMcaStories = () => {
    let result = mcaStoriesByLocationStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
      if (storyNames.includes(sortField)) {
        valA = a.stories[sortField] || 0;
        valB = b.stories[sortField] || 0;
      }
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  };

  const getSortedHelperStories = () => {
    let result = helperStoriesByLocationStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
      if (storyNames.includes(sortField)) {
        valA = a.stories[sortField] || 0;
        valB = b.stories[sortField] || 0;
      }
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  };

  const getSortedMcaSpaces = () => {
    let result = mcaSpacesByLocationStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  };

  const getSortedHelpersRuhiCompleted = () => {
    let result = helpersRuhiByLocationStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      if (sortField.startsWith("Libro ")) {
        const bookA = a.books[sortField];
        const bookB = b.books[sortField];
        valA = (bookA?.u1 || 0) + (bookA?.u2 || 0) + (bookA?.u3 || 0);
        valB = (bookB?.u1 || 0) + (bookB?.u2 || 0) + (bookB?.u3 || 0);
      }
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  };

  const getSortedHelpersRuhiStudying = () => {
    let result = helpersRuhiStudyingByLocationStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      if (sortField.startsWith("Libro ")) {
        const bookA = a.books[sortField];
        const bookB = b.books[sortField];
        valA = (bookA?.u1 || 0) + (bookA?.u2 || 0) + (bookA?.u3 || 0);
        valB = (bookB?.u1 || 0) + (bookB?.u2 || 0) + (bookB?.u3 || 0);
      }
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  };

  const getSortedHelpersStories = () => {
    let result = helpersStoriesByLocationStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];
      if (storyNames.includes(sortField)) {
        valA = a.stories[sortField] || 0;
        valB = b.stories[sortField] || 0;
      }
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  };

  const getSortedHelpersSpaces = () => {
    let result = helpersSpacesByLocationStats;
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(r => r.country.toLowerCase().includes(q) || r.region.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      let valA: any = a[sortField as keyof typeof a];
      let valB: any = b[sortField as keyof typeof b];
      if (valA === undefined) valA = 0;
      if (valB === undefined) valB = 0;
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc" ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });
  };


  return (
    <div className="space-y-6 min-h-[600px] text-slate-755 dark:text-slate-300">
      {/* Contenido Principal */}
      <div className="space-y-6">
        {/* BANNER DE NOTIFICACIÓN DE MODO REPORTE (SÓLO VISIBLE EN PANTALLA) */}
        {formalReportMode && (
          <div className="space-y-4 print:hidden">
            <div className="bg-gradient-to-r from-amber-600/10 via-yellow-600/5 to-transparent border-l-4 border-amber-500 bg-slate-950/60 p-4 rounded-r-2xl shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-xs font-black text-amber-400 uppercase tracking-wider block flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-amber-500 animate-pulse" />
                  Vista de Reporte Formal Activo
                </span>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  Este modo reestructura el panel para simular el formato de impresión real. Se han ocultado los selectores, filtros dinámicos y controles interactivos que no tienen sentido impresos, y se ha insertado un membrete institucional apto para exportación PDF o impresión física.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.focus();
                    window.print();
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Imprimir / Descargar PDF</span>
                </button>
                <button
                  onClick={() => setFormalReportMode(false)}
                  className="px-3 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl cursor-pointer transition-all active:scale-95"
                >
                  Salir del Modo
                </button>
              </div>
            </div>

            {/* SELECCIÓN DE SECCIONES PARA REPORTE MULTI-PÁGINA */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3 animate-fade-in">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <CheckSquare className="h-4 w-4 text-emerald-400" />
                Configurador del Reporte PDF (Multi-sección)
              </span>
              <p className="text-[11px] text-slate-400">
                Selecciona las secciones de estadísticas que deseas incluir en un solo documento compilado para su exportación a PDF. Cada sección seleccionada comenzará en una nueva página para asegurar un formato limpio de impresión.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl text-xs font-semibold text-slate-300 cursor-pointer transition-all select-none">
                  <input
                    type="checkbox"
                    checked={pdfSections.general}
                    onChange={(e) => setPdfSections(prev => ({ ...prev, general: e.target.checked }))}
                    className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500/30 h-4 w-4 cursor-pointer accent-emerald-500"
                  />
                  <span className="flex flex-col">
                    <span>1. Resumen General</span>
                    <span className="text-[9px] text-slate-500 font-normal">Consolidado y Salud</span>
                  </span>
                </label>
                <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl text-xs font-semibold text-slate-300 cursor-pointer transition-all select-none">
                  <input
                    type="checkbox"
                    checked={pdfSections.mca}
                    onChange={(e) => setPdfSections(prev => ({ ...prev, mca: e.target.checked }))}
                    className="rounded border-slate-800 text-blue-500 focus:ring-blue-500/30 h-4 w-4 cursor-pointer accent-blue-500"
                  />
                  <span className="flex flex-col">
                    <span>2. Miembros MCA</span>
                    <span className="text-[9px] text-slate-500 font-normal">Instituto y Salud MCA</span>
                  </span>
                </label>
                <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl text-xs font-semibold text-slate-300 cursor-pointer transition-all select-none">
                  <input
                    type="checkbox"
                    checked={pdfSections.helpers}
                    onChange={(e) => setPdfSections(prev => ({ ...prev, helpers: e.target.checked }))}
                    className="rounded border-slate-800 text-indigo-500 focus:ring-indigo-500/30 h-4 w-4 cursor-pointer accent-indigo-500"
                  />
                  <span className="flex flex-col">
                    <span>3. Ayudantes</span>
                    <span className="text-[9px] text-slate-500 font-normal">Instituto y Salud Auxiliar</span>
                  </span>
                </label>
                <label className="flex items-center gap-2.5 bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 p-2.5 rounded-xl text-xs font-semibold text-slate-300 cursor-pointer transition-all select-none">
                  <input
                    type="checkbox"
                    checked={pdfSections.lsa}
                    onChange={(e) => setPdfSections(prev => ({ ...prev, lsa: e.target.checked }))}
                    className="rounded border-slate-800 text-purple-500 focus:ring-purple-500/30 h-4 w-4 cursor-pointer accent-purple-500"
                  />
                  <span className="flex flex-col">
                    <span>4. Asambleas (AEL)</span>
                    <span className="text-[9px] text-slate-500 font-normal">Estado de Consejos</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* CABECERA INSTITUCIONAL PARA REPORTE FORMAL */}
        {formalReportMode && (
          <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-500">
                <NinePointedStar className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm md:text-base font-black text-white uppercase tracking-wider">CONSEJO REGIONAL DE LAS AMÉRICAS</h1>
                <p className="text-[10px] md:text-xs text-amber-400 font-extrabold uppercase tracking-widest">SISTEMA INTEGRAL DE REPORTES DE CUERPO AUXILIAR</p>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">GRUPO GEOGRÁFICO DE CENTROAMÉRICA • REPORTE DE DESARROLLO Y SALUD ESPIRITUAL</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left bg-slate-950/60 border border-slate-850 p-3 rounded-xl min-w-[240px]">
              <div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">País Seleccionado</span>
                <span className="text-[11px] font-bold text-white flex items-center gap-1.5 mt-0.5">
                  {renderCountryFlagImage(selectedCountry, "h-3 w-4.5 object-cover rounded-sm")}
                  <span>{selectedCountry === "Todos" ? "Todos (Grupo)" : selectedCountry}</span>
                </span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Área Geográfica</span>
                <span className="text-[11px] font-bold text-emerald-400">{selectedRegion === "Todas" ? "📊 Todas las Regiones" : selectedRegion}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Fecha de Emisión</span>
                <span className="text-[11px] font-bold text-blue-400">{new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <div>
                <span className="text-[8px] text-slate-500 uppercase tracking-widest block">Sección Activa</span>
                <span className="text-[11px] font-bold text-purple-400 truncate max-w-[120px]">
                  {{
                    general: "General Consolidado",
                    mca: "Miembros de Cuerpo Auxiliar (MCA)",
                    helpers: "Ayudantes",
                    lsa: "Asambleas (AEL)"
                  }[activeTab]}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Unified sticky container to keep both navigation tabs and filter selections fixed together during page scrolls */}
        <div className={`sticky top-0 z-30 flex flex-col w-full transition-all duration-300 shadow-sm ${formalReportMode ? "hidden print:hidden" : ""}`}>
          
          {/* LAYER 0: The Super-Header (Utility & Location Filters) */}
          <div className="relative z-40 w-full h-10 min-h-[40px] bg-[#F5F2EB]/95 dark:bg-[#1E1B18]/95 backdrop-blur-md border-b border-[#EAE5DF]/35 dark:border-[#2D2A26]/40 flex items-center justify-between px-6 transition-all duration-300">
            {/* Left Side: Displays three geographic dropdown filters in a row */}
            <div className="flex items-center gap-3">
              {/* Dropdown 1: Grupo Geográfico */}
              <div 
                ref={groupDropdownRef}
                className={`relative flex items-center justify-between h-7 w-40 min-w-[160px] bg-white/60 dark:bg-[#151311]/65 border border-[#EAE5DF]/60 dark:border-[#2D2A26]/80 rounded-lg px-2.5 transition-all duration-200 text-left select-none ${user && user.role === "health_team" ? "cursor-not-allowed opacity-75" : "hover:border-[#8FA89B]/55 dark:hover:border-[#8FA89B]/55 hover:bg-white dark:hover:bg-[#1C1917] cursor-pointer"}`}
                onClick={() => {
                  if (user && user.role === "health_team") return;
                  setIsGroupDropdownOpen(!isGroupDropdownOpen);
                }}
              >
                <div className="flex items-center gap-1.5 truncate pr-1">
                  <Globe className="h-3.5 w-3.5 text-[#8A847F] dark:text-[#A8A29E] shrink-0" />
                  <span className="text-[11px] font-medium text-[#3D3A37] dark:text-[#EAE5DF] truncate">
                    {selectedGroup}
                  </span>
                </div>
                {!(user && user.role === "health_team") && (
                  <ChevronDown className="h-3 w-3 text-[#8FA89B]/80 shrink-0" />
                )}

                <AnimatePresence>
                  {isGroupDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 top-full mt-1.5 w-44 bg-[#FCFAF7] dark:bg-[#1C1917] border border-[#EAE5DF]/60 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 overflow-hidden text-left"
                    >
                      {["Las Américas", "Centro América", "Sur América", "Norte América", "El Caribe"].map((grp) => (
                        <div
                          key={grp}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGroup(grp);
                            setSelectedCountry("Todos");
                            setSelectedRegion("Todas");
                            setIsGroupDropdownOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                            selectedGroup === grp
                              ? "bg-[#8FA89B]/10 text-[#5F756B] dark:text-[#8FA89B]"
                              : "text-[#3D3A37] dark:text-[#EAE5DF] hover:bg-[#8FA89B]/5"
                          }`}
                        >
                          <Globe className={`h-3 w-3 shrink-0 ${selectedGroup === grp ? "text-[#5F756B] dark:text-[#8FA89B]" : "text-[#8A847F]"}`} />
                          <span>{grp}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dropdown 2: País */}
              <div 
                ref={countryDropdownRef}
                className="relative flex items-center justify-between h-7 w-40 min-w-[160px] bg-white/60 dark:bg-[#151311]/65 border border-[#EAE5DF]/60 dark:border-[#2D2A26]/80 rounded-lg px-2.5 transition-all duration-200 text-left cursor-pointer select-none hover:border-[#8FA89B]/55 dark:hover:border-[#8FA89B]/55 hover:bg-white dark:hover:bg-[#1C1917]"
                onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              >
                <div className="flex items-center gap-1.5 truncate pr-1">
                  <MapPin className="h-3.5 w-3.5 text-[#8A847F] dark:text-[#A8A29E] shrink-0" />
                  <span className="text-[11px] font-medium text-[#3D3A37] dark:text-[#EAE5DF] truncate">
                    {selectedCountry === "Todos" ? "Todos los Países" : selectedCountry}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-[#8FA89B]/80 shrink-0" />

                <AnimatePresence>
                  {isCountryDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute left-0 top-full mt-1.5 w-44 bg-[#FCFAF7] dark:bg-[#1C1917] border border-[#EAE5DF]/60 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 max-h-60 overflow-y-auto text-left"
                    >
                      {/* Option "Todos" */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountry("Todos");
                          setSelectedRegion("Todas");
                          setIsCountryDropdownOpen(false);
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                          selectedCountry === "Todos"
                            ? "bg-[#8FA89B]/10 text-[#5F756B] dark:text-[#8FA89B]"
                            : "text-[#3D3A37] dark:text-[#EAE5DF] hover:bg-[#8FA89B]/5"
                        }`}
                      >
                        <Globe className="h-3.5 w-3.5 text-[#8A847F] dark:text-[#A8A29E] shrink-0" />
                        <span>{getCountryDisplayName("Todos", selectedGroup)}</span>
                      </div>

                      {/* List of Countries */}
                      {locations.filter(loc => isCountryInGroup(loc.country, selectedGroup)).map((loc) => (
                        <div
                          key={loc.country}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCountry(loc.country);
                            setSelectedRegion("Todas");
                            setIsCountryDropdownOpen(false);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                            selectedCountry === loc.country
                              ? "bg-[#8FA89B]/10 text-[#5F756B] dark:text-[#8FA89B]"
                              : "text-[#3D3A37] dark:text-[#EAE5DF] hover:bg-[#8FA89B]/5"
                          }`}
                        >
                          <MapPin className="h-3 w-3 text-[#8A847F] shrink-0" />
                          <span>{loc.country}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Dropdown 3: Regiones */}
              {(() => {
                const hasRegions = selectedCountry !== "Todos" && (locations.find((l) => l.country === selectedCountry)?.regions || []).length > 0;
                const availableRegions = hasRegions ? (locations.find((l) => l.country === selectedCountry)?.regions || []) : [];
                
                return (
                  <div 
                    ref={regionDropdownRef}
                    className={`relative flex items-center justify-between h-7 w-40 min-w-[160px] rounded-lg px-2.5 transition-all duration-200 text-left select-none border ${
                      hasRegions 
                        ? "bg-white/60 dark:bg-[#151311]/65 border-[#EAE5DF]/60 dark:border-[#2D2A26]/80 hover:border-[#8FA89B]/55 dark:hover:border-[#8FA89B]/55 hover:bg-white dark:hover:bg-[#1C1917] cursor-pointer" 
                        : "bg-[#EAE5DF]/10 dark:bg-[#2D2A26]/10 border-[#EAE5DF]/30 dark:border-[#2D2A26]/30 text-[#8A847F]/40 dark:text-[#A8A29E]/30 cursor-not-allowed"
                    }`}
                    onClick={() => {
                      if (hasRegions) {
                        setIsRegionDropdownOpen(!isRegionDropdownOpen);
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5 truncate pr-1">
                      <Map className="h-3.5 w-3.5 text-[#8A847F] dark:text-[#A8A29E] shrink-0" />
                      <span className="text-[11px] font-medium truncate">
                        {selectedCountry === "Todos" 
                          ? "Todas las Regiones" 
                          : (selectedRegion === "Todas" ? "Todas las Regiones" : selectedRegion)
                        }
                      </span>
                    </div>
                    {hasRegions && <ChevronDown className="h-3 w-3 text-[#8FA89B]/80 shrink-0" />}

                    <AnimatePresence>
                      {hasRegions && isRegionDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.95 }}
                          transition={{ duration: 0.12 }}
                          className="absolute left-0 top-full mt-1.5 w-44 bg-[#FCFAF7] dark:bg-[#1C1917] border border-[#EAE5DF]/60 dark:border-slate-800 rounded-lg shadow-lg py-1 z-50 max-h-60 overflow-y-auto text-left"
                        >
                          {/* Option "Todas" */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRegion("Todas");
                              setIsRegionDropdownOpen(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                              selectedRegion === "Todas"
                                ? "bg-[#8FA89B]/10 text-[#5F756B] dark:text-[#8FA89B]"
                                : "text-[#3D3A37] dark:text-[#EAE5DF] hover:bg-[#8FA89B]/5"
                            }`}
                          >
                            <Map className="h-3.5 w-3.5 text-[#8A847F] dark:text-[#A8A29E] shrink-0" />
                            <span>Todas las Regiones</span>
                          </div>

                          {/* List of Regions */}
                          {availableRegions.map((reg) => (
                            <div
                              key={reg}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRegion(reg);
                                setIsRegionDropdownOpen(false);
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-colors ${
                                selectedRegion === reg
                                  ? "bg-[#8FA89B]/10 text-[#5F756B] dark:text-[#8FA89B]"
                                  : "text-[#3D3A37] dark:text-[#EAE5DF] hover:bg-[#8FA89B]/5"
                              }`}
                            >
                              <Map className="h-3.5 w-3.5 text-[#8A847F] dark:text-[#A8A29E] shrink-0" />
                              <span>{reg}</span>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })()}
            </div>

            {/* Right Side: Spacer */}
            <div className="hidden sm:block w-[120px] shrink-0"></div>
          </div>

          {/* LAYER 1: The Main Navigation Header (Sticky Menu) */}
          <div className="relative z-10 w-full h-16 min-h-[64px] bg-[#FCFAF7]/95 dark:bg-[#1A1816]/95 backdrop-blur-md border-b border-[#EAE5DF]/60 dark:border-[#2D2A26]/80 flex items-center justify-between px-6 transition-all duration-300">
            {/* Left Side: Spacer to preserve center alignment */}
            <div className="flex items-center gap-2.5 w-[160px] shrink-0">
            </div>

            {/* Center Section: Main navigation tabs in Title Case */}
            <div className="flex items-center p-1 bg-[#EAE5DF]/20 dark:bg-[#2D2A26]/20 rounded-full border border-[#EAE5DF]/40 dark:border-[#2D2A26]/40 shadow-inner">
              {/* General */}
              <button
                onClick={() => {
                  setActiveTab("general");
                  setSubTab("resumen");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeTab === "general"
                    ? "bg-[#8FA89B] text-white font-semibold shadow-md"
                    : "text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF]"
                }`}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>General</span>
              </button>

              {/* MCA */}
              <button
                onClick={() => {
                  setActiveTab("mca");
                  setSubTab("instituto");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeTab === "mca"
                    ? "bg-[#8FA89B] text-white font-semibold shadow-md"
                    : "text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF]"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>MCA</span>
              </button>

              {/* Ayudantes */}
              <button
                onClick={() => {
                  setActiveTab("helpers");
                  setSubTab("instituto");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeTab === "helpers"
                    ? "bg-[#8FA89B] text-white font-semibold shadow-md"
                    : "text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF]"
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>Ayudantes</span>
              </button>

              {/* AEL */}
              <button
                onClick={() => {
                  setActiveTab("lsa");
                  setSubTab("capacitacion");
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 cursor-pointer whitespace-nowrap ${
                  activeTab === "lsa"
                    ? "bg-[#8FA89B] text-white font-semibold shadow-md"
                    : "text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF]"
                }`}
              >
                <NinePointedStar className="h-3.5 w-3.5" />
                <span>AEL</span>
              </button>
            </div>

            {/* Right Side: The Acciones Dropdown */}
            <div className="relative flex items-center justify-end w-[160px] shrink-0">
              <button
                onClick={() => {
                  setShowExportDropdown(!showExportDropdown);
                }}
                className="relative flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-semibold text-[#3D3A37] dark:text-[#EAE5DF] hover:bg-[#EAE5DF]/30 dark:hover:bg-[#2C2925]/40 bg-white/50 dark:bg-[#151311]/50 border border-[#EAE5DF] dark:border-[#2D2A26] hover:border-[#8FA89B]/55 transition-all cursor-pointer shadow-sm select-none shrink-0"
                id="dashboard-actions-dropdown-trigger"
              >
                <div className="relative flex items-center justify-center">
                  <RefreshCw className={`h-3.5 w-3.5 text-[#8FA89B] shrink-0 ${loading ? "animate-spin" : "hidden"}`} />
                  <Download className={`h-3.5 w-3.5 text-[#8FA89B] shrink-0 ${loading ? "hidden" : ""}`} />
                </div>
                <span>{loading ? "Sincronizando..." : "Acciones"}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-[#8FA89B]/70 transition-transform duration-200 ${showExportDropdown ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showExportDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowExportDropdown(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 top-12 mt-1 w-52 bg-white dark:bg-[#1C1917] border border-[#EAE5DF] dark:border-[#2D2A26] rounded-xl p-1.5 shadow-xl z-50 text-left space-y-0.5 font-sans"
                    >
                      <button
                        onClick={async () => {
                          setShowExportDropdown(false);
                          await fetchData();
                        }}
                        disabled={loading}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#5F756B] dark:text-[#C5C0BA] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF] hover:bg-[#EAE5DF]/40 dark:hover:bg-[#2C2925]/50 transition-colors cursor-pointer text-left disabled:opacity-50"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 text-[#8FA89B] shrink-0 ${loading ? "animate-spin" : ""}`} />
                        <span>Sincronizar Datos</span>
                      </button>

                      <div className="h-[1px] bg-[#EAE5DF] dark:bg-[#2D2A26] my-1" />

                      <button
                        onClick={() => {
                          window.focus();
                          window.print();
                          setShowExportDropdown(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-[#5F756B] dark:text-[#C5C0BA] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF] hover:bg-[#EAE5DF]/40 dark:hover:bg-[#2C2925]/50 transition-colors cursor-pointer text-left"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#8FA89B] shrink-0" />
                        <span>Imprimir / PDF</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Conditional Sub-Tabs Menu bar transition */}
          <AnimatePresence initial={false} mode="wait">
            {(activeTab === "mca" || activeTab === "helpers" || activeTab === "lsa") && (
              <motion.div
                key={`${activeTab}-subtabs`}
                initial={{ height: 0, opacity: 0, y: -8 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden w-full bg-[#FCFAF7]/50 dark:bg-[#1A1816]/50 border-b border-[#EAE5DF]/40 dark:border-[#2D2A26]/40 py-2.5 flex justify-center"
              >
                <div className="flex items-center gap-2 p-1 bg-[#FCFAF7]/80 dark:bg-[#151311]/80 border border-[#EAE5DF]/60 dark:border-[#2D2A26]/80 rounded-xl shadow-inner">
                  {/* Instituto */}
                  {activeTab !== "lsa" && (
                    <button
                      onClick={() => setSubTab("instituto")}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                        subTab === "instituto"
                          ? "bg-[#8FA89B]/10 dark:bg-[#8FA89B]/15 border border-[#8FA89B]/30 text-[#5F756B] dark:text-[#8FA89B] shadow-sm font-bold"
                          : "border border-transparent text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF] hover:bg-[#EAE5DF]/35"
                      }`}
                    >
                      <BookOpen className="h-3 w-3" />
                      <span>Instituto</span>
                    </button>
                  )}

                  {/* Capacitación */}
                  <button
                    onClick={() => setSubTab("capacitacion")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                      subTab === "capacitacion"
                        ? "bg-[#8FA89B]/10 dark:bg-[#8FA89B]/15 border border-[#8FA89B]/30 text-[#5F756B] dark:text-[#8FA89B] shadow-sm font-bold"
                        : "border border-transparent text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF] hover:bg-[#EAE5DF]/35"
                    }`}
                  >
                    <Sliders className="h-3 w-3" />
                    <span>Capacitación</span>
                  </button>

                  {/* Espacios de Salud */}
                  <button
                    onClick={() => setSubTab("espacios")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                      subTab === "espacios"
                        ? "bg-[#8FA89B]/10 dark:bg-[#8FA89B]/15 border border-[#8FA89B]/30 text-[#5F756B] dark:text-[#8FA89B] shadow-sm font-bold"
                        : "border border-transparent text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF] hover:bg-[#EAE5DF]/35"
                    }`}
                  >
                    <Sprout className="h-3 w-3" />
                    <span>Espacios de Salud</span>
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === "general" && (
              <motion.div
                key="general-subtabs"
                initial={{ height: 0, opacity: 0, y: -8 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden w-full bg-[#FCFAF7]/50 dark:bg-[#1A1816]/50 border-b border-[#EAE5DF]/40 dark:border-[#2D2A26]/40 py-2.5 flex justify-center"
              >
                <div className="flex items-center gap-2 p-1 bg-[#FCFAF7]/80 dark:bg-[#151311]/80 border border-[#EAE5DF]/60 dark:border-[#2D2A26]/80 rounded-xl shadow-inner">
                  {/* Resumen */}
                  <button
                    onClick={() => setSubTab("resumen")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                      subTab === "resumen"
                        ? "bg-[#8FA89B]/10 dark:bg-[#8FA89B]/15 border border-[#8FA89B]/30 text-[#5F756B] dark:text-[#8FA89B] shadow-sm font-bold"
                        : "border border-transparent text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF] hover:bg-[#EAE5DF]/35"
                    }`}
                  >
                    <BookOpen className="h-3 w-3" />
                    <span>Resumen</span>
                  </button>

                  {/* Temas de Salud Espiritual */}
                  <button
                    onClick={() => setSubTab("temas")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold tracking-tight transition-all duration-200 cursor-pointer ${
                      subTab === "temas"
                        ? "bg-[#8FA89B]/10 dark:bg-[#8FA89B]/15 border border-[#8FA89B]/30 text-[#5F756B] dark:text-[#8FA89B] shadow-sm font-bold"
                        : "border border-transparent text-[#8A847F] dark:text-[#A8A29E] hover:text-[#3D3A37] dark:hover:text-[#EAE5DF] hover:bg-[#EAE5DF]/35"
                    }`}
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Temas de Salud Espiritual</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ================== DETALLE DE ÁREAS SELECCIONADAS ================== */}
        <AnimatePresence mode="wait">
          <motion.div
            key={formalReportMode ? "formal_report_document" : (activeTab + "_" + subTab)}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="space-y-4"
          >

          {((!formalReportMode && activeTab === "general") || (formalReportMode && pdfSections.general)) && (
            <div className={`bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 ${formalReportMode ? "page-break mb-10 print:mb-0 print:border-none print:shadow-none print:bg-transparent print:p-0" : "animate-fade-in"}`}>
              {formalReportMode && (
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                    <Globe className="h-4.5 w-4.5 text-emerald-400" />
                    Sección I: Resumen General Consolidado ({getGroupConsolidatedLabel(selectedCountry, selectedGroup)})
                  </h2>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase print:hidden">Sección 1</span>
                </div>
              )}
              {(!formalReportMode ? subTab === "resumen" : true) && (
                <>
                  {/* Resumen Superior de Datos (General) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 border-b border-slate-850 pb-6">
                {/* Tarjeta 1: Miembros de Cuerpo Auxiliar */}
                <div className="bg-slate-950/25 hover:bg-slate-950/50 border border-slate-850 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(59,130,246,0.06)] group cursor-default">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all duration-300 border border-blue-500/20">
                      <Users className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider block">Miembros de Cuerpo Auxiliar</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-white group-hover:scale-105 transition-transform duration-300 tracking-tight">{mcaTotalRegistered}</span>
                  </div>
                  {dateTrendMetrics.hasTrend && (
                    <div className="flex items-center gap-1.5 pt-2.5 mt-1 justify-center border-t border-slate-900/60 w-full text-[10px]">
                      {dateTrendMetrics.mca.state === "up" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fade-in">
                          <TrendingUp className="h-3 w-3" />
                          +{dateTrendMetrics.mca.pct}%
                        </span>
                      )}
                      {dateTrendMetrics.mca.state === "down" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-fade-in">
                          <TrendingDown className="h-3 w-3" />
                          {dateTrendMetrics.mca.pct}%
                        </span>
                      )}
                      {dateTrendMetrics.mca.state === "neutral" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-750/40">
                          = 0%
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-semibold">vs {dateTrendMetrics.prevDateLabel}</span>
                    </div>
                  )}
                </div>

                {/* Tarjeta 2: Ayudantes Nombrados */}
                <div className="bg-slate-950/25 hover:bg-slate-950/50 border border-slate-850 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(99,102,241,0.06)] group cursor-default">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-300 border border-indigo-500/20">
                      <Briefcase className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">Ayudantes</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-white group-hover:scale-105 transition-transform duration-300 tracking-tight">{helpersTotalNamed}</span>
                  </div>
                  {dateTrendMetrics.hasTrend && (
                    <div className="flex items-center gap-1.5 pt-2.5 mt-1 justify-center border-t border-slate-900/60 w-full text-[10px]">
                      {dateTrendMetrics.helpers.state === "up" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fade-in">
                          <TrendingUp className="h-3 w-3" />
                          +{dateTrendMetrics.helpers.pct}%
                        </span>
                      )}
                      {dateTrendMetrics.helpers.state === "down" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-fade-in">
                          <TrendingDown className="h-3 w-3" />
                          {dateTrendMetrics.helpers.pct}%
                        </span>
                      )}
                      {dateTrendMetrics.helpers.state === "neutral" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-750/40">
                          = 0%
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-semibold">vs {dateTrendMetrics.prevDateLabel}</span>
                    </div>
                  )}
                </div>

                {/* Tarjeta 3: Ayudantes para Protección */}
                <div className="bg-slate-950/25 hover:bg-slate-950/50 border border-slate-850 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(16,185,129,0.06)] group cursor-default">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300 border border-emerald-500/20">
                      <Shield className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">Ayudantes para Protección</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-white group-hover:scale-105 transition-transform duration-300 tracking-tight">{helpersProtectionCount}</span>
                  </div>
                  {dateTrendMetrics.hasTrend && (
                    <div className="flex items-center gap-1.5 pt-2.5 mt-1 justify-center border-t border-slate-900/60 w-full text-[10px]">
                      {dateTrendMetrics.helpersProtection.state === "up" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fade-in">
                          <TrendingUp className="h-3 w-3" />
                          +{dateTrendMetrics.helpersProtection.pct}%
                        </span>
                      )}
                      {dateTrendMetrics.helpersProtection.state === "down" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-fade-in">
                          <TrendingDown className="h-3 w-3" />
                          {dateTrendMetrics.helpersProtection.pct}%
                        </span>
                      )}
                      {dateTrendMetrics.helpersProtection.state === "neutral" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-750/40">
                          = 0%
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-semibold">vs {dateTrendMetrics.prevDateLabel}</span>
                    </div>
                  )}
                </div>

                {/* Tarjeta 4: Asambleas Locales (AEL) */}
                <div className="bg-slate-950/25 hover:bg-slate-950/50 border border-slate-850 hover:border-purple-500/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(168,85,247,0.06)] group cursor-default">
                  <div className="flex items-center gap-2 justify-center">
                    <div className="p-1.5 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all duration-300 border border-purple-500/20">
                      <NinePointedStar className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider block">Asambleas Espirituales Locales</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-4xl font-black text-white group-hover:scale-105 transition-transform duration-300 tracking-tight">{lsaTotalCount}</span>
                  </div>
                  {dateTrendMetrics.hasTrend && (
                    <div className="flex items-center gap-1.5 pt-2.5 mt-1 justify-center border-t border-slate-900/60 w-full text-[10px]">
                      {dateTrendMetrics.lsa.state === "up" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-fade-in">
                          <TrendingUp className="h-3 w-3" />
                          +{dateTrendMetrics.lsa.pct}%
                        </span>
                      )}
                      {dateTrendMetrics.lsa.state === "down" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-fade-in">
                          <TrendingDown className="h-3 w-3" />
                          {dateTrendMetrics.lsa.pct}%
                        </span>
                      )}
                      {dateTrendMetrics.lsa.state === "neutral" && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-750/40">
                          = 0%
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-semibold">vs {dateTrendMetrics.prevDateLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* --- INTERACTIVE MAP OF THE AMERICAS --- */}
              {(() => {
                const getCountryStatsForMap = (countryName: string) => {
                  const normalize = (s: string) => s ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
                  const normName = normalize(countryName);

                  // Si no pertenece al grupo geográfico activo, retornar vacío
                  if (!isCountryInGroup(countryName, selectedGroup)) {
                    return {
                      totalMca: 0,
                      totalHelpers: 0,
                      totalHelpersProtection: 0,
                      totalLsa: 0,
                      hasData: false
                    };
                  }

                  // Si se ha seleccionado un país específico y no coincide con este, retornar vacío (el filtro activo no contiene este país)
                  if (selectedCountry !== "Todos" && normalize(selectedCountry) !== normName) {
                    return {
                      totalMca: 0,
                      totalHelpers: 0,
                      totalHelpersProtection: 0,
                      totalLsa: 0,
                      hasData: false
                    };
                  }

                  let mcas = dbUsers.filter(u => u.role === "user" && !u.archived && normalize(u.country) === normName);
                  if (selectedRegion !== "Todas") {
                    mcas = mcas.filter(u => u.region && normalize(u.region) === normalize(selectedRegion));
                  }
                  const totalMca = mcas.length;

                  let countrySubs = activeSubmissions.filter(s => normalize(s.userCountry) === normName);
                  if (selectedRegion !== "Todas") {
                    countrySubs = countrySubs.filter(s => s.userRegion && normalize(s.userRegion) === normalize(selectedRegion));
                  }
                  const latestCountrySubs = getLatestSubmissionsByEmail(countrySubs);

                  const totalHelpers = latestCountrySubs.reduce((sum, sub) => {
                    return sum + (Number(sub.data[FIELD_AYUDANTES_NOMBRADOS]) || 0);
                  }, 0);

                  const totalHelpersProtection = latestCountrySubs.reduce((sum, sub) => {
                    const valObj = sub.data[FIELD_AYUDANTES_PROTECCION];
                    if (valObj && typeof valObj === "object") {
                      const ans = valObj.answer;
                      if (ans === "Sí" || ans === "Si") {
                        const num = Number(valObj.justification);
                        return sum + (isNaN(num) ? 1 : num);
                      }
                    } else if (valObj === "Sí" || valObj === "Si") {
                      return sum + 1;
                    }
                    return sum;
                  }, 0);

                  const totalLsa = getSumLsaFromSubmissions(latestCountrySubs);

                  return {
                    totalMca,
                    totalHelpers,
                    totalHelpersProtection,
                    totalLsa,
                    hasData: totalMca > 0 || totalHelpers > 0 || totalHelpersProtection > 0 || totalLsa > 0
                  };
                };

                const getCountryStatsRaw = (countryName: string) => {
                  const normalize = (s: string) => s ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() : "";
                  const normName = normalize(countryName);

                  let mcas = dbUsers.filter(u => u.role === "user" && !u.archived && normalize(u.country) === normName);
                  if (selectedRegion !== "Todas") {
                    mcas = mcas.filter(u => u.region && normalize(u.region) === normalize(selectedRegion));
                  }
                  const totalMca = mcas.length;

                  let countrySubs = activeSubmissions.filter(s => normalize(s.userCountry) === normName);
                  if (selectedRegion !== "Todas") {
                    countrySubs = countrySubs.filter(s => s.userRegion && normalize(s.userRegion) === normalize(selectedRegion));
                  }
                  const latestCountrySubs = getLatestSubmissionsByEmail(countrySubs);

                  const totalHelpers = latestCountrySubs.reduce((sum, sub) => {
                    return sum + (Number(sub.data[FIELD_AYUDANTES_NOMBRADOS]) || 0);
                  }, 0);

                  const totalHelpersProtection = latestCountrySubs.reduce((sum, sub) => {
                    const valObj = sub.data[FIELD_AYUDANTES_PROTECCION];
                    if (valObj && typeof valObj === "object") {
                      const ans = valObj.answer;
                      if (ans === "Sí" || ans === "Si") {
                        const num = Number(valObj.justification);
                        return sum + (isNaN(num) ? 1 : num);
                      }
                    } else if (valObj === "Sí" || valObj === "Si") {
                      return sum + 1;
                    }
                    return sum;
                  }, 0);

                  const totalLsa = getSumLsaFromSubmissions(latestCountrySubs);

                  return {
                    totalMca,
                    totalHelpers,
                    totalHelpersProtection,
                    totalLsa,
                    hasData: totalMca > 0 || totalHelpers > 0 || totalHelpersProtection > 0 || totalLsa > 0
                  };
                };

                const filteredFeatures = geoJsonData?.features?.filter((f: any) => {
                  return isCountryAllowedInMap(f.properties, selectedGroup);
                }) || [];

                const mapWidth = 640;
                const mapHeight = 500;
                const projection = d3.geoMercator();
                if (filteredFeatures.length > 0) {
                  projection.fitSize([mapWidth, mapHeight], {
                    type: "FeatureCollection",
                    features: filteredFeatures
                  });
                }
                const pathGenerator = d3.geoPath().projection(projection);

                return (
                  <div className="border-t border-slate-800/80 pt-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-500" />
                          <span>Mapa Interactivo de las Américas</span>
                        </h3>
                        <p className="text-xs text-slate-400">
                          Visualiza y selecciona la presencia de recursos y estructuras en cada país del continente.
                        </p>
                      </div>

                    </div>

                    <div className="w-full bg-slate-950/25 border border-slate-850 rounded-xl p-4">
                      {/* El Mapa SVG de las Américas */}
                      <div className="w-full flex flex-col justify-center items-center relative overflow-hidden bg-slate-900/10 border border-slate-850/50 rounded-xl p-4 min-h-[520px]">
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur border border-slate-800/80 rounded-lg px-2.5 py-1 text-[10px] text-slate-400 font-medium select-none font-sans z-10">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Haga clic para seleccionar o filtrar</span>
                        </div>

                        {/* Controles de Zoom / Reset */}
                        {!mapLoading && !mapError && (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg p-1 z-10 select-none shadow-lg">
                            <button
                              onClick={handleZoomIn}
                              title="Acercar (Zoom In)"
                              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <ZoomIn className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleZoomOut}
                              title="Alejar (Zoom Out)"
                              className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              <ZoomOut className="h-4 w-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>
                            <button
                              onClick={handleZoomReset}
                              title="Restablecer vista"
                              className="px-2 py-1 hover:bg-slate-800 rounded text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                              100%
                            </button>
                          </div>
                        )}

                        {mapLoading && (
                          <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 font-sans">
                            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
                            <span className="text-[11px] font-medium">Cargando mapa geográfico real...</span>
                          </div>
                        )}

                        {mapError && !mapLoading && (
                          <div className="text-center p-4 text-xs text-rose-400 font-medium max-w-[240px] font-sans">
                            No se pudo cargar el mapa detallado. Verifique su conexión o intente nuevamente.
                          </div>
                        )}

                        {!mapLoading && !mapError && (
                          <svg
                            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
                            className="w-full h-full max-w-full max-h-[500px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] select-none cursor-grab active:cursor-grabbing outline-none"
                            onMouseDown={handleMapMouseDown}
                            onMouseMove={handleMapMouseMove}
                            onMouseUp={handleMapMouseUp}
                            onMouseLeave={handleMapMouseUp}
                          >
                            <g transform={`translate(${panX}, ${panY}) translate(${mapWidth / 2}, ${mapHeight / 2}) scale(${zoomScale}) translate(${-mapWidth / 2}, ${-mapHeight / 2})`}>
                              {/* Dibujar los países de las Américas */}
                              {filteredFeatures.map((f: any, index: number) => {
                                const dbName = getDbCountryName(f.properties);
                                const stats = getCountryStatsForMap(dbName);
                                const isSelected = selectedCountry === "Todos" 
                                  ? false
                                  : selectedCountry.toLowerCase() === dbName.toLowerCase();
                                const countryPropName = f.properties.name || f.properties.NAME || "";
                                const isHovered = hoveredMapCountry === countryPropName;

                                const pathD = pathGenerator(f);
                                
                                // Calcular centro visual real
                                const centroid = d3.geoCentroid(f);
                                const coords = projection(centroid);
                                const isValidCoords = coords && !isNaN(coords[0]) && !isNaN(coords[1]);

                                // Determinar color de relleno y contorno
                                let fillClass = "";
                                if (stats.hasData) {
                                  if (selectedCountry === "Todos") {
                                    fillClass = "fill-blue-500/20 dark:fill-blue-500/15 stroke-blue-500/30";
                                  } else {
                                    fillClass = "fill-blue-500/10 dark:fill-blue-500/5 stroke-blue-500/30";
                                  }
                                } else {
                                  // Grey out countries with no data
                                  fillClass = "fill-slate-800/20 dark:fill-slate-900/25 stroke-slate-700/10 dark:stroke-slate-800/15";
                                }

                                if (isHovered) {
                                  fillClass = stats.hasData
                                    ? "fill-blue-500/30 dark:fill-blue-500/20 stroke-blue-400 cursor-pointer"
                                    : "fill-slate-700/30 dark:fill-slate-800/35 stroke-slate-600/30 cursor-pointer";
                                }

                                if (isSelected) {
                                  fillClass = "fill-blue-500/40 dark:fill-blue-600/30 stroke-blue-400 cursor-pointer drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]";
                                }

                                return (
                                  <g key={countryPropName || index}>
                                    {pathD && (
                                      <path
                                        d={pathD}
                                        className={`${fillClass} transition-all duration-200`}
                                        onMouseEnter={() => setHoveredMapCountry(countryPropName)}
                                        onMouseLeave={() => setHoveredMapCountry(null)}
                                        onClick={(e) => {
                                          if (mouseDownPos) {
                                            const dx = Math.abs(e.clientX - mouseDownPos.x);
                                            const dy = Math.abs(e.clientY - mouseDownPos.y);
                                            if (dx > 6 || dy > 6) {
                                              // Se detectó arrastre (paneo), evitar selección
                                              return;
                                            }
                                          }
                                          // Si ya está seleccionado, volver a Todos; si no, seleccionar el país
                                          if (selectedCountry.toLowerCase() === dbName.toLowerCase()) {
                                            setSelectedCountry("Todos");
                                            setSelectedRegion("Todas");
                                            setSelectedMapCountry("");
                                          } else {
                                            setSelectedCountry(dbName);
                                            setSelectedRegion("Todas");
                                            setSelectedMapCountry(dbName);
                                          }
                                        }}
                                      />
                                    )}
                                  </g>
                                );
                              })}
                            </g>
                          </svg>
                        )}
                        
                        {/* Tooltip flotante simple visible todo el tiempo */}
                        {!mapLoading && !mapError && (() => {
                          let title = "Toda la región";
                          let stats = {
                            totalMca: filteredUsrList.length,
                            totalHelpers: helpersTotalNamed,
                            totalHelpersProtection: helpersProtectionCount,
                            totalLsa: lsaTotalCount,
                            hasData: filteredUsrList.length > 0 || helpersTotalNamed > 0 || helpersProtectionCount > 0 || lsaTotalCount > 0
                          };
                          let isHoveredState = false;

                          if (hoveredMapCountry) {
                            const f = filteredFeatures.find((x: any) => (x.properties.name || x.properties.NAME) === hoveredMapCountry);
                            if (f) {
                              title = getDbCountryName(f.properties);
                              stats = getCountryStatsRaw(title);
                              isHoveredState = true;
                            }
                          } else if (selectedCountry !== "Todos") {
                            title = selectedCountry;
                          } else if (selectedRegion !== "Todas") {
                            title = selectedRegion;
                          }

                          return (
                            <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-2xl text-left space-y-2.5 z-10 pointer-events-none font-sans min-w-[210px] transition-all duration-300 transform scale-100 animate-fade-in">
                              <div className="flex items-center gap-2 border-b border-slate-800/85 pb-1.5">
                                <div className={`p-1 rounded ${isHoveredState ? "bg-emerald-500/10 text-emerald-400" : "bg-blue-500/10 text-blue-400"}`}>
                                  {isHoveredState ? <MapPin className="h-3.5 w-3.5 animate-pulse" /> : <Globe className="h-3.5 w-3.5" />}
                                </div>
                                <span className="text-xs font-black text-white tracking-wide">
                                  {title}
                                  {isHoveredState && <span className="text-[9px] text-emerald-400 ml-1.5 font-bold uppercase tracking-wider">(Vista previa)</span>}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-1.5 text-[11px] font-medium text-slate-400">
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>MCAs:</span>
                                  <span className="font-extrabold text-white">{stats.totalMca}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>Ayudantes:</span>
                                  <span className="font-extrabold text-white">{stats.totalHelpers}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Ayudantes de Protección:</span>
                                  <span className="font-extrabold text-white">{stats.totalHelpersProtection}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>Asambleas:</span>
                                  <span className="font-extrabold text-white">{stats.totalLsa}</span>
                                </div>
                              </div>
                              {!stats.hasData && (
                                <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider text-center pt-1 border-t border-slate-900/40">
                                  Sin reportes registrados
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

              {/* Contenido según el View Mode */}
              {((viewMode === "both" || viewMode === "charts") || formalReportMode) && (
                <div className="space-y-6">
                  {/* Sección: Temas Recurrentes de Salud Espiritual */}
                  {(!formalReportMode ? subTab === "temas" : true) && (
                    <div className={`space-y-4 ${formalReportMode ? "pt-6 border-t border-slate-800" : "animate-fade-in"}`} style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                      {formalReportMode && (
                        <div className="hidden print:block pb-4 mb-4 border-b border-slate-800">
                          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-emerald-400" />
                            Parte B: Detalle de Temas de Salud Espiritual ({selectedCountry})
                          </h3>
                        </div>
                      )}
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block flex items-center gap-1.5 pt-2">
                      <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                      Temas Recurrentes de Salud Espiritual
                    </span>
                    <div className="grid grid-cols-1 gap-6">
                    {/* MAPA INTERACTIVO DE TEMAS RECURRENTES */}
                    <div className="bg-slate-950/35 border border-slate-850 rounded-2xl p-5 space-y-5 shadow-xl">
                      {/* Cabecera del Mapa */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850/60 pb-4">
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-emerald-400 animate-pulse" />
                            <span>Mapa de Intensidad por Tema de Salud Espiritual</span>
                          </h3>
                          <p className="text-xs text-slate-400">
                            Mapa interactivo que muestra con qué frecuencia aparece cada tema de salud espiritual en los distintos países y regiones del continente.
                          </p>
                        </div>

                        {/* Filtro por Tema de Salud Espiritual */}
                        <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-800 rounded-xl p-1.5 px-3">
                          <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Filtrar por Tema:</span>
                          <select
                            id="map_theme_select"
                            value={selectedThemeForMap}
                            onChange={(e) => setSelectedThemeForMap(e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-black text-emerald-400 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                          >
                            <option value="__SIN_FILTRO__">Sin filtro (Limpiar mapa)</option>
                            {themeIntensityData.allTopics.map((topic) => (
                              <option key={topic} value={topic}>{topic}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Tarjetas Informativas / Métricas */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Menciones Totales</span>
                          <span className="text-2xl font-black text-emerald-400">{themeMapStats.totalMentions}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">En todo el continente</span>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Países con este Tema</span>
                          <span className="text-2xl font-black text-emerald-400">{themeMapStats.countriesCount}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">Con al menos una mención</span>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-1">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Regiones Afectadas</span>
                          <span className="text-2xl font-black text-emerald-400">{themeMapStats.regionsCount}</span>
                          <span className="text-[10px] text-slate-500 font-semibold">Con al menos una mención</span>
                        </div>
                      </div>

                      {/* Contenedor del Mapa e Información */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* El Mapa SVG */}
                        <div className="lg:col-span-8 bg-slate-950/20 border border-slate-850/80 rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden min-h-[480px]">
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/60 backdrop-blur border border-slate-800/80 rounded-lg px-2.5 py-1 text-[10px] text-slate-400 font-medium select-none font-sans z-10">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Haga clic para ver desglose de regiones</span>
                          </div>

                          {/* Controles de Zoom / Reset */}
                          {!mapLoading && !mapError && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg p-1 z-10 select-none shadow-lg">
                              <button
                                onClick={handleThemeMapZoomIn}
                                title="Acercar (Zoom In)"
                                className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                              >
                                <ZoomIn className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleThemeMapZoomOut}
                                title="Alejar (Zoom Out)"
                                className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                              >
                                <ZoomOut className="h-4 w-4" />
                              </button>
                              <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>
                              <button
                                onClick={handleThemeMapZoomReset}
                                title="Restablecer vista"
                                className="px-2 py-1 hover:bg-slate-800 rounded text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                100%
                              </button>
                            </div>
                          )}

                          {mapLoading && (
                            <div className="flex flex-col items-center justify-center space-y-2 text-slate-400 font-sans">
                              <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
                              <span className="text-[11px] font-medium">Cargando mapa geográfico...</span>
                            </div>
                          )}

                          {mapError && !mapLoading && (
                            <div className="text-center p-4 text-xs text-rose-400 font-medium max-w-[240px] font-sans">
                              No se pudo cargar el mapa geográfico.
                            </div>
                          )}

                          {!mapLoading && !mapError && (
                            <svg
                              viewBox="0 0 640 500"
                              className="w-full h-full max-w-full max-h-[460px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] select-none cursor-grab active:cursor-grabbing outline-none"
                              onMouseDown={handleThemeMapMouseDown}
                              onMouseMove={handleThemeMapMouseMove}
                              onMouseUp={handleThemeMapMouseUp}
                              onMouseLeave={handleThemeMapMouseUp}
                            >
                              <g transform={`translate(${themeMapPanX}, ${themeMapPanY}) translate(320, 250) scale(${themeMapZoomScale}) translate(-320, -250)`}>
                                {(() => {
                                  const filteredFeatures = geoJsonData?.features?.filter((f: any) => {
                                    return isCountryAllowedInMap(f.properties, selectedGroup);
                                  }) || [];

                                  const projection = d3.geoMercator().fitSize([640, 500], {
                                    type: "FeatureCollection",
                                    features: filteredFeatures
                                  });
                                  const pathGenerator = d3.geoPath().projection(projection);

                                  return filteredFeatures.map((f: any, index: number) => {
                                    const dbName = getDbCountryName(f.properties);
                                    const normDbName = dbName.toLowerCase().trim();
                                    
                                    let count = 0;
                                    if (selectedRegion !== "Todas" && selectedCountry.toLowerCase() === normDbName) {
                                      const regionKey = `${normDbName}|${selectedRegion.toLowerCase().trim()}`;
                                      const regionCounts = themeIntensityData.regionTopicCounts[regionKey] || {};
                                      if (selectedThemeForMap === "Todos") {
                                        count = (Object.values(regionCounts) as number[]).reduce((a, b) => a + b, 0);
                                      } else if (selectedThemeForMap === "__SIN_FILTRO__") {
                                        count = 0;
                                      } else {
                                        count = regionCounts[selectedThemeForMap] || 0;
                                      }
                                    } else {
                                      const countryCounts = themeIntensityData.countryTopicCounts[normDbName] || {};
                                      if (selectedThemeForMap === "Todos") {
                                        count = (Object.values(countryCounts) as number[]).reduce((a, b) => a + b, 0);
                                      } else if (selectedThemeForMap === "__SIN_FILTRO__") {
                                        count = 0;
                                      } else {
                                        count = countryCounts[selectedThemeForMap] || 0;
                                      }
                                    }

                                    const isSelected = selectedCountry === "Todos" 
                                      ? false
                                      : selectedCountry.toLowerCase() === normDbName;
                                    const countryPropName = f.properties.name || f.properties.NAME || "";
                                    const isHovered = hoveredThemeMapCountry === countryPropName;

                                    const pathD = pathGenerator(f);
                                    const centroid = d3.geoCentroid(f);
                                    const coords = projection(centroid);
                                    const isValidCoords = coords && !isNaN(coords[0]) && !isNaN(coords[1]);

                                    const baseThemeColor = selectedThemeForMap !== "Todos" && selectedThemeForMap !== "__SIN_FILTRO__"
                                      ? getTopicColor(selectedThemeForMap)
                                      : "#10b981";

                                    const fillStyle = getIntensityColor(count, maxCountForThemeMap, baseThemeColor);
                                    const strokeStyle = isSelected 
                                      ? hexToRgba(baseThemeColor, 0.9) 
                                      : isHovered 
                                        ? hexToRgba(baseThemeColor, 0.7) 
                                        : count > 0 
                                          ? hexToRgba(baseThemeColor, 0.3) 
                                          : "rgba(148, 163, 184, 0.15)";
                                    const strokeWidth = isSelected ? "2" : isHovered ? "1.5" : "1";

                                    return (
                                      <g key={`theme-country-${countryPropName || index}`}>
                                        {pathD && (
                                          <path
                                            d={pathD}
                                            fill={fillStyle}
                                            stroke={strokeStyle}
                                            strokeWidth={strokeWidth}
                                            className="transition-all duration-200 cursor-pointer"
                                            onMouseEnter={() => setHoveredThemeMapCountry(countryPropName)}
                                            onMouseLeave={() => setHoveredThemeMapCountry(null)}
                                            onClick={(e) => {
                                              if (themeMapMouseDownPos) {
                                                const dx = Math.abs(e.clientX - themeMapMouseDownPos.x);
                                                const dy = Math.abs(e.clientY - themeMapMouseDownPos.y);
                                                if (dx > 6 || dy > 6) return;
                                              }
                                              if (selectedCountry.toLowerCase() === normDbName) {
                                                setSelectedCountry("Todos");
                                                setSelectedRegion("Todas");
                                              } else {
                                                setSelectedCountry(dbName);
                                                setSelectedRegion("Todas");
                                              }
                                            }}
                                          />
                                        )}
                                        {count > 0 && isValidCoords && (
                                          <circle
                                            cx={coords[0]}
                                            cy={coords[1]}
                                            r={Math.min(5, 3 + (count / maxCountForThemeMap) * 3)}
                                            className="pointer-events-none fill-white stroke-[1.5]"
                                            stroke={baseThemeColor}
                                          />
                                        )}
                                      </g>
                                    );
                                  });
                                })()}
                              </g>
                            </svg>
                          )}

                          {/* Hover Tooltip dentro del Mapa */}
                          {!mapLoading && !mapError && (() => {
                            let title = "Toda la región";
                            let countValue = themeMapStats.totalMentions;
                            let isHoveredState = false;

                            if (hoveredThemeMapCountry) {
                              const f = geoJsonData?.features?.find((x: any) => (x.properties.name || x.properties.NAME) === hoveredThemeMapCountry);
                              if (f) {
                                const dbName = getDbCountryName(f.properties);
                                title = dbName;
                                const countryCounts = themeIntensityData.countryTopicCounts[dbName.toLowerCase().trim()] || {};
                                if (selectedThemeForMap === "Todos") {
                                  countValue = (Object.values(countryCounts) as number[]).reduce((a, b) => a + b, 0);
                                } else if (selectedThemeForMap === "__SIN_FILTRO__") {
                                  countValue = 0;
                                } else {
                                  countValue = countryCounts[selectedThemeForMap] || 0;
                                }
                                isHoveredState = true;
                              }
                            } else if (selectedCountry !== "Todos") {
                              if (selectedRegion !== "Todas") {
                                title = `${selectedCountry} - ${selectedRegion}`;
                                const regionKey = `${selectedCountry.toLowerCase().trim()}|${selectedRegion.toLowerCase().trim()}`;
                                const regionCounts = themeIntensityData.regionTopicCounts[regionKey] || {};
                                if (selectedThemeForMap === "Todos") {
                                  countValue = (Object.values(regionCounts) as number[]).reduce((a, b) => a + b, 0);
                                } else if (selectedThemeForMap === "__SIN_FILTRO__") {
                                  countValue = 0;
                                } else {
                                  countValue = regionCounts[selectedThemeForMap] || 0;
                                }
                              } else {
                                title = selectedCountry;
                                const countryCounts = themeIntensityData.countryTopicCounts[selectedCountry.toLowerCase().trim()] || {};
                                if (selectedThemeForMap === "Todos") {
                                  countValue = (Object.values(countryCounts) as number[]).reduce((a, b) => a + b, 0);
                                } else if (selectedThemeForMap === "__SIN_FILTRO__") {
                                  countValue = 0;
                                } else {
                                  countValue = countryCounts[selectedThemeForMap] || 0;
                                }
                              }
                            }

                            const baseThemeColor = selectedThemeForMap !== "Todos" && selectedThemeForMap !== "__SIN_FILTRO__"
                              ? getTopicColor(selectedThemeForMap)
                              : "#10b981";

                            return (
                              <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-2xl text-left space-y-2 z-10 pointer-events-none font-sans min-w-[220px] transition-all duration-300 transform scale-100 animate-fade-in">
                                <div className="flex items-center gap-2 border-b border-slate-800/85 pb-1.5">
                                  <div className="p-1 rounded" style={{ backgroundColor: hexToRgba(baseThemeColor, 0.1), color: baseThemeColor }}>
                                    <MapPin className="h-3.5 w-3.5 animate-pulse" />
                                  </div>
                                  <span className="text-xs font-black text-white tracking-wide">
                                    {title}
                                    {isHoveredState && <span className="text-[9px] ml-1.5 font-bold uppercase tracking-wider" style={{ color: baseThemeColor }}>(Detalle)</span>}
                                  </span>
                                </div>
                                <div className="space-y-1 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400 text-[11px]">Tema activo:</span>
                                    <span className="font-extrabold truncate max-w-[120px]" title={selectedThemeForMap} style={{ color: baseThemeColor }}>
                                      {selectedThemeForMap === "Todos" ? "Todos los temas" : selectedThemeForMap === "__SIN_FILTRO__" ? "Sin filtro" : selectedThemeForMap}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-1">
                                    <span className="text-slate-400 text-[11px]">Frecuencia:</span>
                                    <span className="font-black text-white text-sm">{countValue} {countValue === 1 ? 'mención' : 'menciones'}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Panel de Desglose de Regiones / Países (Lado Derecho) */}
                        <div className="lg:col-span-4 bg-slate-900/15 border border-slate-850/80 rounded-xl p-4 flex flex-col justify-between h-[480px] overflow-hidden">
                          {(() => {
                            const baseThemeColor = selectedThemeForMap !== "Todos" && selectedThemeForMap !== "__SIN_FILTRO__"
                              ? getTopicColor(selectedThemeForMap)
                              : "#10b981";

                            return (
                              <>
                                <div className="space-y-3 h-full flex flex-col w-full">
                                <div className="border-b border-slate-850 pb-2">
                                  <span className="text-xs font-black text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                    <Activity className="h-3.5 w-3.5" style={{ color: baseThemeColor }} />
                                    <span>Detalle de Frecuencias</span>
                                  </span>
                              <p className="text-[10px] text-slate-400 mt-1">
                                {selectedCountry !== "Todos" 
                                  ? `Muestras en ${selectedCountry} con el tema seleccionado`
                                  : `Muestras por país o región con mayor coincidencia`
                                }
                              </p>
                            </div>

                            {/* Toggles de Países y Regiones */}
                            <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-850/80">
                              <button
                                onClick={() => setThemeMapPanelTab("countries")}
                                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  themeMapPanelTab === "countries"
                                    ? "bg-slate-900 border border-slate-800 font-extrabold shadow-sm"
                                    : "text-slate-400 hover:text-white border border-transparent"
                                }`}
                                style={{ color: themeMapPanelTab === "countries" ? baseThemeColor : undefined }}
                              >
                                Países ({themeMapStats.countryDetailsList.length})
                              </button>
                              <button
                                onClick={() => setThemeMapPanelTab("regions")}
                                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  themeMapPanelTab === "regions"
                                    ? "bg-slate-900 border border-slate-800 font-extrabold shadow-sm"
                                    : "text-slate-400 hover:text-white border border-transparent"
                                }`}
                                style={{ color: themeMapPanelTab === "regions" ? baseThemeColor : undefined }}
                              >
                                Países y Regiones ({selectedCountry !== "Todos" ? themeMapStats.regionDetailsList.filter(r => r.country.toLowerCase() === selectedCountry.toLowerCase()).length : themeMapStats.regionDetailsList.length})
                              </button>
                            </div>

                            {/* Lista con scroll */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                              {(() => {
                                if (themeMapPanelTab === "countries") {
                                  let listToRender = themeMapStats.countryDetailsList;
                                  if (selectedCountry !== "Todos") {
                                    listToRender = listToRender.filter(c => c.name.toLowerCase() === selectedCountry.toLowerCase());
                                  }

                                  if (listToRender.length === 0) {
                                    return (
                                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-500 italic space-y-1.5">
                                        <Globe className="h-5 w-5 text-slate-600" />
                                        <span>Sin menciones registradas para esta selección.</span>
                                      </div>
                                    );
                                  }

                                  return listToRender.map((c, i) => {
                                    const isSelected = selectedCountry.toLowerCase() === c.name.toLowerCase();
                                    return (
                                      <div 
                                        key={`${c.name}-${i}`}
                                        className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-lg p-2.5 flex items-center justify-between transition-all duration-200 group cursor-pointer"
                                        style={{
                                          borderColor: isSelected ? hexToRgba(baseThemeColor, 0.35) : "#1e293b",
                                          backgroundColor: isSelected ? hexToRgba(baseThemeColor, 0.08) : undefined
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isSelected) {
                                            e.currentTarget.style.borderColor = hexToRgba(baseThemeColor, 0.2);
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isSelected) {
                                            e.currentTarget.style.borderColor = "#1e293b";
                                          }
                                        }}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedCountry("Todos");
                                            setSelectedRegion("Todas");
                                          } else {
                                            setSelectedCountry(c.name);
                                            setSelectedRegion("Todas");
                                          }
                                        }}
                                      >
                                        <div className="space-y-0.5 max-w-[70%]">
                                          <div className="text-xs font-black text-slate-200 truncate">{c.name}</div>
                                          <div className="text-[10px] text-slate-500 font-semibold truncate">Ver regiones de este país</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="text-xs font-black border px-2 py-0.5 rounded-md min-w-[28px] text-center"
                                            style={{
                                              color: baseThemeColor,
                                              backgroundColor: hexToRgba(baseThemeColor, 0.1),
                                              borderColor: hexToRgba(baseThemeColor, 0.25)
                                            }}
                                          >
                                            {c.count}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  });
                                } else {
                                  let listToRender = themeMapStats.regionDetailsList;
                                  if (selectedCountry !== "Todos") {
                                    listToRender = listToRender.filter(r => r.country.toLowerCase() === selectedCountry.toLowerCase());
                                  }

                                  if (listToRender.length === 0) {
                                    return (
                                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs text-slate-500 italic space-y-1.5">
                                        <Globe className="h-5 w-5 text-slate-600" />
                                        <span>Sin menciones registradas para esta selección.</span>
                                      </div>
                                    );
                                  }

                                  return listToRender.map((r, i) => (
                                    <div 
                                      key={`${r.country}-${r.region}-${i}`}
                                      className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-lg p-2.5 flex items-center justify-between transition-all duration-200 group"
                                      style={{
                                        borderColor: "#1e293b"
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = hexToRgba(baseThemeColor, 0.2);
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = "#1e293b";
                                      }}
                                    >
                                      <div className="space-y-0.5 max-w-[75%]">
                                        <div className="text-xs font-black text-slate-200 truncate">{r.country} - {r.region}</div>
                                        <div className="text-[10px] text-slate-500 font-semibold truncate">País: {r.country} | Región: {r.region}</div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div 
                                          className="text-xs font-black border px-2 py-0.5 rounded-md min-w-[28px] text-center"
                                          style={{
                                            color: baseThemeColor,
                                            backgroundColor: hexToRgba(baseThemeColor, 0.1),
                                            borderColor: hexToRgba(baseThemeColor, 0.25)
                                          }}
                                        >
                                          {r.count}
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                }
                              })()}
                            </div>
                          </div>

                          {/* Botón para Limpiar Selección de País */}
                          {selectedCountry !== "Todos" && (
                            <button
                              onClick={() => {
                                setSelectedCountry("Todos");
                                setSelectedRegion("Todas");
                              }}
                              className="w-full mt-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-400 hover:text-white py-2 rounded-lg transition-colors cursor-pointer"
                            >
                              Mostrar todos los países
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                      </div>
                    </div>

                    {/* Gráfico 1: Temas Recurrentes de Salud Espiritual (Frecuencia) */}
                    <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                      <span className="text-sm font-bold text-slate-200 uppercase tracking-wider block text-center">
                        Temas Recurrentes de Salud Espiritual (Menciones - Última Fecha: {latestFechaInDatabase ? new Date(latestFechaInDatabase + "T00:00:00").toLocaleDateString("es-ES", { dateStyle: "long" }) : "N/A"})
                      </span>
                      {recurrentTopics.length === 0 ? (
                        <div className="h-56 flex items-center justify-center text-xs text-slate-500 italic">
                          Sin datos de temas recurrentes.
                        </div>
                      ) : (
                        <div className="h-64 text-xs">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[...recurrentTopics].sort((a, b) => b.count - a.count)}
                              margin={{ top: 15, right: 10, left: -15, bottom: 40 }}
                            >
                              <XAxis 
                                dataKey="name" 
                                stroke="#64748b" 
                                fontSize={8} 
                                tickLine={false} 
                                interval={0} 
                                angle={-35} 
                                textAnchor="end" 
                                height={60} 
                              />
                              <YAxis type="number" stroke="#64748b" fontSize={10} allowDecimals={false} tickLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                formatter={(value) => [`${value}`, "Menciones"]}
                              />
                              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {[...recurrentTopics].sort((a, b) => b.count - a.count).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={getTopicColor(entry.name)} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Gráfico 2: Evolución Temporal de Temas Recurrentes (Menciones a lo largo del tiempo) */}
                    <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                      <div className="text-center space-y-1">
                        <span className="text-sm font-bold text-slate-200 uppercase tracking-wider block">
                          Historial de Temas Recurrentes en el Tiempo (Menciones)
                        </span>
                        <span className="text-[9px] text-slate-500 block">
                          Haz clic en los temas para filtrar el gráfico
                        </span>
                      </div>
                      {recurrentTopicsTimelineData.timeline.length === 0 || recurrentTopicsTimelineData.uniqueTopics.length === 0 ? (
                        <div className="h-56 flex items-center justify-center text-xs text-slate-500 italic">
                          Sin datos temporales para temas recurrentes.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Botones de filtro por tema */}
                          <div className="flex flex-wrap gap-1.5 justify-center max-h-24 overflow-y-auto custom-scrollbar px-1 py-0.5">
                            <button
                              onClick={() => setSelectedTimelineTopics([])}
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                selectedTimelineTopics.length === 0
                                  ? "bg-slate-100 text-slate-950 border-slate-100 shadow-sm"
                                  : "bg-slate-950/40 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                              }`}
                            >
                              Mostrar Todos
                            </button>
                            {recurrentTopicsTimelineData.uniqueTopics.map((topic) => {
                              const color = getTopicColor(topic);
                              const isActive = selectedTimelineTopics.includes(topic);
                              return (
                                <button
                                  key={topic}
                                  onClick={() => {
                                    setSelectedTimelineTopics((prev) => {
                                      if (prev.includes(topic)) {
                                        return prev.filter((t) => t !== topic);
                                      } else {
                                        return [...prev, topic];
                                      }
                                    });
                                  }}
                                  style={{
                                    borderColor: isActive ? color : "#1e293b",
                                    backgroundColor: isActive ? `${color}18` : "transparent",
                                    color: isActive ? color : "#94a3b8"
                                  }}
                                  className="text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all hover:brightness-110 active:scale-95 cursor-pointer"
                                >
                                  {topic}
                                </button>
                              );
                            })}
                          </div>

                          <div className="h-48 text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={recurrentTopicsTimelineData.timeline}
                                margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
                              >
                                <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                  itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                  labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                />
                                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                                {recurrentTopicsTimelineData.uniqueTopics
                                  .filter((topic) => selectedTimelineTopics.length === 0 || selectedTimelineTopics.includes(topic))
                                  .map((topic) => (
                                    <Line
                                      key={topic}
                                      type="monotone"
                                      dataKey={topic}
                                      name={topic}
                                      stroke={getTopicColor(topic)}
                                      strokeWidth={2.5}
                                      activeDot={{ r: 6 }}
                                    />
                                  ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

                  {/* Análisis de Ayudantes */}
                  {subTab === "resumen" && (
                    <div className="space-y-6 pt-4 border-t border-slate-850/40 animate-fade-in">
                      {/* Cabecera de Sección: Análisis de Ayudantes */}
                      <div className="flex flex-col gap-1 border-b border-slate-850/65 pb-4">
                        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-indigo-400" />
                          Análisis de Ayudantes
                        </h3>
                        <p className="text-xs text-slate-400">
                          Consolidación de proporción, tendencias de crecimiento histórico y distribución geográfica de los ayudantes nombrados y para protección en el territorio seleccionado ({selectedCountry === "Todos" ? "Toda la región" : selectedCountry}{selectedRegion !== "Todas" ? ` - ${selectedRegion}` : ""}).
                        </p>
                      </div>

                      {/* Gráfico de Torta: Porcentaje de Ayudantes para Protección */}
                      <div className="bg-slate-950/35 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850/60 pb-4">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
                              <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                              <span>Proporción de Ayudantes para Protección</span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Distribución porcentual de los ayudantes reportados entre ayudantes generales nombrados y ayudantes dedicados a la protección.
                            </p>
                          </div>
                        </div>

                        {helpersTotalNamed === 0 && helpersProtectionCount === 0 ? (
                          <div className="h-56 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-500 italic space-y-1.5">
                            <Globe className="h-6 w-6 text-slate-600 animate-pulse" />
                            <span>No hay ayudantes reportados en este territorio para calcular porcentajes.</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            {/* Gráfico */}
                            <div className="md:col-span-2 h-56 text-xs w-full relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: "Ayudantes de Protección", value: helpersProtectionCount },
                                      { name: "Otros Ayudantes Nombrados", value: Math.max(0, helpersTotalNamed) }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                  >
                                    <Cell fill="#10b981" />
                                    <Cell fill="#6366f1" />
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                      backdropFilter: 'blur(8px)',
                                      borderColor: 'rgba(148, 163, 184, 0.25)',
                                      borderRadius: '12px',
                                      color: '#f8fafc',
                                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                    }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              
                              {/* Texto central en la rosca (donut) */}
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-2xl font-black text-white">
                                  {helpersTotalNamed + helpersProtectionCount > 0
                                    ? `${Math.round((helpersProtectionCount / (helpersTotalNamed + helpersProtectionCount)) * 100)}%`
                                    : "0%"
                                  }
                                </span>
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Protección</span>
                              </div>
                            </div>

                            {/* Leyenda y detalles */}
                            <div className="space-y-4 bg-slate-900/30 border border-slate-850/50 p-4 rounded-xl">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Resumen de Totales</span>
                                <div className="text-sm font-extrabold text-white flex items-baseline gap-1">
                                  <span>{helpersTotalNamed + helpersProtectionCount}</span>
                                  <span className="text-xs text-slate-400 font-medium font-sans">Ayudantes Totales</span>
                                </div>
                              </div>

                              <div className="space-y-2 border-t border-slate-800/80 pt-3">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded bg-emerald-500"></div>
                                    <span className="text-slate-300 font-semibold font-sans">Ayudantes de Protección</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-extrabold text-white block">{helpersProtectionCount}</span>
                                    <span className="text-[10px] text-slate-400 block font-semibold">
                                      {helpersTotalNamed + helpersProtectionCount > 0
                                        ? `${((helpersProtectionCount / (helpersTotalNamed + helpersProtectionCount)) * 100).toFixed(1)}%`
                                        : "0%"
                                      }
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-xs border-t border-slate-900/40 pt-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded bg-indigo-500"></div>
                                    <span className="text-slate-300 font-semibold font-sans">Otros Ayudantes Nombrados</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-extrabold text-white block">{helpersTotalNamed}</span>
                                    <span className="text-[10px] text-slate-400 block font-semibold">
                                      {helpersTotalNamed + helpersProtectionCount > 0
                                        ? `${((helpersTotalNamed / (helpersTotalNamed + helpersProtectionCount)) * 100).toFixed(1)}%`
                                        : "0%"
                                      }
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6">
                      {/* Fila 1: Crecimiento de Ayudantes (Gráfico + Panel de Crecimiento) */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                        {/* Gráfico 3: Crecimiento de Ayudantes */}
                        <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Evolución del Número de Ayudantes Nombrados
                          </span>
                          <div className="h-56 text-xs w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={growthData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorHelpers" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                  itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                  labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                  formatter={(value) => [`${value} Ayudantes`, "Cantidad"]}
                                />
                                <Area type="monotone" dataKey="helpers" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHelpers)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Panel de Crecimiento de Ayudantes */}
                        <div className="bg-slate-950/40 border border-slate-850 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Análisis de Crecimiento</span>
                            <h3 className="text-sm font-semibold text-white">Evolución de Ayudantes</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">Variación total registrada en el período histórico visible.</p>
                          </div>
                          
                          <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                            {helpersTrendInfo.diff > 0 ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  Incremento
                                </span>
                                <span className="text-3xl font-black text-emerald-400 mt-2">
                                  +{helpersTrendInfo.diff}
                                </span>
                                <span className="text-xs font-bold text-slate-300">
                                  (+{helpersTrendInfo.pct}%)
                                </span>
                              </div>
                            ) : helpersTrendInfo.diff < 0 ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  Decremento
                                </span>
                                <span className="text-3xl font-black text-rose-400 mt-2">
                                  {helpersTrendInfo.diff}
                                </span>
                                <span className="text-xs font-bold text-slate-300">
                                  ({helpersTrendInfo.pct}%)
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  Sin cambios
                                </span>
                                <span className="text-3xl font-black text-slate-400 mt-2">
                                  0
                                </span>
                                <span className="text-xs font-bold text-slate-500">
                                  (0%)
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                            <div className="flex justify-between">
                              <span>Valor Inicial:</span>
                              <span className="text-slate-300 font-bold">{helpersTrendInfo.first}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Valor Actual:</span>
                              <span className="text-slate-300 font-bold">{helpersTrendInfo.last}</span>
                            </div>
                            {helpersTrendInfo.range && (
                              <div className="text-center pt-2 border-t border-slate-900/30 text-[9px] text-slate-600 uppercase tracking-wider font-bold">
                                {helpersTrendInfo.range}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Fila: Crecimiento de Ayudantes para Protección (Gráfico + Panel de Crecimiento) */}
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                        {/* Gráfico: Crecimiento de Ayudantes para Protección */}
                        <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Evolución del Número de Ayudantes para Protección
                          </span>
                          <div className="h-56 text-xs w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={growthData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="colorHelpersProtection" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                                <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                  itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                  labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                  formatter={(value) => [`${value} Ayudantes`, "Cantidad"]}
                                />
                                <Area type="monotone" dataKey="helpersProtection" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHelpersProtection)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Panel de Crecimiento de Ayudantes para Protección */}
                        <div className="bg-slate-950/40 border border-slate-850 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Análisis de Crecimiento</span>
                            <h3 className="text-sm font-semibold text-white">Evolución de Ayudantes para Protección</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">Variación total registrada en el período histórico visible.</p>
                          </div>
                          
                          <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                            {helpersProtectionTrendInfo.diff > 0 ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <TrendingUp className="h-3.5 w-3.5" />
                                  Incremento
                                </span>
                                <span className="text-3xl font-black text-emerald-400 mt-2">
                                  +{helpersProtectionTrendInfo.diff}
                                </span>
                                <span className="text-xs font-bold text-slate-300">
                                  (+{helpersProtectionTrendInfo.pct}%)
                                </span>
                              </div>
                            ) : helpersProtectionTrendInfo.diff < 0 ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                  <TrendingDown className="h-3.5 w-3.5" />
                                  Decremento
                                </span>
                                <span className="text-3xl font-black text-rose-400 mt-2">
                                  {helpersProtectionTrendInfo.diff}
                                </span>
                                <span className="text-xs font-bold text-slate-300">
                                  ({helpersProtectionTrendInfo.pct}%)
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                  Sin cambios
                                </span>
                                <span className="text-3xl font-black text-slate-400 mt-2">
                                  0
                                </span>
                                <span className="text-xs font-bold text-slate-500">
                                  (0%)
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                            <div className="flex justify-between">
                              <span>Valor Inicial:</span>
                              <span className="text-slate-300 font-bold">{helpersProtectionTrendInfo.first}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Valor Actual:</span>
                              <span className="text-slate-300 font-bold">{helpersProtectionTrendInfo.last}</span>
                            </div>
                            {helpersProtectionTrendInfo.range && (
                              <div className="text-center pt-2 border-t border-slate-900/30 text-[9px] text-slate-600 uppercase tracking-wider font-bold">
                                {helpersProtectionTrendInfo.range}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tabla de Ayudantes por País y Región (Sección de Protección/General) */}
                      <HelpersEvolutionTable
                        submissions={activeSubmissions}
                        selectedCountry={selectedCountry}
                        selectedRegion={selectedRegion}
                        dateFieldId={dateFieldId}
                        FIELD_AYUDANTES_NOMBRADOS={FIELD_AYUDANTES_NOMBRADOS}
                        FIELD_AYUDANTES_PROTECCION={FIELD_AYUDANTES_PROTECCION}
                        renderCountryFlagImage={renderCountryFlagImage}
                      />

                      {/* Tabla de Ayudantes por País y Región (Sección de Protección/General) - REMOVED */}
                      {false && (() => {
                        // 1. Filtrar los envíos por los filtros globales de país y región
                        let filteredSubs = activeSubmissions;
                        if (selectedCountry !== "Todos") {
                          filteredSubs = filteredSubs.filter(s => s.userCountry?.toLowerCase().trim() === selectedCountry.toLowerCase().trim());
                        }
                        if (selectedRegion !== "Todas") {
                          filteredSubs = filteredSubs.filter(s => s.userRegion?.toLowerCase().trim() === selectedRegion.toLowerCase().trim());
                        }

                        // 2. Agrupar todos los envíos por País + Región y luego por Contribuidor (Email)
                        const contributorMap: Record<string, Record<string, Submission[]>> = {};

                        filteredSubs.forEach(sub => {
                          const country = sub.userCountry?.trim() || "Desconocido";
                          const region = sub.userRegion?.trim() || "Sin Región";
                          const geoKey = `${country.toLowerCase()}_${region.toLowerCase()}`;
                          
                          const email = sub.userEmail?.toLowerCase().trim() || sub.id;

                          if (!contributorMap[geoKey]) {
                            contributorMap[geoKey] = {};
                          }
                          if (!contributorMap[geoKey][email]) {
                            contributorMap[geoKey][email] = [];
                          }
                          contributorMap[geoKey][email].push(sub);
                        });

                        // 3. Para cada grupo País + Región, calcular valores iniciales y finales sumando entre contribuyentes
                        const groupMap: Record<string, {
                          country: string;
                          region: string;
                          initialHelpers: number;
                          latestHelpers: number;
                          initialProtection: number;
                          latestProtection: number;
                        }> = {};

                        // Helper para obtener fecha de un envío
                        const getSubDateStr = (sub: Submission) => {
                          if (dateFieldId && sub.data[dateFieldId]) {
                            return String(sub.data[dateFieldId]);
                          }
                          const foundDateKey = Object.keys(sub.data).find(k => {
                            const val = sub.data[k];
                            return typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);
                          });
                          if (foundDateKey) {
                            return String(foundDateKey);
                          }
                          if (sub.submittedAt) {
                            return sub.submittedAt.split("T")[0];
                          }
                          return "2026-02-01";
                        };

                        Object.keys(contributorMap).forEach(geoKey => {
                          const contributors = contributorMap[geoKey];
                          
                          let countryName = "";
                          let regionName = "";
                          
                          let totalInitHelpers = 0;
                          let totalLatHelpers = 0;
                          let totalInitProtection = 0;
                          let totalLatProtection = 0;

                          Object.keys(contributors).forEach(email => {
                            const subs = [...contributors[email]];
                            // Ordenar por fecha de forma cronológica
                            subs.sort((a, b) => getSubDateStr(a).localeCompare(getSubDateStr(b)));
                            
                            const subFirst = subs[0];
                            const subLast = subs[subs.length - 1];
                            
                            if (!countryName && subFirst.userCountry) countryName = subFirst.userCountry.trim();
                            if (!regionName && subFirst.userRegion) regionName = subFirst.userRegion.trim();

                            // Ayudantes Nombrados
                            const firstHelpers = Number(subFirst.data[FIELD_AYUDANTES_NOMBRADOS]) || 0;
                            const lastHelpers = Number(subLast.data[FIELD_AYUDANTES_NOMBRADOS]) || 0;
                            totalInitHelpers += firstHelpers;
                            totalLatHelpers += lastHelpers;

                            // Ayudantes de Protección
                            const getProtectionCount = (sub: Submission) => {
                              let count = 0;
                              const valObj = sub.data[FIELD_AYUDANTES_PROTECCION];
                              if (valObj && typeof valObj === "object") {
                                const ans = valObj.answer;
                                if (ans === "Sí" || ans === "Si") {
                                  const num = Number(valObj.justification);
                                  count = isNaN(num) ? 1 : num;
                                }
                              } else if (valObj === "Sí" || valObj === "Si") {
                                count = 1;
                              }
                              return count;
                            };

                            totalInitProtection += getProtectionCount(subFirst);
                            totalLatProtection += getProtectionCount(subLast);
                          });

                          if (!countryName) {
                            const parts = geoKey.split("_");
                            countryName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : "Desconocido";
                            regionName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : "Sin Región";
                          }

                          groupMap[geoKey] = {
                            country: countryName,
                            region: regionName || "Sin Región",
                            initialHelpers: totalInitHelpers,
                            latestHelpers: totalLatHelpers,
                            initialProtection: totalInitProtection,
                            latestProtection: totalLatProtection
                          };
                        });

                        // Convertir a array de objetos enriquecidos
                        let items = Object.values(groupMap).map(g => {
                          const helpersDiff = g.latestHelpers - g.initialHelpers;
                          const helpersPct = g.initialHelpers > 0 ? Math.round((helpersDiff / g.initialHelpers) * 100) : 0;
                          
                          const protectionDiff = g.latestProtection - g.initialProtection;
                          const protectionPct = g.initialProtection > 0 ? Math.round((protectionDiff / g.initialProtection) * 100) : 0;

                          const initialTotal = g.initialHelpers + g.initialProtection;
                          const latestTotal = g.latestHelpers + g.latestProtection;
                          const totalDiff = latestTotal - initialTotal;
                          const totalPct = initialTotal > 0 ? Math.round((totalDiff / initialTotal) * 100) : 0;

                          return {
                            ...g,
                            helpersDiff,
                            helpersPct,
                            protectionDiff,
                            protectionPct,
                            initialTotal,
                            latestTotal,
                            totalDiff,
                            totalPct
                          };
                        });

                        // 4. Aplicar búsqueda (tableSearch) si existe
                        if (tableSearch.trim()) {
                          const q = tableSearch.toLowerCase().trim();
                          items = items.filter(item => 
                            item.country.toLowerCase().includes(q) || 
                            item.region.toLowerCase().includes(q)
                          );
                        }

                        // 5. Ordenamiento de la tabla
                        const sortedItems = [...items].sort((a, b) => {
                          let valA: any = "";
                          let valB: any = "";
                          
                          if (sortField === "country") {
                            valA = a.country;
                            valB = b.country;
                          } else if (sortField === "region") {
                            valA = a.region;
                            valB = b.region;
                          } else if (sortField === "helpers") {
                            valA = a.latestHelpers;
                            valB = b.latestHelpers;
                          } else if (sortField === "helpersDiff") {
                            valA = a.helpersDiff;
                            valB = b.helpersDiff;
                          } else if (sortField === "helpersProtection") {
                            valA = a.latestProtection;
                            valB = b.latestProtection;
                          } else if (sortField === "protectionDiff") {
                            valA = a.protectionDiff;
                            valB = b.protectionDiff;
                          } else if (sortField === "total") {
                            valA = a.latestTotal;
                            valB = b.latestTotal;
                          } else if (sortField === "totalDiff") {
                            valA = a.totalDiff;
                            valB = b.totalDiff;
                          } else {
                            valA = a.country;
                            valB = b.country;
                          }

                          if (typeof valA === "string") {
                            return sortDirection === "asc"
                              ? valA.localeCompare(valB)
                              : valB.localeCompare(valA);
                          } else {
                            return sortDirection === "asc"
                              ? (valA - valB)
                              : (valB - valA);
                          }
                        });

                        // Calcular totales sumados de los ítems filtrados actualmente
                        const sumInitialHelpers = sortedItems.reduce((acc, item) => acc + item.initialHelpers, 0);
                        const sumLatestHelpers = sortedItems.reduce((acc, item) => acc + item.latestHelpers, 0);
                        const sumHelpersDiff = sumLatestHelpers - sumInitialHelpers;
                        const sumHelpersPct = sumInitialHelpers > 0 ? Math.round((sumHelpersDiff / sumInitialHelpers) * 100) : 0;

                        const sumInitialProtection = sortedItems.reduce((acc, item) => acc + item.initialProtection, 0);
                        const sumLatestProtection = sortedItems.reduce((acc, item) => acc + item.latestProtection, 0);
                        const sumProtectionDiff = sumLatestProtection - sumInitialProtection;
                        const sumProtectionPct = sumInitialProtection > 0 ? Math.round((sumProtectionDiff / sumInitialProtection) * 100) : 0;

                        const sumInitialTotal = sumInitialHelpers + sumInitialProtection;
                        const sumLatestTotal = sumLatestHelpers + sumLatestProtection;
                        const sumTotalDiff = sumLatestTotal - sumInitialTotal;
                        const sumTotalPct = sumInitialTotal > 0 ? Math.round((sumTotalDiff / sumInitialTotal) * 100) : 0;

                        const handleSort = (field: string) => {
                          if (sortField === field) {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                          } else {
                            setSortField(field);
                            setSortDirection("asc");
                          }
                        };

                        const renderTrendBadge = (diff: number, pct: number) => {
                          if (diff > 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shrink-0">
                                <TrendingUp className="h-2.5 w-2.5" />
                                <span>+{diff}</span>
                                {pct > 0 && <span className="text-[9px] font-medium opacity-80">({pct}%)</span>}
                              </span>
                            );
                          } else if (diff < 0) {
                            return (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/15 text-rose-400 border border-rose-500/25 shrink-0">
                                <TrendingDown className="h-2.5 w-2.5" />
                                <span>{diff}</span>
                                {pct < 0 && <span className="text-[9px] font-medium opacity-80">({pct}%)</span>}
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800/40 text-slate-500 border border-slate-800/60 shrink-0">
                                <span>0</span>
                              </span>
                            );
                          }
                        };

                        return (
                          <div className="bg-slate-950/20 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div>
                                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                                  <Briefcase className="h-4 w-4 text-indigo-400" />
                                  <span>Evolución de Ayudantes por País y Región</span>
                                </h3>
                                <p className="text-xs text-slate-400">
                                  Análisis comparativo (Valor Inicial ➔ Valor Actual) con indicadores de incremento y decremento en cada territorio.
                                </p>
                              </div>

                              {/* Buscador local */}
                              <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                                <input
                                  type="text"
                                  placeholder="Buscar país o región..."
                                  value={tableSearch}
                                  onChange={(e) => setTableSearch(e.target.value)}
                                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 outline-none transition-all placeholder-slate-500 hover:bg-slate-950 focus:bg-slate-950"
                                />
                                {tableSearch && (
                                  <button
                                    onClick={() => setTableSearch("")}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold cursor-pointer bg-transparent border-none p-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="overflow-x-auto bg-slate-950/40 border border-slate-850 rounded-2xl shadow-xl">
                              <table className="w-full border-collapse text-left text-xs text-slate-300">
                                <thead>
                                  <tr className="border-b border-slate-800/80 bg-slate-900/40 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                    <th 
                                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-850/40 hover:text-white transition-colors select-none"
                                      onClick={() => handleSort("country")}
                                    >
                                      <div className="flex items-center gap-1">
                                        <span>País</span>
                                        {sortField === "country" && (sortDirection === "asc" ? " ▴" : " ▾")}
                                      </div>
                                    </th>
                                    <th 
                                      className="px-4 py-3.5 cursor-pointer hover:bg-slate-850/40 hover:text-white transition-colors select-none"
                                      onClick={() => handleSort("region")}
                                    >
                                      <div className="flex items-center gap-1">
                                        <span>Región</span>
                                        {sortField === "region" && (sortDirection === "asc" ? " ▴" : " ▾")}
                                      </div>
                                    </th>
                                    <th className="px-4 py-3.5 select-none">
                                      <div className="flex flex-col gap-1 items-end">
                                        <span 
                                          className="cursor-pointer hover:text-white transition-colors flex items-center gap-0.5 justify-end"
                                          onClick={() => handleSort("helpers")}
                                        >
                                          Ayudantes Nombrados {sortField === "helpers" && (sortDirection === "asc" ? " ▴" : " ▾")}
                                        </span>
                                        <span 
                                          className="text-[9px] font-medium text-slate-500 hover:text-slate-300 cursor-pointer flex items-center gap-0.5 justify-end"
                                          onClick={() => handleSort("helpersDiff")}
                                        >
                                          (por cambio) {sortField === "helpersDiff" && (sortDirection === "asc" ? " ▴" : " ▾")}
                                        </span>
                                      </div>
                                    </th>
                                    <th className="px-4 py-3.5 select-none">
                                      <div className="flex flex-col gap-1 items-end">
                                        <span 
                                          className="cursor-pointer hover:text-white transition-colors flex items-center gap-0.5 justify-end"
                                          onClick={() => handleSort("helpersProtection")}
                                        >
                                          Ayudantes de Protección {sortField === "helpersProtection" && (sortDirection === "asc" ? " ▴" : " ▾")}
                                        </span>
                                        <span 
                                          className="text-[9px] font-medium text-slate-500 hover:text-slate-300 cursor-pointer flex items-center gap-0.5 justify-end"
                                          onClick={() => handleSort("protectionDiff")}
                                        >
                                          (por cambio) {sortField === "protectionDiff" && (sortDirection === "asc" ? " ▴" : " ▾")}
                                        </span>
                                      </div>
                                    </th>
                                    <th className="px-4 py-3.5 select-none">
                                      <div className="flex flex-col gap-1 items-end">
                                        <span 
                                          className="cursor-pointer hover:text-white transition-colors flex items-center gap-0.5 justify-end"
                                          onClick={() => handleSort("total")}
                                        >
                                          Total Ayudantes {sortField === "total" && (sortDirection === "asc" ? " ▴" : " ▾")}
                                        </span>
                                        <span 
                                          className="text-[9px] font-medium text-slate-500 hover:text-slate-300 cursor-pointer flex items-center gap-0.5 justify-end"
                                          onClick={() => handleSort("totalDiff")}
                                        >
                                          (por cambio) {sortField === "totalDiff" && (sortDirection === "asc" ? " ▴" : " ▾")}
                                        </span>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900/40">
                                  {sortedItems.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">
                                        No se encontraron registros con los criterios actuales
                                      </td>
                                    </tr>
                                  ) : (
                                    sortedItems.map((item, idx) => (
                                      <tr key={`${item.country}-${item.region}-${idx}`} className="hover:bg-slate-900/25 transition-colors">
                                        <td className="px-4 py-3.5 font-semibold text-slate-100 flex items-center gap-2">
                                          {renderCountryFlagImage(item.country, "h-3 w-4.5 object-cover rounded-sm shadow-sm")}
                                          <span>{item.country}</span>
                                        </td>
                                        <td className="px-4 py-3.5">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-slate-400 border border-slate-800">
                                            {item.region}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono">
                                          <div className="flex items-center justify-end gap-2.5">
                                            <div className="text-right">
                                              <span className="text-slate-400 text-[11px] font-medium">{item.initialHelpers}</span>
                                              <span className="text-slate-500 mx-1 text-[10px]">➔</span>
                                              <span className="text-slate-100 text-xs font-black">{item.latestHelpers}</span>
                                            </div>
                                            {renderTrendBadge(item.helpersDiff, item.helpersPct)}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono">
                                          <div className="flex items-center justify-end gap-2.5">
                                            <div className="text-right">
                                              <span className="text-slate-400 text-[11px] font-medium">{item.initialProtection}</span>
                                              <span className="text-slate-500 mx-1 text-[10px]">➔</span>
                                              <span className="text-slate-100 text-xs font-black">{item.latestProtection}</span>
                                            </div>
                                            {renderTrendBadge(item.protectionDiff, item.protectionPct)}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono">
                                          <div className="flex items-center justify-end gap-2.5">
                                            <div className="text-right bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800/40">
                                              <span className="text-slate-400 text-[11px] font-medium">{item.initialTotal}</span>
                                              <span className="text-slate-500 mx-1 text-[10px]">➔</span>
                                              <span className="text-slate-100 text-xs font-black">{item.latestTotal}</span>
                                            </div>
                                            {renderTrendBadge(item.totalDiff, item.totalPct)}
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                                {sortedItems.length > 0 && (
                                  <tfoot className="border-t border-slate-800 bg-slate-900/20 font-bold text-slate-300">
                                    <tr className="divide-x divide-slate-900/40">
                                      <td colSpan={2} className="px-4 py-3.5 text-xs font-bold text-slate-400">
                                        Totales Filtrados
                                      </td>
                                      <td className="px-4 py-3.5 text-right font-mono">
                                        <div className="flex items-center justify-end gap-2.5">
                                          <div className="text-right">
                                            <span className="text-slate-400 text-[11px]">{sumInitialHelpers}</span>
                                            <span className="text-slate-500 mx-1 text-[10px]">➔</span>
                                            <span className="text-white text-xs font-black">{sumLatestHelpers}</span>
                                          </div>
                                          {renderTrendBadge(sumHelpersDiff, sumHelpersPct)}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3.5 text-right font-mono">
                                        <div className="flex items-center justify-end gap-2.5">
                                          <div className="text-right">
                                            <span className="text-slate-400 text-[11px]">{sumInitialProtection}</span>
                                            <span className="text-slate-500 mx-1 text-[10px]">➔</span>
                                            <span className="text-white text-xs font-black">{sumLatestProtection}</span>
                                          </div>
                                          {renderTrendBadge(sumProtectionDiff, sumProtectionPct)}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3.5 text-right font-mono">
                                        <div className="flex items-center justify-end gap-2.5">
                                          <div className="text-right bg-slate-900/70 px-2 py-0.5 rounded border border-slate-800/80">
                                            <span className="text-slate-350 text-[11px]">{sumInitialTotal}</span>
                                            <span className="text-slate-450 mx-1 text-[10px]">➔</span>
                                            <span className="text-emerald-400 text-xs font-black">{sumLatestTotal}</span>
                                          </div>
                                          {renderTrendBadge(sumTotalDiff, sumTotalPct)}
                                        </div>
                                      </td>
                                    </tr>
                                  </tfoot>
                                )}
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  )}

                  {/* Sección: Análisis de Asambleas Espirituales Locales (AEL) */}
                  {subTab === "resumen" && (
                    <div className="space-y-6 pt-6 border-t border-slate-850/40 animate-fade-in">
                      <div className="bg-slate-900/15 border border-slate-850/60 rounded-3xl p-6 md:p-8 shadow-xl space-y-6" id="ael-analysis-section">
                        {/* Cabecera unificada de la sección */}
                        <div className="flex flex-col gap-1.5 border-b border-slate-850/65 pb-5">
                          <h3 className="text-sm font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-purple-400 animate-pulse" />
                            Análisis de Asambleas Espirituales Locales (AEL)
                          </h3>
                          <p className="text-xs text-slate-400">
                            Evolución del crecimiento del número de Asambleas Espirituales Locales (AEL) registradas históricamente en el territorio seleccionado ({selectedCountry === "Todos" ? "Toda la región" : selectedCountry}{selectedRegion !== "Todas" ? ` - ${selectedRegion}` : ""}).
                          </p>
                        </div>

                        <div className="space-y-6">
                          {/* Fila 2: Crecimiento de Asambleas Espirituales Locales (Gráfico + Panel de Crecimiento) */}
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                            {/* Gráfico 4: Crecimiento de Asambleas Espirituales Locales */}
                            <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Evolución del Número de Asambleas Espirituales Locales (AEL)
                              </span>
                              <div className="h-56 text-xs w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={growthData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
                                    <defs>
                                      <linearGradient id="colorLsa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                                    <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                      itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                      labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                      formatter={(value) => [`${value} AEL`, "Cantidad"]}
                                    />
                                    <Area type="monotone" dataKey="lsa" stroke="#a855f7" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLsa)" />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Panel de Crecimiento de Asambleas */}
                            <div className="bg-slate-950/40 border border-slate-850 hover:border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Análisis de Crecimiento</span>
                                <h3 className="text-sm font-semibold text-white">Evolución de Asambleas</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">Variación total registrada en el período histórico visible.</p>
                              </div>
                              
                              <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                {lsaTrendInfo.diff > 0 ? (
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      <TrendingUp className="h-3.5 w-3.5" />
                                      Incremento
                                    </span>
                                    <span className="text-3xl font-black text-emerald-400 mt-2">
                                      +{lsaTrendInfo.diff}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300">
                                      (+{lsaTrendInfo.pct}%)
                                    </span>
                                  </div>
                                ) : lsaTrendInfo.diff < 0 ? (
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                      <TrendingDown className="h-3.5 w-3.5" />
                                      Decremento
                                    </span>
                                    <span className="text-3xl font-black text-rose-400 mt-2">
                                      {lsaTrendInfo.diff}
                                    </span>
                                    <span className="text-xs font-bold text-slate-300">
                                      ({lsaTrendInfo.pct}%)
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                      Sin cambios
                                    </span>
                                    <span className="text-3xl font-black text-slate-400 mt-2">
                                      0
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                      (0%)
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                <div className="flex justify-between">
                                  <span>Valor Inicial:</span>
                                  <span className="text-slate-300 font-bold">{lsaTrendInfo.first}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Valor Actual:</span>
                                  <span className="text-slate-300 font-bold">{lsaTrendInfo.last}</span>
                                </div>
                                {lsaTrendInfo.range && (
                                  <div className="text-center pt-2 border-t border-slate-900/30 text-[9px] text-slate-600 uppercase tracking-wider font-bold">
                                    {lsaTrendInfo.range}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Tabla de Evolución de Asambleas Locales (AEL) */}
                          <LsaEvolutionTable
                            submissions={activeSubmissions}
                            selectedCountry={selectedCountry}
                            selectedRegion={selectedRegion}
                            dateFieldId={dateFieldId}
                            FIELD_ASAMBLEAS_CANTIDAD={FIELD_ASAMBLEAS_CANTIDAD}
                            FIELD_ASAMBLEAS_CONSULTA={FIELD_ASAMBLEAS_CONSULTA}
                            FIELD_ASAMBLEAS_LINEAS={FIELD_ASAMBLEAS_LINEAS}
                            renderCountryFlagImage={renderCountryFlagImage}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {((!formalReportMode && activeTab === "mca") || (formalReportMode && pdfSections.mca)) && (
            <div className={`bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 ${formalReportMode ? "page-break mb-10 print:mb-0 print:border-none print:shadow-none print:bg-transparent print:p-0" : "animate-fade-in"}`} style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
              {formalReportMode && (
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                    <Users className="h-4.5 w-4.5 text-blue-400" />
                    Sección II: Miembros de Cuerpo Auxiliar (MCA) ({getGroupConsolidatedLabel(selectedCountry, selectedGroup)})
                  </h2>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase print:hidden">Sección 2</span>
                </div>
              )}
              {(!formalReportMode ? subTab === "capacitacion" : true) && (
                <div className="space-y-6 animate-fade-in p-5 bg-slate-950/25 border border-slate-850/50 rounded-2xl">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-emerald-400" />
                    Estudio de la Carta del 1 de Enero
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Estadísticas de Capacitación */}
                    <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                        Estadísticas de Capacitación
                      </span>
                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-slate-400">Estudiaron Carta 1 Ene:</span>
                          <span className="font-bold text-blue-400 font-mono">{mcaStudiedLetterCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Porcentaje de Estudio de Carta */}
                    <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                        Porcentaje de Estudio de Carta
                      </span>
                      <div className="space-y-3 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Porcentaje de MCAs:</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">{mcaLetterPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${mcaLetterPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block italic">
                          Calculado sobre {mcaTotalWithSubmissions} MCAs reportados.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Historic chart of letter study (conditional on charts view mode) */}
                  {(viewMode === "both" || viewMode === "charts") && (
                    <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                          Evolución Histórica de Estudio de Carta
                        </span>
                        <span className="text-[10px] text-slate-550 italic">
                          Eje X: Campo Fecha
                        </span>
                      </div>
                      {mcaLetterHistoryData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center text-xs text-slate-500 italic border border-dashed border-slate-850 rounded-lg">
                          No hay suficientes datos históricos con fecha para mostrar la evolución.
                        </div>
                      ) : (
                        <div className="h-56 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={mcaLetterHistoryData}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorLetterCount" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis 
                                dataKey="label" 
                                stroke="#64748b" 
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis 
                                stroke="#64748b" 
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#0b0f19",
                                  borderColor: "#1e293b",
                                  borderRadius: "8px",
                                  fontSize: "11px",
                                  color: "#cbd5e1"
                                }}
                                labelClassName="font-bold text-slate-300"
                              />
                              <Area 
                                type="monotone" 
                                dataKey="count" 
                                name="MCAs que han estudiado"
                                stroke="#10b981" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorLetterCount)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* GRÁFICOS (VISTA: BOTH / CHARTS) */}
              {(viewMode === "both" || viewMode === "charts") && (
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <BarChart2 className="h-4 w-4 text-blue-400" />
                    Visualización de Datos (Gráficos)
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Gráficos: Relatos (Cantidad) y Relatos (Porcentaje) */}
                    {subTab === "capacitacion" && (
                      <div className="space-y-6 w-full animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                          <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Relatos Estudiados por Miembros de Cuerpo Auxiliar (Cantidad)
                            </span>
                            <div className="h-48 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={mcaStories}
                                    margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                  <XAxis dataKey="story" stroke="#64748b" fontSize={10} />
                                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    formatter={(value) => [value, "MCAs"]}
                                  />
                                  <Bar dataKey="count" name="MCAs" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                    {mcaStories.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Relatos Estudiados por Miembros de Cuerpo Auxiliar (%)
                            </span>
                            <div className="h-48 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={mcaStoriesPercentage}
                                  margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                  <XAxis dataKey="story" stroke="#64748b" fontSize={10} />
                                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} unit="%" />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    formatter={(value) => [`${value}%`, "MCAs"]}
                                  />
                                  <Bar dataKey="percent" name="MCAs" fill="#10b981" radius={[4, 4, 0, 0]}>
                                    {mcaStoriesPercentage.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#34d399"} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Gráfico de Evolución Histórica de Relatos Estudiados */}
                        <div className="space-y-6 w-full">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                            Histórico de Relatos Estudiados (Evolución en el Tiempo por Relato)
                          </span>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Muestra la evolución del total acumulado de miembros del Cuerpo Auxiliar (MCAs) que han estudiado cada relato basándose en la fecha del formulario, junto con el análisis de variación del último periodo.
                          </p>

                          <div className="flex flex-col gap-8">
                            {[
                              { name: "Batula", key: "Batula", color: "#8b5cf6" },
                              { name: "Bramour", key: "Bramour", color: "#f43f5e" },
                              { name: "Miramar", key: "Miramar", color: "#f59e0b" },
                              { name: "Orchard", key: "Orchard", color: "#6366f1" },
                              { name: "San Pedro", key: "San Pedro", color: "#10b981" }
                            ].map((relato) => {
                              const stats = mcaStoriesTrendStats[relato.key] || {
                                recentChange: 0,
                                recentDirection: "none",
                                firstVal: 0,
                                lastVal: 0,
                                prevVal: 0,
                                pctChange: 0
                              };

                              return (
                                <div key={relato.key} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch bg-slate-900/30 border border-slate-850/60 p-5 rounded-2xl shadow-md hover:border-slate-800 transition-all duration-300">
                                  {/* Left part: The Chart (3 columns on lg) */}
                                  <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850/40 rounded-xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-extrabold uppercase tracking-wider block flex items-center gap-1.5" style={{ color: relato.color }}>
                                        <TrendingUp className="h-4 w-4" />
                                        Relato: {relato.name}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-medium">MCAs acumulados por mes</span>
                                    </div>
                                    <div className="h-56 text-xs w-full">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={mcaStoriesHistoricalData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                          <XAxis dataKey="fecha" stroke="#64748b" fontSize={10} />
                                          <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                          <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                            labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                          />
                                          <Line type="monotone" name="MCAs" dataKey={relato.key} stroke={relato.color} strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>

                                  {/* Right part: The KPI Panel (1 column on lg) */}
                                  <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-all duration-300">
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: relato.color }}>Análisis {relato.name}</span>
                                      <h4 className="text-sm font-bold text-white">Variación del Último Periodo</h4>
                                      <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Cambio en la cantidad de MCAs que han reportado haber estudiado este relato específico en el último mes de informe.
                                      </p>
                                    </div>

                                    <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                      {stats.recentChange > 0 ? (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                            <TrendingUp className="h-3 w-3" />
                                            Incremento
                                          </span>
                                          <span className="text-3xl font-black text-emerald-400 mt-2">
                                            +{stats.recentChange}
                                          </span>
                                        </>
                                      ) : stats.recentChange < 0 ? (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                                            <TrendingDown className="h-3 w-3" />
                                            Disminución
                                          </span>
                                          <span className="text-3xl font-black text-rose-400 mt-2">
                                            {stats.recentChange}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">
                                            Estable
                                          </span>
                                          <span className="text-3xl font-black text-slate-400 mt-2">
                                            0
                                          </span>
                                        </>
                                      )}
                                      <span className="text-[10px] text-slate-500 mt-1 block">
                                        MCAs nuevos este mes
                                      </span>
                                    </div>

                                    <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                      <div className="flex justify-between">
                                        <span>Valor Periodo Anterior:</span>
                                        <span className="text-slate-300 font-bold">{stats.prevVal}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Valor Periodo Actual:</span>
                                        <span className="text-slate-300 font-bold">{stats.lastVal}</span>
                                      </div>
                                      {stats.recentChange !== 0 && (
                                        <div className="flex justify-between">
                                          <span>Tasa de Variación:</span>
                                          <span className={`font-bold ${stats.recentChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {stats.recentChange > 0 ? '+' : ''}{stats.pctChange}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Tabla de Relatos de Salud Espiritual (MCA) */}
                        <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-indigo-400" />
                              <div>
                                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">
                                  Tabla de Relatos de Salud Espiritual (MCA)
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Detalle por país y región de los relatos de salud espiritual estudiados por los MCAs con variación respecto al periodo pasado
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20 shadow-md">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <th className="p-3.5 pl-5">País</th>
                                  <th className="p-3.5">Región</th>
                                    {["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"].map((story) => (
                                      <th key={story} className="p-3.5 text-center font-semibold text-slate-300">
                                        <div className="flex items-center justify-center gap-1">
                                          <BookOpen className="h-3 w-3 text-indigo-400/70" />
                                          <span>{story}</span>
                                        </div>
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850/30">
                                  {getSortedMcaStories().length === 0 ? (
                                    <tr>
                                      <td colSpan={7} className="p-10 text-center text-slate-500 italic">
                                        No hay datos registrados para la selección actual.
                                      </td>
                                    </tr>
                                  ) : (
                                    getSortedMcaStories().map((loc, idx) => {
                                      const prevLoc = previousMcaStoriesByLocationStats.find(
                                        p => p.country === loc.country && p.region === loc.region
                                      );
                                      
                                      const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];

                                      return (
                                        <tr key={idx} className="hover:bg-indigo-500/5 even:bg-slate-900/15 transition-colors">
                                          <td className="p-3.5 pl-5 font-semibold text-slate-200">
                                            <div className="flex items-center gap-2">
                                              {renderCountryFlagImage(loc.country, "h-3.5 w-5 object-cover rounded shadow-sm")}
                                              <span>{loc.country}</span>
                                            </div>
                                          </td>
                                          <td className="p-3.5 text-slate-400 font-medium">
                                            <div className="flex items-center gap-1.5 text-slate-300">
                                              <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                              <span>{loc.region}</span>
                                            </div>
                                          </td>
                                          
                                          {storyNames.map((story) => {
                                            const count = loc.stories[story] || 0;
                                            const prevCount = prevLoc?.stories[story] || 0;
                                            const diff = count - prevCount;
                                            
                                            return (
                                              <td key={story} className="p-3.5 text-center">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                  <span className={`inline-flex items-center justify-center min-w-[32px] h-6 px-2 text-xs font-bold rounded-lg transition-all ${
                                                    count > 0 
                                                      ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-extrabold shadow-sm shadow-indigo-500/5" 
                                                      : "text-slate-600 font-normal opacity-40"
                                                  }`}>
                                                    {count > 0 ? count : "0"}
                                                  </span>
                                                  {dateTrendMetrics.hasTrend && diff !== 0 && (
                                                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                                      diff > 0 ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                                                    }`}>
                                                      {diff > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                                      {diff > 0 ? `+${diff}` : diff}
                                                    </span>
                                                  )}
                                                </div>
                                              </td>
                                            );
                                          })}
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>

                                {getSortedMcaStories().length > 0 && (
                                  <tfoot>
                                    <tr className="bg-slate-900/60 border-t border-slate-800 text-slate-200 font-bold">
                                      <td colSpan={2} className="p-4 pl-5">
                                        <div className="flex items-center gap-1.5 text-indigo-400">
                                          <Award className="h-4 w-4 shrink-0" />
                                          <span>Total Consolidado (MCAs)</span>
                                        </div>
                                      </td>
                                      
                                      {["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"].map((story) => {
                                        const totalCurrent = getSortedMcaStories().reduce((acc, loc) => acc + (loc.stories[story] || 0), 0);
                                        const totalPrev = previousMcaStoriesByLocationStats.reduce((acc, loc) => acc + (loc.stories[story] || 0), 0);
                                        const diff = totalCurrent - totalPrev;

                                        return (
                                          <td key={story} className="p-4 text-center bg-slate-900/40">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                              <span className="text-xs font-black text-slate-100 bg-slate-800/60 px-2 py-1 rounded border border-slate-700/50 min-w-[32px] inline-block">
                                                {totalCurrent}
                                              </span>
                                              {dateTrendMetrics.hasTrend && diff !== 0 && (
                                                <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                  diff > 0 ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                                                }`}>
                                                  {diff > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                                  {diff > 0 ? `+${diff}` : diff}
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  </tfoot>
                                )}
                              </table>
                          </div>
                        </div>
                      </div>
                    )}



                    {/* Gráfico 2: Secuencia Ruhí */}
                    {(!formalReportMode ? subTab === "instituto" : true) && (
                      <div className={`bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4 ${formalReportMode ? "mt-8" : ""}`} style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte A: Análisis de Instituto (Secuencia Ruhí)</span>
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Secuencia Ruhí: Completados vs En Proceso
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Chart 1: Completado */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold text-emerald-400 block text-center">
                              Completados (Libros Ruhí)
                            </span>
                            <div className="h-44 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={mcaRuhiBooks}
                                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                >
                                  <XAxis dataKey="book" stroke="#64748b" fontSize={10} />
                                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                                  <Bar dataKey="u1_completed" name="U1" fill="#6ee7b7" radius={[3, 3, 0, 0]} />
                                  <Bar dataKey="u2_completed" name="U2" fill="#10b981" radius={[3, 3, 0, 0]} />
                                  <Bar dataKey="u3_completed" name="U3" fill="#047857" radius={[3, 3, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Chart 2: En Proceso */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-semibold text-blue-400 block text-center">
                              En Proceso (Libros Ruhí)
                            </span>
                            <div className="h-44 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={mcaRuhiBooks}
                                  margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                >
                                  <XAxis dataKey="book" stroke="#64748b" fontSize={10} />
                                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                                  <Bar dataKey="u1_studying" name="U1" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                                  <Bar dataKey="u2_studying" name="U2" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                  <Bar dataKey="u3_studying" name="U3" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Nuevo Gráfico de Porcentaje de Unidades Completadas vs En Proceso */}
                        <div className="border-t border-slate-850 pt-5 mt-4 space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                            Porcentaje por Unidad: Completado vs En Proceso (Libros Ruhí)
                          </span>
                          <div className="h-64 text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={mcaRuhiUnitsPercentageData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                                <XAxis 
                                  dataKey="unitLabel" 
                                  stroke="#64748b" 
                                  fontSize={9}
                                  tickLine={false}
                                />
                                <YAxis 
                                  stroke="#64748b" 
                                  fontSize={10} 
                                  domain={[0, 100]} 
                                  unit="%" 
                                  tickLine={false}
                                />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                  itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                  labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                  formatter={(value) => [`${value}%`]}
                                />
                                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                                <Bar dataKey="completado" name="% Completado" fill="#10b981" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="enProceso" name="% En Proceso" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}

                    {(!formalReportMode ? subTab === "instituto" : true) && (
                      <div className="space-y-6 animate-fade-in" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte B: Detalle de Libros de la Secuencia Ruhí</span>
                          </div>
                        )}
                        
                        {/* Contenedor Unificado de Libros Ruhí */}
                        <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-5 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-teal-400" />
                              <div>
                                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">
                                  Análisis Unificado de Libros Ruhí por País y Región
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Seleccione un libro para analizar el progreso de completados y en proceso en cada región
                                </span>
                              </div>
                            </div>
                            
                            {/* Selector de Libro (Pestañas) */}
                            <div className="flex flex-col gap-2 bg-slate-900/90 p-3 border-2 border-slate-800 rounded-2xl shadow-xl shadow-teal-950/20 max-w-full sm:max-w-xl md:max-w-none w-full lg:w-auto relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>
                              <div className="flex items-center justify-between px-1 mb-1">
                                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                                  Seleccionar Libro de Trabajo:
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                                  {selectedRuhiBookTab}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"].map((book) => {
                                  const isSelected = selectedRuhiBookTab === book;
                                  return (
                                    <button
                                      key={book}
                                      onClick={() => setSelectedRuhiBookTab(book)}
                                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-sm transform active:scale-95 ${
                                        isSelected 
                                          ? "bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/20 scale-[1.05] border border-teal-300/30" 
                                          : "bg-slate-950/70 border border-slate-850 hover:bg-slate-850 hover:border-slate-800 text-slate-300 hover:text-white"
                                      }`}
                                    >
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>}
                                      <span>
                                        <span className="hidden sm:inline">Libro </span>
                                        <span className="sm:hidden">L</span>
                                        {book.split(" ")[1]}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Tarjetas de Análisis en cada Libro - KPIs de Crecimiento */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Card 1: Crecimiento Completados */}
                            {(() => {
                              const diff = currentBookCompleted - prevBookCompleted;
                              const hasTrend = dateTrendMetrics.hasTrend;
                              
                              return (
                                <div className="bg-slate-900/40 border border-slate-850/70 rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                                  <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                                  
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                                      Crecimiento Completados - {selectedRuhiBookTab}
                                    </span>
                                    
                                    {hasTrend ? (
                                      <div>
                                        <div className="flex items-baseline gap-1">
                                          <span className={`text-3xl font-black tracking-tight ${
                                            diff > 0 
                                              ? "text-emerald-400" 
                                              : diff < 0 
                                                ? "text-rose-400" 
                                                : "text-slate-300"
                                          }`}>
                                            {diff > 0 ? `+${diff}` : diff}
                                          </span>
                                          <span className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                                            {diff > 0 ? "Nuevos Completados" : diff < 0 ? "Menos Completados" : "Sin variación"}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                          con respecto al período anterior ({dateTrendMetrics.prevDateLabel || "anterior"})
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-emerald-400 tracking-tight">
                                          {currentBookCompleted}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                                          Total Completados
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Card 2: Crecimiento En Proceso */}
                            {(() => {
                              const diff = currentBookStudying - prevBookStudying;
                              const hasTrend = dateTrendMetrics.hasTrend;
                              
                              return (
                                <div className="bg-slate-900/40 border border-slate-850/70 rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                                  <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                                  
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                                      Crecimiento En Proceso - {selectedRuhiBookTab}
                                    </span>
                                    
                                    {hasTrend ? (
                                      <div>
                                        <div className="flex items-baseline gap-1">
                                          <span className={`text-3xl font-black tracking-tight ${
                                            diff > 0 
                                              ? "text-blue-400" 
                                              : diff < 0 
                                                ? "text-rose-400" 
                                                : "text-slate-300"
                                          }`}>
                                            {diff > 0 ? `+${diff}` : diff}
                                          </span>
                                          <span className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                                            {diff > 0 ? "Nuevos en Proceso" : diff < 0 ? "Menos en Proceso" : "Sin variación"}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                          con respecto al período anterior ({dateTrendMetrics.prevDateLabel || "anterior"})
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-blue-400 tracking-tight">
                                          {currentBookStudying}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                                          Total en Proceso
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* RESUMEN DE UNIDADES DE LOS FILTRADOS */}
                          <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-850 pb-2">
                              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                                Resumen General de Unidades para {selectedRuhiBookTab}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-950/40 border border-slate-850/50 px-2 py-0.5 rounded-md">
                                Total MCAs: <strong className="text-indigo-400">{filteredBookUnitTotals.filteredMcaTotal}</strong>
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Unidad 1 */}
                              {(() => {
                                const tot = filteredBookUnitTotals.filteredMcaTotal;
                                const compPct = tot > 0 ? Math.round((filteredBookUnitTotals.u1Comp / tot) * 100) : 0;
                                const studyPct = tot > 0 ? Math.round((filteredBookUnitTotals.u1Study / tot) * 100) : 0;
                                return (
                                  <div className="bg-slate-950/45 border border-slate-850/60 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-slate-800 transition-all duration-300">
                                    <span className="text-sm font-bold text-slate-200 text-center uppercase tracking-wider block border-b border-slate-900/80 pb-1.5">Unidad 1</span>
                                    <div className="grid grid-cols-2 divide-x divide-slate-900/60">
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">Completados</span>
                                        <span className="text-lg font-extrabold text-emerald-400">{filteredBookUnitTotals.u1Comp}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({compPct}%)</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">En Proceso</span>
                                        <span className="text-lg font-extrabold text-blue-400">{filteredBookUnitTotals.u1Study}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({studyPct}%)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Unidad 2 */}
                              {(() => {
                                const tot = filteredBookUnitTotals.filteredMcaTotal;
                                const compPct = tot > 0 ? Math.round((filteredBookUnitTotals.u2Comp / tot) * 100) : 0;
                                const studyPct = tot > 0 ? Math.round((filteredBookUnitTotals.u2Study / tot) * 100) : 0;
                                return (
                                  <div className="bg-slate-950/45 border border-slate-850/60 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-slate-800 transition-all duration-300">
                                    <span className="text-sm font-bold text-slate-200 text-center uppercase tracking-wider block border-b border-slate-900/80 pb-1.5">Unidad 2</span>
                                    <div className="grid grid-cols-2 divide-x divide-slate-900/60">
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">Completados</span>
                                        <span className="text-lg font-extrabold text-emerald-400">{filteredBookUnitTotals.u2Comp}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({compPct}%)</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">En Proceso</span>
                                        <span className="text-lg font-extrabold text-blue-400">{filteredBookUnitTotals.u2Study}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({studyPct}%)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Unidad 3 */}
                              {(() => {
                                const tot = filteredBookUnitTotals.filteredMcaTotal;
                                const compPct = tot > 0 ? Math.round((filteredBookUnitTotals.u3Comp / tot) * 100) : 0;
                                const studyPct = tot > 0 ? Math.round((filteredBookUnitTotals.u3Study / tot) * 100) : 0;
                                return (
                                  <div className="bg-slate-950/45 border border-slate-850/60 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-slate-800 transition-all duration-300">
                                    <span className="text-sm font-bold text-slate-200 text-center uppercase tracking-wider block border-b border-slate-900/80 pb-1.5">Unidad 3</span>
                                    <div className="grid grid-cols-2 divide-x divide-slate-900/60">
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">Completados</span>
                                        <span className="text-lg font-extrabold text-emerald-400">{filteredBookUnitTotals.u3Comp}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({compPct}%)</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">En Proceso</span>
                                        <span className="text-lg font-extrabold text-blue-400">{filteredBookUnitTotals.u3Study}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({studyPct}%)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Tabla de Datos Unificada */}
                          <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20 shadow-md">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <th className="p-3.5 pl-5">País</th>
                                  <th className="p-3.5">Región</th>
                                  <th className="p-3.5 text-center">Unidades Completadas ({selectedRuhiBookTab})</th>
                                  <th className="p-3.5 text-center">Unidades En Proceso ({selectedRuhiBookTab})</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850/30">
                                {filteredMcaRuhiStats.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="p-10 text-center text-slate-500 italic">
                                      {tableSearch ? "No se encontraron resultados para la búsqueda actual." : "No hay datos de Ruhí registrados para la selección actual."}
                                    </td>
                                  </tr>
                                ) : (
                                  filteredMcaRuhiStats.map((loc, idx) => {
                                    const comp = loc.booksCompleted[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
                                    const study = loc.booksStudying[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
                                    
                                    // Encontrar cambio por región respecto al periodo anterior
                                    const prevLoc = previousMcaRuhiStats.find(p => p.country === loc.country && p.region === loc.region);
                                    const prevComp = prevLoc?.booksCompleted[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
                                    const prevStudy = prevLoc?.booksStudying[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
                                    
                                    const compDiff = comp.total - prevComp.total;
                                    const studyDiff = study.total - prevStudy.total;

                                    return (
                                      <tr key={idx} className="hover:bg-slate-900/35 transition-colors">
                                        <td className="p-3.5 pl-5 font-semibold text-slate-200">
                                          <div className="flex items-center gap-2">
                                            {renderCountryFlagImage(loc.country, "h-3.5 w-5 object-cover rounded shadow-sm")}
                                            <span>{loc.country}</span>
                                          </div>
                                        </td>
                                        <td className="p-3.5 text-slate-400 font-medium">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                            <span>{loc.region}</span>
                                          </div>
                                        </td>
                                        
                                        {/* Completados por Unidades */}
                                        <td className="p-3.5 text-center">
                                          <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                                            <div className="text-[11px] font-mono flex items-center gap-1.5">
                                              {/* Unidad 1 completed badge */}
                                              <span 
                                                title="Unidad 1 completada" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  comp.u1 > 0 
                                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u1: {comp.u1}
                                              </span>
                                              
                                              {/* Unidad 2 completed badge */}
                                              <span 
                                                title="Unidad 2 completada" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  comp.u2 > 0 
                                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u2: {comp.u2}
                                              </span>
                                              
                                              {/* Unidad 3 completed badge */}
                                              <span 
                                                title="Unidad 3 completada" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  comp.u3 > 0 
                                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u3: {comp.u3}
                                              </span>
                                            </div>
                                            {dateTrendMetrics.hasTrend && compDiff !== 0 && (
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                                compDiff > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                                              }`}>
                                                {compDiff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                                {compDiff > 0 ? `+${compDiff}` : compDiff} total
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* En Proceso por Unidades */}
                                        <td className="p-3.5 text-center">
                                          <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                                            <div className="text-[11px] font-mono flex items-center gap-1.5">
                                              {/* Unidad 1 study badge */}
                                              <span 
                                                title="Unidad 1 en proceso" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  study.u1 > 0 
                                                    ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u1: {study.u1}
                                              </span>
                                              
                                              {/* Unidad 2 study badge */}
                                              <span 
                                                title="Unidad 2 en proceso" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  study.u2 > 0 
                                                    ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u2: {study.u2}
                                              </span>
                                              
                                              {/* Unidad 3 study badge */}
                                              <span 
                                                title="Unidad 3 en proceso" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  study.u3 > 0 
                                                    ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u3: {study.u3}
                                              </span>
                                            </div>
                                            {dateTrendMetrics.hasTrend && studyDiff !== 0 && (
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                                studyDiff > 0 ? "text-blue-400 bg-blue-500/10" : "text-rose-400 bg-rose-500/10"
                                              }`}>
                                                {studyDiff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                                {studyDiff > 0 ? `+${studyDiff}` : studyDiff} total
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                              
                              {/* TOTALES GENERALES DEL PIE DE TABLA */}
                              {filteredMcaRuhiStats.length > 0 && (
                                <tfoot>
                                  <tr className="bg-slate-900/50 border-t border-slate-800 text-slate-200 font-bold">
                                    <td colSpan={2} className="p-4 pl-5">
                                      <div className="flex items-center gap-1.5 text-indigo-400">
                                        <Award className="h-4 w-4 shrink-0" />
                                        <span>Total Consolidado</span>
                                      </div>
                                    </td>
                                    
                                    {/* Total Completados por Unidades */}
                                    <td className="p-4 text-center">
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="text-xs font-mono font-extrabold flex items-center gap-2 bg-slate-950/40 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                                          <span className="text-slate-400">u1: <span className="text-emerald-400">{filteredBookUnitTotals.u1Comp}</span></span>
                                          <span className="text-slate-700">|</span>
                                          <span className="text-slate-400">u2: <span className="text-emerald-400">{filteredBookUnitTotals.u2Comp}</span></span>
                                          <span className="text-slate-700">|</span>
                                          <span className="text-slate-400">u3: <span className="text-emerald-400">{filteredBookUnitTotals.u3Comp}</span></span>
                                        </div>
                                        {dateTrendMetrics.hasTrend && filteredBookUnitTotals.diffCompTotal !== 0 && (
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1.5 flex items-center gap-0.5 ${
                                            filteredBookUnitTotals.diffCompTotal > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                                          }`}>
                                            {filteredBookUnitTotals.diffCompTotal > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {filteredBookUnitTotals.diffCompTotal > 0 ? `+${filteredBookUnitTotals.diffCompTotal}` : filteredBookUnitTotals.diffCompTotal} global
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Total En Proceso por Unidades */}
                                    <td className="p-4 text-center">
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="text-xs font-mono font-extrabold flex items-center gap-2 bg-slate-950/40 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                                          <span className="text-slate-400">u1: <span className="text-blue-400">{filteredBookUnitTotals.u1Study}</span></span>
                                          <span className="text-slate-700">|</span>
                                          <span className="text-slate-400">u2: <span className="text-blue-400">{filteredBookUnitTotals.u2Study}</span></span>
                                          <span className="text-slate-700">|</span>
                                          <span className="text-slate-400">u3: <span className="text-blue-400">{filteredBookUnitTotals.u3Study}</span></span>
                                        </div>
                                        {dateTrendMetrics.hasTrend && filteredBookUnitTotals.diffStudyTotal !== 0 && (
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1.5 flex items-center gap-0.5 ${
                                            filteredBookUnitTotals.diffStudyTotal > 0 ? "text-blue-400 bg-blue-500/10" : "text-rose-400 bg-rose-500/10"
                                          }`}>
                                            {filteredBookUnitTotals.diffStudyTotal > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {filteredBookUnitTotals.diffStudyTotal > 0 ? `+${filteredBookUnitTotals.diffStudyTotal}` : filteredBookUnitTotals.diffStudyTotal} global
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Espacios de Salud para MCA */}
                    {(!formalReportMode ? subTab === "espacios" : true) && (
                      <div className="space-y-12 w-full animate-fade-in" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte C: Espacios de Salud (Participación y Facilitación)</span>
                          </div>
                        )}
                        
                        {/* SECCIÓN 1: PARTICIPACIÓN EN ESPACIOS DE ESTUDIO */}
                        <div className="space-y-6 border-b border-slate-850 pb-10">
                          <div className="border-l-4 border-purple-500 pl-4 py-1">
                            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">I. Participación en Espacios de Estudio</h3>
                            <p className="text-xs text-slate-400">Estadísticas, indicadores de asistencia y evolución histórica de los MCAs en espacios de salud espiritual.</p>
                          </div>

                          <div className="space-y-6">
                            {/* Bloque 1: Gráfico Circular + Panel KPI de Participación */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                              {/* Gráfico: Participación */}
                              <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                  <Activity className="h-3.5 w-3.5 text-purple-500" />
                                  Participación de MCAs en Espacios de Estudio
                                </span>
                                <div className="h-52 flex items-center justify-center relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={mcaParticipationChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                      >
                                        {mcaParticipationChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                        itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                        formatter={(value) => [value, "MCAs"]}
                                      />
                                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div className="absolute text-center">
                                    <span className="text-xl font-black text-purple-300">{mcaParticipatingPercent}%</span>
                                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Participa</span>
                                  </div>
                                </div>
                              </div>

                              {/* Panel KPI de Participación */}
                              <div className="bg-slate-950/40 border border-slate-850 hover:border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Métrica Clave</span>
                                  <h3 className="text-sm font-bold text-white">Participantes en Espacios</h3>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">Cantidad de miembros de Cuerpo Auxiliar (MCAs) que reportan participación activa en espacios de estudio de salud espiritual.</p>
                                </div>

                                <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                                    <Activity className="h-3 w-3" />
                                    Participación
                                  </span>
                                  <span className="text-3xl font-black text-purple-300 mt-2">
                                    {mcaParticipatingCount}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-300 mt-0.5">
                                    {mcaParticipatingPercent}% del total
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex justify-between">
                                    <span>Total MCAs Activos:</span>
                                    <span className="text-slate-300 font-bold">{mcaTotalWithSubmissions}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>No Participantes:</span>
                                    <span className="text-slate-300 font-bold">{Math.max(0, mcaTotalWithSubmissions - mcaParticipatingCount)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bloque 2: Evolución Histórica de Participación */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch w-full">
                              {/* Left: Chart */}
                              <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                                    Evolución Histórica de Participación en Espacios (MCA)
                                  </span>
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    Tendencia temporal de la cantidad de Miembros de Cuerpo Auxiliar (MCAs) participando activamente.
                                  </p>
                                </div>
                                <div className="h-64 text-xs w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={mcaSpacesTimelineData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                      <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                                      <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                      />
                                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                      <Line type="monotone" name="MCAs Participando" dataKey="participating" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                                      <Line type="monotone" name="Total MCAs Reportados" dataKey="total" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Right: Trend/Change Analysis Panel */}
                              <div className="bg-slate-950/40 border border-slate-850 hover:border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Análisis de Tendencia</span>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Variación histórica calculada entre los periodos del informe.
                                  </p>
                                </div>

                                <div className="my-4 py-3 border-y border-slate-850/40 space-y-4">
                                  {/* Cambio Reciente */}
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cambio Último Periodo</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      {mcaSpacesTrendStats.participating.recentChange > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          <TrendingUp className="h-3 w-3" />
                                          +{mcaSpacesTrendStats.participating.recentChange}
                                        </span>
                                      ) : mcaSpacesTrendStats.participating.recentChange < 0 ? (
                                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                          <TrendingDown className="h-3 w-3" />
                                          {mcaSpacesTrendStats.participating.recentChange}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">
                                          Sin cambio
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Cambio Histórico Total */}
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evolución Histórica Total</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      {mcaSpacesTrendStats.participating.totalChange > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-black text-sm">
                                          Incremento de +{mcaSpacesTrendStats.participating.totalChange} MCAs
                                        </span>
                                      ) : mcaSpacesTrendStats.participating.totalChange < 0 ? (
                                        <span className="inline-flex items-center gap-1 text-rose-400 font-black text-sm">
                                          Decremento de {mcaSpacesTrendStats.participating.totalChange} MCAs
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-300 font-bold text-sm">
                                          Estable (0 cambio)
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-500 mt-1 leading-none font-medium text-center block">
                                      De {mcaSpacesTrendStats.participating.firstVal} a {mcaSpacesTrendStats.participating.lastVal} participantes
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex justify-between">
                                    <span>Periodo Inicial:</span>
                                    <span className="text-slate-300 font-mono font-bold">{mcaSpacesTimelineData[0]?.fecha || "-"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Periodo Actual:</span>
                                    <span className="text-slate-300 font-mono font-bold">{mcaSpacesTimelineData[mcaSpacesTimelineData.length - 1]?.fecha || "-"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECCIÓN 2: FACILITACIÓN DE ESPACIOS DE ESTUDIO */}
                        <div className="space-y-6">
                          <div className="border-l-4 border-blue-500 pl-4 py-1">
                            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">II. Facilitación de Espacios de Estudio</h3>
                            <p className="text-xs text-slate-400">Análisis del rol activo de los MCAs como facilitadores de espacios de salud espiritual y regularidad de sus reuniones.</p>
                          </div>

                          <div className="space-y-6">
                            {/* Bloque 1: Gráfico Circular + Panel KPI de Facilitación */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                              {/* Gráfico: Facilitación */}
                              <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                  <Award className="h-3.5 w-3.5 text-blue-500" />
                                  Facilitación de Espacios por MCAs
                                </span>
                                <div className="h-52 flex items-center justify-center relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={mcaFacilitationChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                      >
                                        {mcaFacilitationChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                        itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                        formatter={(value) => [value, "MCAs"]}
                                      />
                                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div className="absolute text-center">
                                    <span className="text-xl font-black text-blue-300">{mcaFacilitatingPercent}%</span>
                                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Facilita</span>
                                  </div>
                                </div>
                              </div>

                              {/* Panel KPI de Facilitación */}
                              <div className="bg-slate-950/40 border border-slate-850 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Métrica Clave</span>
                                  <h3 className="text-sm font-bold text-white">Facilitadores de Espacios</h3>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">Cantidad de miembros de Cuerpo Auxiliar (MCAs) que están facilitando activamente algún espacio de estudio de salud espiritual.</p>
                                </div>

                                <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                                    <Award className="h-3 w-3" />
                                    Facilitación
                                  </span>
                                  <span className="text-3xl font-black text-blue-300 mt-2">
                                    {mcaFacilitatingCount}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-300 mt-0.5">
                                    {mcaFacilitatingPercent}% del total
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex justify-between">
                                    <span>Total MCAs Activos:</span>
                                    <span className="text-slate-300 font-bold">{mcaTotalWithSubmissions}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>No Facilitadores:</span>
                                    <span className="text-slate-300 font-bold">{Math.max(0, mcaTotalWithSubmissions - mcaFacilitatingCount)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bloque 2: Evolución Histórica de Facilitación */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch w-full">
                              {/* Left: Chart */}
                              <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                                    Evolución Histórica de Facilitación de Espacios (MCA)
                                  </span>
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    Tendencia temporal de la cantidad de Miembros de Cuerpo Auxiliar (MCAs) facilitando activamente.
                                  </p>
                                </div>
                                <div className="h-64 text-xs w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={mcaSpacesTimelineData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                      <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                                      <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                      />
                                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                      <Line type="monotone" name="MCAs Facilitando" dataKey="facilitating" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                                      <Line type="monotone" name="Total MCAs Reportados" dataKey="total" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Right: Trend/Change Analysis Panel */}
                              <div className="bg-slate-950/40 border border-slate-850 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Análisis de Tendencia</span>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Variación histórica calculada entre los periodos del informe.
                                  </p>
                                </div>

                                <div className="my-4 py-3 border-y border-slate-850/40 space-y-4">
                                  {/* Cambio Reciente */}
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cambio Último Periodo</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      {mcaSpacesTrendStats.facilitating.recentChange > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          <TrendingUp className="h-3 w-3" />
                                          +{mcaSpacesTrendStats.facilitating.recentChange}
                                        </span>
                                      ) : mcaSpacesTrendStats.facilitating.recentChange < 0 ? (
                                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-xs bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                          <TrendingDown className="h-3 w-3" />
                                          {mcaSpacesTrendStats.facilitating.recentChange}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-xs bg-slate-500/10 px-2 py-0.5 rounded border border-slate-500/20">
                                          Sin cambio
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Cambio Histórico Total */}
                                  <div className="flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evolución Histórica Total</span>
                                    <div className="flex items-center gap-1.5 mt-1">
                                      {mcaSpacesTrendStats.facilitating.totalChange > 0 ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-400 font-black text-sm">
                                          Incremento de +{mcaSpacesTrendStats.facilitating.totalChange} MCAs
                                        </span>
                                      ) : mcaSpacesTrendStats.facilitating.totalChange < 0 ? (
                                        <span className="inline-flex items-center gap-1 text-rose-400 font-black text-sm">
                                          Decremento de {mcaSpacesTrendStats.facilitating.totalChange} MCAs
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-300 font-bold text-sm">
                                          Estable (0 cambio)
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-slate-500 mt-1 leading-none font-medium text-center block">
                                      De {mcaSpacesTrendStats.facilitating.firstVal} a {mcaSpacesTrendStats.facilitating.lastVal} facilitadores
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex justify-between">
                                    <span>Periodo Inicial:</span>
                                    <span className="text-slate-300 font-mono font-bold">{mcaSpacesTimelineData[0]?.fecha || "-"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Periodo Actual:</span>
                                    <span className="text-slate-300 font-mono font-bold">{mcaSpacesTimelineData[mcaSpacesTimelineData.length - 1]?.fecha || "-"}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                             {/* Bloque 3: Frecuencia / Regularidad de Espacios Facilitados */}
                             <div className="bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg w-full">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                 <Activity className="h-3.5 w-3.5 text-emerald-400" />
                                 Frecuencia / Regularidad de Espacios Facilitados (MCAs)
                               </span>
                               <p className="text-xs text-slate-400 leading-relaxed">
                                 Distribución de los intervalos de tiempo reportados por los facilitadores de los espacios de salud espiritual.
                               </p>
                               {mcaTotalWithSubmissions === 0 ? (
                                 <div className="py-6 text-center text-slate-500 italic text-xs">
                                   No hay frecuencias de facilitación registradas o activas para la selección actual.
                                 </div>
                               ) : (
                                 <div className="space-y-6">
                                   <div>
                                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                       Cantidad Absoluta (Número de MCAs)
                                     </span>
                                     <div className="h-52 text-xs">
                                       <ResponsiveContainer width="100%" height="100%">
                                         <BarChart
                                           data={mcaFacilitationRegularities}
                                           margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                                         >
                                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                           <XAxis dataKey="regularity" stroke="#64748b" fontSize={10} />
                                           <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                           <Tooltip
                                             contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                             itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                             labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                             formatter={(value) => [value, "MCAs"]}
                                           />
                                           <Bar dataKey="count" name="MCAs" fill="#10b981" radius={[4, 4, 0, 0]}>
                                             {mcaFacilitationRegularities.map((entry, index) => (
                                               <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#34d399"} />
                                             ))}
                                           </Bar>
                                         </BarChart>
                                       </ResponsiveContainer>
                                     </div>
                                   </div>

                                   <div className="border-t border-slate-850/60 pt-4">
                                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                                       Distribución Porcentual (%)
                                     </span>
                                     <div className="h-52 text-xs">
                                       <ResponsiveContainer width="100%" height="100%">
                                         <BarChart
                                           data={mcaFacilitationRegularitiesWithPercentages}
                                           margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                                         >
                                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                           <XAxis dataKey="regularity" stroke="#64748b" fontSize={10} />
                                           <YAxis stroke="#64748b" fontSize={10} tickFormatter={(val) => `${val}%`} />
                                           <Tooltip
                                             contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                             itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                             labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                             formatter={(value) => [`${value}%`, "Porcentaje"]}
                                           />
                                           <Bar dataKey="percentage" name="Porcentaje" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                             {mcaFacilitationRegularitiesWithPercentages.map((entry, index) => (
                                               <Cell key={`cell-pct-${index}`} fill={index % 2 === 0 ? "#3b82f6" : "#60a5fa"} />
                                             ))}
                                           </Bar>
                                         </BarChart>
                                       </ResponsiveContainer>
                                     </div>
                                   </div>
                                 </div>
                               )}
                             </div>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              )}


            </div>
          )}

          {((!formalReportMode && activeTab === "helpers") || (formalReportMode && pdfSections.helpers)) && (
            <div className={`bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 ${formalReportMode ? "page-break mb-10 print:mb-0 print:border-none print:shadow-none print:bg-transparent print:p-0" : "animate-fade-in"}`} style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
              {formalReportMode && (
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Briefcase className="h-4.5 w-4.5 text-indigo-400" />
                    Sección III: Ayudantes de Cuerpo Auxiliar ({getGroupConsolidatedLabel(selectedCountry, selectedGroup)})
                  </h2>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase print:hidden">Sección 3</span>
                </div>
              )}
              {/* GRÁFICOS (VISTA: BOTH / CHARTS) */}
              {((viewMode === "both" || viewMode === "charts") || formalReportMode) && (
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <BarChart2 className="h-4 w-4 text-indigo-400" />
                    Visualización de Datos (Gráficos)
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Gráfico 1: Secuencia Ruhí Ayudantes */}
                    {(!formalReportMode ? subTab === "instituto" : true) && (
                      <div className="space-y-6 w-full animate-fade-in" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte A: Análisis de Instituto (Secuencia Ruhí)</span>
                          </div>
                        )}
                        {/* Nuevo Gráfico: Secuencia Ruhí de Ayudantes (Completados vs En Proceso split por unidades) */}
                        <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Secuencia Ruhí: Completados vs En Proceso (Ayudantes)
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Chart 1: Completado */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-semibold text-emerald-400 block text-center">
                                Completados (Libros Ruhí)
                              </span>
                              <div className="h-44 text-xs">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={helpersRuhiBooks}
                                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                    <XAxis dataKey="book" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                      itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                      labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                                    <Bar dataKey="u1_completed" name="U1" fill="#6ee7b7" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="u2_completed" name="U2" fill="#10b981" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="u3_completed" name="U3" fill="#047857" radius={[3, 3, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Chart 2: En Proceso */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-semibold text-blue-400 block text-center">
                                En Proceso (Libros Ruhí)
                              </span>
                              <div className="h-44 text-xs">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={helpersRuhiBooks}
                                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                    <XAxis dataKey="book" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                      itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                      labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                                    <Bar dataKey="u1_studying" name="U1" fill="#93c5fd" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="u2_studying" name="U2" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                                    <Bar dataKey="u3_studying" name="U3" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Nuevo Gráfico de Porcentaje de Unidades Completadas vs En Proceso (Ayudantes) */}
                        <div className="border-t border-slate-850 pt-5 mt-4 space-y-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                            Porcentaje por Unidad: Completado vs En Proceso (Libros Ruhí) (Ayudantes)
                          </span>
                          <div className="h-64 text-xs">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={helpersRuhiUnitsPercentageData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                                <XAxis 
                                  dataKey="unitLabel" 
                                  stroke="#64748b" 
                                  fontSize={9}
                                  tickLine={false}
                                />
                                <YAxis 
                                  stroke="#64748b" 
                                  fontSize={10} 
                                  domain={[0, 100]} 
                                  unit="%" 
                                  tickLine={false}
                                />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                  itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                  labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                  formatter={(value) => [`${value}%`]}
                                />
                                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 5 }} />
                                <Bar dataKey="completado" name="% Completado" fill="#10b981" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="enProceso" name="% En Proceso" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Contenedor Unificado de Libros Ruhí (Ayudantes) */}
                        <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-5 space-y-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-teal-400" />
                              <div>
                                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">
                                  Análisis Unificado de Libros Ruhí por País y Región (Ayudantes)
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Seleccione un libro para analizar el progreso de completados y en proceso en cada región para ayudantes
                                </span>
                              </div>
                            </div>
                            
                            {/* Selector de Libro (Pestañas) */}
                            <div className="flex flex-col gap-2 bg-slate-900/90 p-3 border-2 border-slate-800 rounded-2xl shadow-xl shadow-teal-950/20 max-w-full sm:max-w-xl md:max-w-none w-full lg:w-auto relative overflow-hidden group">
                              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500"></div>
                              <div className="flex items-center justify-between px-1 mb-1">
                                <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                                  Seleccionar Libro de Trabajo:
                                </span>
                                <span className="text-[10px] font-mono font-bold bg-teal-500/10 border border-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                                  {selectedRuhiBookTab}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"].map((book) => {
                                  const isSelected = selectedRuhiBookTab === book;
                                  return (
                                    <button
                                      key={book}
                                      onClick={() => setSelectedRuhiBookTab(book)}
                                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 shadow-sm transform active:scale-95 ${
                                        isSelected 
                                          ? "bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-teal-500/20 scale-[1.05] border border-teal-300/30" 
                                          : "bg-slate-950/70 border border-slate-850 hover:bg-slate-850 hover:border-slate-800 text-slate-300 hover:text-white"
                                      }`}
                                    >
                                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping"></span>}
                                      <span>
                                        <span className="hidden sm:inline">Libro </span>
                                        <span className="sm:hidden">L</span>
                                        {book.split(" ")[1]}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Tarjetas de Análisis en cada Libro - KPIs de Crecimiento */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Card 1: Crecimiento Completados */}
                            {(() => {
                              const diff = currentHelperBookCompleted - prevHelperBookCompleted;
                              const hasTrend = dateTrendMetrics.hasTrend;
                              
                              return (
                                <div className="bg-slate-900/40 border border-slate-850/70 rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                                  <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
                                  
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                                      Crecimiento Completados - {selectedRuhiBookTab} (Ayudantes)
                                    </span>
                                    
                                    {hasTrend ? (
                                      <div>
                                        <div className="flex items-baseline gap-1">
                                          <span className={`text-3xl font-black tracking-tight ${
                                            diff > 0 
                                              ? "text-emerald-400" 
                                              : diff < 0 
                                                ? "text-rose-400" 
                                                : "text-slate-300"
                                          }`}>
                                            {diff > 0 ? `+${diff}` : diff}
                                          </span>
                                          <span className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                                            {diff > 0 ? "Nuevos Completados" : diff < 0 ? "Menos Completados" : "Sin variación"}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                          con respecto al período anterior ({dateTrendMetrics.prevDateLabel || "anterior"})
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-emerald-400 tracking-tight">
                                          {currentHelperBookCompleted}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                                          Total Completados
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Card 2: Crecimiento En Proceso */}
                            {(() => {
                              const diff = currentHelperBookStudying - prevHelperBookStudying;
                              const hasTrend = dateTrendMetrics.hasTrend;
                              
                              return (
                                <div className="bg-slate-900/40 border border-slate-850/70 rounded-xl p-5 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-slate-800 transition-all duration-300">
                                  <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                                  
                                  <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                                      Crecimiento En Proceso - {selectedRuhiBookTab} (Ayudantes)
                                    </span>
                                    
                                    {hasTrend ? (
                                      <div>
                                        <div className="flex items-baseline gap-1">
                                          <span className={`text-3xl font-black tracking-tight ${
                                            diff > 0 
                                              ? "text-blue-400" 
                                              : diff < 0 
                                                ? "text-rose-400" 
                                                : "text-slate-300"
                                          }`}>
                                            {diff > 0 ? `+${diff}` : diff}
                                          </span>
                                          <span className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                                            {diff > 0 ? "Nuevos en Proceso" : diff < 0 ? "Menos en Proceso" : "Sin variación"}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                          con respecto al período anterior ({dateTrendMetrics.prevDateLabel || "anterior"})
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-black text-blue-400 tracking-tight">
                                          {currentHelperBookStudying}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase">
                                          Total en Proceso
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          {/* RESUMEN DE UNIDADES DE LOS FILTRADOS */}
                          <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-4 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-850 pb-2">
                              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                                Resumen General de Unidades para {selectedRuhiBookTab} (Ayudantes)
                              </span>
                              <span className="text-[10px] font-medium text-slate-400 bg-slate-950/40 border border-slate-850/50 px-2 py-0.5 rounded-md">
                                Total Ayudantes: <strong className="text-teal-400">{filteredHelperBookUnitTotals.filteredHelperTotal}</strong>
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Unidad 1 */}
                              {(() => {
                                const tot = filteredHelperBookUnitTotals.filteredHelperTotal;
                                const compPct = tot > 0 ? Math.round((filteredHelperBookUnitTotals.u1Comp / tot) * 100) : 0;
                                const studyPct = tot > 0 ? Math.round((filteredHelperBookUnitTotals.u1Study / tot) * 100) : 0;
                                return (
                                  <div className="bg-slate-950/45 border border-slate-850/60 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-slate-800 transition-all duration-300">
                                    <span className="text-sm font-bold text-slate-200 text-center uppercase tracking-wider block border-b border-slate-900/80 pb-1.5">Unidad 1</span>
                                    <div className="grid grid-cols-2 divide-x divide-slate-900/60">
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">Completados</span>
                                        <span className="text-lg font-extrabold text-emerald-400">{filteredHelperBookUnitTotals.u1Comp}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({compPct}%)</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">En Proceso</span>
                                        <span className="text-lg font-extrabold text-blue-400">{filteredHelperBookUnitTotals.u1Study}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({studyPct}%)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Unidad 2 */}
                              {(() => {
                                const tot = filteredHelperBookUnitTotals.filteredHelperTotal;
                                const compPct = tot > 0 ? Math.round((filteredHelperBookUnitTotals.u2Comp / tot) * 100) : 0;
                                const studyPct = tot > 0 ? Math.round((filteredHelperBookUnitTotals.u2Study / tot) * 100) : 0;
                                return (
                                  <div className="bg-slate-950/45 border border-slate-850/60 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-slate-800 transition-all duration-300">
                                    <span className="text-sm font-bold text-slate-200 text-center uppercase tracking-wider block border-b border-slate-900/80 pb-1.5">Unidad 2</span>
                                    <div className="grid grid-cols-2 divide-x divide-slate-900/60">
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">Completados</span>
                                        <span className="text-lg font-extrabold text-emerald-400">{filteredHelperBookUnitTotals.u2Comp}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({compPct}%)</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">En Proceso</span>
                                        <span className="text-lg font-extrabold text-blue-400">{filteredHelperBookUnitTotals.u2Study}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({studyPct}%)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Unidad 3 */}
                              {(() => {
                                const tot = filteredHelperBookUnitTotals.filteredHelperTotal;
                                const compPct = tot > 0 ? Math.round((filteredHelperBookUnitTotals.u3Comp / tot) * 100) : 0;
                                const studyPct = tot > 0 ? Math.round((filteredHelperBookUnitTotals.u3Study / tot) * 100) : 0;
                                return (
                                  <div className="bg-slate-950/45 border border-slate-850/60 p-4 rounded-xl flex flex-col gap-3 shadow-sm hover:border-slate-800 transition-all duration-300">
                                    <span className="text-sm font-bold text-slate-200 text-center uppercase tracking-wider block border-b border-slate-900/80 pb-1.5">Unidad 3</span>
                                    <div className="grid grid-cols-2 divide-x divide-slate-900/60">
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">Completados</span>
                                        <span className="text-lg font-extrabold text-emerald-400">{filteredHelperBookUnitTotals.u3Comp}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({compPct}%)</span>
                                      </div>
                                      <div className="flex flex-col items-center justify-center px-2">
                                        <span className="text-xs font-medium text-slate-400 mb-0.5">En Proceso</span>
                                        <span className="text-lg font-extrabold text-blue-400">{filteredHelperBookUnitTotals.u3Study}</span>
                                        <span className="text-[10px] font-bold text-slate-500 mt-0.5">({studyPct}%)</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Tabla de Datos Unificada */}
                          <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20 shadow-md">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <th className="p-3.5 pl-5">País</th>
                                  <th className="p-3.5">Región</th>
                                  <th className="p-3.5 text-center">Unidades Completadas ({selectedRuhiBookTab})</th>
                                  <th className="p-3.5 text-center">Unidades En Proceso ({selectedRuhiBookTab})</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850/30">
                                {filteredHelperRuhiStatsByLocation.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="p-10 text-center text-slate-500 italic">
                                      {tableSearch ? "No se encontraron resultados para la búsqueda actual." : "No hay datos de Ruhí registrados para la selección actual."}
                                    </td>
                                  </tr>
                                ) : (
                                  filteredHelperRuhiStatsByLocation.map((loc, idx) => {
                                    const comp = loc.booksCompleted[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
                                    const study = loc.booksStudying[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
                                    
                                    // Encontrar cambio por región respecto al periodo anterior
                                    const prevLoc = previousHelperRuhiStatsByLocation.find(p => p.country === loc.country && p.region === loc.region);
                                    const prevComp = prevLoc?.booksCompleted[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
                                    const prevStudy = prevLoc?.booksStudying[selectedRuhiBookTab] || { total: 0, u1: 0, u2: 0, u3: 0 };
                                    
                                    const compDiff = comp.total - prevComp.total;
                                    const studyDiff = study.total - prevStudy.total;

                                    return (
                                      <tr key={idx} className="hover:bg-slate-900/35 transition-colors">
                                        <td className="p-3.5 pl-5 font-semibold text-slate-200">
                                          <div className="flex items-center gap-2">
                                            {renderCountryFlagImage(loc.country, "h-3.5 w-5 object-cover rounded shadow-sm")}
                                            <span>{loc.country}</span>
                                          </div>
                                        </td>
                                        <td className="p-3.5 text-slate-400 font-medium">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                            <span>{loc.region}</span>
                                          </div>
                                        </td>
                                        
                                        {/* Completados por Unidades */}
                                        <td className="p-3.5 text-center">
                                          <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                                            <div className="text-[11px] font-mono flex items-center gap-1.5">
                                              {/* Unidad 1 completed badge */}
                                              <span 
                                                title="Unidad 1 completada" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  comp.u1 > 0 
                                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u1: {comp.u1}
                                              </span>
                                              
                                              {/* Unidad 2 completed badge */}
                                              <span 
                                                title="Unidad 2 completada" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  comp.u2 > 0 
                                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u2: {comp.u2}
                                              </span>
                                              
                                              {/* Unidad 3 completed badge */}
                                              <span 
                                                title="Unidad 3 completada" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  comp.u3 > 0 
                                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u3: {comp.u3}
                                              </span>
                                            </div>
                                            {dateTrendMetrics.hasTrend && compDiff !== 0 && (
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                                compDiff > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                                              }`}>
                                                {compDiff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                                {compDiff > 0 ? `+${compDiff}` : compDiff} total
                                              </span>
                                            )}
                                          </div>
                                        </td>

                                        {/* En Proceso por Unidades */}
                                        <td className="p-3.5 text-center">
                                          <div className="flex flex-col items-center justify-center gap-1.5 py-0.5">
                                            <div className="text-[11px] font-mono flex items-center gap-1.5">
                                              {/* Unidad 1 study badge */}
                                              <span 
                                                title="Unidad 1 en proceso" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  study.u1 > 0 
                                                    ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u1: {study.u1}
                                              </span>
                                              
                                              {/* Unidad 2 study badge */}
                                              <span 
                                                title="Unidad 2 en proceso" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  study.u2 > 0 
                                                    ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u2: {study.u2}
                                              </span>
                                              
                                              {/* Unidad 3 study badge */}
                                              <span 
                                                title="Unidad 3 en proceso" 
                                                className={`px-2 py-0.5 rounded border transition-all duration-300 ${
                                                  study.u3 > 0 
                                                    ? "bg-blue-500/15 border-blue-500/30 text-blue-300 font-bold" 
                                                    : "bg-slate-900/10 border-slate-800/40 text-slate-600 font-normal opacity-35"
                                                }`}
                                              >
                                                u3: {study.u3}
                                              </span>
                                            </div>
                                            {dateTrendMetrics.hasTrend && studyDiff !== 0 && (
                                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                                                studyDiff > 0 ? "text-blue-400 bg-blue-500/10" : "text-rose-400 bg-rose-500/10"
                                              }`}>
                                                {studyDiff > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                                {studyDiff > 0 ? `+${studyDiff}` : studyDiff} total
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                              
                              {/* TOTALES GENERALES DEL PIE DE TABLA */}
                              {filteredHelperRuhiStatsByLocation.length > 0 && (
                                <tfoot>
                                  <tr className="bg-slate-900/50 border-t border-slate-800 text-slate-200 font-bold">
                                    <td colSpan={2} className="p-4 pl-5">
                                      <div className="flex items-center gap-1.5 text-teal-400">
                                        <Award className="h-4 w-4 shrink-0" />
                                        <span>Total Consolidado (Ayudantes)</span>
                                      </div>
                                    </td>
                                    
                                    {/* Total Completados por Unidades */}
                                    <td className="p-4 text-center">
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="text-xs font-mono font-extrabold flex items-center gap-2 bg-slate-950/40 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                                          <span className="text-slate-400">u1: <span className="text-emerald-400">{filteredHelperBookUnitTotals.u1Comp}</span></span>
                                          <span className="text-slate-700">|</span>
                                          <span className="text-slate-400">u2: <span className="text-emerald-400">{filteredHelperBookUnitTotals.u2Comp}</span></span>
                                          <span className="text-slate-700">|</span>
                                          <span className="text-slate-400">u3: <span className="text-emerald-400">{filteredHelperBookUnitTotals.u3Comp}</span></span>
                                        </div>
                                        {dateTrendMetrics.hasTrend && filteredHelperBookUnitTotals.diffCompTotal !== 0 && (
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1.5 flex items-center gap-0.5 ${
                                            filteredHelperBookUnitTotals.diffCompTotal > 0 ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                                          }`}>
                                            {filteredHelperBookUnitTotals.diffCompTotal > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {filteredHelperBookUnitTotals.diffCompTotal > 0 ? `+${filteredHelperBookUnitTotals.diffCompTotal}` : filteredHelperBookUnitTotals.diffCompTotal} global
                                          </span>
                                        )}
                                      </div>
                                    </td>

                                    {/* Total En Proceso por Unidades */}
                                    <td className="p-4 text-center">
                                      <div className="flex flex-col items-center justify-center gap-1">
                                        <div className="text-xs font-mono font-extrabold flex items-center gap-2 bg-slate-950/40 border border-slate-800 px-3 py-1.5 rounded-lg shadow-sm">
                                          <span className="text-slate-400">u1: <span className="text-blue-400">{filteredHelperBookUnitTotals.u1Study}</span></span>
                                          <span className="text-slate-700">|</span>
                                          <span className="text-slate-400">u2: <span className="text-blue-400">{filteredHelperBookUnitTotals.u2Study}</span></span>
                                          <span className="text-slate-700">|</span>
                                          <span className="text-slate-400">u3: <span className="text-blue-400">{filteredHelperBookUnitTotals.u3Study}</span></span>
                                        </div>
                                        {dateTrendMetrics.hasTrend && filteredHelperBookUnitTotals.diffStudyTotal !== 0 && (
                                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-1.5 flex items-center gap-0.5 ${
                                            filteredHelperBookUnitTotals.diffStudyTotal > 0 ? "text-blue-400 bg-blue-500/10" : "text-rose-400 bg-rose-500/10"
                                          }`}>
                                            {filteredHelperBookUnitTotals.diffStudyTotal > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                            {filteredHelperBookUnitTotals.diffStudyTotal > 0 ? `+${filteredHelperBookUnitTotals.diffStudyTotal}` : filteredHelperBookUnitTotals.diffStudyTotal} global
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Gráfico 2: Relatos Estudiados */}
                    {(!formalReportMode ? subTab === "capacitacion" : true) && (
                      <div className="space-y-6 w-full animate-fade-in" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte B: Estudio de Carta (Capacitación y Relatos)</span>
                          </div>
                        )}

                        {/* PANEL: Estudio de la Carta del 1 de Enero (Copiado de MCA) */}
                        <div className="space-y-6 animate-fade-in p-5 bg-slate-950/25 border border-slate-850/50 rounded-2xl">
                          <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-indigo-400" />
                            Estudio de la Carta del 1 de Enero
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Estadísticas de Capacitación */}
                            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                                Estadísticas de Capacitación
                              </span>
                              <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between items-center py-2">
                                  <span className="text-slate-400">Estudiaron Carta 1 Ene:</span>
                                  <span className="font-bold text-blue-400 font-mono">{helpersStudiedLetterTotal}</span>
                                </div>
                              </div>
                            </div>

                            {/* Porcentaje de Estudio de Carta */}
                            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-3">
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                                Porcentaje de Estudio de Carta
                              </span>
                              <div className="space-y-3 text-xs">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-400">Porcentaje de Ayudantes:</span>
                                  <span className="font-bold text-indigo-400 font-mono text-sm">{helpersLetterPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${helpersLetterPercent}%` }}
                                  />
                                </div>
                                <span className="text-[10px] text-slate-550 block italic">
                                  Calculado sobre {helpersTotalNamedLastPeriod} ayudantes nombrados.
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Historic chart of letter study */}
                          <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                                Evolución Histórica de Estudio de Carta
                              </span>
                              <span className="text-[10px] text-slate-550 italic">
                                Eje X: Campo Fecha
                              </span>
                            </div>
                            {helpersLetterHistoryData.length === 0 ? (
                              <div className="h-48 flex items-center justify-center text-xs text-slate-500 italic border border-dashed border-slate-850 rounded-lg">
                                No hay suficientes datos históricos con fecha para mostrar la evolución.
                              </div>
                            ) : (
                              <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart
                                    data={helpersLetterHistoryData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                  >
                                    <defs>
                                      <linearGradient id="colorHelperLetterCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis 
                                      dataKey="label" 
                                      stroke="#64748b" 
                                      fontSize={10}
                                      tickLine={false}
                                      axisLine={false}
                                    />
                                    <YAxis 
                                      stroke="#64748b" 
                                      fontSize={10}
                                      tickLine={false}
                                      axisLine={false}
                                      allowDecimals={false}
                                    />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                      itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                      labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    />
                                    <Area 
                                      type="monotone" 
                                      name="Ayudantes" 
                                      dataKey="count" 
                                      stroke="#6363f1" 
                                      strokeWidth={2} 
                                      fillOpacity={1} 
                                      fill="url(#colorHelperLetterCount)" 
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        </div>



                        {/* Relatos Estudiados por Ayudantes (Cantidad & %) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                          <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Relatos Estudiados por Ayudantes (Cantidad)
                            </span>
                            <div className="h-48 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={helpersStories}
                                  margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                  <XAxis dataKey="story" stroke="#64748b" fontSize={10} />
                                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    formatter={(value) => [value, "Ayudantes"]}
                                  />
                                  <Bar dataKey="count" name="Ayudantes" fill="#818cf8" radius={[4, 4, 0, 0]}>
                                    {helpersStories.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#6366f1" : "#4f46e5"} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Relatos Estudiados por Ayudantes (%)
                            </span>
                            <div className="h-48 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={helpersStoriesPercentage}
                                  margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                  <XAxis dataKey="story" stroke="#64748b" fontSize={10} />
                                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} unit="%" />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    formatter={(value) => [`${value}%`, "Ayudantes"]}
                                  />
                                  <Bar dataKey="percent" name="Ayudantes" fill="#10b981" radius={[4, 4, 0, 0]}>
                                    {helpersStoriesPercentage.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#34d399"} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* Gráfico de Evolución Histórica de Relatos Estudiados (Ayudantes) */}
                        <div className="space-y-6 w-full pt-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                            Histórico de Relatos Estudiados (Evolución en el Tiempo por Relato - Ayudantes)
                          </span>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Muestra la evolución del total acumulado de ayudantes que han estudiado cada relato basándose en la fecha del formulario, junto con el análisis de variación del último periodo.
                          </p>

                          <div className="flex flex-col gap-8">
                            {[
                              { name: "Batula", key: "Batula", color: "#8b5cf6" },
                              { name: "Bramour", key: "Bramour", color: "#f43f5e" },
                              { name: "Miramar", key: "Miramar", color: "#f59e0b" },
                              { name: "Orchard", key: "Orchard", color: "#6366f1" },
                              { name: "San Pedro", key: "San Pedro", color: "#10b981" }
                            ].map((relato) => {
                              const stats = helpersStoriesTrendStats[relato.key] || {
                                recentChange: 0,
                                recentDirection: "none",
                                firstVal: 0,
                                lastVal: 0,
                                prevVal: 0,
                                pctChange: 0
                              };

                              return (
                                <div key={relato.key} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch bg-slate-900/30 border border-slate-850/60 p-5 rounded-2xl shadow-md hover:border-slate-800 transition-all duration-300">
                                  {/* Left part: The Chart (3 columns on lg) */}
                                  <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850/40 rounded-xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-extrabold uppercase tracking-wider block flex items-center gap-1.5" style={{ color: relato.color }}>
                                        <TrendingUp className="h-4 w-4" />
                                        Relato: {relato.name}
                                      </span>
                                      <span className="text-[10px] text-slate-550 font-medium">Ayudantes acumulados por mes</span>
                                    </div>
                                    <div className="h-56 text-xs w-full">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={helpersStoriesHistoricalData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                          <XAxis dataKey="fecha" stroke="#64748b" fontSize={10} />
                                          <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                          <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                            labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                          />
                                          <Line type="monotone" name="Ayudantes" dataKey={relato.key} stroke={relato.color} strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>

                                  {/* Right part: The KPI Panel (1 column on lg) */}
                                  <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-all duration-300">
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: relato.color }}>Análisis {relato.name}</span>
                                      <h4 className="text-sm font-bold text-white">Variación del Último Periodo</h4>
                                      <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Cambio en la cantidad de ayudantes que han reportado haber estudiado este relato específico en el último mes de informe.
                                      </p>
                                    </div>

                                    <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                      {stats.recentChange > 0 ? (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                            <TrendingUp className="h-3 w-3" />
                                            Incremento
                                          </span>
                                          <span className="text-3xl font-black text-emerald-400 mt-2">
                                            +{stats.recentChange}
                                          </span>
                                        </>
                                      ) : stats.recentChange < 0 ? (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                                            <TrendingDown className="h-3 w-3" />
                                            Disminución
                                          </span>
                                          <span className="text-3xl font-black text-rose-400 mt-2">
                                            {stats.recentChange}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">
                                            Estable
                                          </span>
                                          <span className="text-3xl font-black text-slate-400 mt-2">
                                            0
                                          </span>
                                        </>
                                      )}
                                      <span className="text-[10px] text-slate-500 mt-1 block">
                                        Ayudantes nuevos este mes
                                      </span>
                                    </div>

                                    <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                      <div className="flex justify-between">
                                        <span>Valor Periodo Anterior:</span>
                                        <span className="text-slate-300 font-bold">{stats.prevVal}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Valor Periodo Actual:</span>
                                        <span className="text-slate-300 font-bold">{stats.lastVal}</span>
                                      </div>
                                      {stats.recentChange !== 0 && (
                                        <div className="flex justify-between">
                                          <span>Tasa de Variación:</span>
                                          <span className={`font-bold ${stats.recentChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {stats.recentChange > 0 ? '+' : ''}{stats.pctChange}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Espacios de Salud Espiritual (Ayudantes) */}
                    {(!formalReportMode ? subTab === "espacios" : true) && (
                      <div className="space-y-12 w-full animate-fade-in" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte C: Espacios de Salud (Participación y Facilitación)</span>
                          </div>
                        )}
                        
                        {/* SECCIÓN 1: PARTICIPACIÓN EN ESPACIOS DE ESTUDIO */}
                        <div className="space-y-6 border-b border-slate-850 pb-10">
                          <div className="border-l-4 border-purple-500 pl-4 py-1">
                            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">I. Participación en Espacios de Estudio</h3>
                            <p className="text-xs text-slate-400">Estadísticas, indicadores de asistencia y evolución histórica de los ayudantes en espacios de salud espiritual.</p>
                          </div>

                          <div className="space-y-6">
                            {/* Bloque 1: Gráfico Circular + Panel KPI de Participación */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                              {/* Gráfico: Participación */}
                              <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                  <Activity className="h-3.5 w-3.5 text-purple-500" />
                                  Participación de Ayudantes en Espacios de Estudio
                                </span>
                                <div className="h-52 flex items-center justify-center relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={helpersParticipationChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                      >
                                        {helpersParticipationChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                        itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                        formatter={(value) => [value, "Ayudantes"]}
                                      />
                                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div className="absolute text-center">
                                    <span className="text-xl font-black text-purple-300">{helpersParticipationPercent}%</span>
                                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Participa</span>
                                  </div>
                                </div>
                              </div>

                              {/* Panel KPI de Participación */}
                              <div className="bg-slate-950/40 border border-slate-850 hover:border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Métrica Clave</span>
                                  <h3 className="text-sm font-bold text-white">Participantes en Espacios</h3>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">Cantidad de ayudantes que reportan participación activa en espacios de estudio de salud espiritual.</p>
                                </div>

                                <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                                    <Activity className="h-3 w-3" />
                                    Participación
                                  </span>
                                  <span className="text-3xl font-black text-purple-300 mt-2">
                                    {helpersStudiedInSpaces}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-300 mt-0.5">
                                    {helpersParticipationPercent}% del total
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex justify-between">
                                    <span>Total Ayudantes Activos:</span>
                                    <span className="text-slate-300 font-bold">{helpersTotalNamed}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>No Participantes:</span>
                                    <span className="text-slate-300 font-bold">{Math.max(0, helpersTotalNamed - helpersStudiedInSpaces)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bloque 2: Evolución Histórica de Participación */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch w-full">
                              {/* Left: Chart */}
                              <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
                                    Evolución Histórica de Participación en Espacios (Ayudantes)
                                  </span>
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    Tendencia temporal de la cantidad de ayudantes participando activamente.
                                  </p>
                                </div>
                                <div className="h-64 text-xs w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={helpersSpacesTimelineData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                      <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                                      <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                      />
                                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                      <Line type="monotone" name="Ayudantes Participando" dataKey="participating" stroke="#8b5cf6" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                                      <Line type="monotone" name="Total Ayudantes Reportados" dataKey="total" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Right: Trend Panel */}
                              <div className="bg-slate-950/40 border border-slate-850 hover:border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Análisis de Tendencia</span>
                                  <h3 className="text-sm font-bold text-white">Variación del Último Mes</h3>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">Muestra la variación de participación en el último periodo de informe y a largo plazo.</p>
                                </div>

                                <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                  {helpersSpacesTrendStats.participating.recentChange > 0 ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                        <TrendingUp className="h-3 w-3" />
                                        Crecimiento
                                      </span>
                                      <span className="text-3xl font-black text-emerald-400 mt-2">
                                        +{helpersSpacesTrendStats.participating.recentChange}
                                      </span>
                                    </>
                                  ) : helpersSpacesTrendStats.participating.recentChange < 0 ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                                        <TrendingDown className="h-3 w-3" />
                                        Reducción
                                      </span>
                                      <span className="text-3xl font-black text-rose-400 mt-2">
                                        {helpersSpacesTrendStats.participating.recentChange}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">
                                        Sin Variación
                                      </span>
                                      <span className="text-3xl font-black text-slate-400 mt-2">
                                        0
                                      </span>
                                    </>
                                  )}
                                  <span className="text-[10px] text-slate-500 mt-1 block">Ayudantes nuevos activos</span>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex justify-between">
                                    <span>Valor Inicial:</span>
                                    <span className="text-slate-300 font-bold">{helpersSpacesTrendStats.participating.firstVal}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valor Anterior:</span>
                                    <span className="text-slate-300 font-bold">{helpersSpacesTrendStats.participating.prevVal}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valor Actual:</span>
                                    <span className="text-slate-300 font-bold">{helpersSpacesTrendStats.participating.lastVal}</span>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-slate-850/40">
                                    <span>Cambio Histórico:</span>
                                    <span className={`font-bold ${helpersSpacesTrendStats.participating.totalChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {helpersSpacesTrendStats.participating.totalChange >= 0 ? '+' : ''}{helpersSpacesTrendStats.participating.totalChange}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SECCIÓN 2: FACILITACIÓN DE ESPACIOS DE ESTUDIO */}
                        <div className="space-y-6 pt-2">
                          <div className="border-l-4 border-blue-500 pl-4 py-1">
                            <h3 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">II. Facilitación de Espacios de Estudio</h3>
                            <p className="text-xs text-slate-400">Estadísticas, indicadores de liderazgo y evolución histórica de los ayudantes en la facilitación de espacios de salud espiritual.</p>
                          </div>

                          <div className="space-y-6">
                            {/* Bloque 1: Gráfico Circular + Panel KPI de Facilitación */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                              {/* Gráfico: Facilitación */}
                              <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                                  Facilitación de Espacios por Ayudantes
                                </span>
                                <div className="h-52 flex items-center justify-center relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={helpersFacilitationChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                      >
                                        {helpersFacilitationChartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                      </Pie>
                                      <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                        itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                        formatter={(value) => [value, "Ayudantes"]}
                                      />
                                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 10 }} />
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div className="absolute text-center">
                                    <span className="text-xl font-black text-blue-300">{helpersFacilitationPercent}%</span>
                                    <span className="text-[9px] text-slate-500 uppercase block font-bold">Facilita</span>
                                  </div>
                                </div>
                              </div>

                              {/* Panel KPI de Facilitación */}
                              <div className="bg-slate-950/40 border border-slate-850 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Métrica Clave</span>
                                  <h3 className="text-sm font-bold text-white">Facilitadores de Espacios</h3>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">Cantidad de ayudantes que facilitan activamente espacios de estudio periódico en su región.</p>
                                </div>

                                <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                                    <Activity className="h-3 w-3" />
                                    Facilitación
                                  </span>
                                  <span className="text-3xl font-black text-blue-300 mt-2">
                                    {spacesFacilitatedByHelpers}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-300 mt-0.5">
                                    {helpersFacilitationPercent}% del total
                                  </span>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex justify-between">
                                    <span>Total Ayudantes Activos:</span>
                                    <span className="text-slate-300 font-bold">{helpersTotalNamed}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>No Facilitadores:</span>
                                    <span className="text-slate-300 font-bold">{Math.max(0, helpersTotalNamed - spacesFacilitatedByHelpers)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bloque 2: Evolución Histórica de Facilitación */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch w-full">
                              {/* Left: Chart */}
                              <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                                    <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                                    Evolución Histórica de Facilitación de Espacios (Ayudantes)
                                  </span>
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    Tendencia temporal de la cantidad de ayudantes que facilitan espacios.
                                  </p>
                                </div>
                                <div className="h-64 text-xs w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={helpersSpacesTimelineData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                      <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
                                      <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                        labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                      />
                                      <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                      <Line type="monotone" name="Ayudantes Facilitando" dataKey="facilitating" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                                      <Line type="monotone" name="Total Ayudantes Reportados" dataKey="total" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2 }} />
                                    </LineChart>
                                  </ResponsiveContainer>
                                </div>
                              </div>

                              {/* Right: Trend Panel */}
                              <div className="bg-slate-950/40 border border-slate-850 hover:border-blue-500/30 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all duration-300">
                                <div className="space-y-2">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Análisis de Tendencia</span>
                                  <h3 className="text-sm font-bold text-white">Variación del Último Mes</h3>
                                  <p className="text-[11px] text-slate-400 leading-relaxed">Muestra la variación de la facilitación en el último periodo de informe y a largo plazo.</p>
                                </div>

                                <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                  {helpersSpacesTrendStats.facilitating.recentChange > 0 ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                        <TrendingUp className="h-3 w-3" />
                                        Crecimiento
                                      </span>
                                      <span className="text-3xl font-black text-emerald-400 mt-2">
                                        +{helpersSpacesTrendStats.facilitating.recentChange}
                                      </span>
                                    </>
                                  ) : helpersSpacesTrendStats.facilitating.recentChange < 0 ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                                        <TrendingDown className="h-3 w-3" />
                                        Reducción
                                      </span>
                                      <span className="text-3xl font-black text-rose-400 mt-2">
                                        {helpersSpacesTrendStats.facilitating.recentChange}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">
                                        Sin Variación
                                      </span>
                                      <span className="text-3xl font-black text-slate-400 mt-2">
                                        0
                                      </span>
                                    </>
                                  )}
                                  <span className="text-[10px] text-slate-500 mt-1 block">Ayudantes nuevos facilitadores</span>
                                </div>

                                <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                  <div className="flex justify-between">
                                    <span>Valor Inicial:</span>
                                    <span className="text-slate-300 font-bold">{helpersSpacesTrendStats.facilitating.firstVal}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valor Anterior:</span>
                                    <span className="text-slate-300 font-bold">{helpersSpacesTrendStats.facilitating.prevVal}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valor Actual:</span>
                                    <span className="text-slate-300 font-bold">{helpersSpacesTrendStats.facilitating.lastVal}</span>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-slate-850/40">
                                    <span>Cambio Histórico:</span>
                                    <span className={`font-bold ${helpersSpacesTrendStats.facilitating.totalChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {helpersSpacesTrendStats.facilitating.totalChange >= 0 ? '+' : ''}{helpersSpacesTrendStats.facilitating.totalChange}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TABLAS DE DETALLES (VISTA: BOTH / TABLES) */}
              {((viewMode === "both" || viewMode === "tables") || formalReportMode) && subTab !== "instituto" && subTab !== "espacios" && (
                <div className="space-y-6 pt-2">


                  {/* Buscador y Ordenación Interactivos */}
                  <div className="grid grid-cols-1 gap-6">
                    {/* Tabla 1: Secuencia Ruhí */}
                    {(!formalReportMode ? subTab === "instituto" : true) && (
                      <div className="space-y-6" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte D: Tabla de Detalle - Libros Ruhí Completados</span>
                          </div>
                        )}
                        <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-850 pb-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">
                                Totales de Libros Ruhí Completados por País y Región (Ayudantes)
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 italic">
                              Regiones filtradas: {getSortedHelpersRuhiCompleted().length} de {helpersRuhiByLocationStats.length}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] select-none">
                                  <th onClick={() => handleSort("country")} className="p-3 cursor-pointer hover:bg-slate-800/40 transition-colors text-slate-200">
                                    País {sortField === "country" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                                  </th>
                                  <th onClick={() => handleSort("region")} className="p-3 cursor-pointer hover:bg-slate-800/40 transition-colors text-slate-200">
                                    Región {sortField === "region" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                                  </th>
                                  {["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"].map((book) => (
                                    <th 
                                      key={book}
                                      onClick={() => handleSort(book)} 
                                      className={`p-3 text-center cursor-pointer hover:bg-slate-800/40 transition-colors ${book === "Libro 14" ? "text-indigo-400 font-bold" : ""}`}
                                    >
                                      {book} {sortField === book ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                                    </th>
                                  ))}
                                  <th onClick={() => handleSort("totalCompleted")} className="p-3 text-right cursor-pointer hover:bg-slate-800/40 transition-colors text-emerald-400">
                                    Total {sortField === "totalCompleted" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {getSortedHelpersRuhiCompleted().length === 0 ? (
                                  <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                                      No se encontraron registros que coincidan con la búsqueda.
                                    </td>
                                  </tr>
                                ) : (
                                  getSortedHelpersRuhiCompleted().map((loc, idx) => (
                                    <tr key={idx} className="border-b border-slate-850/40 hover:bg-slate-900/30 transition-colors">
                                      <td className="p-3 font-semibold text-slate-200">{loc.country}</td>
                                      <td className="p-3 text-slate-400">{loc.region}</td>
                                      {["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13"].map((bookKey) => (
                                        <td key={bookKey} className="p-3 text-center">
                                          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5 py-1">
                                            <span title="Unidad 1" className="text-slate-400">u1:<span className="font-bold text-slate-200">{loc.books[bookKey]?.u1 || 0}</span></span>
                                            <span className="text-slate-700">•</span>
                                            <span title="Unidad 2" className="text-slate-400">u2:<span className="font-bold text-slate-200">{loc.books[bookKey]?.u2 || 0}</span></span>
                                            <span className="text-slate-700">•</span>
                                            <span title="Unidad 3" className="text-slate-400">u3:<span className="font-bold text-slate-200">{loc.books[bookKey]?.u3 || 0}</span></span>
                                          </div>
                                        </td>
                                      ))}
                                      <td className="p-3 text-center">
                                        <div className="text-[11px] text-indigo-400 font-mono flex items-center justify-center gap-1.5 py-1">
                                          <span title="Unidad 1" className="text-indigo-400/80">u1:<span className="font-bold text-indigo-200">{loc.books["Libro 14"]?.u1 || 0}</span></span>
                                          <span className="text-slate-700">•</span>
                                          <span title="Unidad 2" className="text-indigo-400/80">u2:<span className="font-bold text-indigo-200">{loc.books["Libro 14"]?.u2 || 0}</span></span>
                                          <span className="text-slate-700">•</span>
                                          <span title="Unidad 3" className="text-indigo-400/80">u3:<span className="font-bold text-indigo-200">{loc.books["Libro 14"]?.u3 || 0}</span></span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-right font-mono font-bold text-emerald-400">{loc.totalCompleted}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Tabla 2: Libros en Proceso */}
                        <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-850 pb-3">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-blue-400" />
                              <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">
                                Totales de Libros Ruhí En Proceso por País y Región (Ayudantes)
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 italic">
                              Regiones filtradas: {getSortedHelpersRuhiStudying().length} de {helpersRuhiStudyingByLocationStats.length}
                            </span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-extrabold uppercase tracking-wider text-[10px] select-none">
                                  <th onClick={() => handleSort("country")} className="p-3 cursor-pointer hover:bg-slate-800/40 transition-colors text-slate-200">
                                    País {sortField === "country" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                                  </th>
                                  <th onClick={() => handleSort("region")} className="p-3 cursor-pointer hover:bg-slate-800/40 transition-colors text-slate-200">
                                    Región {sortField === "region" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                                  </th>
                                  {["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13", "Libro 14"].map((book) => (
                                    <th 
                                      key={book}
                                      onClick={() => handleSort(book)} 
                                      className={`p-3 text-center cursor-pointer hover:bg-slate-800/40 transition-colors ${book === "Libro 14" ? "text-indigo-400 font-bold" : ""}`}
                                    >
                                      {book} {sortField === book ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                                    </th>
                                  ))}
                                  <th onClick={() => handleSort("totalStudying")} className="p-3 text-right cursor-pointer hover:bg-slate-800/40 transition-colors text-blue-400">
                                    Total {sortField === "totalStudying" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {getSortedHelpersRuhiStudying().length === 0 ? (
                                  <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-500 italic">
                                      No se encontraron registros que coincidan con la búsqueda.
                                    </td>
                                  </tr>
                                ) : (
                                  getSortedHelpersRuhiStudying().map((loc, idx) => (
                                    <tr key={idx} className="border-b border-slate-850/40 hover:bg-slate-900/30 transition-colors">
                                      <td className="p-3 font-semibold text-slate-200">{loc.country}</td>
                                      <td className="p-3 text-slate-400">{loc.region}</td>
                                      {["Libro 8", "Libro 9", "Libro 10", "Libro 11", "Libro 12", "Libro 13"].map((bookKey) => (
                                        <td key={bookKey} className="p-3 text-center">
                                          <div className="text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5 py-1">
                                            <span title="Unidad 1" className="text-slate-400">u1:<span className="font-bold text-slate-200">{loc.books[bookKey]?.u1 || 0}</span></span>
                                            <span className="text-slate-700">•</span>
                                            <span title="Unidad 2" className="text-slate-400">u2:<span className="font-bold text-slate-200">{loc.books[bookKey]?.u2 || 0}</span></span>
                                            <span className="text-slate-700">•</span>
                                            <span title="Unidad 3" className="text-slate-400">u3:<span className="font-bold text-slate-200">{loc.books[bookKey]?.u3 || 0}</span></span>
                                          </div>
                                        </td>
                                      ))}
                                      <td className="p-3 text-center">
                                        <div className="text-[11px] text-indigo-400 font-mono flex items-center justify-center gap-1.5 py-1">
                                          <span title="Unidad 1" className="text-indigo-400/80">u1:<span className="font-bold text-indigo-200">{loc.books["Libro 14"]?.u1 || 0}</span></span>
                                          <span className="text-slate-700">•</span>
                                          <span title="Unidad 2" className="text-indigo-400/80">u2:<span className="font-bold text-indigo-200">{loc.books["Libro 14"]?.u2 || 0}</span></span>
                                          <span className="text-slate-700">•</span>
                                          <span title="Unidad 3" className="text-indigo-400/80">u3:<span className="font-bold text-indigo-200">{loc.books["Libro 14"]?.u3 || 0}</span></span>
                                        </div>
                                      </td>
                                      <td className="p-3 text-right font-mono font-bold text-blue-400">{loc.totalStudying}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tabla 2: Relatos y Gestión */}
                    {(!formalReportMode ? subTab === "capacitacion" : true) && (
                      <div className="space-y-6" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte E: Tabla de Detalle - Relatos y Funcionamiento</span>
                          </div>
                        )}

                        {/* Tabla de Relatos de Salud Espiritual (Ayudantes) */}
                        <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-850 pb-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-indigo-400" />
                              <div>
                                <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">
                                  Tabla de Relatos de Salud Espiritual (Ayudantes)
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  Detalle por país y región de los relatos de salud espiritual estudiados por los ayudantes con variación respecto al periodo pasado
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20 shadow-md">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                                  <th className="p-3.5 pl-5">País</th>
                                  <th className="p-3.5">Región</th>
                                  {["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"].map((story) => (
                                    <th key={story} className="p-3.5 text-center font-semibold text-slate-300">
                                      <div className="flex items-center justify-center gap-1">
                                        <BookOpen className="h-3 w-3 text-indigo-400/70" />
                                        <span>{story}</span>
                                      </div>
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-850/30">
                                {getSortedHelperStories().length === 0 ? (
                                  <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-500 italic">
                                      No hay datos registrados para la selección actual.
                                    </td>
                                  </tr>
                                ) : (
                                  getSortedHelperStories().map((loc, idx) => {
                                    const prevLoc = previousHelperStoriesByLocationStats.find(
                                      p => p.country === loc.country && p.region === loc.region
                                    );
                                    
                                    const storyNames = ["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"];

                                    return (
                                      <tr key={idx} className="hover:bg-indigo-500/5 even:bg-slate-900/15 transition-colors">
                                        <td className="p-3.5 pl-5 font-semibold text-slate-200">
                                          <div className="flex items-center gap-2">
                                            {renderCountryFlagImage(loc.country, "h-3.5 w-5 object-cover rounded shadow-sm")}
                                            <span>{loc.country}</span>
                                          </div>
                                        </td>
                                        <td className="p-3.5 text-slate-400 font-medium">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                            <span>{loc.region}</span>
                                          </div>
                                        </td>
                                        
                                        {storyNames.map((story) => {
                                          const count = loc.stories[story] || 0;
                                          const prevCount = prevLoc?.stories[story] || 0;
                                          const diff = count - prevCount;
                                          
                                          return (
                                            <td key={story} className="p-3.5 text-center">
                                              <div className="flex flex-col items-center justify-center gap-1">
                                                <span className={`inline-flex items-center justify-center min-w-[32px] h-6 px-2 text-xs font-bold rounded-lg transition-all ${
                                                  count > 0 
                                                    ? "bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 font-extrabold shadow-sm shadow-indigo-500/5" 
                                                    : "text-slate-600 font-normal opacity-40"
                                                }`}>
                                                  {count > 0 ? count : "0"}
                                                </span>
                                                {dateTrendMetrics.hasTrend && diff !== 0 && (
                                                  <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded transition-all ${
                                                    diff > 0 ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                                                  }`}>
                                                    {diff > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                                    {diff > 0 ? `+${diff}` : diff}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>

                              {getSortedHelperStories().length > 0 && (
                                <tfoot>
                                  <tr className="bg-slate-900/60 border-t border-slate-800 text-slate-200 font-bold">
                                    <td colSpan={2} className="p-4 pl-5">
                                      <div className="flex items-center gap-1.5 text-indigo-400">
                                        <Award className="h-4 w-4 shrink-0" />
                                        <span>Total Consolidado (Ayudantes)</span>
                                      </div>
                                    </td>
                                    
                                    {["Batula", "Bramour", "Miramar", "Orchard", "San Pedro"].map((story) => {
                                      const totalCurrent = getSortedHelperStories().reduce((acc, loc) => acc + (loc.stories[story] || 0), 0);
                                      const totalPrev = previousHelperStoriesByLocationStats.reduce((acc, loc) => acc + (loc.stories[story] || 0), 0);
                                      const diff = totalCurrent - totalPrev;

                                      return (
                                        <td key={story} className="p-4 text-center bg-slate-900/40">
                                          <div className="flex flex-col items-center justify-center gap-1">
                                            <span className="text-xs font-black text-slate-100 bg-slate-800/60 px-2 py-1 rounded border border-slate-700/50 min-w-[32px] inline-block">
                                              {totalCurrent}
                                            </span>
                                            {dateTrendMetrics.hasTrend && diff !== 0 && (
                                              <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                diff > 0 ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-rose-400 bg-rose-500/10 border border-rose-500/20"
                                              }`}>
                                                {diff > 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                                                {diff > 0 ? `+${diff}` : diff}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      );
                                    })}
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              )}
            </div>
          )}

          {((!formalReportMode && activeTab === "lsa") || (formalReportMode && pdfSections.lsa)) && (
            <div className={`bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 ${formalReportMode ? "page-break mb-10 print:mb-0 print:border-none print:shadow-none print:bg-transparent print:p-0" : "animate-fade-in"}`} style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
              {formalReportMode && (
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <h2 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-2">
                    <NinePointedStar className="h-4.5 w-4.5 text-purple-400 animate-pulse" />
                    Sección IV: Asambleas Espirituales Locales (AEL) ({getGroupConsolidatedLabel(selectedCountry, selectedGroup)})
                  </h2>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase print:hidden">Sección 4</span>
                </div>
              )}




              {/* GRÁFICOS (VISTA: BOTH / CHARTS) */}
              {((viewMode === "both" || viewMode === "charts") || formalReportMode) && (
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-purple-400 uppercase tracking-widest border-b border-slate-850 pb-2 flex items-center gap-1.5">
                    <BarChart2 className="h-4 w-4 text-purple-400" />
                    Visualización de Datos (Gráficos)
                  </h4>
                  <div className="grid grid-cols-1 gap-6">
                    {/* Gráfico 1: Espacios de Estudio */}
                    {(!formalReportMode ? subTab === "espacios" : true) && (
                      <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-6 md:p-8 space-y-6 w-full animate-fade-in" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte A: Gráficos de Espacios de Estudio</span>
                          </div>
                        )}
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                          Espacios de Estudio Periódicos por Facilitador (AELs)
                        </span>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                          {/* Columna 1: Cantidad (Bar Chart) */}
                          <div className="space-y-3 lg:col-span-7">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block text-center lg:text-left">
                              Cantidad por Facilitador
                            </span>
                            <div className="h-72 md:h-80 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={lsaSpaces}
                                  margin={{ top: 10, right: 15, left: -15, bottom: 5 }}
                                >
                                  <XAxis dataKey="facilitator" stroke="#64748b" fontSize={9} interval={0} tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 15)}...` : value} />
                                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                  />
                                  <Bar dataKey="count" name="Asambleas (AEL)" fill="#a855f7" radius={[4, 4, 0, 0]}>
                                    {lsaSpaces.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={getFacilitatorColor(entry.facilitator)} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Columna 2: Porcentaje (Pie/Donut Chart) */}
                          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center gap-6 bg-slate-900/20 border border-slate-900/50 rounded-xl p-6">
                            <div className="relative h-44 w-44 shrink-0 flex items-center justify-center bg-slate-950/40 border border-slate-850/55 rounded-full p-2">
                              <div className="absolute flex flex-col items-center justify-center text-center p-1">
                                <span className="text-lg font-black text-white">
                                  {lsaSpaces.reduce((acc, curr) => acc + curr.count, 0)}
                                </span>
                                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">
                                  Total Espacios
                                </span>
                              </div>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={lsaSpaces.map(sp => ({
                                      name: sp.facilitator,
                                      value: sp.count
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={44}
                                    outerRadius={60}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {lsaSpaces.map((entry, index) => (
                                      <Cell key={`cell-pie-${index}`} fill={getFacilitatorColor(entry.facilitator)} />
                                    ))}
                                  </Pie>
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "#0b0f19",
                                      borderColor: "#1e293b",
                                      borderRadius: "8px",
                                      fontSize: "10px",
                                      color: "#cbd5e1"
                                    }}
                                    formatter={(value: any, name: any) => {
                                      const total = lsaSpaces.reduce((acc, curr) => acc + curr.count, 0);
                                      const pct = total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";
                                      return [`${value} (${pct})`, name];
                                    }}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>

                            {/* Leyenda de porcentajes */}
                            <div className="flex-1 w-full space-y-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800/60 pb-1">
                                Distribución Porcentual
                              </span>
                              <div className="space-y-2">
                                {lsaSpaces.map((sp, index) => {
                                  const total = lsaSpaces.reduce((acc, curr) => acc + curr.count, 0);
                                  const pct = total > 0 ? Math.round((sp.count / total) * 100) : 0;
                                  return (
                                    <div key={`legend-${index}`} className="flex justify-between items-center text-xs">
                                      <div className="flex items-center gap-2 text-slate-300 font-medium truncate max-w-[140px] sm:max-w-none">
                                        <span className={`h-2.5 w-2.5 rounded-full ${getFacilitatorBgClass(sp.facilitator)} shrink-0`} />
                                        <span className="truncate">{sp.facilitator}</span>
                                      </div>
                                      <span className="text-white font-bold ml-2 shrink-0">{pct}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tabla de desglose por País y Región */}
                        <div className="border-t border-slate-850/80 pt-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
                                  Desglose por Territorio y Facilitador
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-550 block mt-0.5">
                                Cantidad de espacios de estudio periódicos registrados por país y región
                              </span>
                            </div>
                          </div>

                          {lsaSpacesDetailed.length === 0 ? (
                            <div className="text-center py-8 bg-slate-900/10 border border-dashed border-slate-850 rounded-xl">
                              <span className="text-xs text-slate-500 font-medium">No hay datos disponibles para mostrar</span>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/20 shadow-inner">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-850 bg-slate-950/60 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <th className="py-3 px-4">País</th>
                                    <th className="py-3 px-4">Región</th>
                                    <th className="py-3 px-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mb-1" />
                                        <span>Asamblea / Consejo</span>
                                      </div>
                                    </th>
                                    <th className="py-3 px-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-pink-500 mb-1" />
                                        <span>AEL</span>
                                      </div>
                                    </th>
                                    <th className="py-3 px-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-sky-400 mb-1" />
                                        <span>MCA</span>
                                      </div>
                                    </th>
                                    <th className="py-3 px-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 mb-1" />
                                        <span>Ayudante</span>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850/40 text-xs">
                                  {lsaSpacesDetailed.map((row, idx) => {
                                    const asambleaCount = row.values["Asamblea Nacional o Consejo Regional"] || 0;
                                    const aelCount = row.values["AEL"] || 0;
                                    const mcaCount = row.values["MCA"] || 0;
                                    const ayudanteCount = row.values["Ayudante"] || 0;

                                    return (
                                      <tr 
                                        key={`${row.country}-${row.region}-${idx}`}
                                        className="hover:bg-slate-900/40 transition-colors group"
                                      >
                                        <td className="py-3 px-4 font-semibold text-slate-200">
                                          <div className="flex items-center gap-2">
                                            {renderCountryFlagImage(row.country, "h-3.5 w-5 object-cover rounded shadow-sm")}
                                            <span>{row.country}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400 font-medium">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                            <span>{row.region}</span>
                                          </div>
                                        </td>
                                        <td className={`py-3 px-4 text-center font-mono ${asambleaCount > 0 ? "text-purple-400 font-bold" : "text-slate-650 opacity-30"}`}>
                                          {asambleaCount}
                                        </td>
                                        <td className={`py-3 px-4 text-center font-mono ${aelCount > 0 ? "text-pink-400 font-bold" : "text-slate-650 opacity-30"}`}>
                                          {aelCount}
                                        </td>
                                        <td className={`py-3 px-4 text-center font-mono ${mcaCount > 0 ? "text-sky-300 font-bold" : "text-slate-650 opacity-30"}`}>
                                          {mcaCount}
                                        </td>
                                        <td className={`py-3 px-4 text-center font-mono ${ayudanteCount > 0 ? "text-amber-400 font-bold" : "text-slate-650 opacity-30"}`}>
                                          {ayudanteCount}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Panel Combinado de Funcionamiento y Gestión de AELs */}
                    {(!formalReportMode ? subTab === "espacios" : true) && (
                      <div className="bg-slate-950/45 border border-slate-850 rounded-2xl p-6 space-y-6 w-full animate-fade-in" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte A.2: Funcionamiento y Gestión de las AELs</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 border-b border-slate-850/60 pb-3">
                          <NinePointedStar className="h-5 w-5 text-purple-400" />
                          <div>
                            <span className="text-xs font-bold text-slate-200 uppercase tracking-widest block">
                              Funcionamiento y Gestión de las Asambleas Locales (AEL)
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              Análisis conjunto de la regularidad de consulta e implementación de líneas de acción en la región
                            </span>
                          </div>
                        </div>

                        {/* Grid de Secciones Detalladas: Consulta (Izquierda) y Líneas de Acción (Derecha) */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Columna Izquierda: Consulta Regular */}
                          <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-5 space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-850/40 pb-2.5">
                              <Users className="h-4 w-4 text-purple-400" />
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Análisis de Consulta Regular
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                              {/* Pie Chart */}
                              <div className="relative h-36 w-36 shrink-0 flex items-center justify-center bg-slate-950/30 border border-slate-850/50 rounded-full p-2">
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                  <span className="text-lg font-black text-white">
                                    {lsaTotalCount > 0 ? `${Math.round((lsaConsultingCount / lsaTotalCount) * 100)}%` : "0%"}
                                  </span>
                                  <span className="text-[8px] text-slate-550 uppercase font-bold tracking-wider">
                                    Consultan
                                  </span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: "Consultan Regularmente", value: lsaConsultingCount },
                                        { name: "No Consultan", value: Math.max(0, lsaTotalCount - lsaConsultingCount) }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={36}
                                      outerRadius={48}
                                      paddingAngle={3}
                                      dataKey="value"
                                    >
                                      <Cell fill="#a855f7" />
                                      <Cell fill="#1e293b" />
                                    </Pie>
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "#0b0f19",
                                        borderColor: "#1e293b",
                                        borderRadius: "8px",
                                        fontSize: "10px",
                                        color: "#cbd5e1"
                                      }}
                                      formatter={(value: any) => [`${value} AELs`, "Cantidad"]}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Tarjeta de KPI y Leyenda Consolidadas */}
                              <div className="flex-1 w-full">
                                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Estado de Consulta</span>
                                    <Users className="h-4 w-4 text-purple-400" />
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                                      <span>Consultan regularmente:</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-white font-bold">{lsaConsultingCount}</span>
                                      <span className="text-slate-400 text-[10px] ml-1">
                                        ({lsaTotalCount > 0 ? `${Math.round((lsaConsultingCount / lsaTotalCount) * 100)}%` : "0%"})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                                      <span className="h-2 w-2 rounded-full bg-slate-850" />
                                      <span>No consultan:</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-slate-300 font-bold">{Math.max(0, lsaTotalCount - lsaConsultingCount)}</span>
                                      <span className="text-slate-550 text-[10px] ml-1">
                                        ({lsaTotalCount > 0 ? `${Math.round((Math.max(0, lsaTotalCount - lsaConsultingCount) / lsaTotalCount) * 100)}%` : "0%"})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Histórico Consulta */}
                            <div className="space-y-3 pt-4 border-t border-slate-850/50">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-400 uppercase tracking-wider">Evolución Consulta</span>
                                <span className="text-slate-550">Histórico de informes</span>
                              </div>
                              {lsaConsultingHistoricalData.length === 0 ? (
                                <div className="h-36 flex items-center justify-center text-[10px] text-slate-550 italic border border-dashed border-slate-850 rounded-lg">
                                  No hay datos históricos.
                                </div>
                              ) : (
                                <div className="h-40 w-full text-xs">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={lsaConsultingHistoricalData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="colorConsultingCombined" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.1} />
                                      <XAxis dataKey="fecha" stroke="#475569" fontSize={8} />
                                      <YAxis stroke="#475569" fontSize={8} allowDecimals={false} />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b", borderRadius: "8px", fontSize: "10px", color: "#cbd5e1" }}
                                      />
                                      <Area type="monotone" name="Consultan" dataKey="consultan" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorConsultingCombined)" />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Columna Derecha: Líneas de Acción */}
                          <div className="bg-slate-900/20 border border-slate-850 rounded-xl p-5 space-y-6">
                            <div className="flex items-center gap-2 border-b border-slate-850/40 pb-2.5">
                              <Activity className="h-4 w-4 text-purple-300" />
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                Análisis de Líneas de Acción
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                              {/* Pie Chart */}
                              <div className="relative h-36 w-36 shrink-0 flex items-center justify-center bg-slate-950/30 border border-slate-850/50 rounded-full p-2">
                                <div className="absolute flex flex-col items-center justify-center text-center">
                                  <span className="text-lg font-black text-white">
                                    {lsaTotalCount > 0 ? `${Math.round((lsaActionLinesCount / lsaTotalCount) * 100)}%` : "0%"}
                                  </span>
                                  <span className="text-[8px] text-slate-550 uppercase font-bold tracking-wider">
                                    Con Líneas
                                  </span>
                                </div>
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: "Con Líneas de Acción", value: lsaActionLinesCount },
                                        { name: "Sin Líneas", value: Math.max(0, lsaTotalCount - lsaActionLinesCount) }
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={36}
                                      outerRadius={48}
                                      paddingAngle={3}
                                      dataKey="value"
                                    >
                                      <Cell fill="#c084fc" />
                                      <Cell fill="#1e293b" />
                                    </Pie>
                                    <Tooltip
                                      contentStyle={{
                                        backgroundColor: "#0b0f19",
                                        borderColor: "#1e293b",
                                        borderRadius: "8px",
                                        fontSize: "10px",
                                        color: "#cbd5e1"
                                      }}
                                      formatter={(value: any) => [`${value} AELs`, "Cantidad"]}
                                    />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>

                              {/* Tarjeta de KPI y Leyenda Consolidadas */}
                              <div className="flex-1 w-full">
                                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl space-y-3">
                                  <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Estado de Líneas de Acción</span>
                                    <Activity className="h-4 w-4 text-purple-300" />
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5 text-purple-350 font-semibold">
                                      <span className="h-2 w-2 rounded-full bg-purple-400" />
                                      <span>Con líneas de acción:</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-white font-bold">{lsaActionLinesCount}</span>
                                      <span className="text-slate-400 text-[10px] ml-1">
                                        ({lsaTotalCount > 0 ? `${Math.round((lsaActionLinesCount / lsaTotalCount) * 100)}%` : "0%"})
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
                                      <span className="h-2 w-2 rounded-full bg-slate-850" />
                                      <span>Sin líneas de acción:</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-slate-300 font-bold">{Math.max(0, lsaTotalCount - lsaActionLinesCount)}</span>
                                      <span className="text-slate-550 text-[10px] ml-1">
                                        ({lsaTotalCount > 0 ? `${Math.round((Math.max(0, lsaTotalCount - lsaActionLinesCount) / lsaTotalCount) * 100)}%` : "0%"})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Histórico Líneas de Acción */}
                            <div className="space-y-3 pt-4 border-t border-slate-850/50">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="font-bold text-slate-400 uppercase tracking-wider">Evolución Líneas</span>
                                <span className="text-slate-550">Histórico de informes</span>
                              </div>
                              {lsaActionLinesHistoricalData.length === 0 ? (
                                <div className="h-36 flex items-center justify-center text-[10px] text-slate-550 italic border border-dashed border-slate-850 rounded-lg">
                                  No hay datos históricos.
                                </div>
                              ) : (
                                <div className="h-40 w-full text-xs">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={lsaActionLinesHistoricalData} margin={{ top: 5, right: 10, left: -30, bottom: 0 }}>
                                      <defs>
                                        <linearGradient id="colorActionLinesCombined" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#c084fc" stopOpacity={0.25}/>
                                          <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.1} />
                                      <XAxis dataKey="fecha" stroke="#475569" fontSize={8} />
                                      <YAxis stroke="#475569" fontSize={8} allowDecimals={false} />
                                      <Tooltip
                                        contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b", borderRadius: "8px", fontSize: "10px", color: "#cbd5e1" }}
                                      />
                                      <Area type="monotone" name="Líneas de Acción" dataKey="actionLines" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#colorActionLinesCombined)" />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tabla de desglose de Consulta y Líneas de Acción */}
                        <div className="border-t border-slate-850/80 pt-6 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
                                  Desglose por Territorio: Consulta y Líneas de Acción de AELs
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Regularidad de consulta e implementación de líneas de acción registradas por país y región
                              </span>
                            </div>
                          </div>

                          {lsaManagementDetailed.length === 0 ? (
                            <div className="text-center py-8 bg-slate-900/10 border border-dashed border-slate-850 rounded-xl">
                              <span className="text-xs text-slate-500 font-medium">No hay datos disponibles para mostrar</span>
                            </div>
                          ) : (
                            <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-900/20 shadow-inner">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-850 bg-slate-950/60 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <th className="py-3 px-4">País</th>
                                    <th className="py-3 px-4">Región</th>
                                    <th className="py-3 px-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-500 mb-1" />
                                        <span>Total AEL</span>
                                      </div>
                                    </th>
                                    <th className="py-3 px-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 mb-1" />
                                        <span>Consultan Regularmente</span>
                                      </div>
                                    </th>
                                    <th className="py-3 px-4 text-center">
                                      <div className="flex flex-col items-center">
                                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mb-1" />
                                        <span>Con Líneas de Acción</span>
                                      </div>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-850/40 text-xs">
                                  {lsaManagementDetailed.map((row, idx) => {
                                    const totalAel = row.totalLsa;
                                    const consulting = row.consultingCount;
                                    const actionLines = row.actionLinesCount;

                                    const consultingPct = totalAel > 0 ? Math.round((consulting / totalAel) * 100) : 0;
                                    const actionLinesPct = totalAel > 0 ? Math.round((actionLines / totalAel) * 100) : 0;

                                    return (
                                      <tr 
                                        key={`${row.country}-${row.region}-${idx}`}
                                        className="hover:bg-slate-900/40 transition-colors group"
                                      >
                                        <td className="py-3 px-4 font-semibold text-slate-200">
                                          <div className="flex items-center gap-2">
                                            {renderCountryFlagImage(row.country, "h-3.5 w-5 object-cover rounded shadow-sm")}
                                            <span>{row.country}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-slate-400 font-medium">
                                          <div className="flex items-center gap-1.5 text-slate-300">
                                            <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                                            <span>{row.region}</span>
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-300">
                                          {totalAel}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <div className="flex flex-col items-center">
                                            <span className={`font-mono font-bold ${consulting > 0 ? "text-purple-400" : "text-slate-650 opacity-30"}`}>
                                              {consulting}
                                            </span>
                                            {totalAel > 0 && consulting > 0 && (
                                              <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                                                ({consultingPct}%)
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                          <div className="flex flex-col items-center">
                                            <span className={`font-mono font-bold ${actionLines > 0 ? "text-purple-300" : "text-slate-650 opacity-30"}`}>
                                              {actionLines}
                                            </span>
                                            {totalAel > 0 && actionLines > 0 && (
                                              <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                                                ({actionLinesPct}%)
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    )}


                    {/* Gráfico 2: Relatos Estudiados AEL con desglose dual (Cantidad y %) e histórico con KPIs */}
                    {(!formalReportMode ? subTab === "capacitacion" : true) && (
                      <div className="space-y-6 w-full animate-fade-in" style={formalReportMode ? { pageBreakBefore: "always" } : undefined}>
                        {formalReportMode && (
                          <div className="hidden print:block pb-2 border-b border-slate-850 mb-3">
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Parte B: Análisis Avanzado de Relatos (Capacitación y Relatos)</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                          {/* Gráfico 2.1: Relatos Cantidad */}
                          <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Relatos Estudiados por Asambleas (AEL) (Cantidad)
                            </span>
                            <div className="h-48 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={lsaStories}
                                  margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                  <XAxis dataKey="story" stroke="#64748b" fontSize={10} />
                                  <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    formatter={(value) => [value, "Asambleas"]}
                                  />
                                  <Bar dataKey="count" name="Asambleas" fill="#a855f7" radius={[4, 4, 0, 0]}>
                                    {lsaStories.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#8b5cf6" : "#a855f7"} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          {/* Gráfico 2.2: Relatos Porcentaje */}
                          <div className="bg-slate-950/45 border border-slate-850 rounded-xl p-4 space-y-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Relatos Estudiados por Asambleas (AEL) (%)
                            </span>
                            <div className="h-48 text-xs">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={lsaStoriesPercentage}
                                  margin={{ top: 5, right: 15, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                  <XAxis dataKey="story" stroke="#64748b" fontSize={10} />
                                  <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} unit="%" />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                    itemStyle={{ color: '#e2e8f0', fontWeight: 'bold' }}
                                    labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                    formatter={(value) => [`${value}%`, "Asambleas"]}
                                  />
                                  <Bar dataKey="percent" name="Asambleas" fill="#10b981" radius={[4, 4, 0, 0]}>
                                    {lsaStoriesPercentage.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10b981" : "#34d399"} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>



                        {/* Evolución Histórica de Relatos Estudiados AEL */}
                        <div className="space-y-6 w-full pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
                            Histórico de Relatos Estudiados (Evolución en el Tiempo por Relato - AEL)
                          </span>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Muestra la evolución del total acumulado de Asambleas Espirituales Locales (AEL) que han estudiado cada relato basándose en la fecha del formulario, junto con el análisis de variación del último periodo.
                          </p>

                          <div className="flex flex-col gap-8">
                            {[
                              { name: "Batula", key: "Batula", color: "#8b5cf6" },
                              { name: "Bramour", key: "Bramour", color: "#f43f5e" },
                              { name: "Miramar", key: "Miramar", color: "#f59e0b" },
                              { name: "Orchard", key: "Orchard", color: "#6366f1" },
                              { name: "San Pedro", key: "San Pedro", color: "#10b981" }
                            ].map((relato) => {
                              const stats = lsaStoriesTrendStats[relato.key] || {
                                recentChange: 0,
                                recentDirection: "none",
                                firstVal: 0,
                                lastVal: 0,
                                prevVal: 0,
                                pctChange: 0
                              };

                              return (
                                <div key={relato.key} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch bg-slate-900/30 border border-slate-850/60 p-5 rounded-2xl shadow-md hover:border-slate-800 transition-all duration-300">
                                  {/* Left part: The Chart (3 columns on lg) */}
                                  <div className="lg:col-span-3 bg-slate-950/45 border border-slate-850/40 rounded-xl p-4 flex flex-col justify-between">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-extrabold uppercase tracking-wider block flex items-center gap-1.5" style={{ color: relato.color }}>
                                        <TrendingUp className="h-4 w-4" />
                                        Relato: {relato.name}
                                      </span>
                                      <span className="text-[10px] text-slate-550 font-medium">Asambleas acumuladas por mes</span>
                                    </div>
                                    <div className="h-56 text-xs w-full">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={lsaStoriesHistoricalData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.15} />
                                          <XAxis dataKey="fecha" stroke="#64748b" fontSize={10} />
                                          <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                                          <Tooltip 
                                            contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderColor: 'rgba(148, 163, 184, 0.25)', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)' }}
                                            itemStyle={{ fontWeight: 'bold' }}
                                            labelStyle={{ color: '#94a3b8', fontWeight: '600' }}
                                          />
                                          <Line type="monotone" name="Asambleas" dataKey={relato.key} stroke={relato.color} strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                                        </LineChart>
                                      </ResponsiveContainer>
                                    </div>
                                  </div>

                                  {/* Right part: The KPI Panel (1 column on lg) */}
                                  <div className="bg-slate-950/40 border border-slate-850 hover:border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm transition-all duration-300">
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: relato.color }}>Análisis {relato.name}</span>
                                      <h4 className="text-sm font-bold text-white">Variación del Último Periodo</h4>
                                      <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Cambio en la cantidad de Asambleas (AEL) que han reportado haber estudiado este relato específico en el último mes de informe.
                                      </p>
                                    </div>

                                    <div className="my-4 py-3 border-y border-slate-850/40 flex flex-col items-center justify-center text-center">
                                      {stats.recentChange > 0 ? (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                                            <TrendingUp className="h-3 w-3" />
                                            Incremento
                                          </span>
                                          <span className="text-3xl font-black text-emerald-400 mt-2">
                                            +{stats.recentChange}
                                          </span>
                                        </>
                                      ) : stats.recentChange < 0 ? (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/10 text-rose-400 border border-rose-500/20 uppercase tracking-wider">
                                            <TrendingDown className="h-3 w-3" />
                                            Disminución
                                          </span>
                                          <span className="text-3xl font-black text-rose-400 mt-2">
                                            {stats.recentChange}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/20 uppercase tracking-wider">
                                            Estable
                                          </span>
                                          <span className="text-3xl font-black text-slate-400 mt-2">
                                            0
                                          </span>
                                        </>
                                      )}
                                      <span className="text-[10px] text-slate-500 mt-1 block">
                                        Asambleas nuevas este mes
                                      </span>
                                    </div>

                                    <div className="space-y-1.5 text-[10px] text-slate-500 font-medium">
                                      <div className="flex justify-between">
                                        <span>Valor Periodo Anterior:</span>
                                        <span className="font-bold text-slate-300 font-mono">{stats.prevVal} AELs</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Valor Último Periodo:</span>
                                        <span className="font-bold text-slate-300 font-mono">{stats.lastVal} AELs</span>
                                      </div>
                                      {stats.prevVal > 0 && (
                                        <div className="flex justify-between">
                                          <span>Porcentaje de Variación:</span>
                                          <span className={`font-bold font-mono ${stats.recentChange > 0 ? "text-emerald-400" : stats.recentChange < 0 ? "text-rose-400" : "text-slate-400"}`}>
                                            {stats.recentChange > 0 ? "+" : ""}{stats.pctChange}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TABLAS DE DETALLES ELIMINADAS (GESTIÓN Y RELATOS REMOVIDOS) */}
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
