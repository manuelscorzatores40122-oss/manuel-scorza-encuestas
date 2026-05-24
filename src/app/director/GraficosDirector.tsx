'use client';

import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

export function GraficosDirector({
  riskData,
  gradeData,
}: {
  riskData: { name: string; value: number; color: string }[];
  gradeData: { grado: string; total: number; alto: number; medio: number }[];
}) {
  const hasData = riskData.some(d => d.value > 0);

  return (
    <div style={{ padding: '28px' }}>
      <h2 style={{ fontFamily: 'var(--font-fraunces), Fraunces, serif', fontWeight: 600, fontSize: '1.2rem', color: '#1c241a', margin: '0 0 4px' }}>
        Distribución de riesgo
      </h2>
      <p style={{ fontSize: '.85rem', color: '#8a9089', marginBottom: '22px' }}>
        Todas las respuestas registradas
      </p>

      {!hasData ? (
        <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.88rem', color: '#8a9089', border: '1.5px dashed rgba(28,36,26,.14)' }}>
          Sin respuestas aún
        </div>
      ) : (
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={riskData} cx="50%" cy="50%" outerRadius={72} innerRadius={36} dataKey="value" paddingAngle={2}>
                {riskData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ border: '1.5px solid #1c241a', borderRadius: 0, fontSize: '.82rem' }}
                formatter={(v: number) => [v, '']}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '.78rem' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {gradeData.length > 0 && (
        <>
          <h2 style={{ fontFamily: 'var(--font-fraunces), Fraunces, serif', fontWeight: 600, fontSize: '1.1rem', color: '#1c241a', margin: '28px 0 16px', paddingTop: '20px', borderTop: '1px solid rgba(28,36,26,.1)' }}>
            Respuestas por grado
          </h2>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeData} barSize={12}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(28,36,26,.08)" vertical={false} />
                <XAxis dataKey="grado" tick={{ fontSize: 10, fill: '#8a9089' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8a9089' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: '1.5px solid #1c241a', borderRadius: 0, fontSize: '.82rem' }}
                />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: '.78rem' }} />
                <Bar dataKey="total"  fill="#46523f" name="Total"        radius={0} />
                <Bar dataKey="medio"  fill="#c08a2e" name="Riesgo medio" radius={0} />
                <Bar dataKey="alto"   fill="#b3473f" name="Riesgo alto"  radius={0} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
