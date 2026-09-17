import { CatalogCategory } from "@prisma/client";

import { listCatalogForAdmin } from "@/server/actions/catalogs";
import { getActiveMethodologyRecord } from "@/server/actions/methodology";
import { CatalogListManager } from "@/components/config/catalog-list-manager";
import { MethodologyEditor } from "@/components/config/methodology-editor";
import type { LevelOption, NpRangeOption, NrRangeOption } from "@/lib/risk-engine/types";

export default async function ConfiguracionPage() {
  const [consecuencias, methodology] = await Promise.all([
    listCatalogForAdmin(CatalogCategory.CONSECUENCIA),
    getActiveMethodologyRecord(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Catálogo de peores consecuencias y metodología GTC 45 activa. El resto de catálogos vive en sus propias
          secciones: Procesos, Peligros, Controles y Medidas de intervención.
        </p>
      </div>

      <CatalogListManager category={CatalogCategory.CONSECUENCIA} title="Peores consecuencias" items={consecuencias} />

      <div>
        <h2 className="text-lg font-semibold text-slate-900">Metodología GTC 45</h2>
        <p className="mt-1 text-sm text-slate-500">
          Motor de cálculo centralizado (ND × NE = NP, NP × NC = NR). Editar estos valores no recalcula evaluaciones
          ya guardadas, solo aplica a evaluaciones nuevas o modificadas.
        </p>
        <div className="mt-3">
          <MethodologyEditor
            methodologyId={methodology.id}
            methodologyName={methodology.name}
            ndLevels={methodology.ndLevels as unknown as LevelOption[]}
            neLevels={methodology.neLevels as unknown as LevelOption[]}
            ncLevels={methodology.ncLevels as unknown as LevelOption[]}
            npRanges={methodology.npRanges as unknown as NpRangeOption[]}
            nrRanges={methodology.nrRanges as unknown as NrRangeOption[]}
          />
        </div>
      </div>
    </div>
  );
}
