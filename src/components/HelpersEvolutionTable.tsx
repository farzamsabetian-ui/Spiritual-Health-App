import React, { useState } from "react";
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  ChevronUp, 
  ChevronDown, 
  ArrowRight,
  Info 
} from "lucide-react";

interface Submission {
  id: string;
  userEmail: string;
  submittedAt: string;
  userCountry?: string;
  userRegion?: string;
  data: Record<string, any>;
}

interface HelpersEvolutionTableProps {
  submissions: Submission[];
  selectedCountry: string;
  selectedRegion: string;
  dateFieldId: string | null;
  FIELD_AYUDANTES_NOMBRADOS: string;
  FIELD_AYUDANTES_PROTECCION: string;
  renderCountryFlagImage: (countryName: string, className?: string) => React.ReactNode;
}

export const HelpersEvolutionTable: React.FC<HelpersEvolutionTableProps> = ({
  submissions,
  selectedCountry,
  selectedRegion,
  dateFieldId,
  FIELD_AYUDANTES_NOMBRADOS,
  FIELD_AYUDANTES_PROTECCION,
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

  // 2. Agrupar todos los envíos por País + Región y luego por Contribuidor (Email)
  const contributorMap: Record<string, Record<string, Submission[]>> = {};

  filteredSubs.forEach((sub) => {
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
  const groupMap: Record<
    string,
    {
      country: string;
      region: string;
      initialHelpers: number;
      latestHelpers: number;
      initialProtection: number;
      latestProtection: number;
    }
  > = {};

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

  Object.keys(contributorMap).forEach((geoKey) => {
    const contributors = contributorMap[geoKey];

    let countryName = "";
    let regionName = "";

    let totalInitHelpers = 0;
    let totalLatHelpers = 0;
    let totalInitProtection = 0;
    let totalLatProtection = 0;

    Object.keys(contributors).forEach((email) => {
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
      countryName = parts[0]
        ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
        : "Desconocido";
      regionName = parts[1]
        ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
        : "Sin Región";
    }

    groupMap[geoKey] = {
      country: countryName,
      region: regionName || "Sin Región",
      initialHelpers: totalInitHelpers,
      latestHelpers: totalLatHelpers,
      initialProtection: totalInitProtection,
      latestProtection: totalLatProtection,
    };
  });

  // Convertir a array de objetos enriquecidos
  const items = Object.values(groupMap).map((g) => {
    const helpersDiff = g.latestHelpers - g.initialHelpers;
    const helpersPct = g.initialHelpers > 0 ? Math.round((helpersDiff / g.initialHelpers) * 100) : 0;

    const protectionDiff = g.latestProtection - g.initialProtection;
    const protectionPct =
      g.initialProtection > 0 ? Math.round((protectionDiff / g.initialProtection) * 100) : 0;

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

    if (typeof valA === "string" && typeof valB === "string") {
      return sortDirection === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortDirection === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }
  });

  // Calcular totales sumados de los ítems filtrados actualmente
  const sumInitialHelpers = sortedItems.reduce((acc, item) => acc + item.initialHelpers, 0);
  const sumLatestHelpers = sortedItems.reduce((acc, item) => acc + item.latestHelpers, 0);
  const sumHelpersDiff = sumLatestHelpers - sumInitialHelpers;
  const sumHelpersPct =
    sumInitialHelpers > 0 ? Math.round((sumHelpersDiff / sumInitialHelpers) * 100) : 0;

  const sumInitialProtection = sortedItems.reduce((acc, item) => acc + item.initialProtection, 0);
  const sumLatestProtection = sortedItems.reduce((acc, item) => acc + item.latestProtection, 0);
  const sumProtectionDiff = sumLatestProtection - sumInitialProtection;
  const sumProtectionPct =
    sumInitialProtection > 0 ? Math.round((sumProtectionDiff / sumInitialProtection) * 100) : 0;

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

  const renderSortIndicator = (field: string) => {
    const isActive = sortField === field;
    return (
      <span className={`inline-flex flex-col ml-1.5 transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-30 group-hover:opacity-75"}`}>
        {isActive && sortDirection === "desc" ? (
          <ChevronDown className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
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
    <div className="bg-slate-950/35 border border-slate-850 rounded-2xl p-6 shadow-xl space-y-5" id="helpers-evolution-table-container">
      {/* Cabecera del panel de la tabla */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Briefcase className="h-4 w-4" />
            </span>
            <span>Evolución de Ayudantes por País y Región</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Análisis de progresión <span className="text-slate-350 font-medium">Inicial ➔ Actual</span> con cálculo automático de variaciones.
          </p>
        </div>
      </div>

      {/* Contenedor de la tabla con scroll horizontal */}
      <div className="overflow-x-auto bg-slate-950/50 border border-slate-850 rounded-xl shadow-inner">
        <table className="w-full border-collapse text-left text-xs text-slate-300 min-w-[650px]">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/55 text-slate-400 font-bold uppercase tracking-wider text-[10px] select-none">
              <th
                className="px-5 py-4 cursor-pointer hover:bg-slate-850/50 hover:text-white transition-colors group"
                onClick={() => handleSort("country")}
              >
                <div className="flex items-center">
                  <span>País</span>
                  {renderSortIndicator("country")}
                </div>
              </th>
              <th
                className="px-5 py-4 cursor-pointer hover:bg-slate-850/50 hover:text-white transition-colors group"
                onClick={() => handleSort("region")}
              >
                <div className="flex items-center">
                  <span>Región</span>
                  {renderSortIndicator("region")}
                </div>
              </th>
              <th className="px-5 py-4 text-right">
                <div className="flex flex-col gap-1 items-end">
                  <span
                    className="cursor-pointer hover:text-white transition-colors flex items-center justify-end group"
                    onClick={() => handleSort("helpers")}
                  >
                    <span>Ayudantes Nombrados</span>
                    {renderSortIndicator("helpers")}
                  </span>
                  <span
                    className="text-[9px] font-normal text-slate-550 hover:text-slate-355 cursor-pointer flex items-center justify-end group"
                    onClick={() => handleSort("helpersDiff")}
                  >
                    <span>(Crecimiento)</span>
                    {renderSortIndicator("helpersDiff")}
                  </span>
                </div>
              </th>
              <th className="px-5 py-4 text-right">
                <div className="flex flex-col gap-1 items-end">
                  <span
                    className="cursor-pointer hover:text-white transition-colors flex items-center justify-end group"
                    onClick={() => handleSort("helpersProtection")}
                  >
                    <span>Ayudantes de Protección</span>
                    {renderSortIndicator("helpersProtection")}
                  </span>
                  <span
                    className="text-[9px] font-normal text-slate-550 hover:text-slate-355 cursor-pointer flex items-center justify-end group"
                    onClick={() => handleSort("protectionDiff")}
                  >
                    <span>(Crecimiento)</span>
                    {renderSortIndicator("protectionDiff")}
                  </span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/60">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-slate-500 italic bg-slate-950/20">
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
                  <td className="px-5 py-3.5 font-semibold text-slate-100">
                    <div className="flex items-center gap-2.5">
                      {renderCountryFlagImage(
                        item.country,
                        "h-3.5 w-5 object-cover rounded-sm shadow-sm opacity-90 border border-slate-800 shrink-0"
                      )}
                      <span className="group-hover/row:text-white transition-colors">{item.country}</span>
                    </div>
                  </td>

                  {/* Región */}
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-slate-400 border border-slate-800 group-hover/row:border-slate-700 group-hover/row:text-slate-300 transition-all">
                      {item.region}
                    </span>
                  </td>

                  {/* Ayudantes Nombrados */}
                  <td className="px-5 py-3.5 text-right font-mono">
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-slate-450 text-[11px] font-medium min-w-[16px] text-right">
                          {item.initialHelpers}
                        </span>
                        <span className="text-slate-600 text-[10px] font-sans">→</span>
                        <span className="text-slate-100 text-xs font-bold min-w-[16px] text-right group-hover/row:text-white">
                          {item.latestHelpers}
                        </span>
                      </div>
                      <div className="w-[78px] flex justify-end shrink-0">
                        {renderTrendBadge(item.helpersDiff, item.helpersPct)}
                      </div>
                    </div>
                  </td>

                  {/* Ayudantes de Protección */}
                  <td className="px-5 py-3.5 text-right font-mono">
                    <div className="flex items-center justify-end gap-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-slate-450 text-[11px] font-medium min-w-[16px] text-right">
                          {item.initialProtection}
                        </span>
                        <span className="text-slate-600 text-[10px] font-sans">→</span>
                        <span className="text-slate-100 text-xs font-bold min-w-[16px] text-right group-hover/row:text-white">
                          {item.latestProtection}
                        </span>
                      </div>
                      <div className="w-[78px] flex justify-end shrink-0">
                        {renderTrendBadge(item.protectionDiff, item.protectionPct)}
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
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    <span>Totales Filtrados</span>
                  </div>
                </td>
                
                {/* Total Ayudantes Nombrados */}
                <td className="px-5 py-4 text-right font-mono">
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-slate-400 text-[11px]">{sumInitialHelpers}</span>
                      <span className="text-slate-655 text-[10px] font-sans">→</span>
                      <span className="text-white text-xs font-extrabold">{sumLatestHelpers}</span>
                    </div>
                    <div className="w-[78px] flex justify-end shrink-0">
                      {renderTrendBadge(sumHelpersDiff, sumHelpersPct)}
                    </div>
                  </div>
                </td>

                {/* Total Ayudantes de Protección */}
                <td className="px-5 py-4 text-right font-mono">
                  <div className="flex items-center justify-end gap-3">
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-slate-400 text-[11px]">{sumInitialProtection}</span>
                      <span className="text-slate-655 text-[10px] font-sans">→</span>
                      <span className="text-white text-xs font-extrabold">{sumLatestProtection}</span>
                    </div>
                    <div className="w-[78px] flex justify-end shrink-0">
                      {renderTrendBadge(sumProtectionDiff, sumProtectionPct)}
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
        <span>Los valores se agrupan por país, región y contribuyente para calcular de forma acumulada la diferencia entre el primer y último envío registrado.</span>
      </div>
    </div>
  );
};
