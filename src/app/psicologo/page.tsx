// src/app/psicologo/page.tsx

import Link from 'next/link';
import {
  AlertTriangle,
  ClipboardList,
  Users,
  TrendingUp,
  Megaphone,
  Plus,
} from 'lucide-react';

import { prisma } from '@/lib/prisma';
import { GraficosDashboard } from './GraficosDashboard';
import { BuscadorEstudiantes } from './BuscadorEstudiantes';
import { DatabaseUnavailable } from '@/components/BaseDatosNoDisponible';
import styles from './dashboard.module.css';

/**
 * Panel principal del psicólogo.
 */
export default async function PsicologoDashboard() {
  try {
    return await renderDashboard();
  } catch {
    return <DatabaseUnavailable />;
  }
}

async function renderDashboard() {
  const [
    totalEstudiantes,
    encuestasActivas,
    totalRespuestas,
    alertasPendientes,
    respuestasPorRiesgo,
    respuestasUltimos30,
    anunciosPublicados,
    ultimasAlertas,
    respuestasTodas,
  ] = await Promise.all([
    prisma.student.count({ where: { estadoMatricula: 'DEFINITIVA' } }),
    prisma.survey.count({ where: { isActive: true } }),
    prisma.response.count(),
    prisma.alert.count({ where: { reviewedAt: null } }),
    prisma.response.groupBy({ by: ['riskLevel'], _count: true }),
    prisma.response.findMany({
      where: { submittedAt: { gte: daysAgo(30) } },
      select: { submittedAt: true, riskLevel: true },
    }),
    prisma.announcement.count({ where: { isPublished: true } }),
    prisma.alert.findMany({
      where: { reviewedAt: null },
      orderBy: { triggeredAt: 'desc' },
      take: 6,
      select: {
        id: true,
        severity: true,
        triggeredAt: true,
        response: {
          select: {
            riskLevel: true,
            survey: { select: { title: true } },
            student: { select: { nombres: true, apellidoPaterno: true } },
          },
        },
      },
    }),
    prisma.response.findMany({
      select: {
        riskLevel: true,
        student: {
          select: {
            section: {
              select: {
                grade: { select: { name: true, order: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const riskDist = {
    LOW:  respuestasPorRiesgo.find((r) => r.riskLevel === 'LOW')?._count  || 0,
    MID:  respuestasPorRiesgo.find((r) => r.riskLevel === 'MID')?._count  || 0,
    HIGH: respuestasPorRiesgo.find((r) => r.riskLevel === 'HIGH')?._count || 0,
  };

  const trend       = bucketByDay(respuestasUltimos30, 30);
  const riskByGrade = buildRiskByGrade(respuestasTodas);

  const tasaRespuesta = totalEstudiantes > 0
    ? `${Math.round((totalRespuestas / totalEstudiantes) * 100)}%`
    : '—';

  return (
    <div className={styles.page}>

      {/* Encabezado */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>Panel del psicólogo</h1>
          <p className={styles.pageSubtitle}>Resumen del bienestar estudiantil · I.E. 40122</p>
        </div>
        <Link href="/psicologo/encuestas/nueva" className={styles.btnPrimary}>
          <Plus className={styles.btnPrimaryIcon} />
          Nueva encuesta
        </Link>
      </header>

      {/* Buscador de alumnos */}
      <BuscadorEstudiantes />

      {/* Grupo 1: Requiere atención */}
      <p className={styles.sectionLabel}>Requiere tu atención</p>
      <section className={`${styles.grid} ${styles.gridAttention}`}>
        <StatCard
          icon={<AlertTriangle />}
          iconVariant="danger"
          label="Alertas pendientes"
          value={alertasPendientes}
          hint={alertasPendientes === 0 ? { text: 'Todo en orden', success: true } : undefined}
          link={alertasPendientes > 0 ? { href: '/psicologo/alertas', text: 'Revisar ahora →' } : undefined}
        />
        <StatCard
          icon={<ClipboardList />}
          iconVariant="info"
          label="Encuestas activas"
          value={encuestasActivas}
          link={{ href: '/psicologo/encuestas/nueva', text: 'Lanzar una →' }}
        />
        <StatCard
          icon={<TrendingUp />}
          iconVariant="neutral"
          label="Respuestas recibidas"
          value={totalRespuestas}
          hint={encuestasActivas === 0 ? { text: 'Sin encuestas activas' } : undefined}
          link={encuestasActivas > 0 ? { href: '/psicologo/respuestas', text: 'Ver respuestas →' } : undefined}
        />
      </section>

      {/* Grupo 2: Contexto general */}
      <p className={styles.sectionLabel}>Contexto general</p>
      <section className={`${styles.grid} ${styles.gridContext}`}>
        <MiniStat icon={<Users />}       label="Estudiantes"        value={totalEstudiantes}    />
        <MiniStat icon={<Megaphone />}   label="Anuncios"           value={anunciosPublicados}  />
        <MiniStat icon={<TrendingUp />}  label="Tasa de respuesta"  value={tasaRespuesta} empty={totalRespuestas === 0} />
      </section>

      {/* Analítica */}
      <div className={styles.analyticsHead}>
        <h2 className={styles.analyticsTitle}>Analítica</h2>
        <Link href="/psicologo/estadisticas" className={styles.linkArrow}>
          Ver estadísticas →
        </Link>
      </div>
      <GraficosDashboard riskDist={riskDist} trend={trend} riskByGrade={riskByGrade} />

      {/* Alertas recientes */}
      <div className={styles.alertsHead}>
        <h2 className={styles.alertsTitle}>Alertas recientes</h2>
        <Link href="/psicologo/alertas" className={styles.linkArrow}>Ver todas →</Link>
      </div>
      {ultimasAlertas.length === 0 ? (
        <p className={styles.alertEmpty}>No hay alertas pendientes ✓</p>
      ) : (
        <div className={styles.alertList}>
          {ultimasAlertas.map((a) => {
            const level      = a.response.riskLevel as 'LOW' | 'MID' | 'HIGH';
            const dotClass   = level === 'HIGH' ? styles.alertDotHigh   : level === 'MID' ? styles.alertDotMid   : styles.alertDotLow;
            const badgeClass = level === 'HIGH' ? styles.alertBadgeHigh : level === 'MID' ? styles.alertBadgeMid : styles.alertBadgeLow;
            const badgeText  = level === 'HIGH' ? 'ALTO' : level === 'MID' ? 'MEDIO' : 'BAJO';
            return (
              <Link key={a.id} href="/psicologo/alertas" className={styles.alertRow}>
                <span className={`${styles.alertDot} ${dotClass}`} />
                <span className={styles.alertName}>
                  {a.response.student.apellidoPaterno}, {a.response.student.nombres}
                </span>
                <span className={styles.alertSurvey}>{a.response.survey.title}</span>
                <span className={`${styles.alertBadge} ${badgeClass}`}>{badgeText}</span>
                <span className={styles.alertTime}>{timeAgo(a.triggeredAt)}</span>
              </Link>
            );
          })}
        </div>
      )}

    </div>
  );
}

function StatCard({
  icon,
  iconVariant,
  label,
  value,
  hint,
  link,
}: {
  icon: React.ReactNode;
  iconVariant: 'danger' | 'info' | 'neutral';
  label: string;
  value: number;
  hint?: { text: string; success?: boolean };
  link?: { href: string; text: string };
}) {
  const iconClass =
    iconVariant === 'danger' ? styles.statIconDanger :
    iconVariant === 'info'   ? styles.statIconInfo   :
                               styles.statIconNeutral;
  return (
    <article className={styles.card}>
      <div className={styles.statHead}>
        <span className={`${styles.statIcon} ${iconClass}`}>{icon}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
      <div className={styles.statValueRow}>
        <span className={styles.statValue}>{value}</span>
        {hint && (
          <span className={`${styles.statHint} ${hint.success ? styles.statHintSuccess : ''}`}>
            {hint.text}
          </span>
        )}
        {link && <Link href={link.href} className={styles.statLink}>{link.text}</Link>}
      </div>
    </article>
  );
}

function MiniStat({
  icon,
  label,
  value,
  empty,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  empty?: boolean;
}) {
  return (
    <article className={styles.ministat}>
      <div className={styles.ministatHead}>
        {icon}
        <span>{label}</span>
      </div>
      <span className={`${styles.ministatValue} ${empty ? styles.ministatValueEmpty : ''}`}>
        {value}
      </span>
    </article>
  );
}

function timeAgo(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (days  > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (mins  > 1) return `hace ${mins}m`;
  return 'ahora';
}

function daysAgo(days: number): Date {
  const date = new Date();

  date.setDate(date.getDate() - days);

  return date;
}

/**
 * Agrupa respuestas por día con desglose LOW/MID/HIGH
 */
function bucketByDay(
  items: { submittedAt: Date; riskLevel: string }[],
  days: number
) {
  type Bucket = { fecha: string; total: number; low: number; mid: number; high: number };
  const buckets: Bucket[] = [];
  const byFecha = new Map<string, Bucket>();
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(5, 10);
    const bucket: Bucket = { fecha: key, total: 0, low: 0, mid: 0, high: 0 };
    buckets.push(bucket);
    byFecha.set(key, bucket);
  }

  for (const item of items) {
    const key = item.submittedAt.toISOString().slice(5, 10);
    const bucket = byFecha.get(key);
    if (!bucket) continue;
    bucket.total++;
    if (item.riskLevel === 'LOW')       bucket.low++;
    else if (item.riskLevel === 'MID')  bucket.mid++;
    else if (item.riskLevel === 'HIGH') bucket.high++;
  }

  return buckets;
}

/**
 * Agrupa respuestas por grado con desglose LOW/MID/HIGH
 */
function buildRiskByGrade(
  items: {
    riskLevel: string;
    student: { section: { grade: { name: string; order: number } } };
  }[]
) {
  type GradeBucket = { grade: string; order: number; LOW: number; MID: number; HIGH: number };
  const map = new Map<string, GradeBucket>();

  for (const item of items) {
    const { name, order } = item.student.section.grade;
    if (!map.has(name)) {
      map.set(name, { grade: name, order, LOW: 0, MID: 0, HIGH: 0 });
    }
    const b = map.get(name)!;
    if (item.riskLevel === 'LOW')       b.LOW++;
    else if (item.riskLevel === 'MID')  b.MID++;
    else if (item.riskLevel === 'HIGH') b.HIGH++;
  }

  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}
