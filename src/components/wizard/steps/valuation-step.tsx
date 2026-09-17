import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HazardHeader } from "@/components/wizard/hazard-header";
import type { HazardWithRelations } from "@/types/wizard";

const PRIORITY_TONE: Record<string, "red" | "amber" | "blue" | "green" | "slate"> = {
  Crítica: "red",
  Alta: "amber",
  Media: "blue",
  Baja: "green",
};

export function ValuationStep({ hazards }: { hazards: HazardWithRelations[] }) {
  if (hazards.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-500">
        Aún no hay peligros evaluados en esta tarea.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hazards.map((hazard, index) => {
        const assessment = hazard.riskAssessment;
        return (
          <Card key={hazard.id} className="p-5">
            <HazardHeader hazard={hazard} index={index} />

            {assessment ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Nivel de Riesgo (NR)</p>
                  <p className="mt-1 text-4xl font-extrabold text-slate-900">{assessment.nr}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{assessment.nrInterpretation}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prioridad</p>
                  <Badge tone={PRIORITY_TONE[assessment.priority] ?? "slate"} className="mt-2 text-sm">
                    {assessment.priority}
                  </Badge>
                </div>
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">NP calculado</p>
                  <p className="mt-1 text-xl font-bold text-slate-900">{assessment.np}</p>
                  <p className="text-xs text-slate-500">{assessment.npInterpretation}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-amber-600">
                Este peligro aún no tiene una evaluación (ND/NE/NC) completa en la etapa anterior.
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
