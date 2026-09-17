"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/session";
import { companySchema } from "@/lib/validations/company";
import { logAudit } from "@/lib/audit/log";

export async function listCompanies() {
  await requireUser();
  return prisma.company.findMany({ orderBy: { name: "asc" } });
}

export async function createCompany(input: unknown) {
  const user = await requireUser();
  const data = companySchema.parse(input);

  const company = await prisma.company.create({
    data: {
      name: data.name,
      nit: data.nit || null,
      sector: data.sector || null,
    },
  });

  await logAudit({ entityType: "Company", entityId: company.id, action: "CREATE", userId: user.id, diff: data });
  revalidatePath("/empresas");
  return company;
}

export async function updateCompany(id: string, input: unknown) {
  const user = await requireUser();
  const data = companySchema.parse(input);

  const company = await prisma.company.update({
    where: { id },
    data: {
      name: data.name,
      nit: data.nit || null,
      sector: data.sector || null,
    },
  });

  await logAudit({ entityType: "Company", entityId: company.id, action: "UPDATE", userId: user.id, diff: data });
  revalidatePath("/empresas");
  return company;
}
