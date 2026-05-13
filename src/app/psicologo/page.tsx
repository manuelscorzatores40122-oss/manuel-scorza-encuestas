// src/app/psicologo/page.tsx

import Link from 'next/link';

import {
  AlertTriangle,
  ClipboardList,
  Users,
  TrendingUp,
  MessageSquare,
  Megaphone,
} from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { DashboardCharts } from './DashboardCharts';

/**
 * Panel principal del psicólogo.
 */
export default async function PsicologoDashboard() {
  const [
    totalEstudiantes,
    encuestasActivas,
    totalRespuestas,
    alertasPendientes,
    respuestasPorRiesgo,
    respuestasUltimos30,
    quierenHablar,
    anunciosPublicados,
  ] = await Promise.all([
    prisma.student.count({
      where: {
        estadoMatricula: 'DEFINITIVA',
      },
    }),

    prisma.survey.count({
      where: {
        isActive: true,
      },
    }),

    prisma.response.count(),

    prisma.alert.count({
      where: {
        reviewedAt: null,
      },
    }),

    prisma.response.groupBy({
      by: ['riskLevel'],
      _count: true,
    }),

    prisma.response.findMany({
      where: {
        submittedAt: {
          gte: daysAgo(30),
        },
      },
      select: {
        submittedAt: true,
        riskLevel: true,
      },
    }),

    prisma.response.count({
      where: {
        wantsToTalk: true,
      },
    }),

    prisma.announcement.count({
      where: {
        isPublished: true,
      },
    }),
  ]);

  /**
   * Distribución de riesgo
   */
  const riskDist = {
    LOW:
      respuestasPorRiesgo.find(
        (item) => item.riskLevel === 'LOW'
      )?._count || 0,

    MID:
      respuestasPorRiesgo.find(
        (item) => item.riskLevel === 'MID'
      )?._count || 0,

    HIGH:
      respuestasPorRiesgo.find(
        (item) => item.riskLevel === 'HIGH'
      )?._count || 0,
  };

  /**
   * Tendencia últimos 30 días
   */
  const trend = bucketByDay(respuestasUltimos30, 30);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Panel del Psicólogo
        </h1>

        <p className="mt-1 text-slate-600">
          Resumen general del bienestar estudiantil
        </p>
      </header>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatButton
          href="/psicologo/estudiantes"
          icon={<Users className="h-5 w-5" />}
          label="Estudiantes"
          value={totalEstudiantes}
          color="brand"
        />

        <StatButton
          href="/psicologo/encuestas"
          icon={<ClipboardList className="h-5 w-5" />}
          label="Encuestas activas"
          value={encuestasActivas}
          color="emerald"
        />

        <StatButton
          href="/psicologo/respuestas"
          icon={<TrendingUp className="h-5 w-5" />}
          label="Respuestas"
          value={totalRespuestas}
          color="purple"
        />

        <StatButton
          href="/psicologo/alertas"
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Alertas"
          value={alertasPendientes}
          color="red"
        />

        <StatButton
          href="/psicologo/respuestas"
          icon={<MessageSquare className="h-5 w-5" />}
          label="Quieren hablar"
          value={quierenHablar}
          color="warm"
        />

        <StatButton
          href="/psicologo/anuncios"
          icon={<Megaphone className="h-5 w-5" />}
          label="Anuncios"
          value={anunciosPublicados}
          color="amber"
        />
      </div>

      {/* Charts */}
      <DashboardCharts
        riskDist={riskDist}
        trend={trend}
      />

      {/* Acciones rápidas */}
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Acciones rápidas
          </h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Link
            href="/psicologo/alertas"
            className="btn-secondary justify-start"
          >
            <AlertTriangle className="h-4 w-4 text-red-500" />
            Revisar alertas
          </Link>

          <Link
            href="/psicologo/encuestas/nueva"
            className="btn-secondary justify-start"
          >
            <ClipboardList className="h-4 w-4 text-brand-500" />
            Crear encuesta
          </Link>

          <Link
            href="/psicologo/respuestas"
            className="btn-secondary justify-start"
          >
            <TrendingUp className="h-4 w-4 text-purple-500" />
            Ver respuestas
          </Link>

          <Link
            href="/psicologo/anuncios"
            className="btn-secondary justify-start"
          >
            <Megaphone className="h-4 w-4 text-amber-500" />
            Ver anuncios
          </Link>
        </div>
      </section>
    </div>
  );
}

/**
 * Tarjeta estadística reutilizable
 */
function StatButton({
  href,
  icon,
  label,
  value,
  color,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
    warm: 'bg-orange-100 text-orange-700',
    amber: 'bg-amber-100 text-amber-700',
  };

  return (
    <Link
      href={href}
      className="
        card
        !p-4
        transition-all
        hover:-translate-y-0.5
        hover:shadow-md
        active:scale-[0.98]
      "
    >
      <div
        className={`
          mb-3
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          ${colorMap[color]}
        `}
      >
        {icon}
      </div>

      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="text-2xl font-bold text-slate-900">
        {value}
      </p>
    </Link>
  );
}

/**
 * Retorna fecha de hace N días
 */
function daysAgo(days: number): Date {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return date;
}

/**
 * Agrupa respuestas por día
 */
function bucketByDay(
  items: {
    submittedAt: Date;
    riskLevel: string;
  }[],
  days: number
) {
  const buckets: {
    fecha: string;
    total: number;
    riesgo: number;
  }[] = [];

  const byFecha = new Map<
    string,
    {
      fecha: string;
      total: number;
      riesgo: number;
    }
  >();

  const today = new Date();

  /**
   * Crear días vacíos
   */
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(date.getDate() - i);

    const key = date.toISOString().slice(5, 10);

    const bucket = {
      fecha: key,
      total: 0,
      riesgo: 0,
    };

    buckets.push(bucket);

    byFecha.set(key, bucket);
  }

  /**
   * Llenar datos reales
   */
  for (const item of items) {
    const key = item.submittedAt
      .toISOString()
      .slice(5, 10);

    const bucket = byFecha.get(key);

    if (!bucket) continue;

    bucket.total += 1;

    if (item.riskLevel !== 'LOW') {
      bucket.riesgo += 1;
    }
  }

  return buckets;
}
