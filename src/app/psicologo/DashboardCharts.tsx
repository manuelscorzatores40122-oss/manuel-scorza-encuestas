'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';

export function DashboardCharts({
  riskDist,
  trend,
}: {
  riskDist: { LOW: number; MID: number; HIGH: number };
  trend: { fecha: string; total: number; riesgo: number }[];
}) {
  const pieData = [
    { name: 'Sin riesgo', value: riskDist.LOW, color: '#16a34a' },
    { name: 'Riesgo medio', value: riskDist.MID, color: '#eab308' },
    { name: 'Riesgo alto', value: riskDist.HIGH, color: '#dc2626' },
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-semibold mb-3">Distribución de riesgo</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%" cy="50%"
                outerRadius={80}
                dataKey="value"
                label={(entry) => `${entry.value}`}
              >
                {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Respuestas últimos 30 días</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#2d8cff" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="riesgo" stroke="#dc2626" strokeWidth={2} name="Con riesgo" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
