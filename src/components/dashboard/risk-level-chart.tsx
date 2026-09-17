"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { CHART_INK, PRIORITY_COLOR } from "@/lib/dashboard/colors";

export function RiskLevelChart({ data }: { data: { name: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-slate-900">Distribución de riesgos por nivel</h3>
      {total === 0 ? (
        <p className="flex h-64 items-center justify-center text-center text-sm text-slate-400">
          Aún no hay peligros evaluados para los filtros actuales.
        </p>
      ) : (
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke={CHART_INK.grid} />
              <XAxis dataKey="name" tick={{ fill: CHART_INK.muted, fontSize: 12 }} axisLine={{ stroke: CHART_INK.axis }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: CHART_INK.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(11,11,11,0.04)" }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${CHART_INK.grid}`, color: CHART_INK.primary }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={64}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLOR[entry.name] ?? CHART_INK.muted} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
