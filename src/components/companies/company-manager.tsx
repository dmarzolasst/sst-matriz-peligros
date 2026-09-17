"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Company } from "@prisma/client";

import { companySchema, type CompanyInput } from "@/lib/validations/company";
import { createCompany, updateCompany } from "@/server/actions/companies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

const EMPTY_VALUES: CompanyInput = { name: "", nit: "", sector: "" };

export function CompanyManager({ companies }: { companies: Company[] }) {
  const [editing, setEditing] = useState<Company | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CompanyInput>({
    resolver: zodResolver(companySchema),
    values: editing
      ? { name: editing.name, nit: editing.nit ?? "", sector: editing.sector ?? "" }
      : EMPTY_VALUES,
  });

  function onSubmit(data: CompanyInput) {
    setError(null);
    startTransition(async () => {
      try {
        if (editing) {
          await updateCompany(editing.id, data);
        } else {
          await createCompany(data);
        }
        setEditing(null);
        reset(EMPTY_VALUES);
      } catch {
        setError("No se pudo guardar la empresa. Intenta de nuevo.");
      }
    });
  }

  function cancelEdit() {
    setEditing(null);
    reset(EMPTY_VALUES);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          {editing ? "Editar empresa" : "Nueva empresa"}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="name">Razón social</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="nit">NIT</Label>
            <Input id="nit" {...register("nit")} placeholder="900123456-7" />
          </div>
          <div>
            <Label htmlFor="sector">Sector</Label>
            <Input id="sector" {...register("sector")} placeholder="Alimentos, construcción, servicios..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {editing ? "Guardar cambios" : "Crear empresa"}
            </Button>
            {editing && (
              <Button type="button" variant="secondary" onClick={cancelEdit}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">NIT</th>
              <th className="px-4 py-3">Sector</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {companies.map((company) => (
              <tr key={company.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{company.name}</td>
                <td className="px-4 py-3 text-slate-500">{company.nit ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">{company.sector ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => setEditing(company)}>
                    Editar
                  </Button>
                </td>
              </tr>
            ))}
            {companies.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Aún no hay empresas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  );
}
