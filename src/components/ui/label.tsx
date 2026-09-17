import { LabelHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx("mb-1 block text-xs font-medium text-slate-700", className)} {...props} />;
}
