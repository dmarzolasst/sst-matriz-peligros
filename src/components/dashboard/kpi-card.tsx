import type { LucideIcon } from "lucide-react";
import { clsx } from "clsx";
import { Card } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "slate" | "blue" | "red" | "amber" | "green";
}) {
  const toneClasses: Record<string, string> = {
    slate: "bg-slate-50 text-slate-600",
    blue: "bg-blue-50 text-blue-600",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}
