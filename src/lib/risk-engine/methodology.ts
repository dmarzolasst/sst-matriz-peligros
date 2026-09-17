import { prisma } from "@/lib/db/prisma";
import type { Methodology } from "./types";

function toMethodology(version: {
  id: string;
  name: string;
  ndLevels: unknown;
  neLevels: unknown;
  ncLevels: unknown;
  npRanges: unknown;
  nrRanges: unknown;
}): Methodology {
  return {
    id: version.id,
    name: version.name,
    ndLevels: version.ndLevels as Methodology["ndLevels"],
    neLevels: version.neLevels as Methodology["neLevels"],
    ncLevels: version.ncLevels as Methodology["ncLevels"],
    npRanges: version.npRanges as Methodology["npRanges"],
    nrRanges: version.nrRanges as Methodology["nrRanges"],
  };
}

export async function getActiveMethodology(): Promise<Methodology> {
  const version = await prisma.riskMethodologyVersion.findFirst({ where: { isActive: true } });
  if (!version) {
    throw new Error("No hay una metodología GTC 45 activa configurada.");
  }
  return toMethodology(version);
}

export async function getMethodologyById(id: string): Promise<Methodology> {
  const version = await prisma.riskMethodologyVersion.findUniqueOrThrow({ where: { id } });
  return toMethodology(version);
}
