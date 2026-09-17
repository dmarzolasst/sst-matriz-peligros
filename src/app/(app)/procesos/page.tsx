import { listCompanies } from "@/server/actions/companies";
import { ProcessAreaManager } from "@/components/config/process-area-manager";

export default async function ProcesosConfigPage() {
  const companies = await listCompanies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Procesos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Procesos y zonas/lugares por empresa. También puedes crearlos directamente desde la Etapa 1 del wizard.
        </p>
      </div>
      <ProcessAreaManager companies={companies} />
    </div>
  );
}
