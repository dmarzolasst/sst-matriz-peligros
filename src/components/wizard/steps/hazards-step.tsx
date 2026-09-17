"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CreatableSelect, type ComboOption } from "@/components/ui/creatable-select";
import { createHazard, deleteHazard, duplicateHazard } from "@/server/actions/hazards";
import { listCatalogByParent } from "@/server/actions/catalogs";
import { CatalogCategory } from "@prisma/client";
import type { HazardWithRelations } from "@/types/wizard";

export function HazardsStep({
  taskId,
  hazards,
  classifications,
}: {
  taskId: string;
  hazards: HazardWithRelations[];
  classifications: ComboOption[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [classificationId, setClassificationId] = useState("");
  const [descriptionId, setDescriptionId] = useState("");
  const [descriptions, setDescriptions] = useState<ComboOption[]>([]);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClassificationChange(id: string) {
    setClassificationId(id);
    setDescriptionId("");
    setLoadingDescriptions(true);
    try {
      const items = await listCatalogByParent(CatalogCategory.PELIGRO_DESCRIPCION, id);
      setDescriptions(items.map((item) => ({ id: item.id, label: item.name })));
    } finally {
      setLoadingDescriptions(false);
    }
  }

  async function handleAddHazard() {
    if (!classificationId || !descriptionId) {
      setError("Selecciona la clasificación y la descripción del peligro.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createHazard(taskId, { classificationId, descriptionId });
      router.refresh();
      setAdding(false);
      setClassificationId("");
      setDescriptionId("");
      setDescriptions([]);
    } catch {
      setError("No se pudo agregar el peligro. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(hazardId: string) {
    if (!confirm("¿Eliminar este peligro y toda su información asociada (controles, evaluación, medidas)?")) return;
    await deleteHazard(hazardId);
    router.refresh();
  }

  async function handleDuplicate(hazardId: string) {
    await duplicateHazard(hazardId);
    router.refresh();
  }

  return (
    <Card className="p-6">
      <div className="space-y-3">
        {hazards.map((hazard, index) => (
          <div
            key={hazard.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                {index + 1}
              </span>
              <Badge tone="blue">{hazard.classification.name}</Badge>
              <span className="text-sm font-medium text-slate-900">{hazard.description.name}</span>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button type="button" variant="ghost" onClick={() => handleDuplicate(hazard.id)} title="Duplicar peligro">
                <Copy size={16} />
              </Button>
              <Button type="button" variant="ghost" onClick={() => handleDelete(hazard.id)} title="Eliminar peligro">
                <Trash2 size={16} className="text-red-500" />
              </Button>
            </div>
          </div>
        ))}

        {hazards.length === 0 && !adding && (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
            Aún no has agregado peligros a esta tarea.
          </p>
        )}
      </div>

      {adding ? (
        <div className="mt-4 space-y-4 rounded-lg border border-blue-200 bg-blue-50/40 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Clasificación (GTC 45)</Label>
              <Select value={classificationId} onChange={(e) => handleClassificationChange(e.target.value)}>
                <option value="">Selecciona una clasificación</option>
                {classifications.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Descripción del peligro</Label>
              <CreatableSelect
                value={descriptionId || null}
                options={descriptions}
                placeholder={classificationId ? "Selecciona o crea una descripción" : "Primero elige una clasificación"}
                disabled={!classificationId || loadingDescriptions}
                onChange={setDescriptionId}
                onCreate={async (name) => {
                  const { createCatalogItem } = await import("@/server/actions/catalogs");
                  const created = await createCatalogItem({
                    category: CatalogCategory.PELIGRO_DESCRIPCION,
                    name,
                    parentId: classificationId,
                  });
                  const option = { id: created.id, label: created.name };
                  setDescriptions((prev) => [...prev, option]);
                  return option;
                }}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" onClick={handleAddHazard} disabled={saving}>
              {saving ? "Agregando..." : "Agregar peligro"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="secondary" className="mt-4" onClick={() => setAdding(true)}>
          <Plus size={16} />
          Agregar otro peligro
        </Button>
      )}
    </Card>
  );
}
