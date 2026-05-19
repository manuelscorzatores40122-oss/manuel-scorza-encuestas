// src/app/psicologo/page.tsx

import Link from 'next/link';
import {
  AlertTriangle,
  ClipboardList,
  Users,
  TrendingUp,
  MessageSquare,
  Megaphone,
  Brain,
} from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { DashboardCharts } from './DashboardCharts';
import styles from './dashboard.module.css';

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
    <div className={styles.page}>

      {/* Banner */}
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <Brain className={styles.bannerIconSvg} />
        </div>
        <div className={styles.bannerText}>
          <h1 className={styles.bannerTitle}>Panel del Psicólogo</h1>
          <p className={styles.bannerSub}>Resumen general del bienestar estudiantil</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className={styles.statsGrid}>
        <StatCard
          href="/psicologo/estudiantes"
          icon={<Users />}
          label="Estudiantes"
          value={totalEstudiantes}
          color="blue"
        />
        <StatCard
          href="/psicologo/encuestas"
          icon={<ClipboardList />}
          label="Encuestas activas"
          value={encuestasActivas}
          color="emerald"
        />
        <StatCard
          href="/psicologo/respuestas"
          icon={<TrendingUp />}
          label="Respuestas"
          value={totalRespuestas}
          color="purple"
        />
        <StatCard
          href="/psicologo/alertas"
          icon={<AlertTriangle />}
          label="Alertas pendientes"
          value={alertasPendientes}
          color="red"
        />
        <StatCard
          href="/psicologo/respuestas"
          icon={<MessageSquare />}
          label="Quieren hablar"
          value={quierenHablar}
          color="orange"
        />
        <StatCard
          href="/psicologo/anuncios"
          icon={<Megaphone />}
          label="Anuncios"
          value={anunciosPublicados}
          color="amber"
        />
      </div>

      {/* Charts */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Analítica</h2>
          <Link href="/psicologo/estadisticas" className={styles.sectionLink}>
            Ver estadísticas →
          </Link>
        </div>
        <div className={styles.sectionBody}>
          <DashboardCharts riskDist={riskDist} trend={trend} />
        </div>
      </div>

      {/* Quick actions */}
      <div className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Acciones rápidas</h2>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.actionsGrid}>
            <Link
              href="/psicologo/alertas"
              className={`${styles.actionBtn} ${styles.actionBtnRed}`}
            >
              <AlertTriangle className={styles.actionBtnIcon} />
              Revisar alertas
            </Link>
            <Link
              href="/psicologo/encuestas/nueva"
              className={`${styles.actionBtn} ${styles.actionBtnEmerald}`}
            >
              <ClipboardList className={styles.actionBtnIcon} />
              Crear encuesta
            </Link>
            <Link
              href="/psicologo/respuestas"
              className={`${styles.actionBtn} ${styles.actionBtnPurple}`}
            >
              <TrendingUp className={styles.actionBtnIcon} />
              Ver respuestas
            </Link>
            <Link
              href="/psicologo/anuncios"
              className={`${styles.actionBtn} ${styles.actionBtnAmber}`}
            >
              <Megaphone className={styles.actionBtnIcon} />
              Ver anuncios
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}

/**
 * Tarjeta estadística reutilizable
 */
function StatCard({
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
  const colorClass = styles[`stat${color.charAt(0).toUpperCase() + color.slice(1)}` as keyof typeof styles];
  return (
    <Link href={href} className={styles.statCard}>
      <div className={`${styles.statIconWrap} ${colorClass}`}>{icon}</div>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
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
