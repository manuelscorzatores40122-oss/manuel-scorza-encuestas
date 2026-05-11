'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

type RiskDist = {
  LOW: number;
  MID: number;
  HIGH: number;
};

type TrendItem = {
  fecha: string;
  total: number;
  riesgo: number;
};

const COLORS = {
  LOW: '#16a34a',
  MID: '#eab308',
  HIGH: '#dc2626',
  BLUE: '#2563eb',
};

export function DashboardCharts({
  riskDist,
  trend,
}: {
  riskDist: RiskDist;
  trend: TrendItem[];
}) {
  const totalRisk = riskDist.LOW + riskDist.MID + riskDist.HIGH;

  const pieData = [
    {
      name: 'Sin riesgo',
      value: riskDist.LOW,
      color: COLORS.LOW,
    },
    {
      name: 'Riesgo medio',
      value: riskDist.MID,
      color: COLORS.MID,
    },
    {
      name: 'Riesgo alto',
      value: riskDist.HIGH,
      color: COLORS.HIGH,
    },
  ].filter((item) => item.value > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Distribución de riesgo
          </h3>
          <p className="text-sm text-slate-500">
            Clasificación general de respuestas psicológicas.
          </p>
        </div>

        <div className="h-72">
          {totalRisk === 0 ? (
            <EmptyChart text="Aún no hay datos de riesgo para mostrar." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ value }) => {
                    const percent = totalRisk
                      ? Math.round((Number(value) / totalRisk) * 100)
                      : 0;

                    return `${percent}%`;
                  }}
                >
                  {pieData.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(value: number, name: string) => {
                    const percent = totalRisk
                      ? Math.round((value / totalRisk) * 100)
                      : 0;

                    return [`${value} estudiantes (${percent}%)`, name];
                  }}
                />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            Respuestas últimos 30 días
          </h3>
          <p className="text-sm text-slate-500">
            Comparación entre respuestas totales y respuestas con riesgo.
          </p>
        </div>

        <div className="h-72">
          {trend.length === 0 ? (
            <EmptyChart text="Aún no hay respuestas registradas." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />

                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />

                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />

                <Tooltip />

                <Legend />

                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={COLORS.BLUE}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Total"
                />

                <Line
                  type="monotone"
                  dataKey="riesgo"
                  stroke={COLORS.HIGH}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Con riesgo"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}