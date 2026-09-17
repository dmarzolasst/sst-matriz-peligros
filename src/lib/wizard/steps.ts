export const WIZARD_STEPS = [
  { slug: "contexto", order: 1, label: "Contexto" },
  { slug: "peligros", order: 2, label: "Peligros" },
  { slug: "controles", order: 3, label: "Controles existentes" },
  { slug: "evaluacion", order: 4, label: "Evaluación" },
  { slug: "valoracion", order: 5, label: "Valoración" },
  { slug: "criterios", order: 6, label: "Criterios" },
  { slug: "medidas", order: 7, label: "Medidas de intervención" },
] as const;

export type WizardStepSlug = (typeof WIZARD_STEPS)[number]["slug"];

export function getStepBySlug(slug: string) {
  return WIZARD_STEPS.find((step) => step.slug === slug);
}

export function getStepByOrder(order: number) {
  return WIZARD_STEPS.find((step) => step.order === order);
}
