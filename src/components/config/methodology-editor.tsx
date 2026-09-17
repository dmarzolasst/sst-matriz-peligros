"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SavedIndicator } from "@/components/wizard/saved-indicator";
import { useAutosaveStatus } from "@/components/wizard/use-autosave-status";
import { updateNcLevels, updateNdLevels, updateNeLevels, updateNpRanges, updateNrRanges } from "@/server/actions/methodology";
import type { LevelOption, NpRangeOption, NrRangeOption } from "@/lib/risk-engine/types";

function LevelsEditor({
  title,
  methodologyId,
  initial,
  onSave,
}: {
  title: string;
  methodologyId: string;
  initial: LevelOption[];
  onSave: (id: string, levels: LevelOption[]) => Promise<void>;
}) {
  const [levels, setLevels] = useState(initial);
  const { status, run } = useAutosaveStatus();

  function update(index: number, patch: Partial<LevelOption>) {
    setLevels((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <SavedIndicator status={status} />
      </div>
      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-[90px_160px_1fr] gap-2 text-xs font-medium text-slate-400">
          <span>Valor</span>
          <span>Nivel</span>
          <span>Interpretación</span>
        </div>
        {levels.map((level, index) => (
          <div key={index} className="grid grid-cols-[90px_160px_1fr] gap-2">
            <Input type="number" value={level.value} onChange={(e) => update(index, { value: Number(e.target.value) })} />
            <Input value={level.label} onChange={(e) => update(index, { label: e.target.value })} />
            <Input value={level.description} onChange={(e) => update(index, { description: e.target.value })} />
          </div>
        ))}
      </div>
      <Button type="button" className="mt-3" onClick={() => run(() => onSave(methodologyId, levels))}>
        Guardar cambios
      </Button>
    </Card>
  );
}

function NpRangesEditor({ methodologyId, initial }: { methodologyId: string; initial: NpRangeOption[] }) {
  const [ranges, setRanges] = useState(initial);
  const { status, run } = useAutosaveStatus();

  function update(index: number, patch: Partial<NpRangeOption>) {
    setRanges((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Rangos de NP (Nivel de Probabilidad)</h3>
        <SavedIndicator status={status} />
      </div>
      <div className="mt-3 space-y-2">
        <div className="grid grid-cols-[80px_80px_140px_1fr] gap-2 text-xs font-medium text-slate-400">
          <span>Mín.</span>
          <span>Máx.</span>
          <span>Nivel</span>
          <span>Interpretación</span>
        </div>
        {ranges.map((range, index) => (
          <div key={index} className="grid grid-cols-[80px_80px_140px_1fr] gap-2">
            <Input type="number" value={range.min} onChange={(e) => update(index, { min: Number(e.target.value) })} />
            <Input type="number" value={range.max} onChange={(e) => update(index, { max: Number(e.target.value) })} />
            <Input value={range.label} onChange={(e) => update(index, { label: e.target.value })} />
            <Input value={range.description} onChange={(e) => update(index, { description: e.target.value })} />
          </div>
        ))}
      </div>
      <Button type="button" className="mt-3" onClick={() => run(() => updateNpRanges(methodologyId, ranges))}>
        Guardar cambios
      </Button>
    </Card>
  );
}

function NrRangesEditor({ methodologyId, initial }: { methodologyId: string; initial: NrRangeOption[] }) {
  const [ranges, setRanges] = useState(initial);
  const { status, run } = useAutosaveStatus();

  function update(index: number, patch: Partial<NrRangeOption>) {
    setRanges((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Rangos de NR (Nivel de Riesgo)</h3>
        <SavedIndicator status={status} />
      </div>
      <div className="mt-3 space-y-3">
        {ranges.map((range, index) => (
          <div key={index} className="rounded-lg border border-slate-100 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <Label className="text-[11px]">Mín.</Label>
                <Input type="number" value={range.min} onChange={(e) => update(index, { min: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[11px]">Máx.</Label>
                <Input type="number" value={range.max} onChange={(e) => update(index, { max: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-[11px]">Prioridad</Label>
                <Input value={range.priority} onChange={(e) => update(index, { priority: e.target.value })} />
              </div>
              <div>
                <Label className="text-[11px]">Aceptabilidad</Label>
                <Input value={range.acceptability} onChange={(e) => update(index, { acceptability: e.target.value })} />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <Label className="text-[11px]">Nivel</Label>
                <Input value={range.label} onChange={(e) => update(index, { label: e.target.value })} />
              </div>
              <div className="col-span-2 sm:col-span-4">
                <Label className="text-[11px]">Significado</Label>
                <Input value={range.description} onChange={(e) => update(index, { description: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" className="mt-3" onClick={() => run(() => updateNrRanges(methodologyId, ranges))}>
        Guardar cambios
      </Button>
    </Card>
  );
}

export function MethodologyEditor({
  methodologyId,
  methodologyName,
  ndLevels,
  neLevels,
  ncLevels,
  npRanges,
  nrRanges,
}: {
  methodologyId: string;
  methodologyName: string;
  ndLevels: LevelOption[];
  neLevels: LevelOption[];
  ncLevels: LevelOption[];
  npRanges: NpRangeOption[];
  nrRanges: NrRangeOption[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>{methodologyName}.</strong> Verifica estos valores contra tu copia oficial de la GTC 45 antes de
        usarlos en producción. Los cambios afectan a toda matriz que use esta metodología.
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <LevelsEditor title="ND — Nivel de Deficiencia" methodologyId={methodologyId} initial={ndLevels} onSave={updateNdLevels} />
        <LevelsEditor title="NE — Nivel de Exposición" methodologyId={methodologyId} initial={neLevels} onSave={updateNeLevels} />
        <LevelsEditor title="NC — Nivel de Consecuencia" methodologyId={methodologyId} initial={ncLevels} onSave={updateNcLevels} />
      </div>

      <NpRangesEditor methodologyId={methodologyId} initial={npRanges} />
      <NrRangesEditor methodologyId={methodologyId} initial={nrRanges} />
    </div>
  );
}
