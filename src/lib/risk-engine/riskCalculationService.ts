import type { Methodology, NpRangeOption, NrRangeOption } from "./types";

/**
 * Único punto de cálculo de la metodología GTC 45. Ningún componente ni
 * server action debe calcular NP o NR por su cuenta: siempre a través de
 * estas funciones, que leen los rangos desde la metodología activa (nunca
 * hardcodeados) para poder actualizarla sin tocar este servicio.
 */

export function getNDInterpretation(methodology: Methodology, nd: number) {
  return methodology.ndLevels.find((level) => level.value === nd) ?? null;
}

export function getNEInterpretation(methodology: Methodology, ne: number) {
  return methodology.neLevels.find((level) => level.value === ne) ?? null;
}

export function getNCInterpretation(methodology: Methodology, nc: number) {
  return methodology.ncLevels.find((level) => level.value === nc) ?? null;
}

export function calculateNP(nd: number, ne: number): number {
  return nd * ne;
}

export function getNPInterpretation(methodology: Methodology, np: number): NpRangeOption {
  const range = methodology.npRanges.find((r) => np >= r.min && np <= r.max);
  if (!range) {
    throw new Error(`No hay un rango de Nivel de Probabilidad configurado para NP=${np}.`);
  }
  return range;
}

export function calculateNR(np: number, nc: number): number {
  return np * nc;
}

export function getNRInterpretation(methodology: Methodology, nr: number): NrRangeOption {
  const range = methodology.nrRanges.find((r) => nr >= r.min && nr <= r.max);
  if (!range) {
    throw new Error(`No hay un rango de Nivel de Riesgo configurado para NR=${nr}.`);
  }
  return range;
}

export type RiskEvaluationInput = { nd: number; ne: number; nc: number };

export type RiskEvaluationResult = {
  np: number;
  npInterpretation: string;
  nr: number;
  nrInterpretation: string;
  priority: string;
  acceptability: string;
};

export function evaluateRisk(methodology: Methodology, input: RiskEvaluationInput): RiskEvaluationResult {
  // Regla GTC 45 (Tabla 2, Nivel de Deficiencia "Bajo"): cuando no se asigna
  // valor numérico a ND (representado aquí como 0), el peligro se clasifica
  // directamente en el nivel de riesgo y de intervención IV, sin calcular NP.
  if (input.nd === 0) {
    const lowestRange = [...methodology.nrRanges].sort((a, b) => a.max - b.max)[0];
    return {
      np: 0,
      npInterpretation: "No aplica (ND Bajo)",
      nr: lowestRange.max,
      nrInterpretation: lowestRange.label,
      priority: lowestRange.priority,
      acceptability: lowestRange.acceptability,
    };
  }

  const np = calculateNP(input.nd, input.ne);
  const npRange = getNPInterpretation(methodology, np);
  const nr = calculateNR(np, input.nc);
  const nrRange = getNRInterpretation(methodology, nr);

  return {
    np,
    npInterpretation: npRange.label,
    nr,
    nrInterpretation: nrRange.label,
    priority: nrRange.priority,
    acceptability: nrRange.acceptability,
  };
}
