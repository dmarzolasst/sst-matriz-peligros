import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Factory,
  HardHat,
  MapPin,
  Scale,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  ShieldQuestion,
  Users,
  Wrench,
} from "lucide-react";

import { auth } from "@/lib/auth/auth";
import { getDashboardData, type DashboardFilters } from "@/lib/dashboard/get-dashboard-data";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DashboardFilters as DashboardFiltersBar } from "@/components/dashboard/dashboard-filters";
import { BarChartCard } from "@/components/dashboard/bar-chart-card";
import { RiskLevelChart } from "@/components/dashboard/risk-level-chart";

type SearchParams = Record<string, string | string[] | undefined>;

function toFilters(searchParams: SearchParams): DashboardFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return typeof value === "string" && value ? value : undefined;
  };
  const routine = get("routine");
  return {
    companyId: get("companyId"),
    processId: get("processId"),
    areaId: get("areaId"),
    classificationId: get("classificationId"),
    riskLevel: get("riskLevel"),
    routine: routine === "true" || routine === "false" ? routine : undefined,
  };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [session, resolvedSearchParams] = await Promise.all([auth(), searchParams]);
  const filters = toFilters(resolvedSearchParams);
  const { kpis, charts } = await getDashboardData(filters);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {session?.user?.name ?? session?.user?.email}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Resumen ejecutivo de peligros y riesgos. Filtra por empresa, proceso, zona, clasificación, nivel de
          riesgo o tipo de tarea.
        </p>
      </div>

      <DashboardFiltersBar />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Peligros identificados" value={kpis.totalHazards} icon={AlertTriangle} tone="blue" />
        <KpiCard label="Tareas" value={kpis.totalTasks} icon={ClipboardList} tone="slate" />
        <KpiCard label="Procesos" value={kpis.totalProcesses} icon={Factory} tone="slate" />
        <KpiCard label="Zonas / áreas" value={kpis.totalAreas} icon={MapPin} tone="slate" />
        <KpiCard label="Trabajadores expuestos" value={kpis.totalExposedWorkers} icon={Users} tone="blue" />

        <KpiCard label="Riesgos críticos" value={kpis.criticalRisks} icon={ShieldOff} tone="red" />
        <KpiCard label="Riesgos altos" value={kpis.highRisks} icon={ShieldAlert} tone="amber" />
        <KpiCard label="Riesgos medios" value={kpis.mediumRisks} icon={ShieldQuestion} tone="amber" />
        <KpiCard label="Riesgos bajos" value={kpis.lowRisks} icon={ShieldCheck} tone="green" />
        <KpiCard label="Requisitos legales asociados" value={kpis.legalRequirementsCount} icon={Scale} tone="slate" />

        <KpiCard label="Peligros con controles" value={`${kpis.pctWithControls}%`} icon={CheckCircle2} tone="green" />
        <KpiCard label="Peligros con medidas" value={`${kpis.pctWithMeasures}%`} icon={HardHat} tone="green" />
        <KpiCard label="Medidas pendientes" value={kpis.pendingMeasures} icon={Wrench} tone="amber" />
        <KpiCard label="Tareas rutinarias" value={kpis.routineTasks} icon={ClipboardList} tone="blue" />
        <KpiCard label="Tareas no rutinarias" value={kpis.nonRoutineTasks} icon={ClipboardList} tone="slate" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarChartCard title="Peligros por clasificación (GTC 45)" data={charts.hazardsByClassification} />
        <RiskLevelChart data={charts.risksByLevel} />
        <BarChartCard title="Peligros por proceso" data={charts.hazardsByProcess} />
        <BarChartCard title="Peligros por zona / área" data={charts.hazardsByArea} />
        <BarChartCard title="Controles existentes registrados" data={charts.controlsDistribution} categorical />
        <BarChartCard title="Medidas de intervención registradas" data={charts.measuresStatus} categorical />
      </div>
    </div>
  );
}
