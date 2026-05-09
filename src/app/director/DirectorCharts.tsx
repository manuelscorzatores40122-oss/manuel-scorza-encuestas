'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function DirectorCharts({
  riskData,
  gradeData,
}: {
  riskData: { name: string; value: number; color: string }[];
  gradeData: { grado: string; total: number; alto: number; medio: number }[];
}) {
  return (
    <div className="card">
      <h2 className="font-semibold mb-3">Distribución de riesgo</h2>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={riskData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={(e: any) => `${e.value}`}>
              {riskData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {gradeData.length > 0 && (
        <>
          <h2 className="font-semibold mt-6 mb-3">Respuestas por grado</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="grado" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#2d8cff" name="Total" />
                <Bar dataKey="medio" fill="#eab308" name="Riesgo medio" />
                <Bar dataKey="alto" fill="#dc2626" name="Riesgo alto" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
