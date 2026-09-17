"use client";

import { Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";

export function SavedIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-xs font-medium",
        status === "saving" && "text-slate-400",
        status === "saved" && "text-emerald-600",
        status === "error" && "text-red-600",
      )}
    >
      {status === "saving" && (
        <>
          <Loader2 size={12} className="animate-spin" /> Guardando...
        </>
      )}
      {status === "saved" && (
        <>
          <Check size={12} /> Guardado
        </>
      )}
      {status === "error" && "Error al guardar"}
    </span>
  );
}
