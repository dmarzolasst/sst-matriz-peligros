"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit/log";
import { levelsArraySchema, npRangesArraySchema, nrRangesArraySchema } from "@/lib/validations/methodology";

export async function getActiveMethodologyRecord() {
  await requireUser();
  return prisma.riskMethodologyVersion.findFirstOrThrow({ where: { isActive: true } });
}

export async function updateNdLevels(id: string, levels: unknown) {
  const user = await requireUser();
  const data = levelsArraySchema.parse(levels);
  await prisma.riskMethodologyVersion.update({ where: { id }, data: { ndLevels: data } });
  await logAudit({ entityType: "RiskMethodologyVersion", entityId: id, action: "UPDATE", userId: user.id, diff: { ndLevels: data } });
  revalidatePath("/configuracion");
}

export async function updateNeLevels(id: string, levels: unknown) {
  const user = await requireUser();
  const data = levelsArraySchema.parse(levels);
  await prisma.riskMethodologyVersion.update({ where: { id }, data: { neLevels: data } });
  await logAudit({ entityType: "RiskMethodologyVersion", entityId: id, action: "UPDATE", userId: user.id, diff: { neLevels: data } });
  revalidatePath("/configuracion");
}

export async function updateNcLevels(id: string, levels: unknown) {
  const user = await requireUser();
  const data = levelsArraySchema.parse(levels);
  await prisma.riskMethodologyVersion.update({ where: { id }, data: { ncLevels: data } });
  await logAudit({ entityType: "RiskMethodologyVersion", entityId: id, action: "UPDATE", userId: user.id, diff: { ncLevels: data } });
  revalidatePath("/configuracion");
}

export async function updateNpRanges(id: string, ranges: unknown) {
  const user = await requireUser();
  const data = npRangesArraySchema.parse(ranges);
  await prisma.riskMethodologyVersion.update({ where: { id }, data: { npRanges: data } });
  await logAudit({ entityType: "RiskMethodologyVersion", entityId: id, action: "UPDATE", userId: user.id, diff: { npRanges: data } });
  revalidatePath("/configuracion");
}

export async function updateNrRanges(id: string, ranges: unknown) {
  const user = await requireUser();
  const data = nrRangesArraySchema.parse(ranges);
  await prisma.riskMethodologyVersion.update({ where: { id }, data: { nrRanges: data } });
  await logAudit({ entityType: "RiskMethodologyVersion", entityId: id, action: "UPDATE", userId: user.id, diff: { nrRanges: data } });
  revalidatePath("/configuracion");
}
