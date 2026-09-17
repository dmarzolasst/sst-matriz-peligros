"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit/log";
import { getMethodologyById } from "@/lib/risk-engine/methodology";
import { evaluateRisk } from "@/lib/risk-engine/riskCalculationService";
import {
  hazardSchema,
  existingControlSchema,
  riskAssessmentSchema,
  controlCriteriaSchema,
  interventionMeasureSchema,
} from "@/lib/validations/hazard";

async function revalidateTaskPaths(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { riskMatrixId: true } });
  if (task) {
    revalidatePath(`/matrices/${task.riskMatrixId}/tasks/${taskId}`, "layout");
  }
}

export async function createHazard(taskId: string, input: unknown) {
  const user = await requireUser();
  const data = hazardSchema.parse(input);

  const count = await prisma.hazard.count({ where: { taskId } });
  const hazard = await prisma.hazard.create({
    data: {
      taskId,
      classificationId: data.classificationId,
      descriptionId: data.descriptionId,
      order: count,
    },
  });

  await logAudit({ entityType: "Hazard", entityId: hazard.id, action: "CREATE", userId: user.id, diff: data });
  await revalidateTaskPaths(taskId);
  return hazard;
}

export async function updateHazard(hazardId: string, input: unknown) {
  const user = await requireUser();
  const data = hazardSchema.parse(input);

  const hazard = await prisma.hazard.update({
    where: { id: hazardId },
    data: { classificationId: data.classificationId, descriptionId: data.descriptionId },
  });

  await logAudit({ entityType: "Hazard", entityId: hazard.id, action: "UPDATE", userId: user.id, diff: data });
  await revalidateTaskPaths(hazard.taskId);
  return hazard;
}

export async function deleteHazard(hazardId: string) {
  const user = await requireUser();
  const hazard = await prisma.hazard.delete({ where: { id: hazardId } });
  await logAudit({ entityType: "Hazard", entityId: hazard.id, action: "DELETE", userId: user.id });
  await revalidateTaskPaths(hazard.taskId);
}

export async function duplicateHazard(hazardId: string) {
  const user = await requireUser();

  const original = await prisma.hazard.findUniqueOrThrow({
    where: { id: hazardId },
    include: {
      existingControls: true,
      riskAssessment: true,
      controlCriteria: { include: { legalRequirement: true } },
      interventionMeasure: true,
    },
  });

  const count = await prisma.hazard.count({ where: { taskId: original.taskId } });

  const duplicated = await prisma.$transaction(async (tx) => {
    const newHazard = await tx.hazard.create({
      data: {
        taskId: original.taskId,
        classificationId: original.classificationId,
        descriptionId: original.descriptionId,
        order: count,
      },
    });

    if (original.existingControls) {
      await tx.existingControl.create({
        data: {
          hazardId: newHazard.id,
          source: original.existingControls.source,
          medium: original.existingControls.medium,
          individual: original.existingControls.individual,
        },
      });
    }

    if (original.riskAssessment) {
      await tx.riskAssessment.create({
        data: {
          hazardId: newHazard.id,
          nd: original.riskAssessment.nd,
          ne: original.riskAssessment.ne,
          nc: original.riskAssessment.nc,
          np: original.riskAssessment.np,
          npInterpretation: original.riskAssessment.npInterpretation,
          nr: original.riskAssessment.nr,
          nrInterpretation: original.riskAssessment.nrInterpretation,
          priority: original.riskAssessment.priority,
        },
      });
    }

    if (original.controlCriteria) {
      const newCriteria = await tx.controlCriteria.create({
        data: {
          hazardId: newHazard.id,
          exposedWorkers: original.controlCriteria.exposedWorkers,
          worstConsequence: original.controlCriteria.worstConsequence,
          hasLegalRequirement: original.controlCriteria.hasLegalRequirement,
        },
      });

      if (original.controlCriteria.legalRequirement) {
        await tx.legalRequirement.create({
          data: {
            controlCriteriaId: newCriteria.id,
            standard: original.controlCriteria.legalRequirement.standard,
            article: original.controlCriteria.legalRequirement.article,
            description: original.controlCriteria.legalRequirement.description,
            referenceUrl: original.controlCriteria.legalRequirement.referenceUrl,
          },
        });
      }
    }

    if (original.interventionMeasure) {
      await tx.interventionMeasure.create({
        data: {
          hazardId: newHazard.id,
          elimination: original.interventionMeasure.elimination,
          substitution: original.interventionMeasure.substitution,
          engineering: original.interventionMeasure.engineering,
          administrative: original.interventionMeasure.administrative,
          ppe: original.interventionMeasure.ppe,
        },
      });
    }

    return newHazard;
  });

  await logAudit({
    entityType: "Hazard",
    entityId: duplicated.id,
    action: "DUPLICATE",
    userId: user.id,
    diff: { sourceHazardId: hazardId },
  });
  await revalidateTaskPaths(original.taskId);
  return duplicated;
}

// ---------------------------------------------------------------------------
// Etapa 3 — Controles existentes
// ---------------------------------------------------------------------------

export async function upsertExistingControl(hazardId: string, input: unknown) {
  const user = await requireUser();
  const data = existingControlSchema.parse(input);

  const control = await prisma.existingControl.upsert({
    where: { hazardId },
    update: { source: data.source || null, medium: data.medium || null, individual: data.individual || null },
    create: {
      hazardId,
      source: data.source || null,
      medium: data.medium || null,
      individual: data.individual || null,
    },
  });

  const hazard = await prisma.hazard.findUniqueOrThrow({ where: { id: hazardId } });
  await logAudit({ entityType: "ExistingControl", entityId: control.id, action: "UPDATE", userId: user.id, diff: data });
  await revalidateTaskPaths(hazard.taskId);
  return control;
}

