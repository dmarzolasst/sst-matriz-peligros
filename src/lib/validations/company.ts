import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(2, "La razón social es obligatoria"),
  nit: z.string().trim().optional().or(z.literal("")),
  sector: z.string().trim().optional().or(z.literal("")),
});

export type CompanyInput = z.infer<typeof companySchema>;
