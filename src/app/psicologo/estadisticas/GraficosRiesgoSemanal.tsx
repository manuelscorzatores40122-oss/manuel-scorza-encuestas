
// src/app/psicologo/estadisticas/GraficosRiesgoSemanal.tsx

'use client';

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from 'recharts';
import type { RiesgoSemanalItem } from '@/lib/analiticas/riesgo-semanal';

export function GraficosRiesgoSemanal({
  data,
}: {
  data: RiesgoSemanalItem[];
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Riesgo semanal por sección
        </h2>

        <p className="text-sm text-slate-500">
          Comparación emocional institucional
        </p>
      </div>

      <div className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
            />

            <XAxis
              dataKey="seccion"
              tick={{ fontSize: 12 }}
            />

            <YAxis allowDecimals={false} />

            <Tooltip />

            <Legend />

            <Bar
              dataKey="riesgoAlto"
              fill="#dc2626"
              radius={[4, 4, 0, 0]}
              name="Riesgo alto"
            />

            <Bar
              dataKey="riesgoMedio"
              fill="#eab308"
              radius={[4, 4, 0, 0]}
              name="Riesgo medio"
            />

            <Bar
              dataKey="riesgoBajo"
              fill="#16a34a"
              radius={[4, 4, 0, 0]}
              name="Riesgo bajo"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
