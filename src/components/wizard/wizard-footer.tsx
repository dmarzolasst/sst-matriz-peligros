"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { WIZARD_STEPS } from "@/lib/wizard/steps";
import { advanceWizardStep } from "@/server/actions/tasks";

export function WizardFooter({
  matrixId,
  taskId,
  currentOrder,
}: {
  matrixId: string;
  taskId: string;
  currentOrder: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const prevStep = WIZARD_STEPS.find((step) => step.order === currentOrder - 1);
  const nextStep = WIZARD_STEPS.find((step) => step.order === currentOrder + 1);

  async function handleContinue() {
    setPending(true);
    try {
      if (nextStep) {
        await advanceWizardStep(taskId, nextStep.order);
        router.push(`/matrices/${matrixId}/tasks/${taskId}/wizard/${nextStep.slug}`);
      } else {
        router.push(`/matrices/${matrixId}`);
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
      {prevStep ? (
        <Link href={`/matrices/${matrixId}/tasks/${taskId}/wizard/${prevStep.slug}`}>
          <Button type="button" variant="secondary">
            Anterior
          </Button>
        </Link>
      ) : (
        <span />
      )}
      <div className="flex flex-wrap gap-2">
        <Link href={`/matrices/${matrixId}`}>
          <Button type="button" variant="ghost">
            Guardar borrador y salir
          </Button>
        </Link>
        <Button type="button" onClick={handleContinue} disabled={pending}>
          {pending ? "Guardando..." : nextStep ? "Continuar" : "Finalizar tarea"}
        </Button>
      </div>
    </div>
  );
}
