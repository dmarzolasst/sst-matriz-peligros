"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WIZARD_STEPS } from "@/lib/wizard/steps";
import { deleteTask, duplicateTask } from "@/server/actions/tasks";
import type { TaskListItem } from "@/types/wizard";

function currentStepSlug(wizardStep: number) {
  const step = WIZARD_STEPS.find((s) => s.order === wizardStep) ?? WIZARD_STEPS[0];
  return step.slug;
}

export function TaskListPanel({ matrixId, tasks }: { matrixId: string; tasks: TaskListItem[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDuplicate(taskId: string) {
    setPendingId(taskId);
    try {
      const newTask = await duplicateTask(taskId);
      router.push(`/matrices/${matrixId}/tasks/${newTask.id}/wizard/contexto`);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(taskId: string) {
    if (!confirm("¿Eliminar esta tarea y todos sus peligros, controles y evaluaciones?")) return;
    setPendingId(taskId);
    try {
      await deleteTask(taskId);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Tareas de la matriz</h2>
          <p className="text-xs text-slate-500">Cada tarea puede tener uno o varios peligros asociados.</p>
        </div>
        <Link href={`/matrices/${matrixId}/tasks/new/wizard/contexto`}>
          <Button type="button">
            <Plus size={16} />
            Nueva tarea
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto">
      <table className="w-full min-w-[680px] text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Tarea</th>
            <th className="px-4 py-3">Proceso / Zona</th>
            <th className="px-4 py-3">Rutinaria</th>
            <th className="px-4 py-3">Peligros</th>
            <th className="px-4 py-3">Avance</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <tr key={task.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{task.name}</td>
              <td className="px-4 py-3 text-slate-500">
                {task.activity.process.name} · {task.area.name}
              </td>
              <td className="px-4 py-3">
                <Badge tone={task.routine ? "blue" : "slate"}>{task.routine ? "Sí" : "No"}</Badge>
              </td>
              <td className="px-4 py-3 text-slate-500">{task.hazards.length}</td>
              <td className="px-4 py-3 text-slate-500">{task.wizardStep}/{WIZARD_STEPS.length}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Link href={`/matrices/${matrixId}/tasks/${task.id}/wizard/${currentStepSlug(task.wizardStep)}`}>
                    <Button type="button" variant="ghost">
                      Abrir
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pendingId === task.id}
                    onClick={() => handleDuplicate(task.id)}
                    title="Duplicar tarea"
                  >
                    <Copy size={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={pendingId === task.id}
                    onClick={() => handleDelete(task.id)}
                    title="Eliminar tarea"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                Aún no hay tareas en esta matriz. Crea la primera con &quot;Nueva tarea&quot;.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </Card>
  );
}
