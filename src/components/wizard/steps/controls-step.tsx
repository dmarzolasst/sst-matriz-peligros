"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HazardHeader } from "@/components/wizard/hazard-header";
import { SavedIndicator } from "@/components/wizard/saved-indicator";
import { useAutosaveStatus } from "@/components/wizard/use-autosave-status";
import { upsertExistingControl, copyControlsFromHazard } from "@/server/actions/hazards";
import type { HazardWithRelations } from "@/types/wizard";

type ControlValues = { source: string; medium: string; individual: string };

function HazardControlsCard({
  hazard,
  index,
  otherHazards,
  sourceSuggestions,
  mediumSuggestions,
  individualSuggestions,
  onCopy,
  copying,
}: {
  hazard: HazardWithRelations;
  index: number;
  otherHazards: HazardWithRelations[];
  sourceSuggestions: string[];
  mediumSuggestions: string[];
  individualSuggestions: string[];
  onCopy: (sourceHazardId: string) => void;
  copying: boolean;
}) {
  const [values, setValues] = useState<ControlValues>({
    source: hazard.existingControls?.source ?? "",
    medium: hazard.existingControls?.medium ?? "",
    individual: hazard.existingControls?.individual ?? "",
  });
  const { status, run } = useAutosaveStatus();

  function handleBlur() {
    run(() => upsertExistingControl(hazard.id, values));
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HazardHeader hazard={hazard} index={index} />
        <div className="flex flex-wrap items-center gap-3">
          <SavedIndicator status={status} />
          {otherHazards.length > 0 && (
            <select
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600"
              disabled={copying}
              value=""
              onChange={(e) => onCopy(e.target.value)}
            >
              <option value="">Copiar controles de...</option>
              {otherHazards.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.classification.name} — {h.description.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`${hazard.id}-source`}>Fuente</Label>
          <Input
            id={`${hazard.id}-source`}
            list={`${hazard.id}-source-list`}
            value={values.source}
            onChange={(e) => setValues((v) => ({ ...v, source: e.target.value }))}
            onBlur={handleBlur}
          />
          <datalist id={`${hazard.id}-source-list`}>
            {sourceSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor={`${hazard.id}-medium`}>Medio</Label>
          <Input
            id={`${hazard.id}-medium`}
            list={`${hazard.id}-medium-list`}
            value={values.medium}
            onChange={(e) => setValues((v) => ({ ...v, medium: e.target.value }))}
            onBlur={handleBlur}
          />
          <datalist id={`${hazard.id}-medium-list`}>
            {mediumSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <Label htmlFor={`${hazard.id}-individual`}>Individuo</Label>
          <Input
            id={`${hazard.id}-individual`}
            list={`${hazard.id}-individual-list`}
            value={values.individual}
            onChange={(e) => setValues((v) => ({ ...v, individual: e.target.value }))}
            onBlur={handleBlur}
          />
          <datalist id={`${hazard.id}-individual-list`}>
            {individualSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>
    </Card>
  );
}

export function ControlsStep({
  hazards,
  sourceSuggestions,
  mediumSuggestions,
  individualSuggestions,
}: {
  hazards: HazardWithRelations[];
  sourceSuggestions: string[];
  mediumSuggestions: string[];
  individualSuggestions: string[];
}) {
  const router = useRouter();
  const [copyingId, setCopyingId] = useState<string | null>(null);

  async function handleCopy(targetHazardId: string, sourceHazardId: string) {
    if (!sourceHazardId) return;
    setCopyingId(targetHazardId);
    try {
      await copyControlsFromHazard(sourceHazardId, targetHazardId);
      router.refresh();
    } finally {
      setCopyingId(null);
    }
  }

  if (hazards.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-500">
        Agrega al menos un peligro en la etapa anterior para poder registrar sus controles existentes.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hazards.map((hazard, index) => (
        <HazardControlsCard
          key={`${hazard.id}-${hazard.existingControls?.updatedAt.getTime() ?? "empty"}`}
          hazard={hazard}
          index={index}
          otherHazards={hazards.filter((h) => h.id !== hazard.id && h.existingControls)}
          sourceSuggestions={sourceSuggestions}
          mediumSuggestions={mediumSuggestions}
          individualSuggestions={individualSuggestions}
          copying={copyingId === hazard.id}
          onCopy={(sourceId) => handleCopy(hazard.id, sourceId)}
        />
      ))}
    </div>
  );
}
