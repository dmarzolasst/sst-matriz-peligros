"use server";

import { CatalogCategory } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/session";
import { logAudit } from "@/lib/audit/log";

export async function listCatalog(category: CatalogCategory) {
  await requireUser();
  return prisma.catalogItem.findMany({
    where: { category, active: true },
    orderBy: { name: "asc" },
  });
}

export async function listCatalogByParent(category: CatalogCategory, parentId: string) {
  await requireUser();
  return prisma.catalogItem.findMany({
    where: { category, active: true, parentId },
    orderBy: { name: "asc" },
  });
}

export async function createCatalogItem(input: { category: CatalogCategory; name: string; parentId?: string }) {
  const user = await requireUser();
  const item = await prisma.catalogItem.create({
    data: { category: input.category, name: input.name, parentId: input.parentId ?? null },
  });
  await logAudit({ entityType: "CatalogItem", entityId: item.id, action: "CREATE", userId: user.id, diff: input });
  return item;
}

// A diferencia de listCatalog/listCatalogByParent (que solo listan activos, para los
// selectores del wizard), esta lista todo para que el administrador pueda reactivar
// elementos desde Configuración.
export async function listCatalogForAdmin(category: CatalogCategory) {
  await requireUser();
  return prisma.catalogItem.findMany({
    where: { category },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });
}

export async function updateCatalogItem(id: string, input: { name?: string; description?: string; active?: boolean }) {
  const user = await requireUser();
  const item = await prisma.catalogItem.update({ where: { id }, data: input });
  await logAudit({ entityType: "CatalogItem", entityId: item.id, action: "UPDATE", userId: user.id, diff: input });
  return item;
}

export async function listProcesses(companyId: string) {
  await requireUser();
  return prisma.process.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export async function createProcess(companyId: string, name: string) {
  const user = await requireUser();
  const process = await prisma.process.upsert({
    where: { companyId_name: { companyId, name } },
    update: {},
    create: { companyId, name },
  });
  await logAudit({ entityType: "Process", entityId: process.id, action: "CREATE", userId: user.id, diff: { name } });
  return process;
}

export async function updateProcess(id: string, name: string) {
  const user = await requireUser();
  const process = await prisma.process.update({ where: { id }, data: { name } });
  await logAudit({ entityType: "Process", entityId: process.id, action: "UPDATE", userId: user.id, diff: { name } });
  return process;
}

export async function listAreas(companyId: string) {
  await requireUser();
  return prisma.area.findMany({ where: { companyId }, orderBy: { name: "asc" } });
}

export async function createArea(companyId: string, name: string) {
  const user = await requireUser();
  const area = await prisma.area.upsert({
    where: { companyId_name: { companyId, name } },
    update: {},
    create: { companyId, name },
  });
  await logAudit({ entityType: "Area", entityId: area.id, action: "CREATE", userId: user.id, diff: { name } });
  return area;
}

export async function updateArea(id: string, name: string) {
  const user = await requireUser();
  const area = await prisma.area.update({ where: { id }, data: { name } });
  await logAudit({ entityType: "Area", entityId: area.id, action: "UPDATE", userId: user.id, diff: { name } });
  return area;
}

export async function listActivities(processId: string) {
  await requireUser();
  return prisma.activity.findMany({ where: { processId }, orderBy: { name: "asc" } });
}

export async function createActivity(processId: string, name: string) {
  const user = await requireUser();
  const activity = await prisma.activity.create({ data: { processId, name } });
  await logAudit({ entityType: "Activity", entityId: activity.id, action: "CREATE", userId: user.id, diff: { name } });
  return activity;
}
