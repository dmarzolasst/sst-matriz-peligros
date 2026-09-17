import { HTMLAttributes } from "react";
import { clsx } from "clsx";

type Tone = "slate" | "green" | "blue" | "amber" | "red";

const toneClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  green: "bg-emerald-100 text-emerald-700",
  blue: "bg-blue-100 text-blue-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
};

export function Badge({ tone = "slate", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
