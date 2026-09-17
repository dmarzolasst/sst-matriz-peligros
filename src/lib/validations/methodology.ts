import { z } from "zod";

export const levelSchema = z.object({
  value: z.number(),
  label: z.string().min(1),
  description: z.string(),
});

export const npRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  label: z.string().min(1),
  description: z.string(),
});

export const nrRangeSchema = z.object({
  min: z.number(),
  max: z.number(),
  label: z.string().min(1),
  description: z.string(),
  priority: z.string().min(1),
  acceptability: z.string().min(1),
});

export const levelsArraySchema = z.array(levelSchema);
export const npRangesArraySchema = z.array(npRangeSchema);
export const nrRangesArraySchema = z.array(nrRangeSchema);
