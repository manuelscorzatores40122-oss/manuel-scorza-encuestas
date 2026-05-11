'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TendenciaEmocionalItem } from '@/lib/analiticas/tendencias-emocionales';

export function TendenciaEmocional({ data }: { data: TendenciaEmocionalItem[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Trend analysis</h2>
        <p className="text-sm text-slate-500">
          Evolución diaria del score, tasa de riesgo y solicitudes de apoyo.
        </p>
      </div>

      <div className="h-[360px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-slate-400">
            No hay tendencias disponibles.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="promedio"
                name="Score promedio"
                stroke="#2563eb"
                fill="url(#scoreTrend)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="tasaRiesgo"
                name="Tasa de riesgo %"
                stroke="#dc2626"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="quierenHablar"
                name="Quieren hablar"
                stroke="#0f766e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
