import { Badge } from "@/components/ui/badge";
import type { HazardWithRelations } from "@/types/wizard";

export function HazardHeader({ hazard, index }: { hazard: HazardWithRelations; index: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
        {index + 1}
      </span>
      <Badge tone="blue">{hazard.classification.name}</Badge>
      <span className="text-sm font-medium text-slate-900">{hazard.description.name}</span>
    </div>
  );
}
