import { prisma } from "@/lib/db/prisma";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "DUPLICATE";

export async function logAudit(params: {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId: string;
  diff?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      userId: params.userId,
      diff: params.diff === undefined ? undefined : (params.diff as object),
    },
  });
}
