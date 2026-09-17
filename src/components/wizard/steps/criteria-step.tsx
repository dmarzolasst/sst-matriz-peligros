"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HazardHeader } from "@/components/wizard/hazard-header";
import { SavedIndicator } from "@/components/wizard/saved-indicator";
import { useAutosaveStatus } from "@/components/wizard/use-autosave-status";
import { upsertControlCriteria } from "@/server/actions/hazards";
import type { HazardWithRelations } from "@/types/wizard";

type FormValues = {
  exposedWorkers: string;
  worstConsequence: string;
  hasLegalRequirement: boolean;
  standard: string;
  article: string;
  description: string;
  referenceUrl: string;
};

function HazardCriteriaCard({
  hazard,
  index,
  consequenceSuggestions,
}: {
  hazard: HazardWithRelations;
  index: number;
  consequenceSuggestions: string[];
}) {
  const criteria = hazard.controlCriteria;
  const [values, setValues] = useState<FormValues>({
    exposedWorkers: criteria ? String(criteria.exposedWorkers) : "",
    worstConsequence: criteria?.worstConsequence ?? "",
    hasLegalRequirement: criteria?.hasLegalRequirement ?? false,
    standard: criteria?.legalRequirement?.standard ?? "",
    article: criteria?.legalRequirement?.article ?? "",
    description: criteria?.legalRequirement?.description ?? "",
    referenceUrl: criteria?.legalRequirement?.referenceUrl ?? "",
  });
  const { status, run } = useAutosaveStatus();

  function persist(next: FormValues) {
    const exposedWorkers = Number(next.exposedWorkers);
    if (!next.worstConsequence.trim() || Number.isNaN(exposedWorkers)) return;
    run(() =>
      upsertControlCriteria(hazard.id, {
        exposedWorkers,
        worstConsequence: next.worstConsequence,
        hasLegalRequirement: next.hasLegalRequirement,
        legalRequirement: next.hasLegalRequirement
          ? {
              standard: next.standard,
              article: next.article,
              description: next.description,
              referenceUrl: next.referenceUrl,
            }
          : null,
      }),
    );
  }

  function update(patch: Partial<FormValues>) {
    setValues((prev) => ({ ...prev, ...patch }));
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <HazardHeader hazard={hazard} index={index} />
        <SavedIndicator status={status} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${hazard.id}-exposed`}>Número de expuestos</Label>
          <Input
            id={`${hazard.id}-exposed`}
            type="number"
            min={0}
            value={values.exposedWorkers}
            onChange={(e) => update({ exposedWorkers: e.target.value })}
            onBlur={() => persist(values)}
          />
        </div>
        <div>
          <Label htmlFor={`${hazard.id}-consequence`}>Peor consecuencia</Label>
          <Input
            id={`${hazard.id}-consequence`}
            list={`${hazard.id}-consequence-list`}
            value={values.worstConsequence}
            onChange={(e) => update({ worstConsequence: e.target.value })}
            onBlur={() => persist(values)}
          />
          <datalist id={`${hazard.id}-consequence-list`}>
            {consequenceSuggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="mt-4">
        <Label>¿Existe un requisito legal específico asociado?</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={values.hasLegalRequirement ? "primary" : "secondary"}
            onClick={() => {
              const next = { ...values, hasLegalRequirement: true };
              setValues(next);
            }}
          >
            Sí
          </Button>
          <Button
            type="button"
            variant={!values.hasLegalRequirement ? "primary" : "secondary"}
            onClick={() => {
              const next = { ...values, hasLegalRequirement: false };
              setValues(next);
              persist(next);
            }}
          >
            No
          </Button>
        </div>
      </div>

      {values.hasLegalRequirement && (
        <div className="mt-4 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${hazard.id}-standard`}>Norma</Label>
            <Input
              id={`${hazard.id}-standard`}
              value={values.standard}
              onChange={(e) => update({ standard: e.target.value })}
              onBlur={() => persist(values)}
              placeholder="Resolución 0312 de 2019"
            />
          </div>
          <div>
            <Label htmlFor={`${hazard.id}-article`}>Artículo</Label>
            <Input
              id={`${hazard.id}-article`}
              value={values.article}
              onChange={(e) => update({ article: e.target.value })}
              onBlur={() => persist(values)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`${hazard.id}-description`}>Descripción</Label>
            <Input
              id={`${hazard.id}-description`}
              value={values.description}
              onChange={(e) => update({ description: e.target.value })}
              onBlur={() => persist(values)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor={`${hazard.id}-url`}>Link / documento de referencia</Label>
            <Input
              id={`${hazard.id}-url`}
              value={values.referenceUrl}
              onChange={(e) => update({ referenceUrl: e.target.value })}
              onBlur={() => persist(values)}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

export function CriteriaStep({
  hazards,
  consequenceSuggestions,
}: {
  hazards: HazardWithRelations[];
  consequenceSuggestions: string[];
}) {
  if (hazards.length === 0) {
    return (
      <Card className="p-6 text-sm text-slate-500">
        Agrega al menos un peligro para definir los criterios de control.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {hazards.map((hazard, index) => (
        <HazardCriteriaCard key={hazard.id} hazard={hazard} index={index} consequenceSuggestions={consequenceSuggestions} />
      ))}
    </div>
  );
}
