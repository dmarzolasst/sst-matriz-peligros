import { z } from "zod";

export const taskContextSchema = z.object({
  processId: z.string().min(1, "Selecciona o crea un proceso"),
  areaId: z.string().min(1, "Selecciona o crea una zona/lugar"),
  activityId: z.string().min(1, "Selecciona o crea una actividad"),
  name: z.string().min(2, "El nombre de la tarea es obligatorio"),
  routine: z.boolean(),
});

export type TaskContextInput = z.infer<typeof taskContextSchema>;
