import { CatalogCategory } from "@prisma/client";

import { listCatalogForAdmin } from "@/server/actions/catalogs";
import { CatalogListManager } from "@/components/config/catalog-list-manager";

export default async function PeligrosConfigPage() {
  const [classifications, descriptions] = await Promise.all([
    listCatalogForAdmin(CatalogCategory.CLASIFICACION_PELIGRO),
    listCatalogForAdmin(CatalogCategory.PELIGRO_DESCRIPCION),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Peligros</h1>
        <p className="mt-1 text-sm text-slate-500">
          Catálogo de clasificaciones GTC 45 y sus descripciones de peligro. Desactivar un elemento lo oculta de los
          selectores del wizard sin borrar los peligros ya registrados con él.
        </p>
      </div>

      <CatalogListManager category={CatalogCategory.CLASIFICACION_PELIGRO} title="Clasificaciones" items={classifications} />

      <div className="space-y-4">
        {classifications
          .filter((c) => c.active)
          .map((classification) => (
            <CatalogListManager
              key={classification.id}
              category={CatalogCategory.PELIGRO_DESCRIPCION}
              title={`Peligros — ${classification.name}`}
              items={descriptions.filter((d) => d.parentId === classification.id)}
              parentId={classification.id}
            />
          ))}
      </div>
    </div>
  );
}
