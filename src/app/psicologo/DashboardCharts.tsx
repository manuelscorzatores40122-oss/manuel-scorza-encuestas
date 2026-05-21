'use client';

import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import { PieChart as PieChartIcon, BarChart2, TrendingUp as TrendIcon } from 'lucide-react';

import styles from './DashboardCharts.module.css';

type RiskDist = { LOW: number; MID: number; HIGH: number };

type TrendItem = {
  fecha: string;
  total: number;
  low: number;
  mid: number;
  high: number;
};

type RiskByGradeItem = {
  grade: string;
  order: number;
  LOW: number;
  MID: number;
  HIGH: number;
};

const C = {
  LOW:    '#16a34a',
  MID:    '#eab308',
  HIGH:   '#dc2626',
};

export function DashboardCharts({
  riskDist,
  trend,
  riskByGrade,
}: {
  riskDist: RiskDist;
  trend: TrendItem[];
  riskByGrade: RiskByGradeItem[];
}) {
  const totalRisk = riskDist.LOW + riskDist.MID + riskDist.HIGH;

  const pieData = [
    { name: 'Sin riesgo',   value: riskDist.LOW,  color: C.LOW  },
    { name: 'Riesgo medio', value: riskDist.MID,  color: C.MID  },
    { name: 'Riesgo alto',  value: riskDist.HIGH, color: C.HIGH },
  ].filter((d) => d.value > 0);

  const hasTrend  = trend.some((d) => d.total > 0);
  const hasGrades = riskByGrade.length > 0;

  return (
    <div className={styles.grid}>

      {/* ── PIE: distribución global ── */}
      <section className={styles.card}>
        <ChartHeader
          title="Distribución de riesgo"
          description="Clasificación general de respuestas psicológicas."
        />
        <div className={styles.chartBox}>
          {totalRisk === 0 ? (
            <EmptyChart
              icon={<PieChartIcon />}
              title="Aún no hay datos"
              text="Los niveles de riesgo aparecerán cuando los estudiantes respondan una encuesta."
            />
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
                  label={({ value }) =>
                    totalRisk ? `${Math.round((Number(value) / totalRisk) * 100)}%` : '0%'
                  }
                >
                  {pieData.map((d) => <Cell key={d.name} fill={d.color} />)}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const pct = totalRisk ? Math.round((value / totalRisk) * 100) : 0;
                    return [`${value} estudiantes (${pct}%)`, name];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── BARS: riesgo por grado ── */}
      <section className={styles.card}>
        <ChartHeader
          title="Riesgo por grado"
          description="Distribución de niveles de riesgo en cada grado escolar."
        />
        <div className={styles.chartBox}>
          {!hasGrades ? (
            <EmptyChart
              icon={<BarChart2 />}
              title="Aún no hay respuestas"
              text="El desglose por grado se construye con las respuestas recibidas."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={riskByGrade}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="grade"
                  tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} resp.`, name]}
                />
                <Legend />
                <Bar dataKey="LOW"  stackId="a" fill={C.LOW}  name="Sin riesgo"   radius={[0, 0, 0, 0]} />
                <Bar dataKey="MID"  stackId="a" fill={C.MID}  name="Riesgo medio" />
                <Bar dataKey="HIGH" stackId="a" fill={C.HIGH} name="Riesgo alto"  radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* ── LINES: evolución 30 días (3 niveles) ── */}
      <section className={`${styles.card} ${styles.cardWide}`}>
        <ChartHeader
          title="Evolución de riesgo — últimos 30 días"
          description="Respuestas diarias desglosadas por nivel de riesgo."
        />
        <div className={styles.chartBox}>
          {!hasTrend ? (
            <EmptyChart
              icon={<TrendIcon />}
              title="La línea de tiempo está vacía"
              text="Cuando lleguen respuestas verás la tendencia diaria de riesgo para detectar picos a tiempo."
            />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trend}
                margin={{ top: 8, right: 16, left: -20, bottom: 0 }}
              >
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
                  type="monotone" dataKey="low"
                  stroke={C.LOW} strokeWidth={2}
                  dot={false} activeDot={{ r: 4 }}
                  name="Sin riesgo"
                />
                <Line
                  type="monotone" dataKey="mid"
                  stroke={C.MID} strokeWidth={2}
                  dot={false} activeDot={{ r: 4 }}
                  name="Riesgo medio"
                />
                <Line
                  type="monotone" dataKey="high"
                  stroke={C.HIGH} strokeWidth={2.5}
                  dot={{ r: 2.5 }} activeDot={{ r: 5 }}
                  name="Riesgo alto"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

    </div>
  );
}

function ChartHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className={styles.header}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
    </div>
  );
}

function EmptyChart({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className={styles.emptyChart}>
      <span className={styles.emptyIcon}>{icon}</span>
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyText}>{text}</p>
    </div>
  );
}
