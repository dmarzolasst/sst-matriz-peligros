"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { CATEGORICAL, CHART_INK } from "@/lib/dashboard/colors";

type NameCount = { name: string; count: number };

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: `1px solid ${CHART_INK.grid}`,
  color: CHART_INK.primary,
};

/**
 * Gráfico de barras de una sola serie (nombre + conteo). `categorical=true`
 * pinta cada barra con un color distinto de la paleta (para categorías que
 * son identidades, p. ej. Fuente/Medio/Individuo); si no, usa un solo tono
 * (comparación de magnitud simple, p. ej. peligros por proceso).
 */
export function BarChartCard({
  title,
  data,
  categorical = false,
  emptyMessage = "Sin datos para los filtros actuales.",
}: {
  title: string;
  data: NameCount[];
  categorical?: boolean;
  emptyMessage?: string;
}) {
  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {data.length === 0 ? (
        <p className="flex h-64 items-center justify-center text-center text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
              <XAxis
                dataKey="name"
                tick={{ fill: CHART_INK.muted, fontSize: 11 }}
                axisLine={{ stroke: CHART_INK.axis }}
                tickLine={false}
                interval={0}
                angle={data.length > 5 ? -20 : 0}
                textAnchor={data.length > 5 ? "end" : "middle"}
                height={data.length > 5 ? 56 : 28}
              />
              <YAxis allowDecimals={false} tick={{ fill: CHART_INK.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(11,11,11,0.04)" }} contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56} fill={CATEGORICAL[0]}>
                {categorical && data.map((entry, index) => <Cell key={entry.name} fill={CATEGORICAL[index % CATEGORICAL.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
