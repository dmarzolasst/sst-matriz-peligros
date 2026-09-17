import { listMatrices } from "@/server/actions/matrices";
import { listCompanies } from "@/server/actions/companies";
import { MatrixManager } from "@/components/matrices/matrix-manager";

export default async function MatricesPage() {
  const [matrices, companies] = await Promise.all([listMatrices(), listCompanies()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Matrices</h1>
        <p className="mt-1 text-sm text-slate-500">Crea y administra las matrices de peligros por empresa.</p>
      </div>
      <MatrixManager matrices={matrices} companies={companies} />
    </div>
  );
}
