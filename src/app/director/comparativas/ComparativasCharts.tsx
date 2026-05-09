'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ComparativasCharts({ data }: { data: { nivel: string; total: number; alto: number; medio: number }[] }) {
  return (
    <div className="card">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="nivel" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#2d8cff" name="Total respuestas" />
            <Bar dataKey="medio" fill="#eab308" name="Riesgo medio" />
            <Bar dataKey="alto" fill="#dc2626" name="Riesgo alto" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
