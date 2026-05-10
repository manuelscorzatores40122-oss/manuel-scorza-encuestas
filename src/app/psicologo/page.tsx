import Link from 'next/link';
import { AlertTriangle, ClipboardList, Users, MessageSquare, TrendingUp } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { DashboardCharts } from './DashboardCharts';

export default async function PsicologoDashboard() {
  const [
    totalEstudiantes,
    encuestasActivas,
    totalRespuestas,
    alertasPendientes,
    respuestasPorRiesgo,
    respuestasUltimos30,
    quierenHablar,
  ] = await Promise.all([
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
    prisma.survey.count({ where: { isActive: true } }),
    prisma.response.count(),
    prisma.alert.count({ where: { reviewedAt: null } }),
    prisma.response.groupBy({
      by: ['riskLevel'],
      _count: true,
    }),
    prisma.response.findMany({
      where: { submittedAt: { gte: daysAgo(30) } },
      select: { submittedAt: true, riskLevel: true },
    }),
    prisma.response.count({ where: { wantsToTalk: true } }),
  ]);

  const riskDist = {
    LOW: respuestasPorRiesgo.find((r) => r.riskLevel === 'LOW')?._count || 0,
    MID: respuestasPorRiesgo.find((r) => r.riskLevel === 'MID')?._count || 0,
    HIGH: respuestasPorRiesgo.find((r) => r.riskLevel === 'HIGH')?._count || 0,
  };

  const trend = bucketByDay(respuestasUltimos30, 30);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Panel del Psicólogo</h1>
        <p className="text-slate-600 mt-1">Resumen general del bienestar estudiantil</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard icon={<Users className="w-5 h-5" />} label="Estudiantes" value={totalEstudiantes} color="brand" />
        <StatCard icon={<ClipboardList className="w-5 h-5" />} label="Encuestas activas" value={encuestasActivas} color="emerald" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Respuestas totales" value={totalRespuestas} color="purple" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Alertas pendientes" value={alertasPendientes} color="red" />
        <StatCard icon={<MessageSquare className="w-5 h-5" />} label="Quieren hablar" value={quierenHablar} color="warm" />
      </div>

      <DashboardCharts riskDist={riskDist} trend={trend} />

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Acciones rápidas</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/psicologo/alertas" className="btn-secondary justify-start">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Revisar alertas
          </Link>
          <Link href="/psicologo/encuestas/nueva" className="btn-secondary justify-start">
            <ClipboardList className="w-4 h-4 text-brand-500" /> Crear encuesta
          </Link>
          <Link href="/psicologo/respuestas" className="btn-secondary justify-start">
            <TrendingUp className="w-4 h-4 text-purple-500" /> Ver respuestas
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
    warm: 'bg-warm-100 text-warm-700',
  };
  return (
    <div className="card !p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color]} mb-3`}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function daysAgo(n: number): Date {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
}

function bucketByDay(items: { submittedAt: Date; riskLevel: string }[], days: number) {
  const buckets: { fecha: string; total: number; riesgo: number }[] = [];
  const byFecha = new Map<string, { fecha: string; total: number; riesgo: number }>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(5, 10);
    const bucket = { fecha: key, total: 0, riesgo: 0 };
    buckets.push(bucket);
    byFecha.set(key, bucket);
  }
  for (const item of items) {
    const key = item.submittedAt.toISOString().slice(5, 10);
    const b = byFecha.get(key);
    if (b) {
      b.total++;
      if (item.riskLevel !== 'LOW') b.riesgo++;
    }
  }
  return buckets;
}
