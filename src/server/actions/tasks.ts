"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit/log";
import { taskContextSchema } from "@/lib/validations/task";

export async function listTasksForMatrix(matrixId: string) {
  await requireUser();
  return prisma.task.findMany({
    where: { riskMatrixId: matrixId },
    include: { activity: { include: { process: true } }, area: true, hazards: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTaskDetail(taskId: string) {
  await requireUser();
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      activity: { include: { process: true } },
      area: true,
      riskMatrix: { include: { company: true, methodologyVersion: true } },
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
  });
  if (!task) notFound();
  return task;
}

export async function createTask(matrixId: string, input: unknown) {
  const user = await requireUser();
  const data = taskContextSchema.parse(input);

  const task = await prisma.task.create({
    data: {
      riskMatrixId: matrixId,
      activityId: data.activityId,
      areaId: data.areaId,
      name: data.name,
      routine: data.routine,
      wizardStep: 1,
    },
  });

  await logAudit({ entityType: "Task", entityId: task.id, action: "CREATE", userId: user.id, diff: data });
  revalidatePath(`/matrices/${matrixId}`);
  return task;
}

export async function updateTaskContext(taskId: string, input: unknown) {
  const user = await requireUser();
  const data = taskContextSchema.parse(input);

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      activityId: data.activityId,
      areaId: data.areaId,
      name: data.name,
      routine: data.routine,
    },
  });

  await logAudit({ entityType: "Task", entityId: task.id, action: "UPDATE", userId: user.id, diff: data });
  revalidatePath(`/matrices/${task.riskMatrixId}`);
  return task;
}

export async function advanceWizardStep(taskId: string, step: number) {
  await requireUser();
  const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
  if (step > task.wizardStep) {
    await prisma.task.update({ where: { id: taskId }, data: { wizardStep: step } });
  }
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const task = await prisma.task.delete({ where: { id: taskId } });
  await logAudit({ entityType: "Task", entityId: task.id, action: "DELETE", userId: user.id });
  revalidatePath(`/matrices/${task.riskMatrixId}`);
}

export async function duplicateTask(taskId: string) {
  const user = await requireUser();

  const original = await prisma.task.findUniqueOrThrow({
    where: { id: taskId },
    include: {
      hazards: {
        orderBy: { order: "asc" },
        include: {
          existingControls: true,
          riskAssessment: true,
          controlCriteria: { include: { legalRequirement: true } },
          interventionMeasure: true,
        },
      },
    },
  });

  const duplicated = await prisma.$transaction(async (tx) => {
    const newTask = await tx.task.create({
      data: {
        riskMatrixId: original.riskMatrixId,
        activityId: original.activityId,
        areaId: original.areaId,
        name: `${original.name} (copia)`,
        routine: original.routine,
        wizardStep: original.wizardStep,
      },
    });

    for (const hazard of original.hazards) {
      const newHazard = await tx.hazard.create({
        data: {
          taskId: newTask.id,
          classificationId: hazard.classificationId,
          descriptionId: hazard.descriptionId,
          order: hazard.order,
        },
      });

      if (hazard.existingControls) {
        await tx.existingControl.create({
          data: {
            hazardId: newHazard.id,
            source: hazard.existingControls.source,
            medium: hazard.existingControls.medium,
            individual: hazard.existingControls.individual,
          },
        });
      }

      if (hazard.riskAssessment) {
        await tx.riskAssessment.create({
          data: {
            hazardId: newHazard.id,
            nd: hazard.riskAssessment.nd,
            ne: hazard.riskAssessment.ne,
            nc: hazard.riskAssessment.nc,
            np: hazard.riskAssessment.np,
            npInterpretation: hazard.riskAssessment.npInterpretation,
            nr: hazard.riskAssessment.nr,
            nrInterpretation: hazard.riskAssessment.nrInterpretation,
            priority: hazard.riskAssessment.priority,
          },
        });
      }

      if (hazard.controlCriteria) {
        const newCriteria = await tx.controlCriteria.create({
          data: {
            hazardId: newHazard.id,
            exposedWorkers: hazard.controlCriteria.exposedWorkers,
            worstConsequence: hazard.controlCriteria.worstConsequence,
            hasLegalRequirement: hazard.controlCriteria.hasLegalRequirement,
          },
        });

        if (hazard.controlCriteria.legalRequirement) {
          await tx.legalRequirement.create({
            data: {
              controlCriteriaId: newCriteria.id,
              standard: hazard.controlCriteria.legalRequirement.standard,
              article: hazard.controlCriteria.legalRequirement.article,
              description: hazard.controlCriteria.legalRequirement.description,
              referenceUrl: hazard.controlCriteria.legalRequirement.referenceUrl,
            },
          });
        }
      }

      if (hazard.interventionMeasure) {
        await tx.interventionMeasure.create({
          data: {
            hazardId: newHazard.id,
            elimination: hazard.interventionMeasure.elimination,
            substitution: hazard.interventionMeasure.substitution,
            engineering: hazard.interventionMeasure.engineering,
            administrative: hazard.interventionMeasure.administrative,
            ppe: hazard.interventionMeasure.ppe,
          },
        });
      }
    }

    return newTask;
  });

  await logAudit({
    entityType: "Task",
    entityId: duplicated.id,
    action: "DUPLICATE",
    userId: user.id,
    diff: { sourceTaskId: taskId },
  });
  revalidatePath(`/matrices/${original.riskMatrixId}`);
  return duplicated;
}
