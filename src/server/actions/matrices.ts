"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/session";
import { matrixSchema } from "@/lib/validations/matrix";
import { logAudit } from "@/lib/audit/log";

export async function listMatrices() {
  await requireUser();
  return prisma.riskMatrix.findMany({
    where: { isTemplate: false },
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMatrixById(id: string) {
  await requireUser();
  const matrix = await prisma.riskMatrix.findUnique({
    where: { id },
    include: { company: true, createdBy: true, methodologyVersion: true },
  });
  if (!matrix) notFound();
  return matrix;
}

export async function createMatrix(input: unknown) {
  const user = await requireUser();
  const data = matrixSchema.parse(input);

  const methodology = await prisma.riskMethodologyVersion.findFirst({ where: { isActive: true } });
  if (!methodology) {
    throw new Error("No hay una metodología GTC 45 activa configurada. Revisa Configuración > Metodología.");
  }

  const matrix = await prisma.riskMatrix.create({
    data: {
      companyId: data.companyId,
      name: data.name,
      methodologyVersionId: methodology.id,
      createdById: user.id,
    },
  });

  await logAudit({ entityType: "RiskMatrix", entityId: matrix.id, action: "CREATE", userId: user.id, diff: data });
  revalidatePath("/matrices");
  return matrix;
}
