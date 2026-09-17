"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { HazardHeader } from "@/components/wizard/hazard-header";
import { SavedIndicator } from "@/components/wizard/saved-indicator";
import { useAutosaveStatus } from "@/components/wizard/use-autosave-status";
import { upsertRiskAssessment } from "@/server/actions/hazards";
import type { HazardWithRelations } from "@/types/wizard";
import type { LevelOption } from "@/lib/risk-engine/types";

type Result = {
  np: number;
  npInterpretation: string;
  nr: number;
  nrInterpretation: string;
  priority: string;
};

function levelDescription(levels: LevelOption[], value: number | null) {
  return levels.find((l) => l.value === value)?.description ?? null;
}

function HazardEvaluationCard({
  hazard,
  index,
  ndLevels,
  neLevels,
  ncLevels,
}: {
  hazard: HazardWithRelations;
  index: number;
  ndLevels: LevelOption[];
  neLevels: LevelOption[];
  ncLevels: LevelOption[];
}) {
  const [nd, setNd] = useState<number | null>(hazard.riskAssessment?.nd ?? null);
  const [ne, setNe] = useState<number | null>(hazard.riskAssessment?.ne ?? null);
  const [nc, setNc] = useState<number | null>(hazard.riskAssessment?.nc ?? null);
  const [result, setResult] = useState<Result | null>(
    hazard.riskAssessment
      ? {
          np: hazard.riskAssessment.np,
          npInterpretation: hazard.riskAssessment.npInterpretation,
          nr: hazard.riskAssessment.nr,
          nrInterpretation: hazard.riskAssessment.nrInterpretation,
          priority: hazard.riskAssessment.priority,
        }
      : null,
  );
  const { status, run } = useAutosaveStatus();

  async function evaluate(next: { nd: number | null; ne: number | null; nc: number | null }) {
    if (next.nd === null || next.ne === null || next.nc === null) return;
    await run(async () => {
      const saved = await upsertRiskAssessment(hazard.id, { nd: next.nd, ne: next.ne, nc: next.nc });
      setResult({
        np: saved.np,
        npInterpretation: saved.npInterpretation,
        nr: saved.nr,
        nrInterpretation: saved.nrInterpretation,
        priority: saved.priority,
      });
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HazardHeader hazard={hazard} index={index} />
        <SavedIndicator status={status} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Nivel de Deficiencia (ND)</Label>
          <Select
            value={nd ?? ""}
            onChange={(e) => {
              const value = Number(e.target.value);
              setNd(value);
              evaluate({ nd: value, ne, nc });
            }}
          >
            <option value="" disabled>
              Selecciona ND
            </option>
            {ndLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label} ({level.value})
              </option>
            ))}
          </Select>
          {nd !== null && <p className="mt-1 text-xs text-slate-500">{levelDescription(ndLevels, nd)}</p>}
        </div>

        <div>
          <Label>Nivel de Exposición (NE)</Label>
          <Select
            value={ne ?? ""}
            onChange={(e) => {
              const value = Number(e.target.value);
              setNe(value);
              evaluate({ nd, ne: value, nc });
            }}
          >
            <option value="" disabled>
              Selecciona NE
            </option>
            {neLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label} ({level.value})
              </option>
            ))}
          </Select>
          {ne !== null && <p className="mt-1 text-xs text-slate-500">{levelDescription(neLevels, ne)}</p>}
        </div>

        <div>
          <Label>Nivel de Consecuencia (NC)</Label>
          <Select
            value={nc ?? ""}
            onChange={(e) => {
              const value = Number(e.target.value);
              setNc(value);
              evaluate({ nd, ne, nc: value });
            }}
          >
            <option value="" disabled>
              Selecciona NC
            </option>
            {ncLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label} ({level.value})
              </option>
            ))}
          </Select>
          {nc !== null && <p className="mt-1 text-xs text-slate-500">{levelDescription(ncLevels, nc)}</p>}
        </div>
      </div>

      {result ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              NP — Nivel de Probabilidad{" "}
              <span className="text-slate-300">(calculado, ND × NE)</span>
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{result.np}</p>
            <p className="text-sm font-medium text-blue-700">{result.npInterpretation}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              NR — Nivel de Riesgo <span className="text-slate-300">(calculado, NP × NC)</span>
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{result.nr}</p>
            <p className="text-sm font-medium text-blue-700">{result.nrInterpretation}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-400">Selecciona ND, NE y NC para calcular NP y NR automáticamente.</p>
      )}
    </Card>
  );
}

export function EvaluationStep({
  hazards,
  ndLevels,
  neLevels,
  ncLevels,
}: {
  hazards: HazardWithRelations[];
  ndLevels: LevelOption[];
  neLevels: LevelOption[];
  ncLevels: LevelOption[];
}) {
  if (hazards.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-500">
        Agrega al menos un peligro para poder evaluar el riesgo.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hazards.map((hazard, index) => (
        <HazardEvaluationCard
          key={hazard.id}
          hazard={hazard}
          index={index}
          ndLevels={ndLevels}
          neLevels={neLevels}
          ncLevels={ncLevels}
        />
      ))}
    </div>
  );
}
