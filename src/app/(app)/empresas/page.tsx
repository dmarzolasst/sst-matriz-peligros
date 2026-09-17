import { listCompanies } from "@/server/actions/companies";
import { CompanyManager } from "@/components/companies/company-manager";

export default async function EmpresasPage() {
  const companies = await listCompanies();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Empresas</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registra las empresas para las que vas a construir matrices de peligros.
        </p>
      </div>
      <CompanyManager companies={companies} />
    </div>
  );
}
