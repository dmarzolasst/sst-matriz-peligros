"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { Company, RiskMatrix } from "@prisma/client";

import { matrixSchema, type MatrixInput } from "@/lib/validations/matrix";
import { createMatrix } from "@/server/actions/matrices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { MatrixStatusBadge } from "./matrix-status-badge";

type MatrixWithCompany = RiskMatrix & { company: Company | null };

export function MatrixManager({
  matrices,
  companies,
}: {
  matrices: MatrixWithCompany[];
  companies: Company[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MatrixInput>({ resolver: zodResolver(matrixSchema) });

  function onSubmit(data: MatrixInput) {
    setError(null);
    startTransition(async () => {
      try {
        const matrix = await createMatrix(data);
        reset({ companyId: "", name: "" });
        router.push(`/matrices/${matrix.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo crear la matriz.");
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Nueva matriz</h2>
        {companies.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Primero registra una empresa en el módulo <span className="font-medium">Empresas</span>.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="companyId">Empresa</Label>
              <Select id="companyId" defaultValue="" {...register("companyId")}>
                <option value="" disabled>
                  Selecciona una empresa
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
              {errors.companyId && <p className="mt-1 text-xs text-red-600">{errors.companyId.message}</p>}
            </div>
            <div>
              <Label htmlFor="name">Nombre de la matriz</Label>
              <Input id="name" {...register("name")} placeholder="Matriz IPEVR 2026" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? "Creando..." : "Crear matriz"}
            </Button>
          </form>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Matriz</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Versión</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matrices.map((matrix) => (
              <tr key={matrix.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{matrix.name}</td>
                <td className="px-4 py-3 text-slate-500">{matrix.company?.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">v{matrix.version}</td>
                <td className="px-4 py-3">
                  <MatrixStatusBadge status={matrix.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => router.push(`/matrices/${matrix.id}`)}>
                    Abrir
                  </Button>
                </td>
              </tr>
            ))}
            {matrices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aún no hay matrices creadas.
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
