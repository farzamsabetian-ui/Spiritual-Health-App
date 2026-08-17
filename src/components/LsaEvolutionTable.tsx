import React, { useState } from "react";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  ChevronUp, 
  ChevronDown, 
  Info,
  Activity,
  Globe
} from "lucide-react";

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

interface Submission {
  id: string;
  userEmail: string;
  submittedAt: string;
  userCountry?: string;
  userRegion?: string;
  data: Record<string, any>;
}

interface LsaEvolutionTableProps {
  submissions: Submission[];
  selectedCountry: string;
  selectedRegion: string;
  dateFieldId: string | null;
  FIELD_ASAMBLEAS_CANTIDAD: string;
  FIELD_ASAMBLEAS_CONSULTA: string;
  FIELD_ASAMBLEAS_LINEAS: string;
  renderCountryFlagImage: (countryName: string, className?: string) => React.ReactNode;
}

export const LsaEvolutionTable: React.FC<LsaEvolutionTableProps> = ({
  submissions,
  selectedCountry,
  selectedRegion,
  dateFieldId,
  FIELD_ASAMBLEAS_CANTIDAD,
  FIELD_ASAMBLEAS_CONSULTA,
  FIELD_ASAMBLEAS_LINEAS,
  renderCountryFlagImage,
}) => {
  const [sortField, setSortField] = useState("country");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // 1. Filtrar los envíos por los filtros globales de país y región
  let filteredSubs = submissions;
  if (selectedCountry !== "Todos") {
    filteredSubs = filteredSubs.filter(
      (s) => s.userCountry?.toLowerCase().trim() === selectedCountry.toLowerCase().trim()
    );
  }
  if (selectedRegion !== "Todas") {
    filteredSubs = filteredSubs.filter(
      (s) => s.userRegion?.toLowerCase().trim() === selectedRegion.toLowerCase().trim()
    );
  }

  // 2. Agrupar todos los envíos por País + Región
  const groupSubsMap: Record<string, Submission[]> = {};

  filteredSubs.forEach((sub) => {
    const country = sub.userCountry?.trim() || "Desconocido";
    const region = sub.userRegion?.trim() || "Sin Región";
    const geoKey = `${country.toLowerCase()}_${region.toLowerCase()}`;

    if (!groupSubsMap[geoKey]) {
      groupSubsMap[geoKey] = [];
    }
    groupSubsMap[geoKey].push(sub);
  });

  // Helper para obtener fecha de un envío
  const getSubDateStr = (sub: Submission) => {
    if (dateFieldId && sub.data[dateFieldId]) {
      return String(sub.data[dateFieldId]);
    }
    const foundDateKey = Object.keys(sub.data).find((k) => {
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

  // 3. Para cada grupo País + Región, calcular valores iniciales (periodo pasado) y actuales (periodo actual)
  const groupMap: Record<
    string,
    {
      country: string;
      region: string;
      initialLsa: number;
      latestLsa: number;
      initialConsulting: number;
      latestConsulting: number;
      initialActionLines: number;
      latestActionLines: number;
    }
  > = {};

  Object.keys(groupSubsMap).forEach((geoKey) => {
    const subs = [...groupSubsMap[geoKey]];
    // Ordenar por fecha de forma cronológica
    subs.sort((a, b) => getSubDateStr(a).localeCompare(getSubDateStr(b)));

    const subLast = subs[subs.length - 1];
    const subPrev = subs.length > 1 ? subs[subs.length - 2] : null;

    const countryName = subLast.userCountry?.trim() || "Desconocido";
    const regionName = subLast.userRegion?.trim() || "Sin Región";

    // Cantidad de Asambleas: número actual (latestLsa) y el del periodo pasado (initialLsa)
    const latestLsa = Number(subLast.data[FIELD_ASAMBLEAS_CANTIDAD]) || 0;
    const initialLsa = subPrev ? (Number(subPrev.data[FIELD_ASAMBLEAS_CANTIDAD]) || 0) : latestLsa;

    // Consultan regularmente
    const latestConsulting = Number(subLast.data[FIELD_ASAMBLEAS_CONSULTA]) || 0;
    const initialConsulting = subPrev ? (Number(subPrev.data[FIELD_ASAMBLEAS_CONSULTA]) || 0) : latestConsulting;

    // Líneas de acción
    const latestActionLines = Number(subLast.data[FIELD_ASAMBLEAS_LINEAS]) || 0;
    const initialActionLines = subPrev ? (Number(subPrev.data[FIELD_ASAMBLEAS_LINEAS]) || 0) : latestActionLines;

    groupMap[geoKey] = {
      country: countryName,
      region: regionName || "Sin Región",
      initialLsa,
      latestLsa,
      initialConsulting,
      latestConsulting,
      initialActionLines,
      latestActionLines,
    };
  });

  // Convertir a array de objetos enriquecidos
  const items = Object.values(groupMap).map((g) => {
    const lsaDiff = g.latestLsa - g.initialLsa;
    const lsaPct = g.initialLsa > 0 ? Math.round((lsaDiff / g.initialLsa) * 100) : 0;

    const consultingDiff = g.latestConsulting - g.initialConsulting;
    const consultingPct = g.initialConsulting > 0 ? Math.round((consultingDiff / g.initialConsulting) * 100) : 0;

    const actionLinesDiff = g.latestActionLines - g.initialActionLines;
    const actionLinesPct = g.initialActionLines > 0 ? Math.round((actionLinesDiff / g.initialActionLines) * 100) : 0;

    const initialTotal = g.initialLsa;
    const latestTotal = g.latestLsa;
    const totalDiff = lsaDiff;
    const totalPct = lsaPct;

    return {
      ...g,
      lsaDiff,
      lsaPct,
      consultingDiff,
      consultingPct,
      actionLinesDiff,
      actionLinesPct,
      initialTotal,
      latestTotal,
      totalDiff,
      totalPct,
    };
  });

  // 5. Ordenación
  const sortedItems = [...items].sort((a, b) => {
    let valA: any;
    let valB: any;

    if (sortField === "country") {
      valA = a.country;
      valB = b.country;
    } else if (sortField === "region") {
      valA = a.region;
      valB = b.region;
    } else if (sortField === "lsa") {
      valA = a.latestLsa;
      valB = b.latestLsa;
    } else if (sortField === "lsaDiff") {
      valA = a.lsaDiff;
      valB = b.lsaDiff;
    } else if (sortField === "consulting") {
      valA = a.latestConsulting;
      valB = b.latestConsulting;
    } else if (sortField === "consultingDiff") {
      valA = a.consultingDiff;
      valB = b.consultingDiff;
    } else if (sortField === "actionLines") {
      valA = a.latestActionLines;
      valB = b.latestActionLines;
    } else if (sortField === "actionLinesDiff") {
      valA = a.actionLinesDiff;
      valB = b.actionLinesDiff;
    } else {
      valA = a.country;
      valB = b.country;
    }

    if (typeof valA === "string" && typeof valB === "string") {
      return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortDirection === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }
  });

  // Calcular totales sumados de los ítems filtrados actualmente
  const sumInitialLsa = sortedItems.reduce((acc, item) => acc + item.initialLsa, 0);
  const sumLatestLsa = sortedItems.reduce((acc, item) => acc + item.latestLsa, 0);
  const sumLsaDiff = sumLatestLsa - sumInitialLsa;
  const sumLsaPct = sumInitialLsa > 0 ? Math.round((sumLsaDiff / sumInitialLsa) * 100) : 0;

  const sumInitialConsulting = sortedItems.reduce((acc, item) => acc + item.initialConsulting, 0);
  const sumLatestConsulting = sortedItems.reduce((acc, item) => acc + item.latestConsulting, 0);
  const sumConsultingDiff = sumLatestConsulting - sumInitialConsulting;
  const sumConsultingPct = sumInitialConsulting > 0 ? Math.round((sumConsultingDiff / sumInitialConsulting) * 100) : 0;

  const sumInitialActionLines = sortedItems.reduce((acc, item) => acc + item.initialActionLines, 0);
  const sumLatestActionLines = sortedItems.reduce((acc, item) => acc + item.latestActionLines, 0);
  const sumActionLinesDiff = sumLatestActionLines - sumInitialActionLines;
  const sumActionLinesPct = sumInitialActionLines > 0 ? Math.round((sumActionLinesDiff / sumInitialActionLines) * 100) : 0;

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIndicator = (field: string) => {
    const isActive = sortField === field;
    return (
      <span className={`inline-flex flex-col ml-1.5 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-30 group-hover:opacity-75"}`}>
        {isActive && sortDirection === "desc" ? (
          <ChevronDown className="h-3.5 w-3.5 text-purple-400 shrink-0" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-purple-400 shrink-0" />
        )}
      </span>
    );
  };

  const renderTrendBadge = (diff: number, pct: number) => {
    if (diff > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <TrendingUp className="h-2.5 w-2.5 text-emerald-450" />
          <span>+{diff}</span>
          {pct > 0 && <span className="text-[9px] font-normal opacity-70">({pct}%)</span>}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
          <TrendingDown className="h-2.5 w-2.5 text-rose-450" />
          <span>{diff}</span>
          {pct < 0 && <span className="text-[9px] font-normal opacity-70">({pct}%)</span>}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800/40 text-slate-400 border border-slate-800/60 shrink-0">
          <span>0</span>
        </span>
      );
    }
  };

  return (
    <div className="bg-slate-950/45 border border-slate-850 rounded-2xl p-6 shadow-lg space-y-5 max-w-4xl mx-auto w-full" id="lsa-evolution-table-container">
      {/* Cabecera del panel de la tabla */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-purple-500/10 rounded-lg text-purple-450">
              <NinePointedStar className="h-4 w-4" />
            </span>
            <span>Evolución de Asambleas Locales (AEL) por País y Región</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Análisis de progresión <span className="text-slate-350 font-medium">Inicial ➔ Actual</span> con cálculo automático de variaciones para indicadores clave.
          </p>
        </div>
      </div>

      {/* Contenedor de la tabla con scroll horizontal */}
      <div className="overflow-x-auto bg-slate-950/50 border border-slate-850 rounded-xl shadow-inner">
        <table className="w-full border-collapse text-left text-xs text-slate-300 min-w-[550px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/55 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
              <th
                className="w-[45%] px-5 py-4 cursor-pointer hover:bg-slate-850/50 hover:text-white transition-colors group"
                onClick={() => handleSort("country")}
              >
                <div className="flex items-center">
                  <span>País</span>
                  {renderSortIndicator("country")}
                </div>
              </th>
              <th
                className="w-[30%] px-5 py-4 cursor-pointer hover:bg-slate-850/50 hover:text-white transition-colors group"
                onClick={() => handleSort("region")}
              >
                <div className="flex items-center">
                  <span>Región</span>
                  {renderSortIndicator("region")}
                </div>
              </th>
              <th className="w-[25%] px-5 py-4 text-right">
                <div className="flex flex-col gap-1 items-end">
                  <span
                    className="cursor-pointer hover:text-white transition-colors flex items-center justify-end group"
                    onClick={() => handleSort("lsa")}
                  >
                    <span>AEL Establecidas</span>
                    {renderSortIndicator("lsa")}
                  </span>
                  <span
                    className="text-[9px] font-normal text-slate-550 hover:text-slate-355 cursor-pointer flex items-center justify-end group"
                    onClick={() => handleSort("lsaDiff")}
                  >
                    <span>(Crecimiento)</span>
                    {renderSortIndicator("lsaDiff")}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-12 text-center text-slate-500 italic bg-slate-950/20">
                  No se encontraron registros con los criterios actuales
                </td>
              </tr>
            ) : (
              sortedItems.map((item, idx) => (
                <tr
                  key={`${item.country}-${item.region}-${idx}`}
                  className="hover:bg-slate-900/35 transition-colors duration-100 group/row even:bg-slate-950/15"
                >
                  {/* País */}
                  <td className="px-5 py-3.5 font-semibold text-slate-100 w-[45%]">
                    <div className="flex items-center gap-2.5">
                      {renderCountryFlagImage(
                        item.country,
                        "h-3.5 w-5 object-cover rounded-sm shadow-sm opacity-90 border border-slate-800 shrink-0"
                      )}
                      <span className="group-hover/row:text-white transition-colors">{item.country}</span>
                    </div>
                  </td>

                  {/* Región */}
                  <td className="px-5 py-3.5 w-[30%]">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-slate-400 border border-slate-800 group-hover/row:border-slate-700 group-hover/row:text-slate-300 transition-all">
                      {item.region}
                    </span>
                  </td>

                  {/* AEL Establecidas */}
                  <td className="px-5 py-3.5 text-right font-mono w-[25%]">
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-1.5 justify-end bg-slate-900/40 px-2.5 py-1 rounded border border-slate-800/50 group-hover/row:bg-slate-900/80 group-hover/row:border-slate-700 transition-all">
                        <span className="text-slate-450 text-[11px] font-medium min-w-[16px] text-right">
                          {item.initialLsa}
                        </span>
                        <span className="text-slate-600 text-[10px] font-sans">→</span>
                        <span className="text-slate-100 text-xs font-bold min-w-[16px] text-right group-hover/row:text-white">
                          {item.latestLsa}
                        </span>
                      </div>
                      <div className="w-[78px] flex justify-end shrink-0">
                        {renderTrendBadge(item.lsaDiff, item.lsaPct)}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {sortedItems.length > 0 && (
            <tfoot className="border-t border-slate-800 bg-slate-900/40 font-bold text-slate-350">
              <tr className="divide-x divide-slate-900/30">
                <td colSpan={2} className="px-5 py-4 text-xs font-bold text-slate-400 bg-slate-900/25">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                    <span>Totales Filtrados</span>
                  </div>
                </td>
                
                {/* Total AEL Establecidas */}
                <td className="px-5 py-4 text-right font-mono w-[25%]">
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-slate-400 text-[11px]">{sumInitialLsa}</span>
                      <span className="text-slate-655 text-[10px] font-sans">→</span>
                      <span className="text-white text-xs font-extrabold">{sumLatestLsa}</span>
                    </div>
                    <div className="w-[78px] flex justify-end shrink-0">
                      {renderTrendBadge(sumLsaDiff, sumLsaPct)}
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Nota informativa al pie */}
      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-1 pt-1">
        <Info className="h-3 w-3 text-slate-500/80 shrink-0" />
        <span>Los valores se agrupan por país, región y contribuyente para calcular de forma acumulada la diferencia entre el primer y último envío registrado para la métrica de AEL Establecidas.</span>
      </div>
    </div>
  );
};
