import { z } from "zod";

export const hazardSchema = z.object({
  classificationId: z.string().min(1, "Selecciona una clasificación"),
  descriptionId: z.string().min(1, "Selecciona o crea una descripción del peligro"),
});

export type HazardInput = z.infer<typeof hazardSchema>;

export const existingControlSchema = z.object({
  source: z.string().trim().optional().or(z.literal("")),
  medium: z.string().trim().optional().or(z.literal("")),
  individual: z.string().trim().optional().or(z.literal("")),
});

export type ExistingControlInput = z.infer<typeof existingControlSchema>;

export const riskAssessmentSchema = z.object({
  nd: z.number(),
  ne: z.number(),
  nc: z.number(),
});

export type RiskAssessmentInput = z.infer<typeof riskAssessmentSchema>;

export const controlCriteriaSchema = z.object({
  exposedWorkers: z.number().int().min(0, "Debe ser un número positivo"),
  worstConsequence: z.string().min(2, "Describe la peor consecuencia posible"),
  hasLegalRequirement: z.boolean(),
  legalRequirement: z
    .object({
      standard: z.string().min(1, "Indica la norma"),
      article: z.string().trim().optional().or(z.literal("")),
      description: z.string().trim().optional().or(z.literal("")),
      referenceUrl: z.string().trim().optional().or(z.literal("")),
    })
    .nullable()
    .optional(),
});

export type ControlCriteriaInput = z.infer<typeof controlCriteriaSchema>;

export const interventionMeasureSchema = z.object({
  elimination: z.string().trim().optional().or(z.literal("")),
  substitution: z.string().trim().optional().or(z.literal("")),
  engineering: z.string().trim().optional().or(z.literal("")),
  administrative: z.string().trim().optional().or(z.literal("")),
  ppe: z.string().trim().optional().or(z.literal("")),
});

export type InterventionMeasureInput = z.infer<typeof interventionMeasureSchema>;
