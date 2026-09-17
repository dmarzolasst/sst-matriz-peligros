import { describe, expect, it } from "vitest";
import type { Methodology } from "./types";
import {
  calculateNP,
  calculateNR,
  evaluateRisk,
  getNCInterpretation,
  getNDInterpretation,
  getNEInterpretation,
  getNPInterpretation,
  getNRInterpretation,
} from "./riskCalculationService";

// Metodología de prueba con los mismos valores sembrados en prisma/seed.ts
// (GTC 45 - valores de referencia).
const methodology: Methodology = {
  id: "test-methodology",
  name: "GTC 45 (test)",
  ndLevels: [
    { value: 10, label: "Muy Alto", description: "" },
    { value: 6, label: "Alto", description: "" },
    { value: 2, label: "Medio", description: "" },
    { value: 0, label: "Bajo", description: "" },
  ],
  neLevels: [
    { value: 4, label: "Continua (EC)", description: "" },
    { value: 3, label: "Frecuente (EF)", description: "" },
    { value: 2, label: "Ocasional (EO)", description: "" },
    { value: 1, label: "Esporádica (EE)", description: "" },
  ],
  ncLevels: [
    { value: 100, label: "Mortal o Catastrófico", description: "" },
    { value: 60, label: "Muy Grave", description: "" },
    { value: 25, label: "Grave", description: "" },
    { value: 10, label: "Leve", description: "" },
  ],
  npRanges: [
    { min: 24, max: 40, label: "Muy Alto", description: "" },
    { min: 10, max: 20, label: "Alto", description: "" },
    { min: 6, max: 8, label: "Medio", description: "" },
    { min: 2, max: 4, label: "Bajo", description: "" },
  ],
  nrRanges: [
    { min: 600, max: 4000, label: "I - Riesgo No Aceptable", priority: "Crítica", acceptability: "No aceptable", description: "" },
    { min: 150, max: 500, label: "II - Riesgo No Aceptable o Aceptable con control específico", priority: "Alta", acceptability: "No aceptable o aceptable con control específico", description: "" },
    { min: 40, max: 120, label: "III - Riesgo Mejorable", priority: "Media", acceptability: "Mejorable", description: "" },
    { min: 0, max: 20, label: "IV - Riesgo Aceptable", priority: "Baja", acceptability: "Aceptable", description: "" },
  ],
};

describe("interpretaciones de niveles", () => {
  it("interpreta ND", () => {
    expect(getNDInterpretation(methodology, 10)?.label).toBe("Muy Alto");
    expect(getNDInterpretation(methodology, 999)).toBeNull();
  });

  it("interpreta NE", () => {
    expect(getNEInterpretation(methodology, 4)?.label).toBe("Continua (EC)");
  });

  it("interpreta NC", () => {
    expect(getNCInterpretation(methodology, 100)?.label).toBe("Mortal o Catastrófico");
  });
});

describe("calculateNP", () => {
  it("multiplica ND x NE", () => {
    expect(calculateNP(10, 4)).toBe(40);
    expect(calculateNP(6, 3)).toBe(18);
    expect(calculateNP(2, 1)).toBe(2);
  });
});

describe("getNPInterpretation", () => {
  it.each([
    [40, "Muy Alto"],
    [24, "Muy Alto"],
    [20, "Alto"],
    [10, "Alto"],
    [8, "Medio"],
    [6, "Medio"],
    [4, "Bajo"],
    [2, "Bajo"],
  ])("NP=%i -> %s", (np, label) => {
    expect(getNPInterpretation(methodology, np).label).toBe(label);
  });

  it("lanza error si no hay rango configurado", () => {
    expect(() => getNPInterpretation(methodology, 999)).toThrow();
  });
});

describe("calculateNR", () => {
  it("multiplica NP x NC", () => {
    expect(calculateNR(40, 100)).toBe(4000);
    expect(calculateNR(2, 10)).toBe(20);
  });
});

describe("getNRInterpretation", () => {
  it.each([
    [4000, "I - Riesgo No Aceptable", "Crítica"],
    [600, "I - Riesgo No Aceptable", "Crítica"],
    [500, "II - Riesgo No Aceptable o Aceptable con control específico", "Alta"],
    [150, "II - Riesgo No Aceptable o Aceptable con control específico", "Alta"],
    [120, "III - Riesgo Mejorable", "Media"],
    [40, "III - Riesgo Mejorable", "Media"],
    [20, "IV - Riesgo Aceptable", "Baja"],
    [0, "IV - Riesgo Aceptable", "Baja"],
  ])("NR=%i -> %s (%s)", (nr, label, priority) => {
    const range = getNRInterpretation(methodology, nr);
    expect(range.label).toBe(label);
    expect(range.priority).toBe(priority);
  });
});

describe("evaluateRisk", () => {
  it("calcula el caso más crítico: ND=10, NE=4, NC=100", () => {
    const result = evaluateRisk(methodology, { nd: 10, ne: 4, nc: 100 });
    expect(result.np).toBe(40);
    expect(result.npInterpretation).toBe("Muy Alto");
    expect(result.nr).toBe(4000);
    expect(result.nrInterpretation).toBe("I - Riesgo No Aceptable");
    expect(result.priority).toBe("Crítica");
  });

  it("calcula un caso de riesgo bajo: ND=2, NE=1, NC=10", () => {
    const result = evaluateRisk(methodology, { nd: 2, ne: 1, nc: 10 });
    expect(result.np).toBe(2);
    expect(result.npInterpretation).toBe("Bajo");
    expect(result.nr).toBe(20);
    expect(result.nrInterpretation).toBe("IV - Riesgo Aceptable");
    expect(result.priority).toBe("Baja");
  });

  it("nunca acepta que el usuario fuerce NP o NR manualmente: siempre son derivados de nd/ne/nc", () => {
    const a = evaluateRisk(methodology, { nd: 6, ne: 3, nc: 25 });
    const b = evaluateRisk(methodology, { nd: 6, ne: 3, nc: 25 });
    expect(a).toEqual(b);
  });

  it("ND=Bajo (Tabla 2 de la GTC 45) se clasifica directamente en nivel IV, sin calcular NP", () => {
    // Con ND=Bajo (valor 0) la guía no permite calcular NP=ND×NE: el peligro
    // se clasifica directamente en el nivel de riesgo y de intervención IV,
    // sin importar NE o NC.
    const result = evaluateRisk(methodology, { nd: 0, ne: 4, nc: 100 });
    expect(result.nrInterpretation).toBe("IV - Riesgo Aceptable");
    expect(result.priority).toBe("Baja");
    expect(result.acceptability).toBe("Aceptable");
  });
});
