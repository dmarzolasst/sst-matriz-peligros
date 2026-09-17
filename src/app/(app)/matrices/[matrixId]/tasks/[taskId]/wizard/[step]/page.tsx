import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CatalogCategory } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getTaskDetail } from "@/server/actions/tasks";
import { listProcesses, listAreas, listActivities, listCatalog } from "@/server/actions/catalogs";
import { getMethodologyById } from "@/lib/risk-engine/methodology";
import { getStepBySlug, WIZARD_STEPS, type WizardStepSlug } from "@/lib/wizard/steps";
import { StepProgressBar } from "@/components/wizard/step-progress-bar";
import { WizardFooter } from "@/components/wizard/wizard-footer";
import { ContextStep } from "@/components/wizard/steps/context-step";
import { HazardsStep } from "@/components/wizard/steps/hazards-step";
import { ControlsStep } from "@/components/wizard/steps/controls-step";
import { EvaluationStep } from "@/components/wizard/steps/evaluation-step";
import { ValuationStep } from "@/components/wizard/steps/valuation-step";
import { CriteriaStep } from "@/components/wizard/steps/criteria-step";
import { MeasuresStep } from "@/components/wizard/steps/measures-step";

async function toNames(category: CatalogCategory) {
  const items = await listCatalog(category);
  return items.map((item) => item.name);
}

export default async function WizardStepPage({
  params,
}: {
  params: Promise<{ matrixId: string; taskId: string; step: string }>;
}) {
  const { matrixId, taskId, step: stepSlug } = await params;
  const step = getStepBySlug(stepSlug);
  if (!step) notFound();

  // ---- Modo creación: solo la etapa "Contexto" existe sin una tarea aún ----
  if (taskId === "new") {
    if (step.slug !== "contexto") {
      redirect(`/matrices/${matrixId}/tasks/new/wizard/contexto`);
    }

    const matrix = await prisma.riskMatrix.findUniqueOrThrow({ where: { id: matrixId } });
    if (!matrix.companyId) notFound();

    const [processes, areas] = await Promise.all([listProcesses(matrix.companyId), listAreas(matrix.companyId)]);

    return (
      <div className="space-y-6">
        <WizardHeader matrixId={matrixId} matrixName={matrix.name} taskName="Nueva tarea" />
        <StepProgressBar matrixId={matrixId} taskId="new" currentOrder={1} maxUnlockedOrder={1} />
        <ContextStep
          matrixId={matrixId}
          companyId={matrix.companyId}
          taskId={null}
          initialProcesses={processes.map((p) => ({ id: p.id, label: p.name }))}
          initialAreas={areas.map((a) => ({ id: a.id, label: a.name }))}
          initialActivities={[]}
        />
      </div>
    );
  }

  // ---- Modo edición: la tarea ya existe ----
  const task = await getTaskDetail(taskId);
  if (task.riskMatrixId !== matrixId) notFound();
  if (!task.riskMatrix.companyId) notFound();

  if (step.order > task.wizardStep) {
    const currentStep = WIZARD_STEPS.find((s) => s.order === task.wizardStep) ?? WIZARD_STEPS[0];
    redirect(`/matrices/${matrixId}/tasks/${taskId}/wizard/${currentStep.slug}`);
  }

  const stepContent = await renderStepContent(step.slug, { matrixId, task });

  return (
    <div className="space-y-6">
      <WizardHeader matrixId={matrixId} matrixName={task.riskMatrix.name} taskName={task.name} />
      <StepProgressBar matrixId={matrixId} taskId={taskId} currentOrder={step.order} maxUnlockedOrder={task.wizardStep} />
      {stepContent}
      <WizardFooter matrixId={matrixId} taskId={taskId} currentOrder={step.order} />
    </div>
  );
}

function WizardHeader({
  matrixId,
  matrixName,
  taskName,
}: {
  matrixId: string;
  matrixName: string;
  taskName: string;
}) {
  return (
    <div>
      <Link href={`/matrices/${matrixId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={14} />
        Volver a {matrixName}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{taskName}</h1>
    </div>
  );
}

async function renderStepContent(
  slug: WizardStepSlug,
  { matrixId, task }: { matrixId: string; task: Awaited<ReturnType<typeof getTaskDetail>> },
) {
  switch (slug) {
    case "contexto": {
      const companyId = task.riskMatrix.companyId as string;
      const [processes, areas, activities] = await Promise.all([
        listProcesses(companyId),
        listAreas(companyId),
        listActivities(task.activity.processId),
      ]);
      return (
        <ContextStep
          matrixId={matrixId}
          companyId={companyId}
          taskId={task.id}
          initialProcesses={processes.map((p) => ({ id: p.id, label: p.name }))}
          initialAreas={areas.map((a) => ({ id: a.id, label: a.name }))}
          initialActivities={activities.map((a) => ({ id: a.id, label: a.name }))}
          initialValues={{
            processId: task.activity.processId,
            areaId: task.areaId,
            activityId: task.activityId,
            name: task.name,
            routine: task.routine,
          }}
        />
      );
    }

    case "peligros": {
      const classifications = await listCatalog(CatalogCategory.CLASIFICACION_PELIGRO);
      return (
        <HazardsStep
          taskId={task.id}
          hazards={task.hazards}
          classifications={classifications.map((c) => ({ id: c.id, label: c.name }))}
        />
      );
    }

    case "controles": {
      const [source, medium, individual] = await Promise.all([
        toNames(CatalogCategory.CONTROL_FUENTE),
        toNames(CatalogCategory.CONTROL_MEDIO),
        toNames(CatalogCategory.CONTROL_INDIVIDUO),
      ]);
      return (
        <ControlsStep
          hazards={task.hazards}
          sourceSuggestions={source}
          mediumSuggestions={medium}
          individualSuggestions={individual}
        />
      );
    }

    case "evaluacion": {
      const methodology = await getMethodologyById(task.riskMatrix.methodologyVersionId);
      return (
        <EvaluationStep
          hazards={task.hazards}
          ndLevels={methodology.ndLevels}
          neLevels={methodology.neLevels}
          ncLevels={methodology.ncLevels}
        />
      );
    }

    case "valoracion":
      return <ValuationStep hazards={task.hazards} />;

    case "criterios": {
      const consequences = await toNames(CatalogCategory.CONSECUENCIA);
      return <CriteriaStep hazards={task.hazards} consequenceSuggestions={consequences} />;
    }

    case "medidas": {
      const [elimination, substitution, engineering, administrative, ppe] = await Promise.all([
        toNames(CatalogCategory.MEDIDA_ELIMINACION),
        toNames(CatalogCategory.MEDIDA_SUSTITUCION),
        toNames(CatalogCategory.MEDIDA_INGENIERIA),
        toNames(CatalogCategory.MEDIDA_ADMINISTRATIVA),
        toNames(CatalogCategory.MEDIDA_EPP),
      ]);
      return (
        <MeasuresStep
          hazards={task.hazards}
          suggestions={{ elimination, substitution, engineering, administrative, ppe }}
        />
      );
    }
  }
}
