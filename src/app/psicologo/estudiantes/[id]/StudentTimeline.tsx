'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import timelineStyles from './StudentTimeline.module.css';

export function StudentTimeline({ data }: { data: { fecha: string; score: number }[] }) {
  return (
    <div className={timelineStyles.card}>
      <h2 className={timelineStyles.title}>Evolución del score de riesgo</h2>
      <div className={timelineStyles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="fecha" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#dc2626"
              strokeWidth={2}
              dot={{ r: 3, fill: '#dc2626' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
