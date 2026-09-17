"use client";

import Link from "next/link";
import { clsx } from "clsx";
import { WIZARD_STEPS } from "@/lib/wizard/steps";

export function StepProgressBar({
  matrixId,
  taskId,
  currentOrder,
  maxUnlockedOrder,
}: {
  matrixId: string;
  taskId: string;
  currentOrder: number;
  maxUnlockedOrder: number;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {WIZARD_STEPS.map((step) => {
        const unlocked = step.order <= maxUnlockedOrder;
        const isCurrent = step.order === currentOrder;

        const chip = (
          <span
            className={clsx(
              "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              isCurrent && "border-blue-600 bg-blue-600 text-white",
              !isCurrent && unlocked && "border-slate-300 bg-white text-slate-700 hover:border-blue-400",
              !unlocked && "border-slate-200 bg-slate-50 text-slate-300",
            )}
          >
            <span
              className={clsx(
                "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                isCurrent ? "bg-white/20" : "bg-black/5",
              )}
            >
              {step.order}
            </span>
            {step.label}
          </span>
        );

        return (
          <li key={step.slug}>
            {unlocked ? (
              <Link href={`/matrices/${matrixId}/tasks/${taskId}/wizard/${step.slug}`}>{chip}</Link>
            ) : (
              chip
            )}
          </li>
        );
      })}
    </ol>
  );
}
