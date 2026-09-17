import type { MatrixStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<MatrixStatus, string> = {
  DRAFT: "Borrador",
  ACTIVE: "Vigente",
  ARCHIVED: "Archivada",
};

const STATUS_TONE: Record<MatrixStatus, "slate" | "green" | "amber"> = {
  DRAFT: "amber",
  ACTIVE: "green",
  ARCHIVED: "slate",
};

export function MatrixStatusBadge({ status }: { status: MatrixStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
