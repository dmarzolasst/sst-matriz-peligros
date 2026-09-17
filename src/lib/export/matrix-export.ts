import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/session";

export async function getMatrixExportData(matrixId: string) {
  await requireUser();

  const matrix = await prisma.riskMatrix.findUniqueOrThrow({
    where: { id: matrixId },
    include: { company: true, createdBy: true, methodologyVersion: true },
  });

  const tasks = await prisma.task.findMany({
    where: { riskMatrixId: matrixId },
    include: {
      activity: { include: { process: true } },
      area: true,
      hazards: {
        orderBy: { order: "asc" },
        include: {
          classification: true,
          description: true,
          existingControls: true,
          riskAssessment: true,
          controlCriteria: { include: { legalRequirement: true } },
          interventionMeasure: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return { matrix, tasks };
}

export type MatrixExportTasks = Awaited<ReturnType<typeof getMatrixExportData>>["tasks"];

export type MatrixExportRow = {
  proceso: string;
  zona: string;
  actividad: string;
  tarea: string;
  rutinaria: string;
  peligro: string;
  clasificacion: string;
  fuente: string;
  medio: string;
  individuo: string;
  nd: number | null;
  ne: number | null;
  np: number | null;
  interpretacionNP: string;
  nc: number | null;
  nr: number | null;
  interpretacionNR: string;
  priority: string | null;
  expuestos: number | null;
  peorConsecuencia: string;
  requisitoLegal: string;
  eliminacion: string;
  sustitucion: string;
  ingenieria: string;
  administrativo: string;
  epp: string;
};

export function flattenMatrixRows(tasks: MatrixExportTasks): MatrixExportRow[] {
  const rows: MatrixExportRow[] = [];

  for (const task of tasks) {
    for (const hazard of task.hazards) {
      const legal = hazard.controlCriteria?.hasLegalRequirement
        ? [hazard.controlCriteria.legalRequirement?.standard, hazard.controlCriteria.legalRequirement?.article]
            .filter(Boolean)
            .join(" - ") || "Sí"
        : "No aplica";

      rows.push({
        proceso: task.activity.process.name,
        zona: task.area.name,
        actividad: task.activity.name,
        tarea: task.name,
        rutinaria: task.routine ? "Sí" : "No",
        peligro: hazard.description.name,
        clasificacion: hazard.classification.name,
        fuente: hazard.existingControls?.source ?? "",
        medio: hazard.existingControls?.medium ?? "",
        individuo: hazard.existingControls?.individual ?? "",
        nd: hazard.riskAssessment?.nd ?? null,
        ne: hazard.riskAssessment?.ne ?? null,
        np: hazard.riskAssessment?.np ?? null,
        interpretacionNP: hazard.riskAssessment?.npInterpretation ?? "",
        nc: hazard.riskAssessment?.nc ?? null,
        nr: hazard.riskAssessment?.nr ?? null,
        interpretacionNR: hazard.riskAssessment?.nrInterpretation ?? "",
        priority: hazard.riskAssessment?.priority ?? null,
        expuestos: hazard.controlCriteria?.exposedWorkers ?? null,
        peorConsecuencia: hazard.controlCriteria?.worstConsequence ?? "",
        requisitoLegal: legal,
        eliminacion: hazard.interventionMeasure?.elimination ?? "",
        sustitucion: hazard.interventionMeasure?.substitution ?? "",
        ingenieria: hazard.interventionMeasure?.engineering ?? "",
        administrativo: hazard.interventionMeasure?.administrative ?? "",
        epp: hazard.interventionMeasure?.ppe ?? "",
      });
    }
  }

  return rows;
}

export type MatrixReportSummary = {
  totalHazards: number;
  totalTasks: number;
  riskCounts: { Crítica: number; Alta: number; Media: number; Baja: number };
  pctWithControls: number;
  pctWithMeasures: number;
  pendingMeasures: number;
  totalExposedWorkers: number;
};

export function summarizeMatrixRows(tasks: MatrixExportTasks, rows: MatrixExportRow[]): MatrixReportSummary {
  const riskCounts = { Crítica: 0, Alta: 0, Media: 0, Baja: 0 };
  for (const row of rows) {
    if (row.priority && row.priority in riskCounts) {
      riskCounts[row.priority as keyof typeof riskCounts] += 1;
    }
  }

  const withControls = rows.filter((r) => r.fuente || r.medio || r.individuo).length;
  const withMeasures = rows.filter((r) => r.eliminacion || r.sustitucion || r.ingenieria || r.administrativo || r.epp).length;
  const pendingMeasures = rows.filter(
    (r) => r.nr !== null && !(r.eliminacion || r.sustitucion || r.ingenieria || r.administrativo || r.epp),
  ).length;
  const totalExposedWorkers = rows.reduce((sum, r) => sum + (r.expuestos ?? 0), 0);

  return {
    totalHazards: rows.length,
    totalTasks: tasks.length,
    riskCounts,
    pctWithControls: rows.length ? Math.round((withControls / rows.length) * 100) : 0,
    pctWithMeasures: rows.length ? Math.round((withMeasures / rows.length) * 100) : 0,
    pendingMeasures,
    totalExposedWorkers,
  };
}
