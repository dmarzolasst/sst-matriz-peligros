import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/session";

export type DashboardFilters = {
  companyId?: string;
  processId?: string;
  areaId?: string;
  classificationId?: string;
  riskLevel?: string;
  routine?: "true" | "false";
};

type NameCount = { name: string; count: number };

function hasAnyControl(existingControls: { source: string | null; medium: string | null; individual: string | null } | null) {
  return !!(existingControls && (existingControls.source || existingControls.medium || existingControls.individual));
}

function hasAnyMeasure(
  measure: {
    elimination: string | null;
    substitution: string | null;
    engineering: string | null;
    administrative: string | null;
    ppe: string | null;
  } | null,
) {
  return !!(
    measure &&
    (measure.elimination || measure.substitution || measure.engineering || measure.administrative || measure.ppe)
  );
}

function groupCount<T>(items: T[], keyFn: (item: T) => string): NameCount[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

/**
 * Única función de agregación del dashboard: opera sobre el mismo conjunto de
 * peligros filtrado para calcular KPIs y datos de gráficos, evitando que las
 * distintas vistas (pantalla, panel gerencial, exportación) muestren números
 * inconsistentes entre sí.
 */
export async function getDashboardData(filters: DashboardFilters) {
  await requireUser();

  const hazards = await prisma.hazard.findMany({
    where: {
      classificationId: filters.classificationId || undefined,
      riskAssessment: filters.riskLevel ? { priority: filters.riskLevel } : undefined,
      task: {
        areaId: filters.areaId || undefined,
        routine: filters.routine === undefined ? undefined : filters.routine === "true",
        activity: {
          processId: filters.processId || undefined,
          process: filters.companyId ? { companyId: filters.companyId } : undefined,
        },
      },
    },
    include: {
      classification: true,
      existingControls: true,
      riskAssessment: true,
      controlCriteria: true,
      interventionMeasure: true,
      task: {
        include: {
          activity: { include: { process: true } },
          area: true,
        },
      },
    },
  });

  const totalHazards = hazards.length;

  const tasksSeen = new Map<string, boolean>();
  for (const hazard of hazards) tasksSeen.set(hazard.taskId, hazard.task.routine);
  const totalTasks = tasksSeen.size;
  const routineTasks = [...tasksSeen.values()].filter(Boolean).length;
  const nonRoutineTasks = totalTasks - routineTasks;

  const totalProcesses = new Set(hazards.map((h) => h.task.activity.process.id)).size;
  const totalAreas = new Set(hazards.map((h) => h.task.area.id)).size;

  const riskCounts: Record<string, number> = { Crítica: 0, Alta: 0, Media: 0, Baja: 0 };
  for (const hazard of hazards) {
    if (hazard.riskAssessment) {
      riskCounts[hazard.riskAssessment.priority] = (riskCounts[hazard.riskAssessment.priority] ?? 0) + 1;
    }
  }

  const withControls = hazards.filter((h) => hasAnyControl(h.existingControls)).length;
  const withMeasures = hazards.filter((h) => hasAnyMeasure(h.interventionMeasure)).length;
  const pendingMeasures = hazards.filter((h) => h.riskAssessment && !hasAnyMeasure(h.interventionMeasure)).length;
  const totalExposedWorkers = hazards.reduce((sum, h) => sum + (h.controlCriteria?.exposedWorkers ?? 0), 0);
  const legalRequirementsCount = hazards.filter((h) => h.controlCriteria?.hasLegalRequirement).length;

  return {
    kpis: {
      totalHazards,
      totalTasks,
      totalProcesses,
      totalAreas,
      criticalRisks: riskCounts["Crítica"] ?? 0,
      highRisks: riskCounts["Alta"] ?? 0,
      mediumRisks: riskCounts["Media"] ?? 0,
      lowRisks: riskCounts["Baja"] ?? 0,
      pctWithControls: totalHazards ? Math.round((withControls / totalHazards) * 100) : 0,
      pctWithMeasures: totalHazards ? Math.round((withMeasures / totalHazards) * 100) : 0,
      pendingMeasures,
      routineTasks,
      nonRoutineTasks,
      totalExposedWorkers,
      legalRequirementsCount,
    },
    charts: {
      hazardsByClassification: groupCount(hazards, (h) => h.classification.name),
      hazardsByProcess: groupCount(hazards, (h) => h.task.activity.process.name),
      hazardsByArea: groupCount(hazards, (h) => h.task.area.name),
      risksByLevel: (["Crítica", "Alta", "Media", "Baja"] as const).map((level) => ({
        name: level,
        count: riskCounts[level] ?? 0,
      })),
      controlsDistribution: [
        { name: "Fuente", count: hazards.filter((h) => h.existingControls?.source).length },
        { name: "Medio", count: hazards.filter((h) => h.existingControls?.medium).length },
        { name: "Individuo", count: hazards.filter((h) => h.existingControls?.individual).length },
      ],
      measuresStatus: [
        { name: "Eliminación", count: hazards.filter((h) => h.interventionMeasure?.elimination).length },
        { name: "Sustitución", count: hazards.filter((h) => h.interventionMeasure?.substitution).length },
        { name: "Ingeniería", count: hazards.filter((h) => h.interventionMeasure?.engineering).length },
        { name: "Administrativo", count: hazards.filter((h) => h.interventionMeasure?.administrative).length },
        { name: "EPP", count: hazards.filter((h) => h.interventionMeasure?.ppe).length },
      ],
    },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
