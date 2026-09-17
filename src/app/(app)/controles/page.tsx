import { CatalogCategory } from "@prisma/client";

import { listCatalogForAdmin } from "@/server/actions/catalogs";
import { CatalogListManager } from "@/components/config/catalog-list-manager";

export default async function ControlesConfigPage() {
  const [fuente, medio, individuo] = await Promise.all([
    listCatalogForAdmin(CatalogCategory.CONTROL_FUENTE),
    listCatalogForAdmin(CatalogCategory.CONTROL_MEDIO),
    listCatalogForAdmin(CatalogCategory.CONTROL_INDIVIDUO),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Controles existentes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sugerencias de autocompletado para la Etapa 3 del wizard (Fuente, Medio, Individuo).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CatalogListManager category={CatalogCategory.CONTROL_FUENTE} title="Fuente" items={fuente} />
        <CatalogListManager category={CatalogCategory.CONTROL_MEDIO} title="Medio" items={medio} />
        <CatalogListManager category={CatalogCategory.CONTROL_INDIVIDUO} title="Individuo" items={individuo} />
      </div>
    </div>
  );
}
