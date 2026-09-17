import { CatalogCategory } from "@prisma/client";

import { listCatalogForAdmin } from "@/server/actions/catalogs";
import { CatalogListManager } from "@/components/config/catalog-list-manager";

export default async function MedidasConfigPage() {
  const [eliminacion, sustitucion, ingenieria, administrativo, epp] = await Promise.all([
    listCatalogForAdmin(CatalogCategory.MEDIDA_ELIMINACION),
    listCatalogForAdmin(CatalogCategory.MEDIDA_SUSTITUCION),
    listCatalogForAdmin(CatalogCategory.MEDIDA_INGENIERIA),
    listCatalogForAdmin(CatalogCategory.MEDIDA_ADMINISTRATIVA),
    listCatalogForAdmin(CatalogCategory.MEDIDA_EPP),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medidas de intervención</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sugerencias por jerarquía de controles, usadas como chips en la Etapa 7 del wizard.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CatalogListManager category={CatalogCategory.MEDIDA_ELIMINACION} title="1. Eliminación" items={eliminacion} />
        <CatalogListManager category={CatalogCategory.MEDIDA_SUSTITUCION} title="2. Sustitución" items={sustitucion} />
        <CatalogListManager category={CatalogCategory.MEDIDA_INGENIERIA} title="3. Controles de ingeniería" items={ingenieria} />
        <CatalogListManager
          category={CatalogCategory.MEDIDA_ADMINISTRATIVA}
          title="4. Controles administrativos"
          items={administrativo}
        />
        <CatalogListManager category={CatalogCategory.MEDIDA_EPP} title="5. EPP" items={epp} />
      </div>
    </div>
  );
}
