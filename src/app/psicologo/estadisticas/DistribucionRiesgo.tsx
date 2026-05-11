'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export function DistribucionRiesgo({
  bajo,
  medio,
  alto,
}: {
  bajo: number;
  medio: number;
  alto: number;
}) {
  const data = [
    { name: 'Riesgo bajo', value: bajo, color: '#16a34a' },
    { name: 'Riesgo medio', value: medio, color: '#eab308' },
    { name: 'Riesgo alto', value: alto, color: '#dc2626' },
  ].filter((item) => item.value > 0);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Distribución de riesgo semanal
        </h2>

        <p className="text-sm text-slate-500">
          Proporción de niveles de riesgo en las respuestas recientes
        </p>
      </div>

      <div className="h-[360px]">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-sm text-slate-400">
            No hay datos suficientes.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={55}
                dataKey="value"
                label
              >
                {data.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
