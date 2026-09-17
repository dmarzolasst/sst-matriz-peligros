"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CatalogCategory } from "@prisma/client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { listCompanies } from "@/server/actions/companies";
import { listAreas, listCatalog, listProcesses } from "@/server/actions/catalogs";

type Option = { id: string; name: string };

export function DashboardFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = useState<Option[]>([]);
  const [processes, setProcesses] = useState<Option[]>([]);
  const [areas, setAreas] = useState<Option[]>([]);
  const [classifications, setClassifications] = useState<Option[]>([]);

  const companyId = searchParams.get("companyId") ?? "";
  const processId = searchParams.get("processId") ?? "";
  const areaId = searchParams.get("areaId") ?? "";
  const classificationId = searchParams.get("classificationId") ?? "";
  const riskLevel = searchParams.get("riskLevel") ?? "";
  const routine = searchParams.get("routine") ?? "";

  useEffect(() => {
    listCompanies().then((items) => setCompanies(items));
    listCatalog(CatalogCategory.CLASIFICACION_PELIGRO).then((items) => setClassifications(items));
  }, []);

  useEffect(() => {
    if (!companyId) return;
    listProcesses(companyId).then((items) => setProcesses(items));
    listAreas(companyId).then((items) => setAreas(items));
  }, [companyId]);

  const processOptions = companyId ? processes : [];
  const areaOptions = companyId ? areas : [];

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);

    if (key === "companyId") {
      params.delete("processId");
      params.delete("areaId");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-end">
      <div className="sm:w-48">
        <Label>Empresa</Label>
        <Select value={companyId} onChange={(e) => updateParam("companyId", e.target.value)}>
          <option value="">Todas</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:w-40">
        <Label>Proceso</Label>
        <Select
          value={processId}
          disabled={!companyId}
          onChange={(e) => updateParam("processId", e.target.value)}
        >
          <option value="">Todos</option>
          {processOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:w-40">
        <Label>Zona / Lugar</Label>
        <Select value={areaId} disabled={!companyId} onChange={(e) => updateParam("areaId", e.target.value)}>
          <option value="">Todas</option>
          {areaOptions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:w-44">
        <Label>Clasificación</Label>
        <Select value={classificationId} onChange={(e) => updateParam("classificationId", e.target.value)}>
          <option value="">Todas</option>
          {classifications.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="sm:w-36">
        <Label>Nivel de riesgo</Label>
        <Select value={riskLevel} onChange={(e) => updateParam("riskLevel", e.target.value)}>
          <option value="">Todos</option>
          <option value="Crítica">Crítica</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </Select>
      </div>
      <div className="sm:w-32">
        <Label>Rutinaria</Label>
        <Select value={routine} onChange={(e) => updateParam("routine", e.target.value)}>
          <option value="">Todas</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </Select>
      </div>
    </div>
  );
}