export async function copyControlsFromHazard(sourceHazardId: string, targetHazardId: string) {
  const user = await requireUser();
  const source = await prisma.existingControl.findUnique({ where: { hazardId: sourceHazardId } });
  if (!source) return null;

  const control = await prisma.existingControl.upsert({
    where: { hazardId: targetHazardId },
    update: { source: source.source, medium: source.medium, individual: source.individual },
    create: {
      hazardId: targetHazardId,
      source: source.source,
      medium: source.medium,
      individual: source.individual,
    },
  });

  const hazard = await prisma.hazard.findUniqueOrThrow({ where: { id: targetHazardId } });
  await logAudit({
    entityType: "ExistingControl",
    entityId: control.id,
    action: "DUPLICATE",
    userId: user.id,
    diff: { sourceHazardId },
  });
  await revalidateTaskPaths(hazard.taskId);
  return control;
}

// ---------------------------------------------------------------------------
// Etapa 4 y 5 — Evaluación y valoración del riesgo
// ---------------------------------------------------------------------------

export async function upsertRiskAssessment(hazardId: string, input: unknown) {
  const user = await requireUser();
  const data = riskAssessmentSchema.parse(input);

  const hazard = await prisma.hazard.findUniqueOrThrow({
    where: { id: hazardId },
    include: { task: { include: { riskMatrix: true } } },
  });

  const methodology = await getMethodologyById(hazard.task.riskMatrix.methodologyVersionId);
  const result = evaluateRisk(methodology, data);

  const assessment = await prisma.riskAssessment.upsert({
    where: { hazardId },
    update: {
      nd: data.nd,
      ne: data.ne,
      nc: data.nc,
      np: result.np,
      npInterpretation: result.npInterpretation,
      nr: result.nr,
      nrInterpretation: result.nrInterpretation,
      priority: result.priority,
    },
    create: {
      hazardId,
      nd: data.nd,
      ne: data.ne,
      nc: data.nc,
      np: result.np,
      npInterpretation: result.npInterpretation,
      nr: result.nr,
      nrInterpretation: result.nrInterpretation,
      priority: result.priority,
    },
  });

  await logAudit({
    entityType: "RiskAssessment",
    entityId: assessment.id,
    action: "UPDATE",
    userId: user.id,
    diff: { ...data, ...result },
  });
  await revalidateTaskPaths(hazard.taskId);
  return { ...assessment, acceptability: result.acceptability };
}

// ---------------------------------------------------------------------------
// Etapa 6 — Criterios para establecer controles
// ---------------------------------------------------------------------------

export async function upsertControlCriteria(hazardId: string, input: unknown) {
  const user = await requireUser();
  const data = controlCriteriaSchema.parse(input);

  const criteria = await prisma.$transaction(async (tx) => {
    const record = await tx.controlCriteria.upsert({
      where: { hazardId },
      update: {
        exposedWorkers: data.exposedWorkers,
        worstConsequence: data.worstConsequence,
        hasLegalRequirement: data.hasLegalRequirement,
      },
      create: {
        hazardId,
        exposedWorkers: data.exposedWorkers,
        worstConsequence: data.worstConsequence,
        hasLegalRequirement: data.hasLegalRequirement,
      },
    });

    if (data.hasLegalRequirement && data.legalRequirement) {
      await tx.legalRequirement.upsert({
        where: { controlCriteriaId: record.id },
        update: {
          standard: data.legalRequirement.standard,
          article: data.legalRequirement.article || null,
          description: data.legalRequirement.description || null,
          referenceUrl: data.legalRequirement.referenceUrl || null,
        },
        create: {
          controlCriteriaId: record.id,
          standard: data.legalRequirement.standard,
          article: data.legalRequirement.article || null,
          description: data.legalRequirement.description || null,
          referenceUrl: data.legalRequirement.referenceUrl || null,
        },
      });
    } else if (!data.hasLegalRequirement) {
      await tx.legalRequirement.deleteMany({ where: { controlCriteriaId: record.id } });
    }

    return record;
  });

  const hazard = await prisma.hazard.findUniqueOrThrow({ where: { id: hazardId } });
  await logAudit({ entityType: "ControlCriteria", entityId: criteria.id, action: "UPDATE", userId: user.id, diff: data });
  await revalidateTaskPaths(hazard.taskId);
  return criteria;
}

// ---------------------------------------------------------------------------
// Etapa 7 — Medidas de intervención
// ---------------------------------------------------------------------------

export async function upsertInterventionMeasure(hazardId: string, input: unknown) {
  const user = await requireUser();
  const data = interventionMeasureSchema.parse(input);

  const measure = await prisma.interventionMeasure.upsert({
    where: { hazardId },
    update: {
      elimination: data.elimination || null,
      substitution: data.substitution || null,
      engineering: data.engineering || null,
      administrative: data.administrative || null,
      ppe: data.ppe || null,
    },
    create: {
      hazardId,
      elimination: data.elimination || null,
      substitution: data.substitution || null,
      engineering: data.engineering || null,
      administrative: data.administrative || null,
      ppe: data.ppe || null,
    },
  });

  const hazard = await prisma.hazard.findUniqueOrThrow({ where: { id: hazardId } });
  await logAudit({
    entityType: "InterventionMeasure",
    entityId: measure.id,
    action: "UPDATE",
    userId: user.id,
    diff: data,
  });
  await revalidateTaskPaths(hazard.taskId);
  return measure;
}
