"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HazardHeader } from "@/components/wizard/hazard-header";
import { SavedIndicator } from "@/components/wizard/saved-indicator";
import { useAutosaveStatus } from "@/components/wizard/use-autosave-status";
import { upsertInterventionMeasure } from "@/server/actions/hazards";
import type { HazardWithRelations } from "@/types/wizard";

type MeasureValues = {
  elimination: string;
  substitution: string;
  engineering: string;
  administrative: string;
  ppe: string;
};

type MeasureField = keyof MeasureValues;

function appendSuggestion(current: string, suggestion: string) {
  return current.trim() ? `${current.trim()}\n${suggestion}` : suggestion;
}

function MeasureBlock({
  label,
  value,
  suggestions,
  onChange,
  onBlur,
  onSuggestionClick,
}: {
  label: string;
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
  onBlur: () => void;
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {suggestions.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestionClick(s)}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <Textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} />
    </div>
  );
}

function HazardMeasuresCard({
  hazard,
  index,
  suggestions,
}: {
  hazard: HazardWithRelations;
  index: number;
  suggestions: Record<MeasureField, string[]>;
}) {
  const measure = hazard.interventionMeasure;
  const [values, setValues] = useState<MeasureValues>({
    elimination: measure?.elimination ?? "",
    substitution: measure?.substitution ?? "",
    engineering: measure?.engineering ?? "",
    administrative: measure?.administrative ?? "",
    ppe: measure?.ppe ?? "",
  });
  const { status, run } = useAutosaveStatus();

  function set(field: MeasureField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function save() {
    run(() => upsertInterventionMeasure(hazard.id, values));
  }

  // Calcula el valor siguiente de una vez (no a partir de un `onChange` + `onBlur`
  // encadenados) para no guardar un estado obsoleto por el clic en una sugerencia.
  // No debe llamarse `run()` (que hace setState) dentro del updater de `setValues`:
  // React no permite actualizar un componente mientras se resuelve el render de otro.
  function appendAndSave(field: MeasureField, suggestion: string) {
    const next = { ...values, [field]: appendSuggestion(values[field], suggestion) };
    setValues(next);
    run(() => upsertInterventionMeasure(hazard.id, next));
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HazardHeader hazard={hazard} index={index} />
        <SavedIndicator status={status} />
      </div>

      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <MeasureBlock
          label="1. Eliminación"
          value={values.elimination}
          suggestions={suggestions.elimination}
          onChange={(v) => set("elimination", v)}
          onBlur={save}
          onSuggestionClick={(s) => appendAndSave("elimination", s)}
        />
        <MeasureBlock
          label="2. Sustitución"
          value={values.substitution}
          suggestions={suggestions.substitution}
          onChange={(v) => set("substitution", v)}
          onBlur={save}
          onSuggestionClick={(s) => appendAndSave("substitution", s)}
        />
        <MeasureBlock
          label="3. Controles de ingeniería"
          value={values.engineering}
          suggestions={suggestions.engineering}
          onChange={(v) => set("engineering", v)}
          onBlur={save}
          onSuggestionClick={(s) => appendAndSave("engineering", s)}
        />
        <MeasureBlock
          label="4. Controles administrativos"
          value={values.administrative}
          suggestions={suggestions.administrative}
          onChange={(v) => set("administrative", v)}
          onBlur={save}
          onSuggestionClick={(s) => appendAndSave("administrative", s)}
        />
        <MeasureBlock
          label="5. EPP"
          value={values.ppe}
          suggestions={suggestions.ppe}
          onChange={(v) => set("ppe", v)}
          onBlur={save}
          onSuggestionClick={(s) => appendAndSave("ppe", s)}
        />
      </div>
    </Card>
  );
}

export function MeasuresStep({
  hazards,
  suggestions,
}: {
  hazards: HazardWithRelations[];
  suggestions: Record<MeasureField, string[]>;
}) {
  if (hazards.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-500">
        Agrega al menos un peligro para definir las medidas de intervención.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hazards.map((hazard, index) => (
        <HazardMeasuresCard key={hazard.id} hazard={hazard} index={index} suggestions={suggestions} />
      ))}
    </div>
  );
}
