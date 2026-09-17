import { z } from "zod";

export const matrixSchema = z.object({
  companyId: z.string().min(1, "Selecciona una empresa"),
  name: z.string().min(2, "El nombre de la matriz es obligatorio"),
});

export type MatrixInput = z.infer<typeof matrixSchema>;
