"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CreatableSelect, type ComboOption } from "@/components/ui/creatable-select";
import { createProcess, createArea, createActivity, listActivities } from "@/server/actions/catalogs";
import { createTask, updateTaskContext, advanceWizardStep } from "@/server/actions/tasks";

type InitialValues = {
  processId: string;
  areaId: string;
  activityId: string;
  name: string;
  routine: boolean;
};

export function ContextStep({
  matrixId,
  companyId,
  taskId,
  initialProcesses,
  initialAreas,
  initialActivities,
  initialValues,
}: {
  matrixId: string;
  companyId: string;
  taskId: string | null;
  initialProcesses: ComboOption[];
  initialAreas: ComboOption[];
  initialActivities: ComboOption[];
  initialValues?: InitialValues;
}) {
  const router = useRouter();

  const [processes, setProcesses] = useState(initialProcesses);
  const [areas, setAreas] = useState(initialAreas);
  const [activities, setActivities] = useState(initialActivities);

  const [processId, setProcessId] = useState(initialValues?.processId ?? "");
  const [areaId, setAreaId] = useState(initialValues?.areaId ?? "");
  const [activityId, setActivityId] = useState(initialValues?.activityId ?? "");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [routine, setRoutine] = useState(initialValues?.routine ?? true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"draft" | "continue" | null>(null);

  async function handleProcessChange(id: string) {
    setProcessId(id);
    setActivityId("");
    setLoadingActivities(true);
    try {
      const result = await listActivities(id);
      setActivities(result.map((activity) => ({ id: activity.id, label: activity.name })));
    } finally {
      setLoadingActivities(false);
    }
  }

  function validate() {
    if (!processId) return "Selecciona o crea un proceso.";
    if (!areaId) return "Selecciona o crea una zona/lugar.";
    if (!activityId) return "Selecciona o crea una actividad.";
    if (!name.trim()) return "El nombre de la tarea es obligatorio.";
    return null;
  }

  async function save() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return null;
    }
    setError(null);

    const payload = { processId, areaId, activityId, name: name.trim(), routine };

    if (taskId) {
      await updateTaskContext(taskId, payload);
      return taskId;
    }
    const task = await createTask(matrixId, payload);
    return task.id;
  }

  async function handleSaveDraft() {
    setPending("draft");
    try {
      const savedTaskId = await save();
      if (savedTaskId) {
        router.push(`/matrices/${matrixId}`);
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  async function handleContinue() {
    setPending("continue");
    try {
      const savedTaskId = await save();
      if (savedTaskId) {
        await advanceWizardStep(savedTaskId, 2);
        router.push(`/matrices/${matrixId}/tasks/${savedTaskId}/wizard/peligros`);
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label>Proceso</Label>
          <CreatableSelect
            value={processId || null}
            options={processes}
            placeholder="Producción, mantenimiento..."
            onChange={handleProcessChange}
            onCreate={async (nameToCreate) => {
              const created = await createProcess(companyId, nameToCreate);
              const option = { id: created.id, label: created.name };
              setProcesses((prev) => [...prev, option]);
              await handleProcessChange(created.id);
              return option;
            }}
          />
        </div>

        <div>
          <Label>Zona / Lugar</Label>
          <CreatableSelect
            value={areaId || null}
            options={areas}
            placeholder="Planta, bodega, oficinas..."
            onChange={setAreaId}
            onCreate={async (nameToCreate) => {
              const created = await createArea(companyId, nameToCreate);
              const option = { id: created.id, label: created.name };
              setAreas((prev) => [...prev, option]);
              return option;
            }}
          />
        </div>

        <div>
          <Label>Actividad</Label>
          <CreatableSelect
            value={activityId || null}
            options={activities}
            placeholder={processId ? "Selecciona o crea una actividad" : "Primero elige un proceso"}
            disabled={!processId || loadingActivities}
            onChange={setActivityId}
            onCreate={async (nameToCreate) => {
              const created = await createActivity(processId, nameToCreate);
              const option = { id: created.id, label: created.name };
              setActivities((prev) => [...prev, option]);
              return option;
            }}
          />
        </div>

        <div>
          <Label htmlFor="task-name">Tarea</Label>
          <Input
            id="task-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Pelado de plátano"
          />
        </div>

        <div>
          <Label>¿Tarea rutinaria?</Label>
          <div className="flex gap-2">
            <Button type="button" variant={routine ? "primary" : "secondary"} onClick={() => setRoutine(true)}>
              Sí
            </Button>
            <Button type="button" variant={!routine ? "primary" : "secondary"} onClick={() => setRoutine(false)}>
              No
            </Button>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
        <Link href={`/matrices/${matrixId}`}>
          <Button type="button" variant="ghost">
            Cancelar
          </Button>
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleSaveDraft} disabled={pending !== null}>
            {pending === "draft" ? "Guardando..." : "Guardar borrador"}
          </Button>
          <Button type="button" onClick={handleContinue} disabled={pending !== null}>
            {pending === "continue" ? "Guardando..." : "Guardar y continuar"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
